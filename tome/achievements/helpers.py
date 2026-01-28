import requests
import json
import time
from typing import Optional, TypedDict


from collections import defaultdict
from django.db.models import Q, F, Sum, Max, Window, IntegerField, Value
from django.db.models.functions import Coalesce, Substr, Cast
from django.db.models.expressions import OrderBy
from django.db.models.functions import Rank

from achievements.models import (
    Achievements,
    Commanders,
    Restrictions,
    AchievementsRestrictions,
    Colors,
)
from users.models import ParticipantAchievements
from users.serializers import ParticipantsSerializer

from sessions_rounds.serializers import RoundsSerializer


def group_parents_by_point_value(parent_dict):
    grouped_by_points = defaultdict(list)

    for _, achievement in parent_dict.items():
        point_value = achievement["point_value"]
        grouped_by_points[point_value].append(achievement)

    return dict(grouped_by_points)


def calculate_total_points_for_month(sessions):
    earned_achievements = (
        ParticipantAchievements.objects.filter(
            session_id__in=sessions,
            participant__deleted=False,
            session__deleted=False,
            deleted=False,
        )
        .select_related("participant")
        .values("id", "earned_points", "participant_id", "participant__name")
    )

    by_participant = defaultdict(int)
    participant_info = set()

    for achievement in earned_achievements:
        participant_info.add(
            (achievement["participant_id"], achievement["participant__name"])
        )
        by_participant[achievement["participant_id"]] += achievement["earned_points"]
    return [
        {"id": p[0], "name": p[1], "total_points": by_participant[p[0]]}
        for p in participant_info
    ]


def calculate_monthly_winners(cutoff):
    pa_qs = ParticipantAchievements.objects.filter(
        participant__deleted=False,
        session__deleted=False,
        deleted=False,
        session__session_date__lt=cutoff,
    ).select_related("session")
    base = pa_qs.values("session__month_year", "participant_id").annotate(
        participant_name=Max("participant__name"),
        total_points=Coalesce(Sum("earned_points"), 0),
    )

    ranked = (
        base.annotate(
            rnk=Window(
                expression=Rank(),
                partition_by=[F("session__month_year")],
                order_by=[
                    OrderBy(F("total_points"), descending=True),
                ],
            ),
        )
        .filter(rnk=1)
        .values(
            "session__month_year",
            "participant_id",
            "participant_name",
            "total_points",
        )
        .order_by("session__month_year")
    )

    sorted = ranked.annotate(
        month_i=Cast(Substr("session__month_year", 1, 2), IntegerField()),
        year_i=Cast(Substr("session__month_year", 4, 2), IntegerField()),
        year_full=Value(2000) + F("year_i"),
    ).order_by("-year_full", "-month_i")

    return list(sorted)


def all_participant_achievements_for_month(session):
    data = ParticipantAchievements.objects.filter(
        session=session, participant__deleted=False, deleted=False
    ).select_related("participant", "achievement", "round")

    achievements_by_participant = defaultdict(list)
    for pa in data:
        achievements_by_participant[pa.participant].append(
            {
                "name": pa.achievement.full_name,
                "round": pa.round,
                "earned_id": pa.id,
                "earned_points": pa.earned_points,
            }
        )

    result = []
    for participant, achievements in achievements_by_participant.items():
        participant_data = ParticipantsSerializer(
            participant, context={"mm_yy": session.month_year}
        ).data

        point_sum = sum([x["earned_points"] for x in achievements])

        achievements_data = [
            {
                "name": achievement["name"],
                "round": RoundsSerializer(achievement["round"]).data,
                "earned_id": achievement["earned_id"],
                "earned_points": achievement["earned_points"],
            }
            for achievement in achievements
        ]
        participant_data["achievements"] = achievements_data
        participant_data["session_points"] = point_sum
        result.append(participant_data)

    return result


class ScryfallCommanderData:
    def __init__(self, name, colors):
        self.name = name
        self.colors = colors


def fetch_scryfall_data():
    """Hit our special scryfall endpoint to fetch all existing commanders."""

    SCRYFALL_COMMANDER_URL = "https://api.scryfall.com/cards/search?q=is%3Acommander+legal%3Acommander&order=name&as=checklist&unique=cards"
    keep_going = True
    out = []

    print("Beginning fetch")
    while keep_going:
        try:
            data = requests.get(
                SCRYFALL_COMMANDER_URL,
                headers={"User-Agent": "MTGCommanderLeague/1.0", "Accept": "*/*"},
            )
            parsed = json.loads(data.content)

            out.extend(parsed["data"])

            SCRYFALL_COMMANDER_URL = parsed.get("next_page")
            keep_going = parsed["has_more"]
            # To be extra careful about overloading Scryfall's API we sleep for 200ms between requests
            time.sleep(0.200)

        except BaseException as e:
            print(e)
            break

    # These are special Commanders that depend on a player choosing a color identity,
    # they already exist with individual colors so we don't need to re-add the non-color ones
    to_remove = set(["The Prismatic Piper", "Faceless One", "Clara Oswald"])
    name_set = {card["name"] for card in out} - to_remove
    color_dict = {c["name"]: c.get("color_identity", []) for c in out}

    return name_set, color_dict


def fetch_current_commanders():
    """Fetch all the commanders currently in their DB and return them as a set."""
    excluded = ["The Prismatic Piper", "Faceless One", "Clara Oswald"]

    query = Q()
    for keyword in excluded:
        query |= Q(name__icontains=keyword)

    return set(
        Commanders.objects.filter(deleted=False)
        .exclude(query)
        .values_list("name", flat=True)
    )


def normalize_color_identity(color_identity):
    """Convert API color list to a sorted, lowercase string matching DB symbols."""
    return "".join(sorted(color_identity)).lower() or "c"


def handle_upsert_restrictions(restrictions, achievement):
    """Handle inserting or updating given restrictions."""
    if len(restrictions) < 1:
        return

    new = []
    update = []

    for r in restrictions:
        if r.get("id") is None:
            new.append(Restrictions(**r))
            continue
        update.append(r)

    if new:
        created = Restrictions.objects.bulk_create(new)
        AchievementsRestrictions.objects.bulk_create(
            [
                AchievementsRestrictions(restrictions=r, achievements=achievement)
                for r in created
            ]
        )

    # Generally will only be updating a handful of objects at a time so
    # do this in a loop is fine.
    for r in update:
        if Restrictions.objects.filter(id=r["id"], deleted=True).exists():
            continue
        Restrictions.objects.filter(id=r["id"]).update(
            name=r.get("name", ""),
            url=r.get("url", ""),
            nested=r.get("nested", False),
            deleted=r.get("deleted", False),
        )


def handle_upsert_child_achievements(achievements, parent):
    """Handle inserting or updating given achievements."""
    if len(achievements) < 1:
        return
    new = []
    update = []

    for achievement in achievements:
        if achievement.get("id") is None:
            new.append(Achievements(**{**achievement, "parent": parent}))
        else:
            update.append(achievement)

    if new:
        Achievements.objects.bulk_create(new)

    for achievement in update:
        Achievements.objects.filter(id=achievement["id"]).update(
            name=achievement.get("name", ""),
            point_value=achievement.get("point_value"),
            deleted=achievement.get("deleted", False),
        )


def cascade_soft_delete(achievement):
    """Soft delete associated achievements and restrictions for a parent that is deleted"""
    achievement_id = achievement.id

    Achievements.objects.filter(parent_id=achievement_id).update(deleted=True)

    parent_restriction_ids = list(
        AchievementsRestrictions.objects.filter(
            achievements_id=achievement_id
        ).values_list("restrictions_id", flat=True)
    )

    Restrictions.objects.filter(id__in=parent_restriction_ids).update(deleted=True)


def calculate_color_mask(colors: list[int]) -> tuple[int, int]:
    """
    Take in some color ids, use them to calculate the mask of the combined color.
    I.e. red = 8, green = 16. Therefore redgreen = 24
    """

    mask_list = Colors.objects.filter(id__in=colors).values_list("mask", flat=True)
    combined_mask = 0
    for mask in mask_list:
        combined_mask |= mask
    calculated = (
        Colors.objects.filter(mask=combined_mask).values("id", "symbol").first()
    )

    if calculated is None:
        raise ValueError(f"No color found for mask: {combined_mask}")

    win_colors = len(calculated["symbol"]) if calculated["symbol"] != "c" else 0

    return win_colors, calculated["id"]


class ColorInfo(TypedDict):
    symbol: str
    name: str


def calculate_color(masks: list[int]) -> Optional[ColorInfo]:
    """
    Take in a list of color masks, sum them and return the associated color info
    """
    combined = 0

    for m in masks:
        if m is not None and m >= 0:
            combined |= m

    color = Colors.objects.filter(mask=combined).values("symbol", "name").first()
    if color is None:
        return None
    return color

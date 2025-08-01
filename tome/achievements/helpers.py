import requests
import json
import time

from collections import defaultdict
from django.db.models import Q

from achievements.models import Achievements, Commanders
from users.models import ParticipantAchievements
from users.serializers import ParticipantsSerializer
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


def handle_pod_win(winner, info, round_id, participant_ids):
    """Handle scenarios where it would be prudent to update or create
    a PA record specifically for a win."""
    win_achievement = None
    if info.get("slug"):
        win_achievement = Achievements.objects.filter(slug=info.get("slug")).first()

    win_record = (
        ParticipantAchievements.objects.filter(
            round_id=round_id,
            achievement__slug__endswith="-colors",
            deleted=False,
            participant_id__in=participant_ids,
        )
        .select_related("achievement")
        .first()
    )

    if not win_record:
        if win_achievement:
            ParticipantAchievements.objects.create(
                participant_id=info.get("participant_id"),
                round_id=round_id,
                session_id=winner.get("session_id"),
                achievement_id=win_achievement.id,
                earned_points=win_achievement.points,
            )
        return

    if info.get("deleted"):
        win_record.deleted = info.get("deleted", False)

    if win_achievement is not None and info.get("participant_id"):
        win_record.achievement_id = win_achievement.id
        win_record.participant_id = info.get("participant_id", None)
        win_record.earned_points = win_achievement.points
    win_record.save()


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
    color_dict = {c["name"]: c.get("colors", []) for c in out}

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

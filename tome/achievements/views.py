import json
from typing import List, Dict

from datetime import datetime
from collections import defaultdict

from django.db import transaction
from django.db.models import (
    Q,
    F,
    Value,
    Prefetch,
    CharField,
    IntegerField,
    Case,
    When,
    Max,
    Sum,
)

from django.contrib.postgres.aggregates import ArrayAgg
from django.utils import timezone
from django.db.models.functions import Concat, Coalesce

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from utils.permissions import IsSuperUser
from .models import Achievements, Colors, Restrictions, AchievementType

from users.models import ParticipantAchievements

from sessions_rounds.models import Pods, Sessions, PodsParticipants, Rounds
from configs.models import Config
from .serializers import (
    AchievementsSerializer,
    AchievementSerializerV2,
    ColorsSerializer,
    CommandersSerializer,
    AchievementTypeSerializer,
)
from achievements.models import (
    Achievements,
    WinningCommanders,
    Commanders,
    AchievementScalableTerms,
    ScalableTerms,
    ScalableTermType,
)
from achievements.participant_achievement_helpers import (
    resolve_participant_achievement_display,
)

from achievements.helpers import (
    calculate_total_points_for_month,
    group_parents_by_point_value,
    fetch_scryfall_data,
    fetch_current_commanders,
    normalize_color_identity,
    handle_upsert_child_achievements,
    handle_upsert_restrictions,
    cascade_soft_delete,
    calculate_monthly_winners,
)
from achievements.scoresheet_helpers import POSTScoresheetHelper, GETScoresheetHelper
from sessions_rounds.helpers import handle_close_round
from services.scryfall_client import ScryfallClientRequest
from services.redis_keepalive import redis_keepalive
from utils.decorators import require_store

GET = "GET"
POST = "POST"
PUT = "PUT"

scryfall_request = ScryfallClientRequest()


@api_view([GET])
def get_scorecard_achievement_options(_, **kwargs):
    """Return flattened list of achievement options for scorecard winner-achievements picker.
    Legacy: child achievements (id, name) + standalone achievements (id, name).
    Scalable: achievement+term pairs (achievement_id, scalable_term_id, name).
    """

    scalable_achievement_ids = set(
        AchievementScalableTerms.objects.values_list("achievement_id", flat=True)
    )

    slug_ok = Q(slug__isnull=True) | Q(slug="precon") | Q(slug="best-snack")

    child_achievements = list(
        Achievements.objects.filter(deleted=False, parent__isnull=False)
        .filter(slug_ok)
        .exclude(slug__iregex=r"win-[0-9]+-colors")
        .select_related("parent")
        .values("id", "name", "parent__name")
    )
    child_options = [
        {"id": a["id"], "name": f"{a['parent__name']} {a['name']}"}
        for a in child_achievements
        if a["parent__name"]
    ]

    parent_achievement_ids = set(
        Achievements.objects.filter(deleted=False, parent__isnull=False).values_list(
            "parent_id", flat=True
        )
    )

    # Standalone achievements (no parent, not scalable)
    standalone = list(
        Achievements.objects.filter(deleted=False, parent__isnull=True)
        .filter(slug_ok)
        .exclude(id__in=scalable_achievement_ids)
        .exclude(id__in=parent_achievement_ids)
        .order_by("name")
        .values("id", "name")
    )
    standalone_options = [{"id": a["id"], "name": a["name"]} for a in standalone]

    legacy_options = child_options + standalone_options

    scalable = list(
        AchievementScalableTerms.objects.filter(
            achievement__deleted=False,
            scalable_term__deleted=False,
        )
        .select_related("achievement", "scalable_term")
        .values(
            "achievement_id",
            "scalable_term_id",
            "achievement__name",
            "scalable_term__term_display",
        )
    )
    scalable_options = [
        {
            "achievement_id": s["achievement_id"],
            "scalable_term_id": s["scalable_term_id"],
            "name": f"{s['achievement__name']} {s['scalable_term__term_display']}",
        }
        for s in scalable
    ]

    return Response({"legacy": legacy_options, "scalable": scalable_options})


@api_view([GET])
def get_scalable_terms(_, **kwargs):
    """Return all scalable terms grouped by type, for the Scalable Terms browse page."""
    terms = (
        ScalableTerms.objects.filter(deleted=False)
        .select_related("type")
        .order_by("type__name", "term_display")
        .values("id", "term_display", "type_id", "type__name")
    )

    grouped = defaultdict(lambda: {"id": None, "name": "", "terms": []})
    untyped = []

    for t in terms:
        term_data = {"id": t["id"], "term_display": t["term_display"]}
        if t["type_id"] and t["type__name"]:
            key = t["type__name"]
            grouped[key]["id"] = t["type_id"]
            grouped[key]["name"] = t["type__name"]
            grouped[key]["terms"].append(term_data)
        else:
            untyped.append(term_data)

    types_list = [
        {"id": v["id"], "name": v["name"], "terms": v["terms"]}
        for v in sorted(grouped.values(), key=lambda x: x["name"])
        if v["terms"]
    ]
    if untyped:
        types_list.append({"id": None, "name": "Uncategorized", "terms": untyped})

    return Response({"types": types_list})


@api_view([GET])
def get_scalable_term_types(_, **kwargs):
    """Return all scalable term types for management dropdowns."""
    types = list(ScalableTermType.objects.all().order_by("name").values("id", "name"))
    return Response(types)


def _get_scalable_achievement_ids():
    """Return distinct achievement IDs that have bridge entries (scalable achievements)."""
    return set(
        AchievementScalableTerms.objects.values_list("achievement_id", flat=True)
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsSuperUser])
def upsert_scalable_term(request, **kwargs):
    """Create or update a scalable term. When creating, add to bridge for each scalable achievement."""
    body = json.loads(request.body.decode("utf-8"))
    term_id = body.get("id")
    term_display = body.get("term_display", "").strip()
    type_id = body.get("type_id")

    if not term_display and not term_id:
        return Response(
            {"message": "term_display is required for new terms."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _validate_type_id(tid):
        if tid is None or tid == "" or tid is False:
            return None
        try:
            resolved = int(tid)
        except (TypeError, ValueError):
            return "type_id must be a valid integer."
        if not ScalableTermType.objects.filter(id=resolved).exists():
            return "type_id does not reference an existing ScalableTermType."
        return resolved

    validated_type_id = _validate_type_id(type_id)
    if validated_type_id is not None and not isinstance(validated_type_id, int):
        return Response(
            {"message": validated_type_id},
            status=status.HTTP_400_BAD_REQUEST,
        )

    term = None
    if term_id:
        term = ScalableTerms.objects.filter(id=term_id).first()
        if not term:
            return Response(
                {"message": "Scalable term not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if term:
        if term_display:
            term.term_display = term_display
        if "deleted" in body:
            term.deleted = body["deleted"]
        if type_id is not None:
            term.type_id = validated_type_id
        term.save()
    else:
        with transaction.atomic():
            term = ScalableTerms.objects.create(
                term_display=term_display,
                type_id=validated_type_id,
                deleted=False,
            )
            scalable_achievement_ids = _get_scalable_achievement_ids()
            AchievementScalableTerms.objects.bulk_create(
                [
                    AchievementScalableTerms(
                        achievement_id=ach_id,
                        scalable_term_id=term.id,
                    )
                    for ach_id in scalable_achievement_ids
                ]
            )

    return Response(
        {"id": term.id, "term_display": term.term_display, "type_id": term.type_id},
        status=status.HTTP_201_CREATED,
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsSuperUser])
def create_scalable_term_type(request):
    """Create a new scalable term type."""
    body = json.loads(request.body.decode("utf-8"))
    name = (body.get("name") or "").strip()
    if not name:
        return Response(
            {"message": "name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if ScalableTermType.objects.filter(name=name).exists():
        return Response(
            {"message": f"Type '{name}' already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    t = ScalableTermType.objects.create(name=name)
    return Response({"id": t.id, "name": t.name}, status=status.HTTP_201_CREATED)


@api_view([GET])
def get_achievements_with_restrictions_v2(request, **kwargs):
    """Get achievements with their restrictions but do it much cleaner than the original endpoint."""

    achievements = (
        Achievements.objects.filter(deleted=False)
        .select_related("parent", "type")
        .annotate(
            points_anno=Coalesce(
                F("parent__point_value"), F("point_value"), output_field=IntegerField()
            ),
            full_name_anno=Case(
                When(
                    parent__isnull=False,
                    then=Concat(F("parent__name"), Value(" "), F("name")),
                ),
                default=F("name"),
                output_field=CharField(),
            ),
        )
        .only(
            "id",
            "name",
            "slug",
            "point_value",
            "parent_id",
            "deleted",
            "type_id",
            "parent__id",
            "parent__name",
            "parent__point_value",
            "type__id",
            "type__name",
            "type__hex_code",
            "type__description",
        )
        .prefetch_related(
            Prefetch(
                "restrictions",
                queryset=Restrictions.objects.filter(deleted=False).only(
                    "id", "name", "url"
                ),
            )
        )
        .order_by(F("parent_id").desc(nulls_last=None))
    )

    # Optional store-scoped filtering via configs.
    store_id = getattr(request, "store_id", None)
    if store_id:
        cfg = dict(
            Config.objects.filter(
                store_id=store_id,
                key__in=["enable_snack_sharing", "enable_money_pack"],
            ).values_list("key", "value")
        )

        exclude_slugs = []
        if (cfg.get("enable_snack_sharing") or "").lower() == "false":
            exclude_slugs.extend(["bring-snack", "best-snack"])
        if (cfg.get("enable_money_pack") or "").lower() == "false":
            exclude_slugs.append("money-pack")

        if exclude_slugs:
            achievements = achievements.exclude(slug__in=exclude_slugs)

    return Response(AchievementSerializerV2(achievements, many=True).data)


@api_view([GET])
def get_achievement_types(_, **kwargs):
    """Get all of the current achievement types."""

    types = AchievementType.objects.all()
    return Response(AchievementTypeSerializer(types, many=True).data)


@api_view([GET])
def get_achievements_with_restrictions(_, **kwargs):
    """Get achievements with their restrictions and put them in a map, raw list, and parents only."""

    parent_map = defaultdict(lambda: {"children": []})
    achievements = (
        Achievements.objects.filter(deleted=False)
        .annotate(
            restrictions_list=ArrayAgg("restrictions"),
            full_name=Coalesce(
                Concat(F("parent__name"), Value(" "), F("name")), F("name")
            ),
        )
        .distinct()
        .values(
            "id",
            "name",
            "parent_id",
            "point_value",
            "slug",
            "restrictions_list",
            "full_name",
        )
        .order_by(F("parent_id").desc(nulls_last=None))
    )
    restrictions = Restrictions.objects.filter(deleted=False).values(
        "id", "name", "url"
    )
    restriction_lookup = {r["id"]: r for r in restrictions}
    for achievement in achievements:
        achievement["restrictions"] = [
            restriction_lookup[r]
            for r in achievement["restrictions_list"]
            if r is not None and r in restriction_lookup
        ]
        del achievement["restrictions_list"]
        if achievement["parent_id"] is None:
            parent_map[achievement["id"]] = {**achievement, "children": []}
        else:
            parent_map[achievement["parent_id"]]["children"].append(achievement)
    grouped = group_parents_by_point_value(parent_map)
    lookup = {a["id"]: a for a in achievements}
    points_set = {
        a["point_value"] for a in achievements if a["point_value"] is not None
    }
    parents_with_kids = [
        p["id"] for p in achievements if parent_map[p["id"]]["children"]
    ]

    return Response(
        {
            "map": grouped,
            "data": achievements,
            "parents": parents_with_kids,
            "lookup": lookup,
            "points_set": points_set,
        },
    )


@api_view([GET])
@require_store
def get_achievements_by_participant_month(request, **kwargs):
    """Calculate the total points earned by a participant in a given month

    Originally this endpoint was meant for much more given the name but it's
    pretty much only used for the leaderboard. Naming will be updated to reflect
    it's true purpose sometime in the future."""

    today = datetime.today()

    mm_yy = kwargs.get("mm_yy")

    if mm_yy == "new" or mm_yy == None:
        mm_yy = today.strftime("%m-%y")

    store_id = request.store_id
    session_ids = Sessions.objects.filter(
        month_year=mm_yy, deleted=False, store_id=store_id
    ).values_list("id", flat=True)

    res = calculate_total_points_for_month(session_ids, store_id)

    res.sort(key=lambda x: x["total_points"], reverse=True)

    return Response(res)


@api_view([GET])
@require_store
def get_league_monthly_winners(request, **kwargs):
    """
    For each month, retrieve the top point earner for the given month + related commander info.
    """
    first_of_current_month = timezone.localdate().replace(day=1)
    return Response(
        calculate_monthly_winners(
            cutoff=first_of_current_month, store_id=request.store_id
        )
    )


@api_view([GET])
@require_store
def get_league_monthly_winner_info(request, mm_yy, participant_id, **kwargs):
    """
    For the provided month/participant, retrieve any relevant info
    about their participation in that month (points earned, commanders for the rounds
    they won, etc etc)
    """
    # Get the rounds for the given month
    rounds = {
        r["id"]: r
        for r in Rounds.objects.filter(
            session__month_year=mm_yy, session__store_id=request.store_id, deleted=False
        ).values("id", "round_number", "starts_at")
    }

    # Get the rounds and pods that the player appeared in
    played_round_ids = set(
        PodsParticipants.objects.filter(
            participants_id=participant_id,
            pods__rounds_id__in=list(rounds.keys()),
            pods__store_id=request.store_id,
        ).values_list("pods__rounds_id", flat=True)
    )

    # Get the number of points they earned per round they appeared in
    points_by_round = {
        row["round_id"]: row["total_points"]
        for row in (
            ParticipantAchievements.objects.filter(
                participant_id=participant_id,
                round_id__in=played_round_ids,
                deleted=False,
                store_id=request.store_id,
            )
            .values("round_id")
            .annotate(total_points=Coalesce(Sum("earned_points"), 0))
        )
    }

    # Get the commanders for the given player in each round, regardless of if they
    # won or not. If nothing gets returned its assumed they lost
    commanders_by_round = {
        row["pods__rounds_id"]: row["cmd_name"]
        for row in (
            WinningCommanders.objects.filter(
                deleted=False,
                participants_id=participant_id,
                pods__rounds_id__in=list(rounds.keys()),
                store_id=request.store_id,
            )
            .values("pods__rounds_id")
            .annotate(cmd_name=Max("name"))
        )
    }

    commander_images_by_raw = scryfall_request.get_commander_image_urls(
        commander_names=commanders_by_round.values()
    )

    all_rel_rounds = sorted(played_round_ids.union(points_by_round.keys()))

    rounds_payload = []

    for rid in all_rel_rounds:
        raw_name = commanders_by_round.get(rid)
        rounds_payload.append(
            {
                **rounds.get(rid),
                "total_points": int(points_by_round.get(rid, 0) or 0),
                "commander": raw_name,
                "commander_img": commander_images_by_raw.get(raw_name, []),
            }
        )

    return Response(
        {
            "participant_id": participant_id,
            "rounds": rounds_payload,
        }
    )


@api_view([GET])
def get_colors(_, **kwargs):
    """Get all of the color combinations."""
    colors_objects = Colors.objects.all()
    colors = [
        {
            "id": c["id"],
            "name": c["name"].title(),
            "symbol": c["symbol"],
            "symbol_length": c["symbol_length"],
        }
        for c in ColorsSerializer(colors_objects, many=True).data
    ]

    id_obj = {v["id"]: v for v in colors}
    symbol_obj = {v["symbol"]: v["id"] for v in colors}

    return Response(
        {"list": colors, "idObj": id_obj, "symbolObj": symbol_obj},
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsSuperUser])
def upsert_achievements(request, **kwargs):
    """Create or update an achievement. Name is required."""
    body = json.loads(request.body.decode("utf-8"))
    id = body.get("id", None)
    name = body.get("name", None)

    if not name and not id:
        return Response(
            {"message": "Missing 'name' for achievement."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    achievement = None
    if id:
        achievement = Achievements.objects.filter(id=id).first()
        if not achievement:
            return Response(
                {"message": "Achievement with given ID not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if achievement:
        if name:
            achievement.name = name
        if "deleted" in body:
            achievement.deleted = body["deleted"]
            if body["deleted"] == True:
                cascade_soft_delete(achievement)
        if "point_value" in body:
            achievement.point_value = body["point_value"]
        if "type_id" in body:
            achievement.type_id = body["type_id"]
        if "restrictions" in body:
            handle_upsert_restrictions(body["restrictions"], achievement)
        if "achievements" in body:
            handle_upsert_child_achievements(body["achievements"], achievement)

        achievement.save()
    else:
        restrictions = body.get("restrictions")
        children = body.get("achievements")
        achievement = Achievements.objects.create(
            name=name,
            deleted=body.get("deleted", False),
            point_value=body.get("point_value"),
            type_id=body.get("type_id"),
        )
        handle_upsert_restrictions(restrictions, achievement)
        handle_upsert_child_achievements(children, achievement)

    serialized = AchievementsSerializer(achievement).data
    return Response(serialized, status=status.HTTP_201_CREATED)


@api_view([GET])
@require_store
def get_participant_round_achievements(request, participant_id, round_id, **kwargs):
    """Get all achievements + points for a participant in a particular round."""
    achievements = ParticipantAchievements.objects.select_related(
        "achievement", "achievement__parent", "scalable_term"
    ).filter(
        participant_id=participant_id,
        round_id=round_id,
        store_id=request.store_id,
        deleted=False,
    )

    out = []
    for a in achievements:
        resolved = resolve_participant_achievement_display(a)
        out.append(
            {
                "id": a.id,
                "full_name": resolved["full_name"],
                "earned_points": resolved["earned_points"],
            }
        )

    return Response(out)


@api_view([GET])
def get_all_commanders(_, **kwargs):
    """Get and return all valid commanders we have currently."""
    try:
        commanders = Commanders.objects.filter(
            deleted=False, is_background=False, is_companion=False
        )
        partners_backgrounds = Commanders.objects.filter(
            Q(has_partner=True) | Q(is_background=True),
            deleted=False,
        ).distinct("name")
        companions = Commanders.objects.filter(is_companion=True, deleted=False)
    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    commander_data = CommandersSerializer(commanders, many=True).data
    commander_lookup = {c["name"]: c for c in commander_data}
    partner_data = CommandersSerializer(partners_backgrounds, many=True).data
    companion_data = CommandersSerializer(companions, many=True).data
    return Response(
        {
            "commanders": commander_data,
            "partners": partner_data,
            "commander_lookup": commander_lookup,
            "companions": companion_data,
        }
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsSuperUser])
def fetch_and_insert_commanders(_, **kwargs):
    """
    Query scryfall and see if any new commanders have been added.

    Update the db with the new commanders if yes, else do nothing.
    """

    name_set, color_dict = fetch_scryfall_data()
    existing_commanders = fetch_current_commanders()

    if len(name_set) <= len(existing_commanders):
        return Response(
            {"message": "No new Commanders found."}, status=status.HTTP_200_OK
        )

    to_update = list(name_set - existing_commanders)

    color_map = {
        tuple(sorted(color["symbol"].lower())): color["id"]
        for color in Colors.objects.values("id", "symbol")
    }

    records = []
    try:
        for commander in to_update:
            color_key = tuple(normalize_color_identity(color_dict[commander]))
            color_id = color_map.get(color_key)

            if color_id is not None:
                records.append(Commanders(name=commander, color_id=color_id))
            else:
                print(
                    f"Warning: No matching color_id for {commander.name} with colors {commander.colors}"
                )
    except Exception as e:
        print(f"Error found in commander mapping: {e}")

    out = Commanders.objects.bulk_create(records)
    redis_keepalive()

    return Response(
        {"message": f"Added {len(out)} new commanders to the database."},
        status=status.HTTP_201_CREATED,
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@require_store
def upsert_earned_achievements(request, **kwargs):
    """
    Responsible for either inserting an achievement
    or updating an existing one (primarily deleting)
    """

    body = json.loads(request.body.decode("utf-8"))

    id = body.get("id", [])

    if id:
        achievement = ParticipantAchievements.objects.filter(
            id=id, store_id=request.store_id, deleted=False
        ).first()
        if not achievement:
            return Response(
                {"message": "Achievement with given ID not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "deleted" in body:
            achievement.deleted = body["deleted"]
            achievement.save()

        return Response(status=status.HTTP_201_CREATED)

    participant_id = body.get("participant_id")
    round_id = body.get("round_id")
    achievement_id = body.get("achievement_id")
    scalable_term_id = body.get("scalable_term_id")

    if not participant_id or not round_id or not achievement_id:
        return Response(
            {"message": "Missing information to create achievement."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    achievement = (
        Achievements.objects.select_related("parent")
        .filter(id=achievement_id, deleted=False)
        .first()
    )
    if not achievement:
        return Response(
            {"message": "Achievement not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if scalable_term_id is not None:
        if not AchievementScalableTerms.objects.filter(
            achievement_id=achievement_id,
            scalable_term_id=scalable_term_id,
        ).exists():
            return Response(
                {"message": "Invalid achievement and scalable term combination."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        point_value = achievement.point_value or achievement.points
    else:
        point_value = achievement.points

    session_id = (
        Rounds.objects.filter(id=round_id, session__store_id=request.store_id)
        .values_list("session_id", flat=True)
        .first()
    )

    ParticipantAchievements.objects.create(
        participant_id=participant_id,
        achievement_id=achievement_id,
        scalable_term_id=scalable_term_id,
        round_id=round_id,
        session_id=session_id,
        earned_points=point_value,
        store_id=request.store_id,
    )
    return Response(status=status.HTTP_201_CREATED)


@api_view([GET, POST, PUT])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@require_store
def scoresheet(request, round_id: int, pod_id: int, **kwargs):
    """Technically V3 of the upsert participant achievements endpoint, but now
    broken into 3 endpoints (fetch/insert/update) to reduce complexity."""
    store_id: int = request.store_id
    if request.method == GET:
        builder = GETScoresheetHelper(round_id, pod_id, store_id)
        result = builder.build()
        return Response(result)

    body = request.data
    builder = POSTScoresheetHelper(round_id, pod_id, store_id, **body)
    result = builder.build()

    with transaction.atomic():
        pod = Pods.objects.select_for_update().get(id=pod_id, store_id=store_id)

        if request.method == POST and pod.submitted:
            return Response(
                {"message": "Pod already submitted. Use PUT to update."},
                status=status.HTTP_409_CONFLICT,
            )

        if request.method == PUT:
            if not pod.submitted:
                return Response(
                    {"message": "Pod not submitted, use POST to insert."},
                    status=status.HTTP_409_CONFLICT,
                )
            ParticipantAchievements.objects.filter(
                participant_id__in=result.pods_participants,
                round_id=round_id,
                session_id=result.session_id,
                deleted=False,
                store_id=store_id,
            ).select_related("achievement").exclude(
                achievement__slug="participation"
            ).update(
                deleted=True
            )
            WinningCommanders.objects.filter(
                pods_id=pod_id, store_id=store_id, deleted=False
            ).update(deleted=True)

        ParticipantAchievements.objects.bulk_create(result.records)

        if result.commander_name is not None:
            WinningCommanders.objects.create(
                name=result.commander_name,
                color_id=result.color_id,
                participants_id=result.winner_id,
                pods_id=pod_id,
                commander_id=result.commander_id,
                partner_id=result.partner_id,
                companion_id=result.companion_id,
                decklist_id=result.decklist_id,
                store_id=store_id,
            )
        if not pod.submitted:
            pod.submitted = True
            pod.save()

    handle_close_round(round_id)
    return Response(status=status.HTTP_201_CREATED)

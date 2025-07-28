import json

from datetime import datetime
from collections import defaultdict

from django.db import transaction
from django.db.models import Q, F, Value
from django.contrib.postgres.aggregates import ArrayAgg
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

from .models import Achievements, Colors, Restrictions
from users.models import ParticipantAchievements

from sessions_rounds.models import Pods, Sessions, PodsParticipants
from .serializers import AchievementsSerializer, ColorsSerializer, CommandersSerializer
from achievements.models import Achievements, WinningCommanders, Commanders

from achievements.helpers import (
    calculate_total_points_for_month,
    group_parents_by_point_value,
    handle_pod_win,
    fetch_scryfall_data,
    fetch_current_commanders,
    normalize_color_identity,
)

GET = "GET"
POST = "POST"


@api_view([GET])
def get_achievements_with_restrictions(_):
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
            if r is not None
        ]
        del achievement["restrictions_list"]
        if achievement["parent_id"] is None:
            parent_map[achievement["id"]] = {**achievement, "children": []}
        else:
            parent_map[achievement["parent_id"]]["children"].append(achievement)
    grouped = group_parents_by_point_value(parent_map)
    parents_with_kids = [
        p["id"] for p in achievements if parent_map[p["id"]]["children"]
    ]

    return Response(
        {"map": grouped, "data": achievements, "parents": parents_with_kids},
    )


@api_view([GET])
def get_achievements_by_participant_month(_, mm_yy=None):
    """Calculate the total points earned by a participant in a given month

    Originally this endpoint was meant for much more given the name but it's
    pretty much only used for the leaderboard. Naming will be updated to reflect
    it's true purpose sometime in the future."""

    today = datetime.today()

    if mm_yy == "new" or mm_yy == None:
        mm_yy = today.strftime("%m-%y")

    session_ids = Sessions.objects.filter(month_year=mm_yy).values_list("id", flat=True)

    res = calculate_total_points_for_month(session_ids)

    res.sort(key=lambda x: x["total_points"], reverse=True)

    return Response(res)


@api_view([GET])
def get_colors(_):
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
@permission_classes([IsAuthenticated])
def upsert_achievements(request):
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
        if "point_value" in body:
            achievement.point_value = body["point_value"]
        if "parent_id" in body:
            achievement.parent_id = body["parent_id"]
        achievement.save()
    else:
        achievement = Achievements.objects.create(
            name=name,
            deleted=body.get("deleted", False),
            point_value=body.get("point_value"),
            parent_id=body.get("parent_id"),
        )

    serialized = AchievementsSerializer(achievement).data
    return Response(serialized, status=status.HTTP_201_CREATED)


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upsert_participant_achievements_v2(request):
    """V2 of the upserting achievements endpoint. Should ideally handle things
    much more graceful than V1."""
    body = json.loads(request.body.decode("utf-8"))

    new = body.get("new", [])
    update = body.get("update", [])
    winner = body.get("winnerInfo", None)
    winInfo = body.get("winInfo", None)

    # this should always exist
    pod = Pods.objects.get(id=winner["pod_id"])
    pod_participants = PodsParticipants.objects.filter(pods_id=pod.id).values_list(
        "participants_id", flat=True
    )

    updated_objects = []
    created_objs = []

    handle_pod_win(
        winner=winner,
        info=winInfo,
        round_id=pod.rounds_id,
        participant_ids=pod_participants,
    )

    if len(update) > 0:
        update_ids = [x["id"] for x in update]
        update_objs = ParticipantAchievements.objects.filter(pk__in=update_ids)

        slugs = [x["slug"] for x in update if "slug" in x]
        slug_to_achievement = {
            a.slug: a for a in Achievements.objects.filter(slug__in=slugs)
        }

        update_data = {item["id"]: item for item in update}

        for obj in update_objs:
            record = update_data.get(obj.id)
            if record:
                obj.deleted = record.get("deleted", False)
                slug = record.get("slug")
                # participant_id isn't properly getting updated on the PA record
                if slug:
                    achievement = slug_to_achievement.get(slug)
                    if not achievement:
                        return Response(
                            {
                                "error": f"Achievement with slug '{slug}' does not exist."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    obj.achievement = achievement
                updated_objects.append(obj)

    if len(new) > 0:
        slugs = [x["slug"] for x in new if "slug" in x]
        ids = [x["achievement_id"] for x in new if "achievement_id" in x]

        all_achievements = Achievements.objects.filter(
            Q(slug__in=slugs) | Q(id__in=ids)
        )

        achievement_dict = {
            a.slug if a.slug and a.slug != "precon" else a.id: a
            for a in all_achievements
        }

        for record in new:
            if record.get("slug"):
                achievement = achievement_dict.get(record["slug"])
                r = ParticipantAchievements(
                    id=None,
                    participant_id=record["participant_id"],
                    achievement_id=achievement.id,
                    round_id=record["round_id"],
                    session_id=record["session_id"],
                    earned_points=achievement.points,
                )
                created_objs.append(r)
                continue
            achievement = achievement_dict.get(record["achievement_id"])
            r = ParticipantAchievements(
                id=None,
                participant_id=record["participant_id"],
                achievement_id=record["achievement_id"],
                round_id=record["round_id"],
                session_id=record["session_id"],
                earned_points=achievement.points,
            )
            created_objs.append(r)

    WinningCommanders(
        id=winner.get("id", None),
        name=winner["commander_name"],
        colors_id=winner["color_id"],
        participants_id=winner["participant_id"],
        pods_id=winner["pod_id"],
    ).save()
    with transaction.atomic():
        if len(updated_objects) > 0:
            ParticipantAchievements.objects.bulk_update(
                updated_objects, ["deleted", "achievement"]
            )
        if len(created_objs) > 0:
            ParticipantAchievements.objects.bulk_create(created_objs)
        if not pod.submitted:
            pod.submitted = True
            pod.save()

    return Response({"message": "success"}, status=status.HTTP_201_CREATED)


@api_view([GET])
def get_participant_round_achievements(_, participant_id, round_id):
    """Get all achievements + points for a participant in a particular round."""
    achievements = ParticipantAchievements.objects.select_related("achievement").filter(
        participant_id=participant_id, round_id=round_id, deleted=False
    )

    out = [
        {
            "id": a.id,
            "full_name": a.achievement.full_name,
            "earned_points": a.earned_points,
        }
        for a in achievements
    ]

    return Response(out)


@api_view([GET])
def get_all_commanders(_):
    """Get and return all valid commanders we have currently."""
    try:
        commanders = Commanders.objects.filter(deleted=False)
        partners_backgrounds = Commanders.objects.filter(
            Q(has_partner=True) | Q(is_background=True),
            deleted=False,
        ).distinct("name")
    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    commander_data = CommandersSerializer(commanders, many=True).data
    commander_lookup = {c["name"]: c for c in commander_data}
    partner_data = CommandersSerializer(partners_backgrounds, many=True).data
    return Response(
        {
            "commanders": commander_data,
            "partners": partner_data,
            "commander_lookup": commander_lookup,
        }
    )


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def fetch_and_insert_commanders(_):
    """
    Query scryfall and see if any new commanders have been added.

    Update the db with the new commanders if yes, else do nothing.
    """

    name_set, color_dict = fetch_scryfall_data()
    existing_commanders = fetch_current_commanders()

    print("\n\n", len(name_set), len(existing_commanders), "\n\n")
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
                records.append(Commanders(name=commander, colors_id=color_id))
            else:
                print(
                    f"Warning: No matching color_id for {commander.name} with colors {commander.colors}"
                )
    except Exception as e:
        print(f"Error found in commander mapping: {e}")

    out = Commanders.objects.bulk_create(records)

    return Response(
        {"message": f"Added {len(out)} new commanders to the database."},
        status=status.HTTP_201_CREATED,
    )

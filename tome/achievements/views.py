import json

from datetime import datetime

from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Achievements, Colors
from users.models import ParticipantAchievements
from users.serializers import (
    ParticipantsAchievementsSerializer,
    ParticipantsAchievementsFullModelSerializer,
)
from sessions_rounds.models import Pods, Sessions, PodsParticipants
from .serializers import AchievementsSerializer, ColorsSerializer, CommandersSerializer
from achievements.models import Achievements, WinningCommanders, Commanders

from achievements.helpers import (
    AchievementCleaverService,
    all_participant_achievements_for_month,
    group_parents_by_point_value,
    handle_pod_win,
)


@api_view(["GET"])
def get_achievements_with_restrictions(request):
    """Get achievements with their restrictions and put them in a map, raw list, and parents only."""
    achievements = Achievements.objects.filter(deleted=False).prefetch_related(
        "restrictions"
    )
    serializer = AchievementsSerializer(achievements, many=True).data
    parent_map = {
        a["id"]: {**a, "children": []} for a in serializer if a["parent"] is None
    }
    for achievement in serializer:
        if achievement["parent"] is not None:
            parent_map[achievement["parent"]["id"]]["children"].append(achievement)

    grouped = group_parents_by_point_value(parent_map)
    parents = [
        achievement["parent"]["id"]
        for achievement in serializer
        if achievement["parent"] is not None and achievement["deleted"] is False
    ]

    return Response(
        {"map": grouped, "data": serializer, "parents": parents},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def get_achievements_by_participant_session(_, session_id):
    """Get all the achievements earned by participants for a given session."""

    result = all_participant_achievements_for_month(session_id)
    result.sort(reverse=True, key=lambda x: x["total_points"])

    return Response(result, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_achievements_by_participant_month(_, mm_yy):
    """Get all of the achievements earned by participants in a given month."""

    today = datetime.today()

    if mm_yy == "new" or None:
        mm_yy = today.strftime("%m-%y")

    sessions_for_month = Sessions.objects.filter(month_year=mm_yy)

    result = {}
    for session in sessions_for_month:
        achievements = all_participant_achievements_for_month(session.id)
        for achievement in achievements:
            result[achievement["id"]] = achievement

    unique_achievements = list(result.values())
    unique_achievements.sort(key=lambda x: x["total_points"], reverse=True)

    return Response(unique_achievements, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_colors(request):
    colors_objects = Colors.objects.all()
    colors = [
        {"id": c["id"], "name": c["name"].title()}
        for c in ColorsSerializer(colors_objects, many=True).data
    ]

    return Response(colors, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upsert_achievements(request):
    """Create or update an achievement. Name is required."""
    body = json.loads(request.body.decode("utf-8"))
    id = body.get("id", None)
    deleted = body.get("deleted", None)
    point_value = body.get("point_value", None)
    parent_id = body.get("parent_id", None)
    name = body.get("name", None)

    if name is None:
        return Response(
            {
                "message": "Information to create/update achievement missing from request body."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    achievement, _ = Achievements.objects.update_or_create(
        id=(id if id else None),
        defaults={
            "name": name or None,
            "deleted": deleted or False,
            "point_value": point_value or None,
            "parent_id": parent_id,
        },
    )
    if achievement.deleted:
        return Response(status=status.HTTP_201_CREATED)

    serialized = AchievementsSerializer(achievement)
    return Response(serialized.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def post_achievements_for_participants(request):
    """
    Take in session_id, round_id, and a list of participants,
    each with a list of achievements earned
    that round and log them each as new records under the ParticipantsAchievements table.
    """
    # TODO First iteration of this endpoint will not consider restrictions on achievements
    # as that functionality will likely require it's own service to handle.
    body = json.loads(request.body.decode("utf-8"))
    participants = body.get("participants", None)
    round_id = body.get("round", None)
    session_id = body.get("session", None)
    pod_id = body.get("pod", None)
    winner_info = body.get("winnerInfo", None)

    if not round_id or not session_id or not pod_id:
        return Response(
            {"message": "Missing round and/or session information"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # maybe make a new service for updating?
    # if round not closed, do the existing one
    # if round closed, go into new one that:
    # takes in the stuff, edits where it needs to
    # and adds where else it needs to

    achievement_service = AchievementCleaverService(
        participants=participants,
        round=round_id,
        session=session_id,
        pod_id=pod_id,
        winner_info=winner_info,
    )
    achievement_service.build_service()
    Pods.objects.filter(id=pod_id).update(submitted=True)
    return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upsert_participant_achievements(request):
    """Update the achievement for a given round/session."""
    body = json.loads(request.body.decode("utf-8"))
    earned_id = body.get("earned_id", None)
    achievement = body.get("achievement", None)
    participant = body.get("participant", None)
    round = body.get("round", None)
    session = body.get("session", None)
    deleted = body.get("deleted", False)

    if achievement:
        achievementObj = Achievements.objects.get(id=achievement)

    if earned_id:
        pa = ParticipantAchievements.objects.get(id=earned_id)
        try:
            if achievement:
                pa.achievement_id = achievement
                pa.earned_points = achievementObj.points
            if participant:
                pa.participant_id = participant
            if round:
                pa.round_id = round
            if session:
                pa.session_id = session
            if deleted:
                pa.deleted = deleted

            pa.save()
            return Response(
                {"message": "Updated successfully"},
                status=status.HTTP_201_CREATED,
            )
        except ParticipantAchievements.DoesNotExist:
            return Response(
                {"message": "ParticipantAchievement object not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    new_entry = ParticipantAchievements.objects.create(
        achievement_id=achievement,
        participant_id=participant,
        round_id=round,
        session_id=session,
        earned_points=achievementObj.points,
    )
    return Response(
        ParticipantsAchievementsSerializer(new_entry).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
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


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_participant_round_achievements(request, participant_id, round_id):
    """Get all achievements + points for a participant in a particular round."""
    try:
        out_dict = {"total_points": 0}
        achievements_for_round = ParticipantAchievements.objects.filter(
            participant_id=participant_id, round_id=round_id, deleted=False
        )
        for achievement in achievements_for_round:
            out_dict["total_points"] = (
                out_dict["total_points"] + achievement.earned_points
            )

        out_dict["achievements"] = ParticipantsAchievementsFullModelSerializer(
            achievements_for_round, many=True
        ).data

    except ObjectDoesNotExist:
        return Response(
            {"error": "Invalid participant or round ID."},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(out_dict, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_all_commanders(_):
    """Get and return all valid commanders we have currently."""
    try:
        commanders = Commanders.objects.filter(deleted=False)
    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    data = CommandersSerializer(commanders, many=True).data
    return Response(data, status=status.HTTP_200_OK)

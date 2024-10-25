import json

from datetime import datetime

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
from users.serializers import ParticipantsAchievementsSerializer
from sessions_rounds.models import Pods, Sessions
from .serializers import AchievementsSerializer, ColorsSerializer

from achievements.helpers import (
    AchievementCleaverService,
    make_achievement_map,
    all_participant_achievements_for_month,
)


@api_view(["GET"])
def get_achievements_with_restrictions(request):
    achievements = Achievements.objects.filter(deleted=False).prefetch_related(
        "restrictions"
    )
    serializer = AchievementsSerializer(achievements, many=True).data
    map = make_achievement_map(serializer)
    parents = set(
        [
            achievement["parent"]["id"]
            for achievement in serializer
            if achievement["parent"] is not None
        ]
    )
    return Response(
        {"map": map, "data": serializer, "parents": parents}, status=status.HTTP_200_OK
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

    if not round_id or not session_id or not pod_id or not winner_info:
        return Response(
            {"message": "Missing round and/or session information"},
            status=status.HTTP_400_BAD_REQUEST,
        )

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

    if earned_id:
        try:
            pa = ParticipantAchievements.objects.get(id=earned_id)
            if achievement:
                pa.achievement_id = achievement
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
    )
    return Response(
        ParticipantsAchievementsSerializer(new_entry).data,
        status=status.HTTP_201_CREATED,
    )

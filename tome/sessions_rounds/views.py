import json
import random

from datetime import datetime

from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Sessions, Rounds, Pods, PodsParticipants
from users.models import ParticipantAchievements
from achievements.models import WinningCommanders

from .serializers import SessionSerializer, PodsParticipantsSerializer
from achievements.serializers import WinningCommandersSerializer
from users.serializers import ParticipantsAchievementsFullModelSerializer
from .helpers import (
    generate_pods,
    get_participants_total_scores,
    RoundInformationService,
)


POST = "POST"


@api_view(["GET"])
def all_sessions(request):
    """Get all sessions that are not deleted, including their rounds info."""
    sessions = Sessions.objects.filter(deleted=False)

    data = SessionSerializer(sessions, many=True).data

    session_map = {}

    # this sort is probably not needed once things get rolling for real
    data.sort(reverse=True, key=lambda x: x["created_at"])
    for session in data:
        mm_yy = session["month_year"]
        if session_map.get(mm_yy, None) is None:
            session_map[session["month_year"]] = []
        session_map[mm_yy].append(session)

    return Response(session_map, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_unique_session_months(request):
    """Get a list of unique month-years for sessions."""
    months = Sessions.objects.filter(deleted=False).values("month_year").distinct()

    sorted_months = sorted(
        [m["month_year"] for m in months],
        key=lambda x: (int(x.split("-")[1]), int(x.split("-")[0])),
    )

    return Response(sorted_months, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def sessions_and_rounds(request, mm_yy):
    """Get or create a sessions/rounds for today."""
    today = datetime.today()

    if mm_yy == "new" or None:
        mm_yy = today.strftime("%m-%y")

    if request.method == POST:
        new_session = Sessions.objects.create(month_year=mm_yy)
        Rounds.objects.create(session_id=new_session.id, round_number=1)
        Rounds.objects.create(session_id=new_session.id, round_number=2)
        serializer = SessionSerializer(new_session)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    try:
        current_session = Sessions.objects.filter(
            month_year=mm_yy, deleted=False
        ).latest("created_at")
        serializer = SessionSerializer(current_session).data
    except Sessions.DoesNotExist:
        return Response(
            {"message": "Open session for current month not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(serializer, status=status.HTTP_200_OK)


@api_view(["GET"])
def sessions_and_rounds_by_date(request):
    """Get participants total scores by session month."""

    mm_yy = request.GET.get("mm_yy")
    participants = get_participants_total_scores(mm_yy=mm_yy)

    return Response(participants, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def begin_round(request):
    """Begin a round. Request expects a round_id, session_id, and a list of participants.
    If a participant in the list does not have an id, it will be created.

    Return a list of lists (pods)"""
    body = json.loads(request.body.decode("utf-8"))
    participants = body.get("participants", None)
    round = Rounds.objects.get(id=body.get("round", None))
    session = Sessions.objects.get(id=body.get("session", None))

    if not participants or not round or not session:
        return Response(
            {"message": "Missing information to begin round."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    round_service = RoundInformationService(
        participants=participants, session=session, round=round
    )

    all_participants = list(round_service.build_participants_and_achievements())

    (
        random.shuffle(all_participants)
        if round.round_number == 1
        else all_participants.sort(key=lambda x: x.total_points, reverse=True)
    )
    pods = generate_pods(participants=all_participants, round=round)
    serialized_data = [
        PodsParticipantsSerializer(pods_participant, many=True).data
        for pods_participant in pods
    ]
    return Response(serialized_data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_pods(_, round):
    """Get the pods that were made for a given round."""
    round_obj = Rounds.objects.get(id=round)
    all_pods = Pods.objects.filter(rounds_id=round)
    winners_by_pod = WinningCommandersSerializer.by_pods(all_pods)
    pods_participants = PodsParticipants.objects.filter(
        pods_id__in=[x.id for x in all_pods]
    )

    serialized_pods_participants = PodsParticipantsSerializer(
        pods_participants,
        many=True,
        context={"round_id": round, "mm_yy": round_obj.session.month_year},
    ).data

    pod_map = {}
    for pod in serialized_pods_participants:
        pod_id = pod["pods"]["id"]
        submitted = pod["pods"]["submitted"]

        if pod_map.get(pod_id, None) is None:
            pod_map[pod_id] = {
                "id": pod_id,
                "submitted": submitted,
                "participants": [],
                "winner_info": winners_by_pod.get(pod_id, None),
            }

        participant_data = {
            "participant_id": pod["participant_id"],
            "name": pod["name"],
            "total_points": pod["total_points"],
            "round_points": pod["round_points"],
        }

        pod_map[pod_id]["participants"].append(participant_data)

    return Response(pod_map, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_pods_achievements(_, round, pod):
    """Get all of the achievements earned for a pod + round."""
    participant_achievements = ParticipantAchievements.objects.filter(
        round_id=round,
        deleted=False,
        participant__in=PodsParticipants.objects.filter(
            pods_id=pod, pods__deleted=False
        ).values_list("participants", flat=True),
    )
    achievement_data = ParticipantsAchievementsFullModelSerializer().to_dict(
        participant_achievements
    )

    winner_data = WinningCommandersSerializer.by_pods([pod])
    return Response(
        {
            "pod_achievements": achievement_data,
            "winning_commander": winner_data.get(pod, None),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def close_round(request):
    """Close a round. Endpoint expects a round_id and a session_id
    Essentially flipping the associated round 'closed' flag to true

    If the received round is a second round, also flip the session flag to true."""
    body = json.loads(request.body.decode("utf-8"))
    round = body.get("round", None)
    session = body.get("session", None)

    if not round or not session:
        return Response(
            {"message": "Session/Round information not provided"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    Rounds.objects.filter(id=round["id"]).update(completed=True)

    if round["round_number"] != 1:
        Sessions.objects.filter(id=session).update(closed=True)

    return Response(status=status.HTTP_201_CREATED)

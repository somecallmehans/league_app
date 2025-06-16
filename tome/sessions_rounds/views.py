import json
import random

from datetime import datetime
from collections import defaultdict

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
from users.models import ParticipantAchievements, Participants

from .serializers import SessionSerializer, PodsParticipantsSerializer
from achievements.serializers import WinningCommandersSerializer
from users.serializers import (
    ParticipantsAchievementsFullModelSerializer,
    ParticipantsSerializer,
)
from .helpers import (
    generate_pods,
    get_participants_total_scores,
    RoundInformationService,
    PodRerollService,
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
def sessions_and_rounds(request, mm_yy=None):
    """Get or create a sessions/rounds for today."""

    if mm_yy is None or mm_yy == "new":
        today = datetime.today()
        mm_yy = today.strftime("%m-%y")

    if request.method == POST:
        new_session = Sessions.objects.create(month_year=mm_yy)
        Rounds.objects.create(session_id=new_session.id, round_number=1)
        Rounds.objects.create(session_id=new_session.id, round_number=2)
        session = SessionSerializer(new_session).data

        return Response(session, status=status.HTTP_201_CREATED)
    try:
        session_data = Sessions.objects.filter(month_year=mm_yy, deleted=False).latest(
            "created_at"
        )
        session = SessionSerializer(session_data).data
    except Sessions.DoesNotExist:
        return Response(
            {"message": "Open session for current month not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(session, status=status.HTTP_200_OK)


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

    Return the bridge records on success"""
    body = json.loads(request.body.decode("utf-8"))
    participants = body.get("participants", None)
    round_id = body.get("round", None)
    session_id = body.get("session", None)

    if not participants or not round or not session_id:
        return Response(
            {"message": "Missing information to begin round."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    round_service = RoundInformationService(
        participants=participants, session_id=session_id, round_id=round_id
    )

    all_participants = list(round_service.build_participants_and_achievements())

    (
        random.shuffle(all_participants)
        # Round 1 is always odd id, round 2 is always evem
        if round_id % 2 != 0
        else all_participants.sort(key=lambda x: x.total_points, reverse=True)
    )

    pods = PodsParticipantsSerializer(
        generate_pods(participants=all_participants, round_id=round_id), many=True
    ).data
    return Response(pods, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reroll_pods(request):
    """Take in a list of participants and a round_id. Create any participants that don't exist
    and then roll everyone into new pods (either random or sorted based on round)"""
    body = json.loads(request.body.decode("utf-8"))
    participants = body.get("participants", None)
    round = Rounds.objects.get(id=body.get("round", None))
    pods = Pods.objects.filter(rounds_id=round.id, deleted=False)

    if not participants or not round:
        return Response(
            {"message": "Missing information to reroll pods."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pod_service = PodRerollService(participants=participants, round=round, pods=pods)

    new_pods = pod_service.build()
    return Response(
        new_pods,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_round_participants(_, round):
    """Take in a round id and return all participants who
    are assigned to a pods for that given round."""
    if not round:
        return Response("Error, no round provided.", status=status.HTTP_400_BAD_REQUEST)

    participants = Participants.objects.filter(
        podsparticipants__pods__rounds_id=round, podsparticipants__pods__deleted=False
    )

    return Response(
        ParticipantsSerializer(participants, many=True).data, status=status.HTTP_200_OK
    )


@api_view(["GET"])
def get_pods(_, round):
    """Get the pods that were made for a given round."""
    round_obj = Rounds.objects.get(id=round)
    all_pods = Pods.objects.filter(rounds_id=round, deleted=False)
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


@api_view(["GET"])
def get_rounds_by_month(_, mm_yy):
    """Get all rounds for a given month.
    Return a dict where keys are dates and val is a list of rounds."""
    try:
        rounds = (
            Rounds.objects.filter(
                session__month_year=mm_yy, session__deleted=False, deleted=False
            )
            .select_related("session")
            .values("session__id", "id", "round_number", "created_at")
        )
        round_dict = defaultdict(list)
        for round in rounds:
            formatted_date = round["created_at"].strftime("%-m/%-d")
            round_dict[formatted_date].append(round)
    except BaseException as e:
        print(f"Exception found: {e}")
        return Response({"message": "Bad request"}, status=status.HTTP_400_BAD_REQUEST)
    return Response(round_dict, status=status.HTTP_200_OK)

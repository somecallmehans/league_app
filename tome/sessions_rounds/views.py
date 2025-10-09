import json
import random

from datetime import datetime, date, time
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
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch, Exists, OuterRef
from django.utils import timezone

from .models import Sessions, Rounds, Pods, PodsParticipants, RoundSignups
from users.models import ParticipantAchievements, Participants
from achievements.models import WinningCommanders, Achievements

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
from configs.configs import get_round_caps

GET = "GET"
POST = "POST"
DELETE = "DELETE"


@api_view([GET])
def all_sessions(_):
    """Get all sessions that are not deleted, including their rounds info."""
    data = Sessions.objects.filter(deleted=False).order_by("-session_date")
    sessions = SessionSerializer(data, many=True).data

    session_map = defaultdict(list)
    for session in sessions:
        mm_yy = session["month_year"]
        session_map[mm_yy].append(session)

    return Response(session_map, status=status.HTTP_200_OK)


@api_view([GET])
def get_unique_session_months(request):
    """Get a list of unique month-years for sessions."""
    months = Sessions.objects.filter(deleted=False).values("month_year").distinct()

    sorted_months = sorted(
        [m["month_year"] for m in months],
        key=lambda x: (int(x.split("-")[1]), int(x.split("-")[0])),
    )

    return Response(sorted_months, status=status.HTTP_200_OK)


@api_view([GET, POST])
def sessions_and_rounds(request, mm_yy=None):
    """Get or create a sessions/rounds for today."""

    if mm_yy is None or mm_yy == "new":
        today = datetime.today()
        mm_yy = today.strftime("%m-%y")

    if request.method == POST:
        body = json.loads(request.body.decode("utf-8"))
        sess_date_str = body.get("session_date")

        if not sess_date_str:
            return Response(
                {"message": "Session date required (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_date = date.fromisoformat(sess_date_str)
        mm_yy = session_date.strftime("%m-%y")
        new_session = Sessions.objects.create(
            month_year=mm_yy, session_date=session_date
        )

        tz = timezone.get_current_timezone()
        r1_naive = datetime.combine(session_date, time(13, 30))
        r2_naive = datetime.combine(session_date, time(15, 30))

        r1_dt = (
            r1_naive
            if timezone.is_aware(r1_naive)
            else timezone.make_aware(r1_naive, tz)
        )
        r2_dt = (
            r2_naive
            if timezone.is_aware(r2_naive)
            else timezone.make_aware(r2_naive, tz)
        )

        Rounds.objects.create(session=new_session, round_number=1, starts_at=r1_dt)
        Rounds.objects.create(session=new_session, round_number=2, starts_at=r2_dt)
        session = SessionSerializer(new_session).data

        return Response(session, status=status.HTTP_201_CREATED)
    try:
        session_data = Sessions.objects.filter(month_year=mm_yy, deleted=False).latest(
            "session_date"
        )
        session = SessionSerializer(session_data).data
    except Sessions.DoesNotExist:
        return Response(
            {"message": "Open session for current month not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(session, status=status.HTTP_200_OK)


@api_view([GET])
def sessions_and_rounds_by_date(request):
    """Get participants total scores by session month."""

    mm_yy = request.GET.get("mm_yy")
    participants = get_participants_total_scores(mm_yy=mm_yy)

    return Response(participants, status=status.HTTP_200_OK)


@api_view([POST])
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

    if len(participants) in (1, 2):
        return Response(
            {"message": "Not enough players to begin round."},
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


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reroll_pods(request):
    """Take in a list of participants and a round_id. Create any participants that don't exist
    and then roll everyone into new pods (either random or sorted based on round)"""
    body = json.loads(request.body.decode("utf-8"))

    try:
        participants = body.get("participants", None)
        round = Rounds.objects.get(id=body.get("round", None))
        pods = Pods.objects.filter(rounds_id=round.id, deleted=False)
    except Exception as e:
        return Response(
            {"message": "Missing information to reroll pods"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        pod_service = PodRerollService(
            participants=participants, round=round, pods=pods
        )
        new_pods = pod_service.build()
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(
        new_pods,
        status=status.HTTP_201_CREATED,
    )


@api_view([GET])
def get_round_participants(_, round):
    """Take in a round id and return all participants who
    are assigned to pods for that given round."""
    try:
        round_obj = Rounds.objects.get(id=round)
    except ObjectDoesNotExist:
        return Response(
            {"message": "Round not found for given id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    participants = Participants.objects.filter(
        podsparticipants__pods__rounds=round_obj, podsparticipants__pods__deleted=False
    )

    return Response(
        ParticipantsSerializer(participants, many=True).data, status=status.HTTP_200_OK
    )


@api_view([GET])
def get_pods(_, round):
    """Get the pods that were made for a given round."""
    try:
        round_obj = Rounds.objects.get(id=round)
    except ObjectDoesNotExist:
        return Response(
            {"message": "Round not found"}, status=status.HTTP_400_BAD_REQUEST
        )

    pods = Pods.objects.filter(rounds_id=round, deleted=False)
    pod_ids = pods.values_list("id", flat=True)
    winners_by_pod = WinningCommandersSerializer.by_pods(pods)

    pods_participants = PodsParticipants.objects.filter(pods_id__in=pod_ids)

    serialized_participants = PodsParticipantsSerializer(
        pods_participants,
        many=True,
        context={"round_id": round, "mm_yy": round_obj.session.month_year},
    ).data

    pod_map = defaultdict(lambda: {"participants": []})

    for entry in serialized_participants:
        pod_id = entry["pods"]["id"]
        pod_data = pod_map[pod_id]

        if not pod_data.get("id"):
            pod_data.update(
                {
                    "id": pod_id,
                    "submitted": entry["pods"]["submitted"],
                    "winner_info": winners_by_pod.get(pod_id),
                }
            )

        pod_data["participants"].append(
            {
                "participant_id": entry["participant_id"],
                "name": entry["name"],
                "total_points": entry["total_points"],
                "round_points": entry["round_points"],
            }
        )

    return Response(pod_map, status=status.HTTP_200_OK)


@api_view([GET])
def get_pods_achievements(_, pod):
    """Get all of the achievements earned for a pod

    this data is used to populate the initial values
    of the scorecard form."""
    try:
        pod_obj = Pods.objects.filter(id=pod, deleted=False).first()
    except ObjectDoesNotExist:
        return Response({"message": "No pod found"}, status=status.HTTP_400_BAD_REQUEST)

    participant_achievements = ParticipantAchievements.objects.filter(
        round_id=pod_obj.rounds_id,
        deleted=False,
        participant__in=PodsParticipants.objects.filter(
            pods_id=pod_obj.id, pods__deleted=False
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


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def close_round(request):
    """Close a round. Endpoint expects a round_id and a session_id
    Essentially flipping the associated round 'closed' flag to true

    If the received round is a second round, also flip the session flag to true.

    NOTE 6/22/25: Unexpected, but the powers that be whom submit scores totally ignore
    the "close round" button this endpoint is attached to. Even though it blinks bright red, afaik
    they have never touched it. And in the 8~ months this app has been active, there hasn't been
    any ill effects or any notable reason for a round or session to be marked closed/submitted
    other than that being something that made sense to me in August 2024

    For that reason, this endpoint will soon be deprecated in favor of a check whenever
    a pod gets submitted to see whether a round should be closed or not based on if any pods are
    still active/open or not.
    """
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


@api_view([GET])
def get_rounds_by_month(_, mm_yy):
    """Get all rounds for a given month.
    Return a dict where keys are dates and val is a list of rounds."""
    rounds = (
        Rounds.objects.filter(
            session__month_year=mm_yy, session__deleted=False, deleted=False
        )
        .select_related("session")
        .annotate(
            started=Exists(Pods.objects.filter(rounds=OuterRef("pk"), deleted=False))
        )
        .values(
            "session__id",
            "session__closed",
            "id",
            "round_number",
            "created_at",
            "completed",
            "started",
            "starts_at",
        )
    )

    if not rounds.exists():
        return Response({})

    round_dict = defaultdict(list)
    for round in rounds:
        formatted_date = round["starts_at"].strftime("%-m/%-d")
        round_dict[formatted_date].append(round)

    return Response(round_dict)


@api_view([GET])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_all_rounds(_, participant_id=None):
    """
    Get all of the rounds that have happened. If we have a participant_id, get
    all of the rounds that occurred after that participant was created (by day)
    """

    filters = {"deleted": False}

    if participant_id:
        participant = (
            Participants.objects.filter(id=participant_id).values("created_at").first()
        )
        if participant is None:
            return Response(
                {"message": f"Participant with ID {participant_id} not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        filters["created_at__date__gt"] = participant["created_at"].date()
    rounds = (
        Rounds.objects.filter(**filters)
        .values("id", "round_number", "starts_at")
        .order_by("-starts_at")
    )
    for r in rounds:
        r["starts_at"] = r["starts_at"].strftime("%-m/%-d/%Y")
    return Response(rounds)


@api_view([GET])
def get_participant_recent_pods(_, participant_id, mm_yy=None):
    """
    Get pods for the given participant for all of the rounds they were apart of
    this month.

    """

    if not mm_yy:
        today = datetime.today()
        mm_yy = today.strftime("%m-%y")

    participant = Participants.objects.filter(id=participant_id, deleted=False).first()

    if not participant:
        return Response(
            {"message": "Participant does not exist"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    participant_pods = (
        Pods.objects.filter(
            deleted=False,
            rounds__session__month_year=mm_yy,
            podsparticipants__participants=participant,
        )
        .select_related("rounds")
        .prefetch_related(
            Prefetch(
                "podsparticipants_set",
                queryset=PodsParticipants.objects.select_related("participants"),
            )
        )
    )

    winners = WinningCommanders.objects.filter(
        pods_id__in=[p.id for p in participant_pods], deleted=False
    ).values("pods_id", "participants_id", "name")

    winners_dict = {w["pods_id"]: w for w in winners}

    out = defaultdict(list)
    for pod in participant_pods:
        pod_id = pod.id
        winner = winners_dict.get(pod_id)
        occurred = pod.rounds.starts_at

        participants = pod.podsparticipants_set.all()

        out[occurred.strftime("%m/%d/%Y")].append(
            {
                "id": pod_id,
                "round_number": pod.rounds.round_number,
                "commander_name": (
                    winner["name"] if winner else "Commander Not Reported"
                ),
                "participants": [
                    {
                        "id": p.participants.id,
                        "name": p.participants.name,
                        "winner": (
                            True
                            if winner and winner["participants_id"] == p.participants.id
                            else False
                        ),
                    }
                    for p in participants
                ],
            }
        )

    sorted_output = sorted(
        out.items(), key=lambda x: datetime.strptime(x[0], "%m/%d/%Y")
    )

    return Response(sorted_output)


@api_view([POST])
def signup(request):
    """Allows users to pre-signup for a round using their code that should be linked
    to them via discord."""
    body = json.loads(request.body.decode("utf-8"))
    code: str = body.get("code")
    rounds: list[int] = body.get("rounds")

    pid = (
        Participants.objects.filter(
            code=code, deleted=False, discord_user_id__isnull=False
        )
        .values_list("id", flat=True)
        .first()
    )

    if not pid:
        return Response({"message": "No participant found for the given code."})

    has_signed_in = RoundSignups.objects.filter(
        participant_id=pid, round_id__in=rounds
    ).exists()

    if has_signed_in:
        return Response({"message": "User has already signed in."})

    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=rid) for rid in rounds
    )

    return Response({"message": "Successfully added"}, status=status.HTTP_201_CREATED)


@api_view([GET])
def signin_counts(request):
    """Return a count and 2 lists of currently signed in users."""
    round_one = request.query_params.get("round_one")
    round_two = request.query_params.get("round_two")

    if not round_one and not round_two:
        return Response(
            {"message": "At least one round required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    query = (
        RoundSignups.objects.filter(round_id__in=[round_one, round_two])
        .select_related("participant")
        .values("participant_id", "participant__name", "round_id")
    )

    out = {
        round_one: {"participants": [], "count": 0, "is_full": False},
        round_two: {"participants": [], "count": 0, "is_full": False},
    }

    cap1, cap2 = get_round_caps()

    for q in query:
        if q["round_id"] == int(round_one):
            out[round_one]["participants"].append(
                {"id": q["participant_id"], "name": q["participant__name"]}
            )
            out[round_one]["count"] += 1

            if out[round_one]["count"] >= cap1:
                out[round_one]["is_full"] = True
        else:
            out[round_two]["participants"].append(
                {"id": q["participant_id"], "name": q["participant__name"]}
            )
            out[round_two]["count"] += 1
            if out[round_two]["count"] >= cap2:
                out[round_two]["is_full"] = True

    return Response(out)


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def post_signin(request):
    """Post a signed in user from the lobby. Accepts a round_id and a participant_id"""
    body = json.loads(request.body.decode("utf-8"))
    rid = body.get("round_id")
    pid = body.get("participant_id")

    if not rid or not pid:
        return Response(
            {"message": "Missing round or participant in request."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _, created = RoundSignups.objects.get_or_create(
        round_id=rid,
        participant_id=pid,
    )

    if not created:
        return Response(
            {"message": "User already exists for round."}, status=status.HTTP_200_OK
        )

    return Response({"message": "Created"}, status=status.HTTP_201_CREATED)


@api_view([DELETE])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_signin(request):
    """Remove a signed in user from lobby."""
    body = json.loads(request.body.decode("utf-8"))

    rid = body.get("round_id")
    pid = body.get("participant_id")

    if not rid or not pid:
        return Response(
            {"message": "Missing round or participant in request."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        rid = int(rid)
        pid = int(pid)
    except (TypeError, ValueError):
        return Response(
            {"detail": "round_id and participant_id must be integers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    deleted_count, _ = RoundSignups.objects.filter(
        round_id=rid, participant_id=pid
    ).delete()

    if deleted_count == 0:
        return Response(
            {"detail": "Signup not found for given round_id and participant_id."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_pod_participants(request):
    """Take in a participant and a pod, and if there's space/user is not in another pod already
    then add said participant to that pod."""

    body = json.loads(request.body.decode("utf-8"))
    pod_id = body.get("pod_id")
    pid = body.get("participant_id")
    rid = body.get("round_id")

    if not pod_id or not pid or not rid:
        return Response(
            {"message": "Missing pod id, participant id, or round id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target_pod = PodsParticipants.objects.filter(pods_id=pod_id)
    round_participants = (
        PodsParticipants.objects.filter(pods__rounds_id=rid, pods__deleted=False)
        .values_list("participants_id", flat=True)
        .distinct()
    )

    if len(target_pod) >= 5:
        return Response(
            {"message": "Pod already full"}, status=status.HTTP_204_NO_CONTENT
        )

    if any(pid == tp.id for tp in target_pod) or pid in round_participants:
        return Response(
            {"message": "Participant already in pod"}, status=status.HTTP_204_NO_CONTENT
        )

    part = Achievements.objects.get(slug="participation")
    has_participation = (
        ParticipantAchievements.objects.filter(
            participant_id=pid, round_id=rid, achievement_id=part.id
        )
        .select_related("achievements")
        .exists()
    )

    if not has_participation:
        [sid] = Rounds.objects.filter(id=rid).values_list("session_id", flat=True)
        ParticipantAchievements.objects.create(
            participant_id=pid,
            round_id=rid,
            achievement_id=part.id,
            session_id=sid,
            earned_points=part.point_value,
        )

    PodsParticipants.objects.create(participants_id=pid, pods_id=pod_id)

    return Response({"message": "Successfully added"}, status=status.HTTP_201_CREATED)


@api_view([DELETE])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_pod_participant(request):
    """Take in a participant and a pod and delete that combo from the podsparticipants table."""

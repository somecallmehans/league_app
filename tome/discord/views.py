import json
from datetime import date
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from utils.decorators import require_service_token

from users.models import Participants
from sessions_rounds.models import Sessions, RoundSignups, Rounds, Pods

from configs.configs import get_round_caps

GET = "GET"
POST = "POST"


@require_service_token
@api_view([GET])
def mycode(_, discord_user_id):
    """Take in a users discord id, return their code."""
    code = (
        Participants.objects.filter(discord_user_id=discord_user_id, deleted=False)
        .values("code")
        .first()
    )

    if not code:
        return Response(
            {"message": "No code found, participant likely unlinked."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(code)


@require_service_token
@api_view([GET])
def search(_, query):
    """Take in the string we're looking for and search against users who
    are currently unlinked."""
    q = (query or "").strip()
    matched_participants = Participants.objects.filter(
        Q(name__icontains=q), discord_user_id=None, deleted=False
    ).values("id", "name")

    return Response(list(matched_participants))


@csrf_exempt
@require_service_token
@api_view([POST])
def link(request):
    """Take in the a user id + the discord id. Add the discord id to the users row."""
    body = json.loads(request.body.decode("utf-8"))
    pid = body.get("participant_id")
    duid = body.get("discord_user_id")

    if not pid or not duid:
        return Response(
            {"message": "Missing either participant_id or discord user id."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target = Participants.objects.get(id=pid)

    if target.discord_user_id:
        return Response({"message": "User already linked."}, status=status.HTTP_200_OK)

    target.discord_user_id = duid
    target.save()
    return Response(
        {"code": target.code},
        status=status.HTTP_201_CREATED,
    )


@require_service_token
@api_view([GET])
def next_session(_):
    """Return the next upcoming session with its rounds."""

    next_session = (
        Sessions.objects.filter(
            closed=False,
            deleted=False,
            session_date__gte=date.today(),
        )
        .order_by("session_date")
        .first()
    )
    if not next_session:
        return Response(
            {"message": "Sign-ins not open"}, status=status.HTTP_400_BAD_REQUEST
        )

    rounds = list(
        Rounds.objects.filter(session=next_session, deleted=False)
        .values("id", "round_number", "starts_at")
        .order_by("round_number")[:2]
    )
    counts_qs = (
        RoundSignups.objects.filter(round_id__in=[r["id"] for r in rounds])
        .values("round_id")
        .annotate(user_count=Count("participant_id", distinct=True))
    )
    current = {row["round_id"]: row["user_count"] for row in counts_qs}

    cap1, cap2 = get_round_caps()

    for r in rounds:
        cap = cap1 if r["round_number"] == 1 else cap2
        r["current_count"] = current.get(r["id"], 0)
        r["cap"] = cap
        r["is_full"] = r["current_count"] >= cap

    if all(r["is_full"] for r in rounds):
        return Response({"message": "Rounds are full"})

    return Response(
        {
            "session_date": next_session.session_date.strftime("%Y-%m-%d"),
            "rounds": rounds,
        }
    )


@csrf_exempt
@require_service_token
@api_view([POST])
def signin(request):
    """Sign in a user via discord."""
    body = json.loads(request.body.decode("utf-8"))
    duid: str = body.get("discord_user_id")
    rounds: list[int] = body.get("rounds")

    pid = (
        Participants.objects.filter(deleted=False, discord_user_id=duid)
        .values_list("id", flat=True)
        .first()
    )

    round_started = Pods.objects.filter(rounds_id__in=rounds).exists()

    print("\n\n", round_started, "\n\n")
    if round_started:
        return Response(
            {"message": "Round has started, sign ins are closed."},
            status=status.HTTP_208_ALREADY_REPORTED,
        )

    if not pid:
        return Response(
            {
                "message": "Participant is currently not linked. Run /link to connect to your league history."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    has_signed_in = RoundSignups.objects.filter(
        participant_id=pid, round_id__in=rounds
    ).exists()

    if has_signed_in:
        return Response(
            {"message": "User has already signed in."},
            status=status.HTTP_208_ALREADY_REPORTED,
        )

    round_numbers = dict(
        Rounds.objects.filter(id__in=rounds).values_list("id", "round_number")
    )
    counts_qs = (
        RoundSignups.objects.filter(round_id__in=rounds)
        .values("round_id")
        .annotate(user_count=Count("participant_id", distinct=True))
    )
    current_counts = {row["round_id"]: row["user_count"] for row in counts_qs}

    cap1, cap2 = get_round_caps()

    def cap_for(rid: int) -> int:
        rn = round_numbers.get(rid)
        return cap1 if rn == 1 else cap2

    full_rounds = [rid for rid in rounds if current_counts.get(rid, 0) >= cap_for(rid)]
    if full_rounds:
        return Response(
            {"message": "Selected round is full.", "full_round_ids": full_rounds},
            status=status.HTTP_409_CONFLICT,
        )

    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=rid) for rid in rounds
    )

    return Response({"message": "Successfully added"}, status=status.HTTP_201_CREATED)

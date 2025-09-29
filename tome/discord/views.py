import json
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from utils.decorators import require_service_token

from users.models import Participants
from sessions_rounds.models import Sessions, RoundSignups
from sessions_rounds.serializers import SessionSerializer

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
    matched_participants = Participants.objects.filter(
        name__contains=query, discord_user_id=None, deleted=False
    ).values("id", "name")

    return Response(matched_participants)


@csrf_exempt
@require_service_token
@api_view([POST])
def link(request):
    """Take in the a user id + the discord id. Add the discord id to the users row."""
    body = json.loads(request.body.decode("utf-8"))
    pid = body.get("participant_id")
    duid = body.get("discord_user_id")

    if not pid and not duid:
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
        Sessions.objects.filter(closed=False, deleted=False)
        .order_by("-created_at")
        .first()
    )

    if not next_session:
        return Response(
            {"message": "Sign-ins not open"}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response(SessionSerializer(next_session).data)


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
        return Response({"message": "User has already signed in."})

    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=rid) for rid in rounds
    )

    return Response({"message": "Successfully added"}, status=status.HTTP_201_CREATED)

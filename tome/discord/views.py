import json
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from utils.decorators import require_service_token

from users.models import Participants

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

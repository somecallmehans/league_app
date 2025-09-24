from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from users.models import Participants

GET = "GET"


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

import json

from django.core.exceptions import ObjectDoesNotExist

from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


from .models import Participants
from .serializers import ParticipantsSerializer
from .queries import get_decklists


@api_view(["GET"])
def get_all_participants(_, id=None):
    filters = {"deleted": False}
    if id:
        filters["id"] = id
    data = list(Participants.objects.filter(**filters).values("id", "name"))
    # participants = ParticipantsSerializer(data, many=True).data
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upsert_participant(request):
    body = json.loads(request.body.decode("utf-8"))
    id = body.get("id", None)
    name = body.get("name", None)
    deleted = body.get("deleted", None)

    if not name and not id:
        return Response(
            {"message": "Missing information to upsert participant"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if id:
        try:
            participant = Participants.objects.get(id=id)
        except ObjectDoesNotExist:
            return Response(
                {"message": "Participant not found"}, status=status.HTTP_400_BAD_REQUEST
            )
        if name:
            participant.name = name
        if deleted:
            participant.deleted = True
        participant.save()
        return Response(
            {"message": "Updated successfully"}, status=status.HTTP_201_CREATED
        )

    participant = Participants.objects.create(name=name)
    serializer = ParticipantsSerializer(participant)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


class Login(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, _):
        content = {"message": "Hello, World!"}
        return Response(content)


@api_view(["GET"])
def decklists(request):
    """Return all current active submitted decklists"""

    if request.method == "GET":
        out = get_decklists(request.query_params)
        return Response(out)

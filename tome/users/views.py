import json

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


@api_view(["GET"])
def get_all_participants(request):
    participants = Participants.objects.all().filter(deleted=False)
    serializer = ParticipantsSerializer(participants, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upsert_participant(request):
    body = json.loads(request.body.decode("utf-8"))
    id = body.get("id", None)
    name = body.get("name", None)
    deleted = body.get("deleted", None)

    if id:
        try:
            participant = Participants.objects.get(id=id)
            if name:
                participant.name = name
            if deleted:
                participant.deleted = True
            participant.save()
            return Response(
                {"message": "Updated successfully"}, status=status.HTTP_201_CREATED
            )
        except Participants.DoesNotExist:
            return Response({"message": "Participant not found"})

    participant = Participants.objects.create(name=name)
    serializer = ParticipantsSerializer(participant)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


class Login(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        content = {"message": "Hello, World!"}
        return Response(content)

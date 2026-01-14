import json

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Sum, F
from django.db.models.functions import Coalesce
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

from services.scryfall_client import ScryfallClientRequest

from .models import Participants, Decklists
from .serializers import ParticipantsSerializer

scryfall_request = ScryfallClientRequest()


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
def get_decklists(_):
    """Return all current active submitted decklists"""

    query = (
        Decklists.objects.filter(deleted=False)
        .annotate(
            points=Coalesce(
                Sum(
                    Coalesce(
                        "achievement__point_value",
                        F("achievement__parent__point_value"),
                        0,
                    )
                ),
                0,
            )
        )
        .values(
            "id",
            "name",
            "url",
            "code",
            "commander_id",
            "commander__name",
            "partner_id",
            "partner__name",
            "companion_id",
            "companion__name",
            "participant__name",
            "participant_id",
            "points",
        )
    )

    out = []
    commander_images = scryfall_request.get_commander_image_urls(
        commander_names=[
            name
            for row in query
            for name in (
                row.get("commander__name"),
                row.get("partner__name"),
                row.get("companion__name"),
            )
            if name
        ]
    )
    for q in query:
        out.append(
            {"commander_img": commander_images.get(q["commander__name"], []), **q}
        )

    return Response(list(out))

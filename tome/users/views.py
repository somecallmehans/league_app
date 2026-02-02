import json

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from rest_framework.exceptions import ValidationError, AuthenticationFailed, ParseError

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

from utils.decorators import require_user_code
from .models import Participants, SessionToken
from .serializers import ParticipantsSerializer
from .queries import (
    get_decklists,
    post_decklists,
    get_single_decklist_by_code,
    get_decklist_by_participant_round,
    get_valid_edit_token_or_fail,
    require_session_token,
    get_session_token_or_none,
    get_single_decklist_by_id,
)


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


@api_view(["GET", "POST"])
@require_user_code
def decklists(request, **kwargs):
    """Return all current active submitted decklists"""

    if request.method == "GET":
        out = get_decklists(params=request.query_params, owner_id=None)
        return Response(out)

    try:
        pid = kwargs["participant_id"]
        post_decklists(request.data, pid)
        return Response(status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response(
            {"detail": str(e.detail["url"]), "errors": e.detail},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def decklist(request):
    """Return an individual decklist, shaped for our scoresheet form."""

    params = request.query_params
    code = params.get("code")
    participant_id = params.get("participant_id")
    round_id = params.get("round_id")

    if not code and not participant_id and not round_id:
        return Response(
            {"detail": "Details missing to fetch decklist"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if code and len(code) != 4:
        return Response(
            {"detail": "Incorrect code format supplied"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if code:
        payload = get_single_decklist_by_code(code)
    else:
        payload = get_decklist_by_participant_round(int(participant_id), int(round_id))
    return Response(payload, status=status.HTTP_200_OK)


@api_view(["GET"])
def decklist_by_id(request):
    """Take in a decklist_id and return the data for editing. Also check to ensure
    there is a session active and it's still valid, otherwise 401."""
    try:
        require_session_token(request)
    except ParseError as e:
        return Response({"active": False})
    except AuthenticationFailed as e:
        return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    decklist_id = request.query_params.get("decklist_id")

    payload = get_single_decklist_by_id(decklist_id)

    return Response(payload)


@api_view(["GET"])
def verify_session_token(request):
    """This endpoint is called by out edit decklists gatekeeper to see whether
    we have an active session token or not. Return 200 if the token is valid."""

    try:
        token = get_session_token_or_none(request)
    except ParseError as e:
        return Response({"active": False})
    except AuthenticationFailed as e:
        return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    if not token:
        return Response({"active": False})

    return Response(
        {"active": True, "expires_at": int(token.expires_at.timestamp())},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def exchange_tokens(request):
    """Take in an edit token, validate, and return a session token attached
    to a cookie."""

    code = (request.data.get("code") or "").strip()

    if not code:
        return Response(
            {"detail": "Code is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        owner = get_valid_edit_token_or_fail(code)
    except AuthenticationFailed as e:
        return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    session = SessionToken.mint(owner=owner)

    resp = Response(
        {
            "active": True,
            "expires_at": int(session.expires_at.timestamp()),
        }
    )

    resp.set_cookie(
        key="edit_decklist_session",
        value=session.session_id,
        max_age=30 * 60,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/",
    )

    return resp


@api_view(["GET"])
def get_user_decklists(request):
    """Validate the cookie, if it's legit return the decklists for the user."""

    try:
        token = require_session_token(request)
    except ParseError as e:
        return Response({"active": False})
    except AuthenticationFailed as e:
        return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    decklists = get_decklists(params=None, owner_id=token.owner_id)

    return Response(decklists)

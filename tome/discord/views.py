import json
import logging
from django.db import transaction
from datetime import date
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from utils.decorators import require_service_token, require_discord_store

from users.models import Participants, EditToken, Decklists
from users.helpers import check_for_bad_words
from sessions_rounds.models import Sessions, RoundSignups, Rounds, Pods
from stores.models import Store, StoreParticipant

from configs.configs import get_round_caps

logger = logging.getLogger(__name__)

GET = "GET"
POST = "POST"


@require_service_token
@require_discord_store
@api_view([GET])
def mycode(request, discord_user_id):
    """Take in a users discord id, return their code."""

    code = (
        Participants.objects.filter(
            discord_user_id=discord_user_id,
            deleted=False,
        )
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
@require_discord_store
@api_view([GET])
def search(request, query):
    """Take in the string we're looking for and search against users who
    are currently unlinked."""
    q = (query or "").strip()
    matched_participants = Participants.objects.filter(
        Q(name__icontains=q),
        discord_user_id=None,
        deleted=False,
    ).values("id", "name")

    return Response(list(matched_participants))


@csrf_exempt
@require_service_token
@require_discord_store
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
@require_discord_store
@api_view([GET])
def next_session(request):
    """Return the next upcoming session with its rounds."""

    next_session = (
        Sessions.objects.filter(
            closed=False,
            deleted=False,
            session_date__gte=date.today(),
            store_id=request.store_id,
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
        RoundSignups.objects.filter(
            round_id__in=[r["id"] for r in rounds], store_id=request.store_id
        )
        .values("round_id")
        .annotate(user_count=Count("participant_id", distinct=True))
    )
    current = {row["round_id"]: row["user_count"] for row in counts_qs}

    cap1, cap2 = get_round_caps(store_id=request.store_id)

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
@require_discord_store
@api_view([POST])
def signin(request):
    """Sign in a user via discord."""
    body = json.loads(request.body.decode("utf-8"))
    duid: str = body.get("discord_user_id")
    rounds: list[int] = body.get("rounds")

    logger.info(f"Received signin request for {duid}")

    pid = (
        Participants.objects.filter(deleted=False, discord_user_id=duid)
        .values_list("id", flat=True)
        .first()
    )

    round_started = Pods.objects.filter(
        rounds_id__in=rounds, store_id=request.store_id
    ).exists()

    if round_started:
        logger.error(f"Signin failed for {duid}, round has started")
        return Response(
            {"message": "Round has started, sign ins are closed."},
            status=status.HTTP_208_ALREADY_REPORTED,
        )

    if not pid:
        logger.error(f"Signin failed for {duid}, participant not linked")

        return Response(
            {
                "message": "Participant is currently not linked. Run /link to connect to your league history."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    has_signed_in = RoundSignups.objects.filter(
        participant_id=pid, round_id__in=rounds, store_id=request.store_id
    ).exists()

    if has_signed_in:
        logger.error(f"Signin failed for {duid}, user already signed in")

        return Response(
            {"message": "User has already signed in."},
            status=status.HTTP_208_ALREADY_REPORTED,
        )

    round_numbers = dict(
        Rounds.objects.filter(
            id__in=rounds, session__store_id=request.store_id
        ).values_list("id", "round_number")
    )
    counts_qs = (
        RoundSignups.objects.filter(round_id__in=rounds, store_id=request.store_id)
        .values("round_id")
        .annotate(user_count=Count("participant_id", distinct=True))
    )
    current_counts = {row["round_id"]: row["user_count"] for row in counts_qs}

    cap1, cap2 = get_round_caps(request.store_id)

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
        RoundSignups(participant_id=pid, round_id=rid, store_id=request.store_id)
        for rid in rounds
    )

    logger.info(f"Successfully signed in {duid}")
    return Response({"message": "Successfully added"}, status=status.HTTP_201_CREATED)


@require_service_token
@require_discord_store
@api_view([POST])
def drop_user(request):
    """Take in a discord user id and check if that user is registered for the next
    league round. If yes, remove them."""

    body = json.loads(request.body.decode("utf-8"))
    duid = body.get("discord_user_id")

    logger.info(f"Drop request received from user {duid}")

    if not duid:
        return Response(
            {"message": "Discord user id not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target = Participants.objects.filter(discord_user_id=duid).first()

    if not target:
        logger.error(f"Error, user not linked: {duid}")

        return Response(
            {"message": "User is not linked"}, status=status.HTTP_400_BAD_REQUEST
        )

    next_session = (
        Sessions.objects.filter(
            closed=False,
            deleted=False,
            session_date__gte=date.today(),
            store_id=request.store_id,
        )
        .order_by("session_date")
        .first()
    )
    if not next_session:
        logger.error("Sign ins are not open")
        return Response(
            {"message": "Sign-ins not open"}, status=status.HTTP_400_BAD_REQUEST
        )

    rids = list(
        Rounds.objects.filter(session=next_session, deleted=False)
        .values_list("id", flat=True)
        .order_by("round_number")[:2]
    )

    RoundSignups.objects.filter(
        participant_id=target.id, round_id__in=rids, store_id=request.store_id
    ).delete()

    logger.info(
        f"User successfully dropped from rounds on {next_session.session_date}, duid: {duid}"
    )
    return Response(
        {"date": next_session.session_date}, status=status.HTTP_202_ACCEPTED
    )


@require_service_token
@require_discord_store
@api_view([POST])
def issue_edit_token(request):
    """
    This endpoint validates the user is linked, then if yes we revoke/issue a new
    edit token.
    """

    body = json.loads(request.body.decode("utf-8"))
    duid: str = body.get("discord_user_id")

    logger.info(f"Edit decklist request received from {duid}")

    if not duid:
        return Response(
            {"message": "discord_user_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        participant = Participants.objects.filter(
            discord_user_id=duid, deleted=False
        ).get()
    except Participants.DoesNotExist:
        logger.error("Participant is not currently linked.")
        return Response(
            {
                "message": "It looks like you haven't linked your discord to your league history.\n\n"
                "Run /link to connect to your league history."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    store = Store.objects.filter(id=request.store_id).first()
    if not store:
        return Response(
            {"message": "Store not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if not Decklists.objects.filter(
        participant=participant, deleted=False, store_id=request.store_id
    ).exists():
        logger.error(f"User with DU_ID: {duid} does not have any decklists")
        url = f"{store.slug}.commanderleague.xyz/decklists/new"
        return Response(
            {
                "message": (
                    "It doesn't look like you have any decklists to edit.\n\n"
                    "[Click here to make a new decklist.]"
                    "(https://" + url + ")\n\n"
                    "Don't forget to get your unique code via /mycode\n"
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    code = EditToken.mint(owner=participant)

    logger.info(f"Participant verified, returning edit token. User {duid}")
    return Response({"code": code, "slug": store.slug}, status=status.HTTP_201_CREATED)


@require_service_token
@api_view([POST])
def validate_channel(request):
    """Check if the channel we received a bot request from exists + is allowed

    We don't use @require_discord_store here because this endpoint is doing the gatekeeping for the rest
    of those requests.

    """
    guild = request.data.get("guild_id")
    channel = request.data.get("channel_id")

    if not guild or not channel:
        return Response(
            {"message": "Missing guild or channel id"},
            status=status.HTTP_404_NOT_FOUND,
        )

    exists = Store.objects.filter(
        discord_guild_id=guild,
        discord_channel_id=channel,
        deleted=False,
        is_active=True,
    ).exists()

    if not exists:
        return Response(
            {"message": "Store not found"}, status=status.HTTP_404_NOT_FOUND
        )

    return Response(status=status.HTTP_204_NO_CONTENT)


@require_service_token
@require_discord_store
@api_view([POST])
def check_join_status(request):
    """Check if a discord user is linked/a member of the store. Returns body like:
    {
      "is_linked": true,
      "participant_id": 123,
      "participant_name": "Taylor Smith",
      "in_store": true,
      "store_name": "Mimic's Market"
    }
    """
    body = json.loads(request.body.decode("utf-8"))
    duid = body.get("discord_user_id")

    if not duid:
        return Response(
            {"message": "Discord user id not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    logger.info(f"Checking join status for {duid}")
    participant = Participants.objects.filter(
        discord_user_id=int(duid), deleted=False
    ).first()

    store = Store.objects.filter(id=request.store_id).first()
    if not store:
        logger.error("Store not found in check_join_status")
        return Response(
            {"message": "Store not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if not participant:
        payload = {
            "is_linked": False,
            "participant_id": None,
            "participant_name": None,
            "in_store": False,
            "store_name": store.name,
        }
        return Response(payload, status=status.HTTP_200_OK)

    in_store = StoreParticipant.objects.filter(
        store_id=request.store_id, participant_id=participant.id
    ).exists()

    payload = {
        "is_linked": True,
        "participant_id": participant.id,
        "participant_name": participant.name,
        "in_store": in_store,
        "store_id": request.store_id,
        "store_name": store.name,
    }
    return Response(payload, status=status.HTTP_200_OK)


@require_service_token
@require_discord_store
@api_view([POST])
def find_participants(request):
    """Similar to the above search, do a rough match for a submitted name."""
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return Response(
            {"message": "Invalid JSON body."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_query = (body.get("query") or "").strip()
    if len(raw_query) < 3:
        return Response(
            {"matches": []},
            status=status.HTTP_200_OK,
        )
    participants = (
        Participants.objects.filter(
            discord_user_id__isnull=True, name__icontains=raw_query, deleted=False
        )
        .distinct()
        .order_by("name")[:25]
        .values("id", "name")
    )
    return Response(
        {"matches": list(participants)},
        status=status.HTTP_200_OK,
    )


@require_service_token
@require_discord_store
@api_view([POST])
def register_and_join(request):
    """Take in a name, create the user and register/link them"""

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return Response(
            {"message": "Invalid JSON body."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    name = (body.get("name") or "").strip()
    duid = body.get("discord_user_id")

    if not duid:
        return Response(
            {"message": "Discord user id not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not name or len(name) < 2:
        return Response(
            {"message": "Name is required, please try again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logger.info(f"Attempting create for {name}, duid: {duid}")
    if check_for_bad_words(name):
        logger.info(f"SOMEONE {duid} SAID A NAUGHTY WORD: {name}")
        return Response(
            {"message": "Invalid name entered, please try again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    store = Store.objects.filter(id=request.store_id).first()
    if not store:
        logger.error("Store not found in register_and_join")
        return Response(
            {"message": "Store not found."}, status=status.HTTP_404_NOT_FOUND
        )

    with transaction.atomic():
        new = Participants.objects.filter(
            discord_user_id=int(duid), deleted=False
        ).first()
        created = False

        if not new:
            new = Participants.objects.create(
                name=name,
                discord_user_id=int(duid),
            )
            created = True

        _, sp_created = StoreParticipant.objects.get_or_create(
            store_id=request.store_id,
            participant_id=new.id,
        )

    payload = {
        "participant_id": new.id,
        "participant_name": new.name,
        "code": new.code,
        "linked": True,
        "in_store": True,
        "store_name": store.name,
    }
    http_status = (
        status.HTTP_201_CREATED if (created or sp_created) else status.HTTP_200_OK
    )
    return Response(payload, status=http_status)


@require_service_token
@require_discord_store
@api_view([POST])
def ensure_store_membership(request):
    """
    Ensure a linked participant is associated with the current store.
    """

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return Response(
            {"message": "Invalid JSON body."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    duid = body.get("discord_user_id")
    if duid in (None, ""):
        return Response(
            {"message": "Discord user id not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    duid = int(duid)

    participant = Participants.objects.filter(
        discord_user_id=duid, deleted=False
    ).first()

    if not participant:
        return Response(
            {"message": "Discord account is not linked to any participant."},
            status=status.HTTP_404_NOT_FOUND,
        )

    store = Store.objects.filter(id=request.store_id).only("name").first()
    if not store:
        return Response(
            {"message": "Store not found."}, status=status.HTTP_404_NOT_FOUND
        )

    with transaction.atomic():
        _, created = StoreParticipant.objects.get_or_create(
            store_id=request.store_id,
            participant_id=participant.id,
        )

    payload = {
        "participant_id": participant.id,
        "participant_name": participant.name,
        "in_store": True,
        "store_name": store.name,
        "created_store_membership": created,
    }

    http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK

    return Response(payload, status=http_status)

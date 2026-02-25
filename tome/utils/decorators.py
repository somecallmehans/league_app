import secrets

from functools import wraps
from rest_framework.response import Response
from rest_framework import status

from django.conf import settings

from users.models import Participants
from stores.models import Store


def require_service_token(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        expected = f"X-SERVICE-TOKEN {settings.SERVICE_TOKEN}"
        if not secrets.compare_digest(auth, expected):
            return Response(
                {"detail": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return func(request, *args, **kwargs)

    return wrapper


def require_user_code(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if request.method == "POST":
            code = request.headers.get("X-Participant-Code", "")
            if not code:
                return Response(
                    {"detail": "Code not provided"}, status=status.HTTP_401_UNAUTHORIZED
                )
            participant = (
                Participants.objects.filter(code=code, discord_user_id__isnull=False)
                .values_list("id", flat=True)
                .first()
            )
            if not participant:
                return Response(
                    {"detail": "Code match not found, rejecting request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            kwargs["participant_id"] = participant
        return func(request, *args, **kwargs)

    return wrapper


def require_store(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if getattr(request, "store_id", None) is None:
            return Response(
                {"detail": "Store context required"}, status=status.HTTP_400_BAD_REQUEST
            )
        return view_func(request, *args, **kwargs)

    return _wrapped


def require_discord_store(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        guild_id = request.headers.get("X-DISCORD-GUILD-ID", "")
        if not guild_id:
            return Response(
                {"detail": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        store = Store.objects.filter(
            discord_guild_id=guild_id, is_active=True, deleted=False
        ).first()
        if not store:
            return Response(
                {"detail": "Store not found, invalid request"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.store_id = store.id
        return func(request, *args, **kwargs)

    return wrapper

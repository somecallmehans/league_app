import secrets

from functools import wraps
from django.http import JsonResponse
from django.conf import settings

from users.models import Participants


def require_service_token(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        expected = f"X-SERVICE-TOKEN {settings.SERVICE_TOKEN}"
        if not secrets.compare_digest(auth, expected):
            return JsonResponse({"detail": "Unauthorized"}, status=401)
        return func(request, *args, **kwargs)

    return wrapper


def require_user_code(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if request.method == "POST":
            code = request.headers.get("X-Participant-Code", "")
            if not code:
                return JsonResponse({"detail": "Code not provided"}, status=400)
            participant = (
                Participants.objects.filter(code=code, discord_user_id__isnull=False)
                .values_list("id", flat=True)
                .first()
            )
            if not participant:
                return JsonResponse(
                    {"detail": "Code match not found, rejecting request"}, status=401
                )
            kwargs["participant_id"] = participant
        return func(request, *args, **kwargs)

    return wrapper

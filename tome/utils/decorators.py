import secrets

from functools import wraps
from django.http import JsonResponse
from django.conf import settings


def require_service_token(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        expected = f"X-SERVICE-TOKEN {settings.SERVICE_TOKEN}"
        if not secrets.compare_digest(auth, expected):
            return JsonResponse({"detail": "Unauthorized"}, status=401)
        return func(request, *args, **kwargs)

    return wrapper

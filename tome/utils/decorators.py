from django.http import JsonResponse
from django.conf import settings

def require_service_token(func):
    def wrapper(request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        expected = f"X-SERVICE-TOKEN {settings.SERVICE_TOKEN}"
        if auth != expected:
            return JsonResponse({"detail": "Unauthorized"}, status=401)
        return func(request, *args, **kwargs)
    return wrapper
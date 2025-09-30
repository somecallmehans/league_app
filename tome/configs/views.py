import json
from typing import Any, Callable
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from .models import Config
from .configs import CONFIG_SPEC

GET = "GET"
POST = "POST"


@api_view([GET])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_all_configs(_):
    """Get all of the current configs"""

    configs = Config.objects.all().values("name", "key", "value", "description")

    return Response(configs)


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_config(request, key):
    """Update a config."""

    if not key:
        return Response(
            {"message": "No key provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    target = Config.objects.get(key=key)

    if not target:
        return Response(
            {"message": "Config not found"}, status=status.HTTP_400_BAD_REQUEST
        )

    body = json.loads(request.body.decode("utf-8"))
    value = body["value"]

    spec = CONFIG_SPEC.get(key)
    if spec and "cast" in spec:
        try:
            value = spec["cast"](value)
        except (TypeError, ValueError) as e:
            return Response(
                {"message": f"Invalid value for {key}: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    target.value = value
    target.save(update_fields=["value", "updated_at"])

    return Response(status=status.HTTP_201_CREATED)

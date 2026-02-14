import json
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from utils.decorators import require_store
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from .models import Config
from .configs import CONFIG_SPEC

GET = "GET"
POST = "POST"


@api_view([GET])
@require_store
def get_all_configs(request, **kwargs):
    """Get all of the current configs"""

    configs = (
        Config.objects.filter(Q(store_id=request.store_id) | Q(store__isnull=True))
        .values("name", "key", "value", "description", "scope_kind")
        .order_by("id")
    )

    return Response(configs)


@api_view([POST])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@require_store
def update_config(request, key, **kwargs):
    """Update a config."""

    if not key:
        return Response(
            {"message": "No key provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target = Config.objects.get(key=key, store_id=request.store_id)
    except Config.DoesNotExist:
        return Response(
            {"message": "Config not found"}, status=status.HTTP_404_NOT_FOUND
        )

    body = json.loads(request.body.decode("utf-8"))

    if "value" not in body:
        return Response(
            {"message": "Missing value"}, status=status.HTTP_400_BAD_REQUEST
        )

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

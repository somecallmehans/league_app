from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from .models import Config

GET = "GET"


@api_view([GET])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_all_configs(_):
    """Get all of the current configs"""

    configs = Config.objects.all().values("name", "key", "value", "description")

    return Response(configs)

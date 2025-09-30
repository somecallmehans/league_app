from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Config

GET = "GET"


@api_view([GET])
def get_all_configs(_):
    """Get all of the current configs"""

    configs = Config.objects.all().values("key", "value", "description")

    return Response(configs)

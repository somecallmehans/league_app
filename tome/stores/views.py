from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view
from rest_framework.response import Response

from users.auth import StoreTokenObtainPairSerializer

from .models import Store

GET = "GET"


class StoreTokenObtainPairView(TokenObtainPairView):
    serializer_class = StoreTokenObtainPairSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["store_slug"] = self.kwargs.get("store_slug")
        return ctx


@api_view(["GET"])
def get_store(request, **kwargs):
    """If we have a store, get the stores info."""

    store = (
        Store.objects.filter(id=request.store_id).values("name", "external_url").first()
    )

    return Response(store)

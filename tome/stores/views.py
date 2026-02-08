from rest_framework_simplejwt.views import TokenObtainPairView
from users.auth import StoreTokenObtainPairSerializer


class StoreTokenObtainPairView(TokenObtainPairView):
    serializer_class = StoreTokenObtainPairSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["store_slug"] = self.kwargs.get("store_slug")
        return ctx

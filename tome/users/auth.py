from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from stores.models import Store, StoreUserAccess


class StoreTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        store_slug = self.context["store_slug"]

        store = Store.objects.filter(
            slug=store_slug, deleted=False, is_active=True
        ).first()
        if not store:
            raise serializers.ValidationError({"detail": "Store not found"})

        user = self.user

        allowed = StoreUserAccess.objects.filter(
            user=user,
            store=store,
            is_active=True,
            role__in=["admin", "staff"],
        ).exists()

        if not allowed:
            raise serializers.ValidationError(
                {"detail": "Not authorized for this store"}
            )

        data["store"] = {"id": store.id, "slug": store.slug, "name": store.name}

        return data

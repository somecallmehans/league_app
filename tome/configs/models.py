from django.db import models

from django.db.models import Q
from django.db.models.constraints import CheckConstraint


class Config(models.Model):
    class Scope(models.TextChoices):
        GLOBAL = "global", "Global"
        SHOP = "shop", "Shop"

    key = models.SlugField(max_length=64)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True, default="")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    scope_kind = models.CharField(
        max_length=16, choices=Scope.choices, default=Scope.GLOBAL, db_index=True
    )
    store = models.ForeignKey("stores.Store", on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = "configs"
        constraints = [
            CheckConstraint(
                check=~Q(scope_kind="shop") | Q(store_id__isnull=False),
                name="configs_store_required_for_shop_scope",
            ),
            CheckConstraint(
                check=~Q(scope_kind="global") | Q(store_id__isnull=True),
                name="configs_store_null_for_global_scope",
            ),
        ]

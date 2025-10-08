from django.db import models


class Config(models.Model):
    class Scope(models.TextChoices):
        GLOBAL = "global", "Global"
        SHOP = "shop", "Shop"

    key = models.SlugField(max_length=64)
    value = models.JSONField()
    description = models.CharField(max_length=255, blank=True, default="")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    scope_kind = models.CharField(
        max_length=16, choices=Scope.choices, default=Scope.GLOBAL, db_index=True
    )

    class Meta:
        db_table = "configs"

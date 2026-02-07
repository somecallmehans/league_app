from django.conf import settings
from django.db import models


class Store(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    slug = models.SlugField(max_length=255, null=False, blank=False)
    external_url = models.URLField(null=False, blank=False)
    discord_channel_id = models.BigIntegerField(unique=True)
    is_active = models.BooleanField(default=True)
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "stores"
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=models.Q(deleted=False),
                name="unique_active_store_slug",
            )
        ]


class StoreParticipant(models.Model):
    participant = models.ForeignKey("users.Participants", on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)

    class Meta:
        db_table = "store_participants"
        constraints = [
            models.UniqueConstraint(
                fields=["store", "participant"],
                name="uniq_store_participant",
            )
        ]


class StoreUserAccess(models.Model):
    store = models.ForeignKey(
        "Store",
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("staff", "Staff"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "store_user_access"
        constraints = [
            models.UniqueConstraint(fields=["store", "user"], name="uniq_store_user"),
        ]

    def __str__(self):
        return f"{self.user_id} -> {self.store_id} ({self.role})"

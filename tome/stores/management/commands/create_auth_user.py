from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from stores.models import Store, StoreUserAccess

User = get_user_model()

DEFAULT_PASSWORD = "Welcome1!"


class Command(BaseCommand):
    help = "Create a new auth user with staff access to a store (interactive)"

    def add_arguments(self, parser):
        parser.add_argument("--store-slug", required=False)
        parser.add_argument("--username", required=False)
        parser.add_argument("--firstname", required=False)
        parser.add_argument("--lastname", required=False)
        parser.add_argument("--email", required=False)

    def _prompt(self, label):
        return input(f"{label}: ").strip()

    @transaction.atomic
    def handle(self, *args, **opts):
        store_slug = opts.get("store_slug") or self._prompt("Store slug")
        username = opts.get("username") or self._prompt("Username")
        first_name = opts.get("firstname") or self._prompt("First name")
        last_name = opts.get("lastname") or self._prompt("Last name")
        email = opts.get("email") or self._prompt("Email")

        if not all([store_slug, username, first_name, last_name, email]):
            raise CommandError("All fields are required")

        try:
            store = Store.objects.get(slug=store_slug, deleted=False)
        except Store.DoesNotExist:
            raise CommandError(f"Store not found: {store_slug}")

        if User.objects.filter(username=username).exists():
            raise CommandError(f"User already exists: {username}")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=DEFAULT_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            is_superuser=False,
            is_staff=True,
        )

        StoreUserAccess.objects.create(
            user=user,
            store=store,
            role="staff",
            is_active=True,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nCreated user '{username}' with staff access to store '{store.slug}'"
            )
        )
        self.stdout.write(f"Password: {DEFAULT_PASSWORD}\n")

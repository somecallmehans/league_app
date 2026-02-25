from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from stores.models import Store
from configs.models import Config


BASE_CONFIGS = [
    {
        "key": "round_one_cap",
        "name": "Round One Cap",
        "description": "Max players allowed in Round 1",
        "type": int,
    },
    {
        "key": "round_two_cap",
        "name": "Round Two Cap",
        "description": "Max players allowed in Round 2",
        "type": int,
    },
    {
        "key": "round_day",
        "name": "Round Day",
        "description": "The day each week that league occurs",
        "type": str,
    },
    {
        "key": "round_one_start",
        "name": "Round One Start",
        "description": "The start time for round 1",
        "type": str,
    },
    {
        "key": "round_two_start",
        "name": "Round Two Start",
        "description": "The start time for round 2",
        "type": str,
    },
]


class Command(BaseCommand):
    help = "Seed or update base configs for a store (interactive)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=False)

    def _prompt(self, label):
        return input(f"{label}: ").strip()

    @transaction.atomic
    def handle(self, *args, **opts):
        slug = opts.get("slug") or self._prompt("Store slug")

        try:
            store = Store.objects.get(slug=slug, deleted=False)
        except Store.DoesNotExist:
            raise CommandError("Store not found")

        self.stdout.write(f"\nSeeding configs for store: {store.name}\n")

        for cfg in BASE_CONFIGS:
            existing = Config.objects.filter(
                scope_kind=Config.Scope.SHOP,
                store=store,
                key=cfg["key"],
            ).first()

            default_display = f" (current: {existing.value})" if existing else ""
            raw_value = self._prompt(f"{cfg['name']}{default_display}")

            if not raw_value and existing:
                # Keep existing if user presses enter
                continue

            if cfg["type"] == int:
                try:
                    raw_value = int(raw_value)
                except ValueError:
                    raise CommandError(f"{cfg['name']} must be an integer")

            Config.objects.update_or_create(
                scope_kind=Config.Scope.SHOP,
                store=store,
                key=cfg["key"],
                defaults={
                    "value": str(raw_value),
                    "description": cfg["description"],
                    "name": cfg["name"],
                },
            )

        self.stdout.write(self.style.SUCCESS(f"\nConfigs seeded for '{store.slug}'\n"))

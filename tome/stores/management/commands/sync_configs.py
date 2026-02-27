from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from configs.configs import (
    CONFIG_REGISTRY,
    CONFIG_TYPE_CHECKBOX,
    CONFIG_TYPE_SELECT,
    DEFAULT_VALUES,
)
from configs.models import Config
from stores.models import Store


class Command(BaseCommand):
    help = "Ensure stores have all shop-scoped configs from the registry (creates missing with defaults)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--store-slug",
            required=False,
            help="Sync configs for a single store",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Sync configs for all stores",
        )

    def _default_for_key(self, key, entry):
        if key in DEFAULT_VALUES:
            return DEFAULT_VALUES[key]
        if entry["type"] == CONFIG_TYPE_SELECT and "options" in entry:
            return entry["options"][0]
        if entry["type"] == CONFIG_TYPE_CHECKBOX:
            return "false"
        return ""

    @transaction.atomic
    def handle(self, *args, **opts):
        store_slug = opts.get("store_slug")
        sync_all = opts.get("all", False)

        if not store_slug and not sync_all:
            raise CommandError("Specify --store-slug or --all")

        if store_slug:
            try:
                stores = [Store.objects.get(slug=store_slug, deleted=False)]
            except Store.DoesNotExist:
                raise CommandError(f"Store not found: {store_slug}")
        else:
            stores = list(Store.objects.filter(deleted=False))

        created_count = 0
        for store in stores:
            for key, entry in CONFIG_REGISTRY.items():
                existing = Config.objects.filter(
                    scope_kind=Config.Scope.SHOP,
                    store=store,
                    key=key,
                ).first()

                if not existing:
                    default_value = self._default_for_key(key, entry)
                    Config.objects.create(
                        scope_kind=Config.Scope.SHOP,
                        store=store,
                        key=key,
                        value=default_value,
                        name=entry["name"],
                        description=entry["description"],
                    )
                    created_count += 1
                    self.stdout.write(
                        f"  Created {key}={default_value} for {store.slug}"
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSynced configs for {len(stores)} store(s), created {created_count} missing config(s)\n"
            )
        )

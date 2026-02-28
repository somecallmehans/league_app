from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from configs.configs import (
    CONFIG_REGISTRY,
    CONFIG_TYPE_CHECKBOX,
    CONFIG_TYPE_NUMBER,
    CONFIG_TYPE_SELECT,
    CONFIG_TYPE_TEXT,
    DEFAULT_VALUES,
)
from configs.models import Config
from stores.models import Store




class Command(BaseCommand):
    help = "Seed or update base configs for a store (interactive)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=False)
        parser.add_argument(
            "--defaults",
            action="store_true",
            help="Use default values for all configs (non-interactive)",
        )

    def _prompt(self, label):
        return input(f"{label}: ").strip()

    def _prompt_select(self, name, options, existing_value):
        self.stdout.write(f"\n{name}:")
        for i, opt in enumerate(options, 1):
            marker = " (current)" if existing_value == opt else ""
            self.stdout.write(f"  {i}. {opt}{marker}")
        default_hint = f" (current: {existing_value})" if existing_value else ""
        raw = self._prompt(f"Choice 1-{len(options)} or value{default_hint}")
        if not raw and existing_value:
            return existing_value
        # Allow numeric choice
        try:
            idx = int(raw)
            if 1 <= idx <= len(options):
                return options[idx - 1]
        except ValueError:
            pass
        # Allow direct value
        if raw in options:
            return raw
        raise CommandError(f"Invalid choice. Must be 1-{len(options)} or one of: {', '.join(options)}")

    def _prompt_checkbox(self, name, existing_value):
        default_hint = f" (current: {existing_value})" if existing_value else ""
        raw = self._prompt(f"{name} [y/n]{default_hint}").strip().lower()
        if not raw and existing_value:
            return existing_value
        if raw in ("y", "yes", "1", "true"):
            return "true"
        if raw in ("n", "no", "0", "false"):
            return "false"
        raise CommandError("Must be y or n")

    def _get_value_for_config(self, key, entry, existing, use_defaults):
        name = entry["name"]
        config_type = entry["type"]

        if use_defaults:
            if existing:
                return existing.value
            default = DEFAULT_VALUES.get(key)
            if config_type == CONFIG_TYPE_SELECT and "options" in entry:
                default = default or entry["options"][0]
            elif config_type == CONFIG_TYPE_CHECKBOX:
                default = default or "false"
            return default or ""

        if config_type == CONFIG_TYPE_SELECT and "options" in entry:
            return self._prompt_select(name, entry["options"], existing.value if existing else None)

        if config_type == CONFIG_TYPE_CHECKBOX:
            return self._prompt_checkbox(name, existing.value if existing else None)

        if config_type == CONFIG_TYPE_NUMBER:
            default_display = f" (current: {existing.value})" if existing else ""
            raw = self._prompt(f"{name}{default_display}")
            if not raw and existing:
                return existing.value
            if "validate" in entry:
                try:
                    val = entry["validate"](raw)
                    return str(val)
                except (TypeError, ValueError) as e:
                    raise CommandError(f"{name}: {e}")
            return raw

        # text
        default_display = f" (current: {existing.value})" if existing else ""
        return self._prompt(f"{name}{default_display}") or (existing.value if existing else "")

    @transaction.atomic
    def handle(self, *args, **opts):
        slug = opts.get("slug") or self._prompt("Store slug")
        use_defaults = opts.get("defaults", False)

        try:
            store = Store.objects.get(slug=slug, deleted=False)
        except Store.DoesNotExist:
            raise CommandError("Store not found")

        self.stdout.write(f"\nSeeding configs for store: {store.name}\n")

        for key, entry in CONFIG_REGISTRY.items():
            existing = Config.objects.filter(
                scope_kind=Config.Scope.SHOP,
                store=store,
                key=key,
            ).first()

            value = self._get_value_for_config(key, entry, existing, use_defaults)
            if not value and not existing:
                raise CommandError(f"Value required for {key}")

            if value or existing:
                Config.objects.update_or_create(
                    scope_kind=Config.Scope.SHOP,
                    store=store,
                    key=key,
                    defaults={
                        "value": value or (existing.value if existing else ""),
                        "description": entry["description"],
                        "name": entry["name"],
                    },
                )

        self.stdout.write(self.style.SUCCESS(f"\nConfigs seeded for '{store.slug}'\n"))

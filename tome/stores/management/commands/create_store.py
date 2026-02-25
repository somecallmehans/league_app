from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from stores.models import Store


class Command(BaseCommand):
    help = "Create a new store (interactive)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=False)
        parser.add_argument("--name", required=False)
        parser.add_argument("--external-url", required=False)
        parser.add_argument("--discord-guild-id", required=False, type=int)

    @transaction.atomic
    def handle(self, *args, **opts):
        slug = opts.get("slug") or input("Store slug: ").strip()
        name = opts.get("name") or input("Store name: ").strip()
        external_url = opts.get("external_url") or input("External URL: ").strip()
        discord_guild_id = (
            opts.get("discord_guild_id") or input("Discord Guild ID: ").strip()
        )

        if not slug or not name:
            raise CommandError("Slug and name are required")

        try:
            if discord_guild_id:
                discord_guild_id = int(discord_guild_id)
        except ValueError:
            raise CommandError("Discord Guild ID must be an integer")

        store, created = Store.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "external_url": external_url,
                "discord_guild_id": discord_guild_id,
                "is_active": True,
                "deleted": False,
            },
        )

        if not created:
            updated = False

            if store.name != name:
                store.name = name
                updated = True

            if store.external_url != external_url:
                store.external_url = external_url
                updated = True

            if store.discord_guild_id != discord_guild_id:
                store.discord_guild_id = discord_guild_id
                updated = True

            if updated:
                store.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created store '{slug}'"))
        else:
            self.stdout.write(self.style.WARNING(f"Store '{slug}' already exists"))

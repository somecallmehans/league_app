from django.db import migrations
from configs.models import Config


def seed_configs(apps, schema_editor):
    # Create round_one_cap = 24
    Config.objects.update_or_create(
        scope_kind="global",
        key="round_one_cap",
        defaults={
            "value": 24,
            "description": "Max players allowed in Round 1",
        },
        name="Round One Cap",
    )

    # Create round_two_cap = 24
    Config.objects.update_or_create(
        scope_kind="global",
        key="round_two_cap",
        defaults={
            "value": 24,
            "description": "Max players allowed in Round 2",
        },
        name="Round Two Cap",
    )


def unseed_configs(apps, schema_editor):
    Config.objects.filter(key__in=["round_one_cap", "round_two_cap"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            "configs",
            "0001_initial",
        ),
    ]

    operations = [
        migrations.RunPython(seed_configs, unseed_configs),
    ]

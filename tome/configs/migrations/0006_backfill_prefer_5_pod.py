from django.db import migrations

KEY = "prefer_5_pod"
NAME = "Prefer 5-player pods"
DESCRIPTION = "When applicable, generate a pod of 5 instead of three 3 pods"
DEFAULT_VALUE = "true"


def backfill_prefer_5_pod(apps, schema_editor):
    Config = apps.get_model("configs", "Config")
    Store = apps.get_model("stores", "Store")

    for store in Store.objects.filter(deleted=False).iterator():
        Config.objects.get_or_create(
            scope_kind="shop",
            store_id=store.id,
            key=KEY,
            defaults={
                "value": DEFAULT_VALUE,
                "name": NAME,
                "description": DESCRIPTION,
            },
        )


def reverse_backfill(apps, schema_editor):
    Config = apps.get_model("configs", "Config")
    Config.objects.filter(scope_kind="shop", key=KEY).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("configs", "0005_alter_config_value"),
        ("stores", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_prefer_5_pod, reverse_backfill),
    ]

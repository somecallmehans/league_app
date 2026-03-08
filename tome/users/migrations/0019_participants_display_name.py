# Participants display_name: add column, backfill from name, then set unique

from django.db import migrations, models


def backfill_display_name(apps, schema_editor):
    Participants = apps.get_model("users", "Participants")
    deleted_idx = 1
    for p in Participants.objects.all():
        if p.deleted:
            p.display_name = f"Deleted {p.name} {deleted_idx}"
            deleted_idx += 1
        else:
            p.display_name = p.name
        p.save(update_fields=["display_name"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0018_decklistsachievements_scalable_term"),
    ]

    operations = [
        migrations.AddField(
            model_name="participants",
            name="display_name",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.RunPython(backfill_display_name, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="participants",
            name="display_name",
            field=models.CharField(max_length=255, unique=True),
        ),
    ]

# 0006_backfill_time_fields.py
from django.db import migrations
from django.utils import timezone

from sessions_rounds.models import Sessions, Rounds


def backfill(apps, schema_editor):
    for r in Rounds.objects.filter(starts_at__isnull=True):
        r.starts_at = r.created_at
        r.save(update_fields=["starts_at"])

    for s in Sessions.objects.filter(session_date__isnull=True):
        s.session_date = s.created_at.date()
        s.save(update_fields=["session_date"])


class Migration(migrations.Migration):
    dependencies = [("sessions_rounds", "0005_rounds_starts_at_sessions_session_date")]
    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]

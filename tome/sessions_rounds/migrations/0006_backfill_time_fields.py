# 0006_backfill_time_fields.py
from django.db import migrations
from django.utils import timezone


def backfill(apps, schema_editor):
    Sessions = apps.get_model("sessions_rounds", "Sessions")
    Rounds = apps.get_model("sessions_rounds", "Rounds")
    tz = timezone.get_current_timezone()

    for r in Rounds.objects.filter(starts_at__isnull=True):
        dt = r.created_at
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, tz)
        r.starts_at = dt
        r.save(update_fields=["starts_at"])

    for s in Sessions.objects.filter(session_date__isnull=True):
        dt = s.created_at
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, tz)
        s.session_date = dt.date()
        s.save(update_fields=["session_date"])


class Migration(migrations.Migration):
    dependencies = [("sessions_rounds", "0005_rounds_starts_at_sessions_session_date")]
    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]

# users/migrations/0005_reconcile_earned_points.py
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("users", "0004_participantachievements_earned_points")]
    operations = [
        migrations.RunSQL(
            "ALTER TABLE participant_achievements "
            "ADD COLUMN IF NOT EXISTS earned_points integer",
            "ALTER TABLE participant_achievements "
            "DROP COLUMN IF EXISTS earned_points",
        )
    ]

from django.db import migrations
from django.db.models import Count


def backfill_earned_counts(apps, schema_editor):
    Achievements = apps.get_model("achievements", "Achievements")
    AchievementScalableTerms = apps.get_model("achievements", "AchievementScalableTerms")
    AchievementEarnedCount = apps.get_model("achievements", "AchievementEarnedCount")
    ParticipantAchievements = apps.get_model("users", "ParticipantAchievements")

    scalable_achievement_ids = set(
        AchievementScalableTerms.objects.values_list("achievement_id", flat=True)
    )

    count_rows = []
    for achievement_id in Achievements.objects.values_list("id", flat=True):
        if achievement_id not in scalable_achievement_ids:
            count_rows.append(
                AchievementEarnedCount(
                    achievement_id=achievement_id,
                    scalable_term_id=None,
                    count=0,
                )
            )

    for bridge in AchievementScalableTerms.objects.values("achievement_id", "scalable_term_id"):
        count_rows.append(
            AchievementEarnedCount(
                achievement_id=bridge["achievement_id"],
                scalable_term_id=bridge["scalable_term_id"],
                count=0,
            )
        )

    AchievementEarnedCount.objects.bulk_create(count_rows, ignore_conflicts=True)

    earned_by_pair = (
        ParticipantAchievements.objects.filter(deleted=False)
        .values("achievement_id", "scalable_term_id")
        .annotate(earned=Count("id"))
    )

    for row in earned_by_pair:
        AchievementEarnedCount.objects.filter(
            achievement_id=row["achievement_id"],
            scalable_term_id=row["scalable_term_id"],
        ).update(count=row["earned"])


def reverse_backfill(apps, schema_editor):
    AchievementEarnedCount = apps.get_model("achievements", "AchievementEarnedCount")
    AchievementEarnedCount.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0032_achievementearnedcount"),
        ("users", "0019_participants_is_patreon"),
    ]

    operations = [
        migrations.RunPython(backfill_earned_counts, reverse_backfill),
    ]

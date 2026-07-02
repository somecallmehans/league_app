from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0031_scalableinfo"),
    ]

    operations = [
        migrations.CreateModel(
            name="AchievementEarnedCount",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("count", models.PositiveIntegerField(default=0)),
                (
                    "achievement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="earned_counts",
                        to="achievements.achievements",
                    ),
                ),
                (
                    "scalable_term",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="earned_counts",
                        to="achievements.scalableterms",
                    ),
                ),
            ],
            options={
                "db_table": "achievement_earned_count",
            },
        ),
        migrations.AddConstraint(
            model_name="achievementearnedcount",
            constraint=models.UniqueConstraint(
                fields=("achievement", "scalable_term"),
                name="unique_achievement_scalable_term_count",
            ),
        ),
    ]

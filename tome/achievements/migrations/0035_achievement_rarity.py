from django.db import migrations, models
import django.db.models.deletion


RARITY_ROWS = (
    ("Most Popular", "#9CA3AF"),
    ("Uncommon", "#6B8BA4"),
    ("Rare", "#DAA520"),
    ("Mythic", "#D43220"),
)


def seed_achievement_rarities(apps, schema_editor):
    AchievementRarity = apps.get_model("achievements", "AchievementRarity")
    for name, hex_code in RARITY_ROWS:
        AchievementRarity.objects.update_or_create(
            name=name,
            defaults={"hex_code": hex_code},
        )


def remove_achievement_rarities(apps, schema_editor):
    AchievementRarity = apps.get_model("achievements", "AchievementRarity")
    AchievementRarity.objects.filter(
        name__in=[name for name, _ in RARITY_ROWS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0034_update_achievement_type_names"),
    ]

    operations = [
        migrations.CreateModel(
            name="AchievementRarity",
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
                ("name", models.CharField(max_length=255, unique=True)),
                ("hex_code", models.CharField(max_length=7)),
            ],
            options={
                "db_table": "achievement_rarity",
            },
        ),
        migrations.RunPython(
            seed_achievement_rarities,
            remove_achievement_rarities,
        ),
        migrations.AddField(
            model_name="achievements",
            name="rarity",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="achievements",
                to="achievements.achievementrarity",
            ),
        ),
    ]

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0030_add_unique_constraints"),
    ]

    operations = [
        migrations.CreateModel(
            name="ScalableInfo",
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
                ("info", models.TextField()),
                ("deleted", models.BooleanField(default=False)),
                (
                    "scalable_term",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="info_entries",
                        to="achievements.scalableterms",
                    ),
                ),
            ],
            options={
                "db_table": "scalable_info",
            },
        ),
    ]

# Generated by Django 4.2.16 on 2024-09-27 19:48

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Pods",
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
                ("deleted", models.BooleanField(default=False)),
            ],
            options={
                "db_table": "pods",
            },
        ),
        migrations.CreateModel(
            name="PodsParticipants",
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
            ],
            options={
                "db_table": "pods_participants",
            },
        ),
        migrations.CreateModel(
            name="Sessions",
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
                ("month_year", models.CharField(max_length=5)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("closed", models.BooleanField(default=False)),
                ("deleted", models.BooleanField(default=False)),
            ],
            options={
                "db_table": "sessions",
            },
        ),
        migrations.CreateModel(
            name="Rounds",
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
                ("round_number", models.IntegerField(choices=[(1, "One"), (2, "Two")])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("completed", models.BooleanField(default=False)),
                ("deleted", models.BooleanField(default=False)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="sessions_rounds.sessions",
                    ),
                ),
            ],
            options={
                "db_table": "rounds",
            },
        ),
    ]

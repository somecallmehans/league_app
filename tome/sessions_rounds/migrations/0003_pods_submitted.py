# Generated by Django 4.2.16 on 2024-09-30 02:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sessions_rounds", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="pods",
            name="submitted",
            field=models.BooleanField(default=False),
        ),
    ]

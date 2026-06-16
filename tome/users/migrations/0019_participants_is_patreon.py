from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0018_decklistsachievements_scalable_term"),
    ]

    operations = [
        migrations.AddField(
            model_name="participants",
            name="is_patreon",
            field=models.BooleanField(default=False),
        ),
    ]

# 0007_backfill_codes.py
from django.db import migrations, transaction, IntegrityError
from users.helpers import generate_code
from users.models import Participants


def backfill_codes(apps, schema_editor):
    for p in Participants.objects.filter(code__isnull=True):
        for _ in range(5):
            p.code = generate_code()
            try:
                with transaction.atomic():
                    p.save(update_fields=["code"])
                    break
            except IntegrityError:
                p.code = None


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0006_participants_code_participants_discord_user_id_and_more")
    ]
    operations = [migrations.RunPython(backfill_codes, migrations.RunPython.noop)]

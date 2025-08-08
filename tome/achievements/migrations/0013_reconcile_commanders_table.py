# achievements/migrations/0012_reconcile_commanders_table.py
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("achievements", "0009_commanders")]
    operations = [
        migrations.RunSQL(
            "CREATE TABLE IF NOT EXISTS commanders (id bigint) ;",
            "DROP TABLE IF EXISTS commanders",
        )
    ]

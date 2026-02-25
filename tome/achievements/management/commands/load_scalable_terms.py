"""
Management command to load scalable terms from CSV.
Usage: python manage.py load_scalable_terms [--file path/to/scalable_terms.csv]

CSV format: term_display[,type]
Example:
  term_display,type
  1,Batch
  2,Batch
  Trample,Keyword Ability
"""
import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from achievements.models import ScalableTerms, ScalableTermType


class Command(BaseCommand):
    help = "Load scalable terms from CSV file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=str(
                Path(__file__).resolve().parent.parent.parent
                / "fixtures"
                / "scalable_terms.csv"
            ),
            help="Path to CSV file (default: achievements/fixtures/scalable_terms.csv)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing terms before loading (use with caution)",
        )

    def handle(self, *args, **options):
        filepath = Path(options["file"])
        if not filepath.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {filepath}"))
            return

        if options["clear"]:
            count = ScalableTerms.objects.count()
            ScalableTerms.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {count} existing terms"))

        created = 0
        with open(filepath, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if "term_display" not in reader.fieldnames:
                self.stderr.write(
                    self.style.ERROR("CSV must have column: term_display")
                )
                return

            for row in reader:
                term_display = row.get("term_display", "").strip()
                if not term_display:
                    continue

                type_name = row.get("type", "").strip()
                if type_name:
                    type_obj = ScalableTermType.objects.filter(name=type_name).first()
                else:
                    type_obj = None

                defaults = {"type": type_obj}
                _, was_created = ScalableTerms.objects.get_or_create(
                    term_display=term_display,
                    defaults=defaults,
                )
                if was_created:
                    created += 1

        self.stdout.write(
            self.style.SUCCESS(f"Loaded {created} new scalable terms from {filepath}")
        )

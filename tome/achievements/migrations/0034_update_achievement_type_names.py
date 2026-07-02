from django.db import migrations


def _normalize_type_name(name):
    return (name or "").strip().lower().replace("-", " ")


SKIP_TYPE_NAMES = {
    "non deck building",
    "non deckbuilding",
}

DECK_FOUNDATION_NAME = "Deck Foundation"
DECK_FOUNDATION_HEX = "#D43220"

FOUNDATION_DESCRIPTION = (
    "No more than one deck foundation achievement may be earned per win. "
    "For all format-related foundation achievements, only the Commander banned "
    "list applies (i.e. don't worry about non-Commander banned lists)."
)

SCALABLE_TERMS_DESCRIPTION = (
    "Win with a deck that includes a number of nonland cards that have or "
    "reference a shared keyword, ability word, subtype, counter type, or "
    "approved quality or grouping of qualities (see below) scaled according "
    "to the below table."
)

# Legacy prod names -> new names/descriptions.
LEGACY_TYPE_RENAMES = {
    "deckbuilding": {
        "name": "Basic Check",
        "description": None,
    },
    "legality": {
        "name": "Bonus Restriction",
        "description": None,
    },
    "scalable": {
        "name": "Scalable Terms",
        "description": SCALABLE_TERMS_DESCRIPTION,
    },
    "scaleable": {
        "name": "Scalable Terms",
        "description": SCALABLE_TERMS_DESCRIPTION,
    },
}

# Idempotent refresh when migration is re-run after partial application.
FINAL_TYPE_UPDATES = {
    "basic check": {
        "name": "Basic Check",
        "description": None,
    },
    "bonus restriction": {
        "name": "Bonus Restriction",
        "description": None,
    },
    "scalable terms": {
        "name": "Scalable Terms",
        "description": SCALABLE_TERMS_DESCRIPTION,
    },
    "deck foundation": {
        "name": DECK_FOUNDATION_NAME,
        "description": FOUNDATION_DESCRIPTION,
    },
}


def _ensure_deck_foundation_type(AchievementType):
    achievement_type, _created = AchievementType.objects.get_or_create(
        name=DECK_FOUNDATION_NAME,
        defaults={
            "hex_code": DECK_FOUNDATION_HEX,
            "description": FOUNDATION_DESCRIPTION,
        },
    )
    AchievementType.objects.filter(id=achievement_type.id).update(
        description=FOUNDATION_DESCRIPTION,
    )


def update_achievement_types(apps, schema_editor):
    AchievementType = apps.get_model("achievements", "AchievementType")

    _ensure_deck_foundation_type(AchievementType)

    for achievement_type in AchievementType.objects.all():
        normalized = _normalize_type_name(achievement_type.name)
        if normalized in SKIP_TYPE_NAMES:
            continue

        update = LEGACY_TYPE_RENAMES.get(normalized) or FINAL_TYPE_UPDATES.get(
            normalized
        )
        if update:
            AchievementType.objects.filter(id=achievement_type.id).update(**update)


def reverse_achievement_types(apps, schema_editor):
    AchievementType = apps.get_model("achievements", "AchievementType")
    Achievements = apps.get_model("achievements", "Achievements")

    reverse_by_name = {
        "basic check": {
            "name": "Deckbuilding",
            "description": (
                "When earned, these achievements may not be earned again by the same "
                "player using the same color identity, until the following week"
            ),
        },
        "bonus restriction": {
            "name": "Legality",
            "description": (
                "No more than one Legality Achievement may be earned per win. For all "
                "format-related legality achievements, only the Commander banned list "
                "applies (i.e. don't worry about banned lists for modern, pioneer, "
                "pauper, etc)."
            ),
        },
        "scalable terms": {
            "name": "Scalable",
            "description": (
                'Win with a deck that includes a number of cards referencing a shared '
                'mechanic or quality, as defined in the associated "Scalable" achievement.'
            ),
        },
    }

    for achievement_type in AchievementType.objects.all():
        normalized = _normalize_type_name(achievement_type.name)
        if normalized in SKIP_TYPE_NAMES:
            continue

        revert = reverse_by_name.get(normalized)
        if revert:
            AchievementType.objects.filter(id=achievement_type.id).update(**revert)

    deck_foundation = AchievementType.objects.filter(name=DECK_FOUNDATION_NAME).first()
    if deck_foundation and not Achievements.objects.filter(
        type_id=deck_foundation.id
    ).exists():
        deck_foundation.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0033_backfill_achievement_earned_count"),
    ]

    operations = [
        migrations.RunPython(update_achievement_types, reverse_achievement_types),
    ]

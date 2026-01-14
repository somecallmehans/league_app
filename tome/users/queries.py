from dataclasses import dataclass
from rest_framework.exceptions import ValidationError

from django.db.models import Sum, F
from django.db.models.functions import Coalesce

from achievements.helpers import calculate_color

from .models import Decklists, DecklistsAchievements
from services.scryfall_client import ScryfallClientRequest


scryfall_request = ScryfallClientRequest()


SORT_MAP = {
    "points_desc": ("-points", "-created_at", "id"),
    "points_asc": ("points", "-created_at", "id"),
    "newest": ("-created_at", "id"),
    "oldest": ("created_at", "id"),
    "name_asc": ("name", "id"),
    "name_desc": ("-name", "id"),
}

COLOR_BITS = {"W": 1, "U": 2, "B": 4, "R": 8, "G": 16, "C": 0}


def get_decklists(params: str = "") -> list[Decklists]:
    """Return decklists based on params"""
    sort_order = params.get("sort_order")
    color_mask = params.get("colors")
    query = (
        Decklists.objects.filter(deleted=False)
        .select_related(
            "commander__colors",
            "partner__colors",
            "companion__colors",
            "participant",
        )
        .annotate(
            points=Coalesce(
                Sum(
                    Coalesce(
                        "achievement__point_value",
                        F("achievement__parent__point_value"),
                        0,
                    )
                ),
                0,
            )
        )
        .values(
            "id",
            "name",
            "url",
            "code",
            "give_credit",
            "commander_id",
            "commander__name",
            "commander__colors__mask",
            "partner_id",
            "partner__name",
            "partner__colors__mask",
            "companion_id",
            "companion__name",
            "participant__name",
            "participant_id",
            "points",
        )
    )

    order_by = SORT_MAP.get(sort_order, SORT_MAP["points_desc"])
    if color_mask:
        try:
            mask_int = int(color_mask)
        except (TypeError, ValueError):
            raise ValidationError({"colors": "colors must be an integer mask"})

        query = query.filter(commander__colors__mask=mask_int)
    query = query.order_by(*order_by)

    out = []
    commander_images = scryfall_request.get_commander_image_urls(
        commander_names=[
            name
            for row in query
            for name in (
                row.get("commander__name"),
                row.get("partner__name"),
                row.get("companion__name"),
            )
            if name
        ]
    )
    for qu in query:
        give_credit = qu["give_credit"]
        out.append(
            {
                "id": qu["id"],
                "name": qu["name"],
                "url": qu["url"],
                "participant_name": qu["participant__name"] if give_credit else None,
                "code": qu["code"],
                "commander_name": qu["commander__name"],
                "commander_img": commander_images.get(qu["commander__name"]),
                "partner_name": qu.get("partner__name"),
                "partner_img": commander_images.get(qu["partner__name"]),
                "companion_name": qu.get("companion__name"),
                "companion_img": commander_images.get(qu["companion__name"]),
                "color": calculate_color(
                    [
                        qu["commander__colors__mask"],
                        qu.get("partner__colors__mask") or -1,
                    ]
                ),
                "points": qu["points"],
            }
        )

    return list(out)


def post_decklists(body, pid) -> None:
    """Post a new decklist"""
    achievements = body.get("achievements", [])

    try:
        deck = Decklists.objects.create(
            name=body["name"],
            url=body["url"],
            participant_id=pid,
            commander_id=body["commander"],
            partner_id=body.get("partner", None),
            companion_id=body.get("companion", None),
            give_credit=body.get("give_credit", False),
        )

        DecklistsAchievements.objects.bulk_create(
            [
                DecklistsAchievements(decklist_id=deck.id, achievement_id=a_id)
                for a_id in achievements
            ]
        )
    except:
        raise Exception("Issue saving deck")

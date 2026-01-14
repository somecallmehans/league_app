from django.db.models import Sum, F
from django.db.models.functions import Coalesce

from .models import Decklists
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


def get_decklists(params: str = "") -> list[Decklists]:
    """Return decklists based on params"""
    sort_order = params.get("sort_order")
    color_filter = params.get("colors")

    query = (
        Decklists.objects.filter(deleted=False)
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
            "commander_id",
            "commander__name",
            "partner_id",
            "partner__name",
            "companion_id",
            "companion__name",
            "participant__name",
            "participant_id",
            "points",
        )
    )

    order_by = SORT_MAP.get(sort_order, SORT_MAP["points_desc"])
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
    for q in query:
        out.append(
            {
                "commander_img": commander_images.get(q["commander__name"], []),
                "partner_img": commander_images.get(q["partner__name"]),
                "companion_img": commander_images.get(q["companion__name"]),
                **q,
            }
        )

    return list(out)

import re
import uuid
import logging
from typing import Any, Optional, Union
from urllib.parse import urlparse
from django.utils import timezone

from rest_framework.exceptions import AuthenticationFailed, ParseError

from collections import defaultdict
from better_profanity import profanity
from rest_framework.exceptions import ValidationError

from django.db import transaction
from django.db.models import Func, F, IntegerField, Q, Value, Sum
from django.db.models.functions import Coalesce
from django.http import HttpRequest


from achievements.helpers import calculate_color

from .models import (
    Decklists,
    DecklistsAchievements,
    EditToken,
    Participants,
    SessionToken,
)
from .helpers import hash_code
from achievements.models import WinningCommanders
from sessions_rounds.models import PodsParticipants
from services.scryfall_client import ScryfallClientRequest

logger = logging.getLogger(__name__)


scryfall_request = ScryfallClientRequest()


SORT_MAP = {
    # "points_desc": ("-points", "-created_at", "id"),
    # "points_asc": ("points", "-created_at", "id"),
    "newest": ("-created_at", "id"),
    "oldest": ("created_at", "id"),
    "name_asc": ("name", "id"),
    "name_desc": ("-name", "id"),
}

COLOR_BITS = {"W": 1, "U": 2, "B": 4, "R": 8, "G": 16, "C": 0}
COLOR_POINTS: dict[int, int] = {
    5: 0,
    4: 1,
    3: 2,
    2: 3,
    1: 4,
    0: 5,
}


class BitAnd(Func):
    function = ""
    template = "(%(expressions)s)"
    arg_joiner = " & "
    output_field = IntegerField()


class BitOr(Func):
    function = ""
    template = "(%(expressions)s)"
    arg_joiner = " | "
    output_field = IntegerField()


def _unique_ids_preserve_order(ids: list[int]) -> list[int]:
    """Deduplicate decklist ids while keeping first occurrence order (ORM duplicates)."""
    seen: set[int] = set()
    out: list[int] = []
    for i in ids:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out


DECKLIST_VALUES_COLUMNS = (
    "id",
    "name",
    "url",
    "code",
    "give_credit",
    "commander_id",
    "commander__name",
    "commander__color__mask",
    "partner_id",
    "partner__name",
    "partner__color__mask",
    "companion_id",
    "companion__name",
    "participant__name",
    "participant_id",
    "points",
)


def _achievements_by_decklist_ids(ids: list[int]) -> defaultdict:
    ach_by_decklist: defaultdict = defaultdict(list)
    if not ids:
        return ach_by_decklist
    ach_query = (
        DecklistsAchievements.objects.filter(decklist_id__in=ids)
        .select_related("achievement", "scalable_term")
        .order_by("decklist_id", "achievement_id")
    )
    for row in ach_query:
        if row.scalable_term_id and row.scalable_term:
            name = f"{row.achievement.name} {row.scalable_term.term_display}"
        else:
            name = row.achievement.full_name
        ach_by_decklist[row.decklist_id].append(
            {
                "id": row.achievement_id,
                "name": name,
                "points": row.achievement.points,
            }
        )
    return ach_by_decklist


def _enrich_decklist_rows(
    page_rows: list[dict],
    ach_by_decklist: defaultdict,
) -> list[dict]:
    out = []
    commander_images = scryfall_request.get_commander_image_urls(
        commander_names=[
            name
            for row in page_rows
            for name in (
                row.get("commander__name"),
                row.get("partner__name"),
                row.get("companion__name"),
            )
            if name
        ]
    )
    for qu in page_rows:
        give_credit = qu["give_credit"]
        color = calculate_color(
            [
                qu["commander__color__mask"],
                qu.get("partner__color__mask") or -1,
            ]
        )
        achievements = ach_by_decklist.get(qu["id"], [])
        has_precon = any(ach["id"] == 2 for ach in achievements)
        color_points = COLOR_POINTS[color.symbol_length] if not has_precon else 0
        id_points = COLOR_POINTS[color.symbol_length] if not has_precon else "Precon"

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
                "color": {
                    "symbol": color.symbol,
                    "name": color.name,
                    "points": id_points,
                },
                "points": qu["points"] + color_points,
                "achievements": achievements,
            }
        )
    return out


def _rows_for_ids_preserving_order(qs, ordered_ids: list[int]) -> list[dict]:
    if not ordered_ids:
        return []
    rows = list(qs.filter(id__in=ordered_ids).values(*DECKLIST_VALUES_COLUMNS))
    by_id = {r["id"]: r for r in rows}
    return [by_id[i] for i in ordered_ids if i in by_id]


def _ordered_ids_by_points(qs, descending: bool) -> list[int]:
    light = list(
        qs.values(
            "id",
            "points",
            "commander__color__mask",
            "partner__color__mask",
        )
    )
    if not light:
        return []
    by_id: dict[int, dict] = {}
    for r in light:
        rid = r["id"]
        if rid not in by_id:
            by_id[rid] = r
    light = list(by_id.values())
    all_ids = [r["id"] for r in light]
    precon_ids = set(
        DecklistsAchievements.objects.filter(
            decklist_id__in=all_ids, achievement_id=2
        ).values_list("decklist_id", flat=True)
    )
    scored: list[tuple[int, int]] = []
    for r in light:
        has_precon = r["id"] in precon_ids
        color = calculate_color(
            [
                r["commander__color__mask"],
                r.get("partner__color__mask") or -1,
            ]
        )
        color_points = COLOR_POINTS[color.symbol_length] if not has_precon else 0
        total = r["points"] + color_points
        scored.append((total, r["id"]))
    if descending:
        scored.sort(key=lambda x: (-x[0], x[1]))
    else:
        scored.sort(key=lambda x: (x[0], x[1]))
    return [s[1] for s in scored]


def _decklists_filtered_queryset(params: dict, owner_id: Optional[int]):
    """Build filtered decklist queryset (not ordered for points sorts)."""
    sort_order = params.get("sort_order")
    color_mask = params.get("colors")
    query = (
        Decklists.objects.filter(deleted=False)
        .select_related(
            "commander__color",
            "partner__color",
            "companion__color",
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
        .values(*DECKLIST_VALUES_COLUMNS)
    )

    if color_mask is not None:
        try:
            mask_int = int(color_mask)
        except (TypeError, ValueError):
            raise ValidationError({"colors": "colors must be an integer mask"})

        query = query.annotate(
            combined_mask=BitOr(
                F("commander__color__mask"),
                Coalesce(F("partner__color__mask"), Value(0)),
            )
        )

        if mask_int == 0:
            query = query.filter(combined_mask=0)
        else:
            query = query.annotate(
                subset_mask=BitAnd(F("combined_mask"), Value(mask_int))
            ).filter(
                subset_mask=F("combined_mask"),
                combined_mask__gt=0,
            )

    if owner_id is not None:
        query = query.filter(participant_id=owner_id)

    search = (params.get("search") or "").strip()
    if search:
        query = query.filter(
            Q(name__icontains=search) | Q(participant__name__icontains=search)
        )

    return query, sort_order


def get_decklists(
    params: dict = None,
    owner_id: int = None,
    *,
    paginate: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> Union[list, dict[str, Any]]:
    """Return decklists based on params.

    When ``paginate`` is True, returns
    ``{"results": [...], "count": int, "page": int, "page_size": int}``.
    Otherwise returns a plain list (participant / admin flows).
    """
    params = params or {}
    query, sort_order = _decklists_filtered_queryset(params, owner_id)

    if sort_order in ("points_desc", "points_asc"):
        ordered_ids = _ordered_ids_by_points(query, sort_order == "points_desc")
        total_count = len(ordered_ids)
        if paginate:
            offset = max(0, (page - 1) * page_size)
            page_ids = ordered_ids[offset : offset + page_size]
        else:
            page_ids = ordered_ids
        page_rows = _rows_for_ids_preserving_order(query, page_ids)
    else:
        order_by = SORT_MAP.get(sort_order, SORT_MAP["newest"])
        query = query.order_by(*order_by)
        raw_ids = list(query.values_list("id", flat=True))
        ordered_unique_ids = _unique_ids_preserve_order(raw_ids)
        total_count = len(ordered_unique_ids)
        if paginate:
            offset = max(0, (page - 1) * page_size)
            page_ids = ordered_unique_ids[offset : offset + page_size]
            page_rows = _rows_for_ids_preserving_order(query, page_ids)
        else:
            page_rows = _rows_for_ids_preserving_order(query, ordered_unique_ids)

    ids_for_ach = [r["id"] for r in page_rows]
    ach_by_decklist = _achievements_by_decklist_ids(ids_for_ach)
    out = _enrich_decklist_rows(page_rows, ach_by_decklist)

    if not paginate:
        return list(out)
    return {
        "results": list(out),
        "count": total_count,
        "page": page,
        "page_size": page_size,
    }


class StubCommander(dict):
    id: Optional[int]
    name: Optional[str]
    color_id: Optional[int]


def get_single_decklist() -> Decklists:
    """Base return a decklist"""
    return Decklists.objects.filter(deleted=False).values(
        "id",
        "name",
        "url",
        "give_credit",
        "commander_id",
        "commander__name",
        "commander__color_id",
        "partner_id",
        "partner__name",
        "partner__color_id",
        "companion_id",
        "companion__name",
        "companion__color_id",
    )


def get_single_decklist_by_id(id) -> Decklists:
    """Return a single decklist + achievements by its id"""
    query = get_single_decklist()
    query = query.filter(id=id).first()

    if not query:
        raise ValidationError({"id": "Decklist not found"})

    a_query = DecklistsAchievements.objects.filter(decklist_id=id).select_related(
        "achievement", "scalable_term"
    )

    payload = {
        "name": query["name"],
        "url": query["url"],
        "commander": StubCommander(
            id=query["commander_id"],
            name=query["commander__name"],
            color_id=query["commander__color_id"],
        ),
        "partner": StubCommander(
            id=query["partner_id"],
            name=query["partner__name"],
            color_id=query["partner__color_id"],
        ),
        "companion": StubCommander(
            id=query["companion_id"],
            name=query["companion__name"],
            color_id=query["companion__color_id"],
        ),
        "give_credit": query["give_credit"],
        "achievements": [],
    }

    for row in a_query:
        if row.scalable_term_id and row.scalable_term:
            name = f"{row.achievement.name} {row.scalable_term.term_display}"
            payload["achievements"].append(
                {
                    "achievement_id": row.achievement_id,
                    "scalable_term_id": row.scalable_term_id,
                    "name": name,
                    "tempId": str(uuid.uuid4()),
                }
            )
        else:
            payload["achievements"].append(
                {
                    "id": row.achievement_id,
                    "name": row.achievement.full_name,
                    "tempId": str(uuid.uuid4()),
                }
            )

    return payload


def get_single_decklist_by_code(param: str = "") -> Decklists:
    code = f"DL-{param}"
    query = get_single_decklist()
    query = query.filter(code=code).first()
    if not query:
        raise ValidationError({"code": "Decklist not found"})
    a_query = DecklistsAchievements.objects.filter(
        decklist_id=query["id"]
    ).select_related("achievement", "scalable_term")

    payload = {
        "winner-achievements": [],
        "winner-commander": StubCommander(
            id=query["commander_id"],
            name=query["commander__name"],
            color_id=query["commander__color_id"],
        ),
        "partner-commander": StubCommander(
            id=query["partner_id"],
            name=query["partner__name"],
            color_id=query["partner__color_id"],
        ),
        "companion-commander": StubCommander(
            id=query["companion_id"],
            name=query["companion__name"],
            color_id=query["companion__color_id"],
        ),
    }

    for row in a_query:
        if row.scalable_term_id and row.scalable_term:
            name = f"{row.achievement.name} {row.scalable_term.term_display}"
            payload["winner-achievements"].append(
                {
                    "achievement_id": row.achievement_id,
                    "scalable_term_id": row.scalable_term_id,
                    "name": name,
                }
            )
        else:
            payload["winner-achievements"].append(
                {"id": row.achievement_id, "name": row.achievement.full_name}
            )

    return payload


def get_decklist_by_participant_round(
    participant_id: int, round_id: int, store_id: int
) -> Decklists:
    pod_id = (
        PodsParticipants.objects.filter(
            participants_id=participant_id, pods__rounds_id=round_id
        )
        .values_list("pods_id", flat=True)
        .get()
    )

    try:
        winning_commander = WinningCommanders.objects.filter(
            participants_id=participant_id,
            pods_id=pod_id,
            store_id=store_id,
            deleted=False,
        ).get()
        if not winning_commander.decklist_id:
            return {"achievements": [], "url": "", "id": "", "name": "", "code": ""}

        decklist = (
            Decklists.objects.filter(id=winning_commander.decklist_id, deleted=False)
            .values("id", "name", "url", "code")
            .first()
        )
        a_query = DecklistsAchievements.objects.filter(
            decklist_id=decklist["id"]
        ).select_related("achievement", "scalable_term")

        payload = {
            "achievements": [],
            "url": decklist["url"],
            "id": decklist["id"],
            "name": decklist["name"],
            "code": decklist["code"],
        }

        payload["decklist"] = decklist

        for row in a_query:
            if row.scalable_term_id and row.scalable_term:
                name = f"{row.achievement.name} {row.scalable_term.term_display}"
            else:
                name = row.achievement.full_name
            payload["achievements"].append(
                {
                    "id": row.achievement_id,
                    "name": name,
                    "points": row.achievement.points,
                }
            )

        return payload

    except WinningCommanders.DoesNotExist:
        return {"achievements": [], "url": "", "id": "", "name": "", "code": ""}


ALLOWED_HOSTS = {
    "moxfield.com",
    "www.moxfield.com",
    "archidekt.com",
    "www.archidekt.com",
}

MOXFIELD_DECK_PATH_RE = re.compile(r"^/decks/[^/]+(?:/[^/]+)?/?$")


def _normalize_url(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return raw
    if "://" not in raw:
        raw = f"https://{raw}"
    return raw


def validate_decklist_url_only(url: Optional[str]) -> None:
    """Ensure decklist URL uses allowed scheme and host (Moxfield/Archidekt)."""

    if url:
        normalized = _normalize_url(url)
        parsed = urlparse(normalized)

        if parsed.scheme not in {"http", "https"}:
            raise ValidationError(
                {"url": "URL must start with http:// or https:// (or omit it)."}
            )
        if not parsed.netloc:
            raise ValidationError({"url": "Please enter a valid URL (missing domain)."})
        if parsed.username or parsed.password:
            raise ValidationError(
                {"url": "URLs with embedded credentials are not allowed."}
            )

        host = (parsed.hostname or "").lower()
        if host not in ALLOWED_HOSTS:
            raise ValidationError(
                {
                    "url": "That site isn’t supported. Please use an approved decklist URL (Moxfield/Archidekt)."
                }
            )


def validate_inputs(name: Optional[str], url: Optional[str], pid: int) -> None:
    """Check both inputs for 1. profanity and 2. make sure urls are on our allow list"""

    if name and profanity.contains_profanity(name):
        logger.info(f"Profanity identified for {name}, PID: {pid}")
        raise ValidationError({"url": "Name cannot contain profanity"})
    if url and profanity.contains_profanity(url):
        logger.info(f"Profanity identified for {url}, PID: {pid}")
        raise ValidationError({"url": "URL cannot contain profanity"})

    validate_decklist_url_only(url)


def validate_required_decklist_fields(body) -> None:
    """Ensure required decklist fields are present before create."""
    missing = []
    if not body.get("name"):
        missing.append("name")
    if not body.get("url"):
        missing.append("url")
    if body.get("commander") in (None, ""):
        missing.append("commander")

    if missing:
        raise ValidationError(
            {"url": f"Missing required field(s): {', '.join(missing)}"}
        )


def post_decklists(body, pid, store_id) -> None:
    """Post a new decklist"""
    achievements = body.get("achievements", [])

    try:
        validate_required_decklist_fields(body)
        validate_inputs(body["name"], body["url"], pid)
        deck = Decklists.objects.create(
            name=body["name"],
            url=body["url"],
            participant_id=pid,
            commander_id=body["commander"],
            partner_id=body.get("partner", None),
            companion_id=body.get("companion", None),
            give_credit=body.get("give_credit", False),
            store_id=store_id,
        )

        rows = []
        for a in achievements:
            if isinstance(a, int):
                rows.append(
                    DecklistsAchievements(
                        decklist_id=deck.id, achievement_id=a, scalable_term_id=None
                    )
                )
            elif isinstance(a, dict):
                if (
                    a.get("achievement_id") is not None
                    and a.get("scalable_term_id") is not None
                ):
                    rows.append(
                        DecklistsAchievements(
                            decklist_id=deck.id,
                            achievement_id=a["achievement_id"],
                            scalable_term_id=a["scalable_term_id"],
                        )
                    )
                elif a.get("id") is not None:
                    rows.append(
                        DecklistsAchievements(
                            decklist_id=deck.id,
                            achievement_id=int(a["id"]),
                            scalable_term_id=None,
                        )
                    )
        if rows:
            DecklistsAchievements.objects.bulk_create(rows)
    except ValidationError as e:
        raise


@transaction.atomic
def get_valid_edit_token_or_fail(raw: str) -> Participants:
    """Take in a raw token, then validate it or fail."""

    code_hash = hash_code(raw)

    token = (
        EditToken.objects.select_for_update()
        .select_related("owner")
        .filter(code_hash=code_hash)
        .first()
    )

    if not token:
        raise AuthenticationFailed("Invalid code")

    if not token.is_valid():
        raise AuthenticationFailed("Code expired or already used")

    token.used_at = timezone.now()
    token.save(update_fields=["used_at"])

    return token.owner


@transaction.atomic
def maybe_get_session_token(request: HttpRequest) -> Optional[SessionToken]:
    """For the polling endpoint, similarily validates the session
    but also handles revocation."""
    raw = request.COOKIES.get("edit_decklist_session")
    if not raw:
        raise ParseError("No code found")

    token = SessionToken.objects.filter(session_id=raw).first()
    if not token:
        raise AuthenticationFailed("Invalid code")

    if token.expires_at < timezone.now() and token.revoked_at is None:
        token.revoked_at = timezone.now()
        token.save(update_fields=["revoked_at"])

    if not token.is_valid():
        return None

    return token


def require_session_token(request: HttpRequest) -> SessionToken:
    """Validate that our session token is still valid"""
    raw = request.COOKIES.get("edit_decklist_session")
    if not raw:
        raise ParseError("No code found")

    token = SessionToken.objects.filter(session_id=raw).first()
    if not token:
        raise AuthenticationFailed("Invalid code")

    if not token.is_valid():
        raise AuthenticationFailed("Code expired or already used")

    return token

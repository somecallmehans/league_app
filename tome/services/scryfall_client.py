import logging
import requests, json, hashlib, threading, time, re
from typing import Dict, List, Iterable, Any, Optional
from collections import OrderedDict
from django.core.cache import cache

logger = logging.getLogger(__name__)


CACHE_TTL = 60 * 60 * 24 * 30
SCRYFALL_COLLECTION_URL = "https://api.scryfall.com/cards/collection"
SCRYFALL_HEADERS = {"User-Agent": "MTGCommanderLeague/1.0", "Accept": "*/*"}
REQUEST_TIMEOUT = 8
_RPS_LIMIT = 8
_WINDOW_SEC = 1.0
_window_ts: List[float] = []
_lock = threading.Lock()

PLUS_SPLIT = re.compile(r"\s*\+\s*")
SUFFIX_PARENS = re.compile(r"\s*\([^)]*\)$")


def _normalize_for_scryfall(name: str) -> str:
    return SUFFIX_PARENS.sub("", name or "").strip()


def _norm_key(name: str) -> str:
    normed = _normalize_for_scryfall(name).lower()
    digest = hashlib.sha1(normed.encode("utf-8")).hexdigest()
    return f"scryfall:card:{digest}"


def split_commander_field(value: Optional[str]) -> list[str]:
    """Split 'Jodah, the Unifier+Jegantha, the Wellspring' -> ['Jodah, the Unifier', 'Jegantha, the Wellspring']"""
    if not value:
        return []
    parts = [p.strip() for p in PLUS_SPLIT.split(value) if p and p.strip()]
    seen = OrderedDict()
    for p in parts:
        seen.setdefault(p, None)
    return list(seen.keys())


def _explode_raw_names(raw: Optional[str]) -> list[str]:
    """Split raw DB value by '+', strip spaces, drop empties, then normalize for Scryfall."""
    if not raw:
        return []
    parts = [p.strip() for p in PLUS_SPLIT.split(raw) if p and p.strip()]
    return [_normalize_for_scryfall(p) for p in parts]


def _throttle():
    with _lock:
        now = time.monotonic()
        while _window_ts and now - _window_ts[0] > _WINDOW_SEC:
            _window_ts.pop(0)
        if len(_window_ts) >= _RPS_LIMIT:
            sleep_for = _WINDOW_SEC - (now - _window_ts[0])
        else:
            sleep_for = 0.0
    if sleep_for > 0:
        time.sleep(max(0, sleep_for))
    with _lock:
        _window_ts.append(time.monotonic())


def _chunk(lst: List[Any], size: int) -> Iterable[List[Any]]:
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def _chunk_cache_key(identifiers: List[Dict[str, Any]]) -> str:
    payload = json.dumps(identifiers, sort_keys=True, separators=(",", ":"))
    return "scryfall:collection:" + hashlib.sha1(payload.encode()).hexdigest()


def _request_collection(
    identifiers: List[Dict[str, Any]], retries: int = 3
) -> Dict[str, Any]:
    _throttle()
    resp = requests.post(
        SCRYFALL_COLLECTION_URL,
        headers=SCRYFALL_HEADERS,
        json={"identifiers": identifiers},
        timeout=REQUEST_TIMEOUT,
    )
    if 200 <= resp.status_code < 300:
        return resp.json()

    if resp.status_code in (429, 500, 502, 503, 504) and retries > 0:
        ra = resp.headers.get("Retry-After")
        if ra:
            try:
                delay = float(ra)
            except ValueError:
                delay = 0.5
        else:
            attempt = 4 - retries
            base = 0.25 * (2**attempt)
            delay = base + (0.1 * base * (time.monotonic() % 1))
        time.sleep(delay)
        return _request_collection(identifiers, retries - 1)

    try:
        detail = resp.json()
    except Exception:
        detail = resp.text
    raise RuntimeError(f"Scryfall error {resp.status_code}: {detail}")


class ScryfallClientRequest:
    """Server side client + cache to make scryfall requests."""

    def __init__(self, cache_ttl: int = CACHE_TTL):
        self.cache_ttl = cache_ttl

    def get_cards_by_collection(self, identifiers):
        """Make a POST request out to scryfall for a collection of
        cards. Limit 75 cards in the collection. Send card names as identifiers:
        {
            "identifiers": [
                {
                  "name": "Ancient Tomb"
                },
          ]
        }
        """
        MAX_PER = 75
        all_cards: List[Dict[str, Any]] = []
        all_warnings: List[Any] = []

        for chunk in _chunk(identifiers, MAX_PER):
            ck = _chunk_cache_key(chunk)
            cached = cache.get(ck)
            if cached is None:
                data = _request_collection(chunk)
                cache.set(ck, data, timeout=self.cache_ttl)
            else:
                data = cached

            all_cards.extend(data.get("data", []))
            if data.get("warnings"):
                all_warnings.extend(data["warnings"])

        out = {"object": "list", "data": all_cards}
        if all_warnings:
            out["warnings"] = all_warnings
        return out

    @staticmethod
    def primary_image_url(card: Dict[str, Any]) -> Optional[str]:
        """Picks a usable image URL, handling MDFCs."""
        iu = card.get("image_uris")
        if iu:
            return iu.get("art_crop")
        faces = card.get("card_faces") or []
        if faces and faces[0].get("image_uris"):
            iu0 = faces[0]["image_uris"]
            return iu0.get("normal") or iu0.get("large") or iu0.get("png")
        return None

    def get_commander_card_payloads_by_raw(
        self,
        commander_names: Iterable[str],
    ) -> dict[str, list[dict]]:
        """
        Accepts raw DB values (may contain '+' and/or trailing parenthetical variants).
        Returns: { raw_input: [card_payload, ...] }.
        Internally caches each card by its normalized name key: scryfall:card:name:<normalized>.
        """
        # 1) Build: raw -> [normalized names...]
        raw_to_norms: dict[str, list[str]] = {}
        all_norms: list[str] = []

        for raw in commander_names:
            norms = _explode_raw_names(raw)
            raw_to_norms[raw] = norms
            all_norms.extend(norms)

        # global de-dupe of normalized names while preserving order
        all_norms = list(OrderedDict.fromkeys(all_norms))

        # 2) Per-name cache lookups; collect misses for batch request
        wants: list[dict[str, str]] = []
        norm_to_card: dict[str, dict] = {}

        for n in all_norms:
            key = f"scryfall:card:name:{_norm_key(n)}"
            hit = cache.get(key)
            if hit:
                norm_to_card[n] = hit
            else:
                # Ask Scryfall by canonical name (no suffixes)
                wants.append({"name": n})
        logger.info(f"Cards pulled from cache: {list(norm_to_card.keys())}")
        logger.info(f"Cards to be fetched: {wants}")

        # 3) Batch fetch any misses, then fill cache and map
        if wants:
            bundle = self.get_cards_by_collection(wants)
            for card in bundle.get("data", []):
                # Scryfall returns canonical name in `name`
                cn = card.get("name", "")
                cache_key = f"scryfall:card:name:{_norm_key(cn)}"
                cache.set(cache_key, card, timeout=self.cache_ttl)
                norm_to_card[cn] = card

                # also ensure lowercase access works
                norm_to_card[_normalize_for_scryfall(cn)] = card

        # 4) Build result per raw input (list for partners)
        out: dict[str, list[dict]] = {}
        for raw, norms in raw_to_norms.items():
            cards: list[dict] = []
            for n in norms:
                # try exact normalized, then lowercase normalized
                card = norm_to_card.get(n) or norm_to_card.get(n)
                if card:
                    cards.append(card)
            out[raw] = cards

        return out

    def get_commander_image_urls(
        self,
        commander_names: Iterable[str],
    ) -> dict[str, list[str]]:
        """
        Convenience: raw -> [image_url, ...]
        """
        cards_by_raw = self.get_commander_card_payloads_by_raw(commander_names)
        images_by_raw: dict[str, list[str]] = {}
        for raw, cards in cards_by_raw.items():
            imgs = []
            for c in cards:
                url = self.primary_image_url(c)
                if url:
                    imgs.append(url)
            images_by_raw[raw] = imgs
        return images_by_raw

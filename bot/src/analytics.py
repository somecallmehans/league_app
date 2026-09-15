"""Emit Discord bot interactions to GA4 via the Measurement Protocol."""

from __future__ import annotations

import hashlib
import logging
import os
import uuid
from typing import Any, Callable, Optional

import httpx

logger = logging.getLogger(__name__)

BOT_INTERACTION_EVENT = "bot_interaction"
GA_COLLECT_URL = "https://www.google-analytics.com/mp/collect"


def normalize_interaction_name(name: str) -> str:
    parts = name.split(":")
    if len(parts) >= 2 and parts[-1].isdigit():
        return ":".join(parts[:-1])
    return name


def hash_discord_user_id(discord_user_id: int, salt: Optional[str] = None) -> str:
    secret = salt if salt is not None else os.getenv("GA_USER_ID_SALT", "")
    material = f"{secret}:{discord_user_id}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _credentials() -> Optional[tuple[str, str, str]]:
    measurement_id = os.getenv("GA_MEASUREMENT_ID") or ""
    api_secret = os.getenv("GA_API_SECRET") or ""
    salt = os.getenv("GA_USER_ID_SALT") or ""
    if not measurement_id or not api_secret or not salt:
        return None
    return measurement_id, api_secret, salt


async def track_bot_interaction(
    *,
    discord_user_id: int,
    interaction_name: str,
    interaction_kind: str,
    store_slug: Optional[str] = None,
    http_client_factory: Optional[Callable[[], Any]] = None,
) -> None:
    """Post a bot_interaction event. Never raises to callers."""
    try:
        creds = _credentials()
        if not creds:
            logger.info(
                "Skipping bot analytics: GA_MEASUREMENT_ID, GA_API_SECRET, "
                "or GA_USER_ID_SALT unset"
            )
            return

        measurement_id, api_secret, salt = creds
        params: dict[str, Any] = {
            "interaction_name": normalize_interaction_name(interaction_name),
            "interaction_kind": interaction_kind,
        }
        if store_slug:
            params["store_slug"] = store_slug

        payload = {
            "client_id": str(uuid.uuid4()),
            "user_id": hash_discord_user_id(discord_user_id, salt=salt),
            "events": [{"name": BOT_INTERACTION_EVENT, "params": params}],
        }

        url = f"{GA_COLLECT_URL}?measurement_id={measurement_id}&api_secret={api_secret}"
        factory = http_client_factory or (lambda: httpx.AsyncClient(timeout=5))
        async with factory() as client:
            await client.post(url, json=payload)
    except Exception:
        logger.exception("bot analytics emission failed")

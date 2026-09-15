import hashlib
import logging
from typing import Any, Callable, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.analytics import (
    BOT_INTERACTION_EVENT,
    hash_discord_user_id,
    normalize_interaction_name,
    track_bot_interaction,
)


def test_normalize_strips_trailing_numeric_id():
    assert normalize_interaction_name("join:confirm:42") == "join:confirm"
    assert normalize_interaction_name("signin_confirm") == "signin_confirm"
    assert normalize_interaction_name("join:pick") == "join:pick"


def test_hash_discord_user_id_is_stable_and_not_raw():
    hashed = hash_discord_user_id(12345, salt="test-salt")
    assert hashed == hash_discord_user_id(12345, salt="test-salt")
    assert hashed != "12345"
    assert "12345" not in hashed
    assert hashed != hash_discord_user_id(12345, salt="other-salt")


@pytest.mark.asyncio
async def test_track_bot_interaction_posts_measurement_protocol_payload(monkeypatch):
    monkeypatch.setenv("GA_MEASUREMENT_ID", "G-TESTID")
    monkeypatch.setenv("GA_API_SECRET", "secret")
    monkeypatch.setenv("GA_USER_ID_SALT", "salt")

    post = AsyncMock(return_value=MagicMock(status_code=204))
    client = MagicMock()
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    client.post = post

    await track_bot_interaction(
        discord_user_id=99,
        interaction_name="join:confirm:7",
        interaction_kind="component",
        store_slug="mimic",
        http_client_factory=lambda: client,
    )

    assert post.await_count == 1
    url = post.await_args.args[0]
    assert "measurement_id=G-TESTID" in url
    assert "api_secret=secret" in url
    body = post.await_args.kwargs["json"]
    assert body["user_id"] == hash_discord_user_id(99, salt="salt")
    assert body["events"][0]["name"] == BOT_INTERACTION_EVENT
    params = body["events"][0]["params"]
    assert params["interaction_name"] == "join:confirm"
    assert params["interaction_kind"] == "component"
    assert params["store_slug"] == "mimic"


@pytest.mark.asyncio
async def test_track_skips_when_credentials_missing(monkeypatch):
    monkeypatch.delenv("GA_MEASUREMENT_ID", raising=False)
    monkeypatch.delenv("GA_API_SECRET", raising=False)
    monkeypatch.delenv("GA_USER_ID_SALT", raising=False)

    factory: Callable[[], Any] = MagicMock()
    await track_bot_interaction(
        discord_user_id=1,
        interaction_name="help",
        interaction_kind="command",
        http_client_factory=factory,
    )
    factory.assert_not_called()


@pytest.mark.asyncio
async def test_track_skips_when_salt_missing(monkeypatch):
    monkeypatch.setenv("GA_MEASUREMENT_ID", "G-TESTID")
    monkeypatch.setenv("GA_API_SECRET", "secret")
    monkeypatch.delenv("GA_USER_ID_SALT", raising=False)

    factory: Callable[[], Any] = MagicMock()
    await track_bot_interaction(
        discord_user_id=1,
        interaction_name="help",
        interaction_kind="command",
        http_client_factory=factory,
    )
    factory.assert_not_called()


@pytest.mark.asyncio
async def test_track_swallows_http_errors(monkeypatch, caplog):
    monkeypatch.setenv("GA_MEASUREMENT_ID", "G-TESTID")
    monkeypatch.setenv("GA_API_SECRET", "secret")
    monkeypatch.setenv("GA_USER_ID_SALT", "salt")

    post = AsyncMock(side_effect=RuntimeError("ga down"))
    client = MagicMock()
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    client.post = post

    with caplog.at_level(logging.ERROR):
        await track_bot_interaction(
            discord_user_id=1,
            interaction_name="signin",
            interaction_kind="command",
            http_client_factory=lambda: client,
        )

    assert any("bot analytics" in r.message.lower() for r in caplog.records)

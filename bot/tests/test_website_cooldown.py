import time

from src.router import (
    WEBSITE_COOLDOWN_SEC,
    WEBSITE_COOLDOWNS,
    _set_website_cooldown,
    _website_cooldown_remaining,
)


def setup_function():
    WEBSITE_COOLDOWNS.clear()


def test_website_cooldown_not_active_initially():
    assert _website_cooldown_remaining(1, 2) is None


def test_website_cooldown_active_after_set():
    _set_website_cooldown(1, 2)
    remaining = _website_cooldown_remaining(1, 2)
    assert remaining is not None
    assert 0 < remaining <= WEBSITE_COOLDOWN_SEC


def test_website_cooldown_per_user():
    _set_website_cooldown(1, 2)
    assert _website_cooldown_remaining(1, 3) is None


def test_website_cooldown_expires():
    _set_website_cooldown(1, 2)
    WEBSITE_COOLDOWNS[(1, 2)] = time.time() - 1
    assert _website_cooldown_remaining(1, 2) is None

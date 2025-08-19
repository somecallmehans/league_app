import json
import types
import pytest

from django.core.cache import cache
from services.scryfall_client import ScryfallClientRequest, SCRYFALL_COLLECTION_URL

pytestmark = pytest.mark.django_db


def mk_card(name, image_url="https://img.example/normal.jpg"):
    return {
        "object": "card",
        "name": name,
        "image_uris": {"normal": image_url},
    }


def mk_mdfc(name, front_url="https://img.example/front.jpg"):
    return {
        "object": "card",
        "name": name,
        "card_faces": [
            {"name": f"{name} // Face B", "image_uris": {"normal": front_url}},
            {
                "name": f"{name} // Face B2",
                "image_uris": {"normal": "https://img.example/back.jpg"},
            },
        ],
    }


def fake_scryfall_response(cards):
    return {
        "object": "list",
        "has_more": False,
        "data": cards,
    }


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def svc():
    # shorter TTL during tests
    return ScryfallClientRequest(cache_ttl=60)


@pytest.fixture
def no_throttle(monkeypatch):
    # neutralize throttling so tests are fast and deterministic
    from services import scryfall_client

    monkeypatch.setattr(scryfall_client, "_throttle", lambda: None)


@pytest.fixture
def mock_requests_post(monkeypatch):
    calls = {"count": 0, "payloads": []}

    class FakeResp:
        def __init__(self, status=200, json_data=None, headers=None):
            self.status_code = status
            self._json = json_data or {}
            self.headers = headers or {}

        def json(self):
            return self._json

        @property
        def text(self):
            return json.dumps(self._json)

    def _post(url, headers=None, json=None, timeout=None):
        assert url == SCRYFALL_COLLECTION_URL
        calls["count"] += 1
        calls["payloads"].append(json)
        # Echo back the names it asked for as cards w/ simple image_uris
        idents = json.get("identifiers", [])
        cards = []
        for ident in idents:
            nm = ident.get("name")
            if nm == "MDFC Example":
                cards.append(mk_mdfc("MDFC Example"))
            else:
                cards.append(
                    mk_card(
                        nm, image_url=f"https://img.example/{nm.replace(' ', '_')}.jpg"
                    )
                )
        return FakeResp(200, fake_scryfall_response(cards))

    monkeypatch.setattr("services.scryfall_client.requests.post", _post)
    return calls


def test_splits_plus_and_strips_parenthetical(svc, mock_requests_post, no_throttle):
    raw_inputs = [
        "Jodah, the Unifier+Jegantha, the Wellspring",
        "The Prismatic Piper (Blue)",
        "Atraxa, Grand Unifier",
    ]
    result = svc.get_commander_card_payloads_by_raw(raw_inputs)

    # raw -> list[card]
    assert set(result.keys()) == set(raw_inputs)
    assert [
        c["name"] for c in result["Jodah, the Unifier+Jegantha, the Wellspring"]
    ] == [
        "Jodah, the Unifier",
        "Jegantha, the Wellspring",
    ]
    assert [c["name"] for c in result["The Prismatic Piper (Blue)"]] == [
        "The Prismatic Piper"
    ]
    assert [c["name"] for c in result["Atraxa, Grand Unifier"]] == [
        "Atraxa, Grand Unifier"
    ]

    # only one HTTP batch call (<=75 identifiers)
    assert mock_requests_post["count"] == 1
    sent_names = [i["name"] for i in mock_requests_post["payloads"][0]["identifiers"]]
    # Parenthetical removed; partners split
    assert sent_names == [
        "Jodah, the Unifier",
        "Jegantha, the Wellspring",
        "The Prismatic Piper",
        "Atraxa, Grand Unifier",
    ]


def test_caches_by_normalized_name(svc, mock_requests_post, no_throttle):
    # First call populates cache (should make one HTTP call)
    raw1 = ["The Prismatic Piper (Blue)"]
    _ = svc.get_commander_card_payloads_by_raw(raw1)
    assert mock_requests_post["count"] == 1

    # Second call with a different suffix should be cache hit (no additional HTTP)
    raw2 = ["The Prismatic Piper (Green)"]
    _ = svc.get_commander_card_payloads_by_raw(raw2)
    assert mock_requests_post["count"] == 1  # still one call, cache used


def test_returns_empty_for_empty_or_none_inputs(svc, mock_requests_post, no_throttle):
    result = svc.get_commander_card_payloads_by_raw([None, "", "   "])
    assert result == {None: [], "": [], "   ": []}
    # no network calls
    assert mock_requests_post["count"] == 0


def test_partner_order_preserved(svc, mock_requests_post, no_throttle):
    raw = ["A Partner+Z Partner+B Partner"]
    _ = svc.get_commander_card_payloads_by_raw(raw)
    sent_names = [i["name"] for i in mock_requests_post["payloads"][0]["identifiers"]]
    assert sent_names == ["A Partner", "Z Partner", "B Partner"]

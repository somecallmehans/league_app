import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def mock_scryfall_commander_images():
    """Avoid live Scryfall calls in user API tests."""

    def _fake(commander_names):
        return {name: [] for name in commander_names}

    with patch(
        "users.queries.scryfall_request.get_commander_image_urls",
        side_effect=_fake,
    ):
        yield

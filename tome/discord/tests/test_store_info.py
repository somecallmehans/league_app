import pytest

from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status


@pytest.fixture(scope="function")
def client(settings):
    settings.SERVICE_TOKEN = "test-token"
    api = APIClient()
    api.credentials(
        HTTP_AUTHORIZATION="X-SERVICE-TOKEN test-token",
        HTTP_X_DISCORD_GUILD_ID="1123750208937938964",
    )
    return api


def test_store_info(client) -> None:
    """should: return slug and store name for the guild's store"""
    url = reverse("store_info")
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "slug" in data
    assert "store_name" in data
    assert data["slug"]

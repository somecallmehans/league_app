import pytest
from django.test import RequestFactory
from rest_framework.test import APIClient

from stores.models import Store
from stores.middleware import StoreResolverMiddleware, InvalidStoreRedirectMiddleware


@pytest.fixture
def store_active(transactional_db):
    return Store.objects.create(
        name="Active Store",
        slug="active-store",
        external_url="https://active.example.test",
        discord_guild_id=9999990001,
        is_active=True,
        deleted=False,
    )


@pytest.fixture
def store_inactive(transactional_db):
    return Store.objects.create(
        name="Inactive Store",
        slug="inactive-store",
        external_url="https://inactive.example.test",
        discord_guild_id=9999990002,
        is_active=False,
        deleted=False,
    )


@pytest.fixture
def rf():
    return RequestFactory()


class TestInvalidStoreRedirectMiddleware:
    """InvalidStoreRedirectMiddleware should redirect only when the subdomain
    does not correspond to any non-deleted store (including inactive ones)."""

    def _get_response(self, request, settings):
        settings.BASE_DOMAINS = {"example.test"}
        mw = InvalidStoreRedirectMiddleware(get_response=lambda r: None)
        return mw.process_request(request)

    def test_missing_store_redirects_to_apex(self, rf, settings, transactional_db):
        request = rf.get("/leaderboard", HTTP_HOST="nonexistent.example.test")
        response = self._get_response(request, settings)
        assert response is not None
        assert response.status_code == 302

    def test_active_store_does_not_redirect(self, rf, settings, store_active):
        request = rf.get("/leaderboard", HTTP_HOST="active-store.example.test")
        response = self._get_response(request, settings)
        assert response is None

    def test_inactive_store_does_not_redirect(self, rf, settings, store_inactive):
        request = rf.get("/leaderboard", HTTP_HOST="inactive-store.example.test")
        response = self._get_response(request, settings)
        assert response is None


class TestStoreResolverMiddleware:
    """StoreResolverMiddleware should resolve both active and inactive
    non-deleted stores and attach them to the request."""

    def _resolve(self, request, settings):
        settings.BASE_DOMAINS = {"example.test"}
        mw = StoreResolverMiddleware(get_response=lambda r: None)
        mw.process_request(request)
        return request

    def test_resolves_active_store(self, rf, settings, store_active):
        request = rf.get("/store/", HTTP_HOST="active-store.example.test")
        request = self._resolve(request, settings)
        assert request.store_id == store_active.id
        assert request.store_slug == "active-store"

    def test_resolves_inactive_store(self, rf, settings, store_inactive):
        request = rf.get("/store/", HTTP_HOST="inactive-store.example.test")
        request = self._resolve(request, settings)
        assert request.store_id == store_inactive.id
        assert request.store_slug == "inactive-store"

    def test_missing_store_leaves_none(self, rf, settings, transactional_db):
        request = rf.get("/store/", HTTP_HOST="nope.example.test")
        request = self._resolve(request, settings)
        assert request.store_id is None
        assert request.store is None


class TestGetStoreView:
    """The get_store view should return is_active in the response body."""

    def _make_client(self, slug, settings):
        settings.BASE_DOMAINS = {"example.test"}
        client = APIClient()
        client.defaults["HTTP_HOST"] = f"{slug}.example.test"
        return client

    def test_active_store_returns_is_active_true(self, settings, store_active):
        client = self._make_client("active-store", settings)
        res = client.get("/store/")
        assert res.status_code == 200
        data = res.json()
        assert data["is_active"] is True
        assert data["slug"] == "active-store"

    def test_inactive_store_returns_is_active_false(self, settings, store_inactive):
        client = self._make_client("inactive-store", settings)
        res = client.get("/store/")
        assert res.status_code == 200
        data = res.json()
        assert data["is_active"] is False
        assert data["slug"] == "inactive-store"

    def test_missing_store_returns_null(self, settings, transactional_db):
        client = self._make_client("nope", settings)
        res = client.get("/store/")
        assert res.status_code == 200
        assert res.json() is None

import pytest

from django.urls import reverse
from rest_framework import status

from achievements.models import (
    ScalableTerms,
    ScalableTermType,
    AchievementScalableTerms,
    Achievements,
)
from utils.test_helpers import get_ids

ids = get_ids()


@pytest.fixture
def scalable_term_types():
    """Ensure we have at least two scalable term types for tests that need them."""
    types = list(ScalableTermType.objects.all()[:2])
    if len(types) < 2:
        for name in ["Fixture Type A", "Fixture Type B"]:
            t, _ = ScalableTermType.objects.get_or_create(name=name)
            types.append(t)
    return types


def test_get_scalable_terms(client) -> None:
    """
    Should: return scalable terms grouped by type, excluding deleted.
    """
    url = reverse("get_scalable_terms")
    res = client.get(url)
    parsed = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert "types" in parsed
    assert isinstance(parsed["types"], list)


def test_get_scalable_terms_excludes_deleted(client) -> None:
    """
    Should: exclude soft-deleted terms from the response.
    """
    type_obj = ScalableTermType.objects.first()
    active = ScalableTerms.objects.create(
        term_display="Active Term",
        type=type_obj,
        deleted=False,
    )
    deleted_term = ScalableTerms.objects.create(
        term_display="Deleted Term",
        type=type_obj,
        deleted=True,
    )

    url = reverse("get_scalable_terms")
    res = client.get(url)
    parsed = res.json()

    assert res.status_code == status.HTTP_200_OK
    term_displays = [
        t["term_display"]
        for typ in parsed["types"]
        for t in typ.get("terms", [])
    ]
    assert "Active Term" in term_displays
    assert "Deleted Term" not in term_displays


def test_get_scalable_term_types(client) -> None:
    """
    Should: return all scalable term types.
    """
    url = reverse("get_scalable_term_types")
    res = client.get(url)
    parsed = res.json()

    assert res.status_code == status.HTTP_200_OK
    assert isinstance(parsed, list)
    assert all("id" in t and "name" in t for t in parsed)


def test_upsert_scalable_term_create(client) -> None:
    """
    Should: create a new scalable term.
    """
    type_obj = ScalableTermType.objects.first()
    url = reverse("upsert_scalable_term")
    body = {
        "term_display": "Trample",
        "type_id": type_obj.id if type_obj else None,
    }

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_201_CREATED
    assert parsed["term_display"] == "Trample"
    assert "id" in parsed

    created = ScalableTerms.objects.filter(term_display="Trample").first()
    assert created is not None
    assert created.deleted is False


def test_upsert_scalable_term_create_adds_to_bridge(client, scalable_term_types) -> None:
    """
    Should: when creating a new term, add bridge entries for each scalable achievement.
    """
    type_obj = scalable_term_types[0]
    ach = Achievements.objects.filter(deleted=False).first()
    assert ach is not None, "Need seeded achievements"
    AchievementScalableTerms.objects.create(
        achievement_id=ach.id,
        scalable_term_id=ScalableTerms.objects.create(
            term_display="Existing",
            type=type_obj,
        ).id,
    )

    url = reverse("upsert_scalable_term")
    body = {"term_display": "NewBridgeTerm", "type_id": type_obj.id}

    res = client.post(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    new_term = ScalableTerms.objects.get(term_display="NewBridgeTerm")
    bridge_count = AchievementScalableTerms.objects.filter(
        scalable_term_id=new_term.id
    ).count()
    assert bridge_count >= 1
    assert AchievementScalableTerms.objects.filter(
        achievement_id=ach.id,
        scalable_term_id=new_term.id,
    ).exists()


def test_upsert_scalable_term_update(client, scalable_term_types) -> None:
    """
    Should: update an existing term's name and type.
    """
    type_obj = scalable_term_types[0]
    other_type = scalable_term_types[1] if len(scalable_term_types) > 1 else type_obj
    term = ScalableTerms.objects.create(
        term_display="Original",
        type=type_obj,
    )

    url = reverse("upsert_scalable_term")
    body = {
        "id": term.id,
        "term_display": "Updated Name",
        "type_id": other_type.id,
    }

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_201_CREATED
    assert parsed["term_display"] == "Updated Name"

    term.refresh_from_db()
    assert term.term_display == "Updated Name"


def test_upsert_scalable_term_soft_delete(client) -> None:
    """
    Should: soft-delete a term when deleted=True.
    """
    type_obj = ScalableTermType.objects.first()
    term = ScalableTerms.objects.create(
        term_display="ToDelete",
        type=type_obj,
        deleted=False,
    )

    url = reverse("upsert_scalable_term")
    body = {
        "id": term.id,
        "term_display": term.term_display,
        "deleted": True,
    }

    res = client.post(url, body, format="json")
    assert res.status_code == status.HTTP_201_CREATED

    term.refresh_from_db()
    assert term.deleted is True


def test_upsert_scalable_term_create_no_name(client) -> None:
    """
    Should: return 400 when creating without term_display.
    """
    url = reverse("upsert_scalable_term")
    body = {"type_id": 1}

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "term_display" in parsed.get("message", "").lower()


def test_upsert_scalable_term_update_not_found(client) -> None:
    """
    Should: return 400 when updating a non-existent term id.
    """
    url = reverse("upsert_scalable_term")
    body = {"id": 99999, "term_display": "Ghost"}

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "not found" in parsed.get("message", "").lower()


def test_create_scalable_term_type(client) -> None:
    """
    Should: create a new scalable term type.
    """
    url = reverse("create_scalable_term_type")
    body = {"name": "Custom Type"}

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_201_CREATED
    assert parsed["name"] == "Custom Type"
    assert "id" in parsed

    created = ScalableTermType.objects.filter(name="Custom Type").first()
    assert created is not None


def test_create_scalable_term_type_duplicate(client) -> None:
    """
    Should: return 400 when creating a type that already exists.
    """
    ScalableTermType.objects.get_or_create(name="Duplicate Type")
    url = reverse("create_scalable_term_type")
    body = {"name": "Duplicate Type"}

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in parsed.get("message", "").lower()


def test_create_scalable_term_type_no_name(client) -> None:
    """
    Should: return 400 when name is empty.
    """
    url = reverse("create_scalable_term_type")
    body = {"name": ""}

    res = client.post(url, body, format="json")
    parsed = res.json()

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "required" in parsed.get("message", "").lower()


def test_upsert_scalable_term_requires_auth(api_client) -> None:
    """
    Should: return 401 when unauthenticated.
    """
    url = reverse("upsert_scalable_term")
    body = {"term_display": "Unauth", "type_id": 1}

    res = api_client.post(url, body, format="json")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_scalable_term_type_requires_auth(api_client) -> None:
    """
    Should: return 401 when unauthenticated.
    """
    url = reverse("create_scalable_term_type")
    body = {"name": "Unauth Type"}

    res = api_client.post(url, body, format="json")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

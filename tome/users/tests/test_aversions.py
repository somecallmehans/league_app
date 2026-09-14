from django.urls import reverse
from rest_framework import status

from utils.test_helpers import get_ids
from users.models import Aversions, Participants, Users

ids = get_ids()


def test_create_aversion_normalizes_pair(client):
    url = reverse("participant_aversions", kwargs={"participant_id": ids.P1})
    res = client.post(url, {"other_participant_id": ids.P2}, format="json")

    assert res.status_code == status.HTTP_201_CREATED
    assert res.data["other_participant"]["id"] == ids.P2
    assert res.data["declared_by_id"] == ids.P1

    aversion = Aversions.objects.get()
    assert aversion.participant_low_id == min(ids.P1, ids.P2)
    assert aversion.participant_high_id == max(ids.P1, ids.P2)
    assert aversion.declared_by_id == ids.P1


def test_create_aversion_from_other_direction_is_duplicate(client):
    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )
    url = reverse("participant_aversions", kwargs={"participant_id": ids.P2})
    res = client.post(url, {"other_participant_id": ids.P1}, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["message"] == "Aversion already exists"
    assert Aversions.objects.count() == 1


def test_create_self_aversion_rejected(client):
    url = reverse("participant_aversions", kwargs={"participant_id": ids.P1})
    res = client.post(url, {"other_participant_id": ids.P1}, format="json")

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert Aversions.objects.count() == 0


def test_get_aversions_from_either_participant(client):
    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P3),
        participant_high_id=max(ids.P1, ids.P3),
        declared_by_id=ids.P1,
    )

    from_p1 = client.get(
        reverse("participant_aversions", kwargs={"participant_id": ids.P1})
    )
    from_p3 = client.get(
        reverse("participant_aversions", kwargs={"participant_id": ids.P3})
    )

    assert from_p1.status_code == status.HTTP_200_OK
    assert from_p3.status_code == status.HTTP_200_OK
    assert len(from_p1.data) == 1
    assert len(from_p3.data) == 1
    assert from_p1.data[0]["other_participant"]["id"] == ids.P3
    assert from_p3.data[0]["other_participant"]["id"] == ids.P1


def test_delete_aversion(client):
    aversion = Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )
    res = client.delete(reverse("delete_aversion", kwargs={"aversion_id": aversion.id}))

    assert res.status_code == status.HTTP_204_NO_CONTENT
    assert Aversions.objects.count() == 0


def test_soft_delete_participant_cascades_aversions(client):
    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )
    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P3),
        participant_high_id=max(ids.P1, ids.P3),
        declared_by_id=ids.P3,
    )

    res = client.post(
        reverse("upsert_participant"),
        {"id": ids.P1, "name": "gone", "deleted": True},
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED
    assert Aversions.objects.count() == 0
    assert Participants.objects.get(id=ids.P1).deleted is True


def test_aversions_require_superuser(api_client, db):
    user = Users.objects.create(
        name="Regular Admin",
        password="letmein",
        email="regular@email.com",
        admin=True,
    )
    user.is_authenticated = True
    user.is_superuser = False
    user.is_staff = True
    api_client.force_authenticate(user=user)

    res = api_client.get(
        reverse("participant_aversions", kwargs={"participant_id": ids.P1})
    )
    assert res.status_code == status.HTTP_403_FORBIDDEN

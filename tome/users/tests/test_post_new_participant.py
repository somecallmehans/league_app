import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from users.models import Participants


@pytest.mark.django_db
def test_post_new_participant():
    client = APIClient()

    url = reverse("upsert_participant")

    payload = {"name": "John Newguy"}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED

    participant_exists = Participants.objects.filter(name="John Newguy").exists()
    assert participant_exists


@pytest.mark.django_db
def test_post_update_participant():
    client = APIClient()
    url = reverse("upsert_participant")

    payload = {"id": 1, "name": "Jane Newgirl"}
    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db()
def test_post_new_participant_fail():
    client = APIClient()

    url = reverse("upsert_participant")

    payload = {}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST

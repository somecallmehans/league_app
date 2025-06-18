import pytest

from django.urls import reverse
from rest_framework import status

from users.models import Participants


def test_post_new_participant(client):

    url = reverse("upsert_participant")

    payload = {"name": "John Newguy"}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED

    participant_exists = Participants.objects.filter(name="John Newguy").exists()
    assert participant_exists


def test_post_update_participant(client):
    url = reverse("upsert_participant")

    payload = {"id": 901, "name": "Jane Newgirl"}
    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED


def test_post_new_participant_fail(client):
    url = reverse("upsert_participant")

    payload = {}

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST

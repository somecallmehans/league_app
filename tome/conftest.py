import pytest
from rest_framework.test import APIClient
from django.db import connection

from users.models import Participants, Users

test_participants = [
    Participants(name="Charlie Smith"),
    Participants(name="Trenna Thain"),
    Participants(name="Fern Penvarden"),
    Participants(name="Nikita Heape"),
    Participants(name="Bevon Goldster"),
    Participants(name="Jeffrey Blackwood"),
    Participants(name="Amanda Tinnin"),
    Participants(name="Bless Frankfurt"),
    Participants(name="Fran Brek"),
    Participants(name="Thom Horn"),
]


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def mock_authenticated_user(db):
    user = Users.objects.create(
        name="Testy McTestface", password="letmein", email="email@email.com", admin=True
    )
    user.is_authenticated = True
    return user


@pytest.fixture
def client(api_client, mock_authenticated_user):
    """
    Simulates an authenticated client (no need for JWT).
    """
    api_client.force_authenticate(user=mock_authenticated_user)
    return api_client


@pytest.fixture(autouse=True, scope="function")
def seed_db(db):
    with connection.cursor() as cursor:
        cursor.execute("ALTER SEQUENCE participants_id_seq RESTART WITH 1")

    Participants.objects.bulk_create(test_participants)

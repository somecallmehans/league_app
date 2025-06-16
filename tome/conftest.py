import pytest
from rest_framework.test import APIClient
from django.db import connection

from users.models import Participants, Users
from sessions_rounds.models import Sessions, Rounds

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

test_sessions = [
    Sessions(id=101, month_year="10-24", closed=True, created_at=1729900800),
    Sessions(id=102, month_year="11-24", closed=True, created_at=1730592000),
    Sessions(id=103, month_year="11-24", closed=False, created_at=1731196800),
]

test_rounds = [
    Rounds(id=111, session_id=101, round_number=1),
    Rounds(id=112, session_id=101, round_number=2),
    Rounds(id=113, session_id=102, round_number=1),
    Rounds(id=114, session_id=102, round_number=2),
    Rounds(id=115, session_id=103, round_number=1),
    Rounds(id=116, session_id=103, round_number=2),
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
    Participants.objects.bulk_create(test_participants)
    Sessions.objects.bulk_create(test_sessions)
    Rounds.objects.bulk_create(test_rounds)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants));
        """
        )

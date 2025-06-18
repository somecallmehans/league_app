import pytest
from rest_framework.test import APIClient
from django.db import connection

from users.models import Participants, Users
from sessions_rounds.models import Sessions, Rounds
from achievements.models import Achievements

test_participants = [
    Participants(id=901, name="Charlie Smith"),
    Participants(id=902, name="Trenna Thain"),
    Participants(id=903, name="Fern Penvarden"),
    Participants(id=904, name="Nikita Heape"),
    Participants(id=905, name="Bevon Goldster"),
    Participants(id=906, name="Jeffrey Blackwood"),
    Participants(id=907, name="Amanda Tinnin"),
    Participants(id=908, name="Bless Frankfurt"),
    Participants(id=909, name="Fran Brek"),
    Participants(id=910, name="Thom Horn"),
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

test_achievements = [
    Achievements(id=24, name="Participation", slug="participation", point_value=3),
    Achievements(id=25, name="Kill the table", point_value=2),
    Achievements(
        id=26, name="Win with a deck that has no instants or sorceries", point_value=5
    ),
    Achievements(
        id=27, name="Win with no creatures except your commander", point_value=4
    ),
    Achievements(id=28, name="Win with no lands", point_value=9),
    Achievements(id=29, name="Win with 88 or more basic lands", point_value=11),
    Achievements(
        id=30, name="Win via commander damage", slug="cmdr-damage", point_value=1
    ),
    Achievements(id=31, name="The game is a draw", slug="end-draw", point_value=3),
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
    Achievements.objects.bulk_create(test_achievements)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants));
        """
        )

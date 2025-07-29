import pytest
from unittest import mock
from datetime import datetime

from rest_framework.test import APIClient
from django.db import connection
from pathlib import Path

from users.models import Users

SEED_DIRECTORY = "./test_db_seeds"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def mock_authenticated_user(db):
    """Mock authenticate our test user"""
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
def mock_today():
    """Mock what 'today' is for our tests, which generally all assume
    it's November 2024."""

    class MockDateTime(datetime):
        @classmethod
        def today(cls):
            return cls(2024, 11, 25)

    with (
        mock.patch("users.models.datetime", MockDateTime),
        mock.patch("achievements.views.datetime", MockDateTime),
        mock.patch("sessions_rounds.views.datetime", MockDateTime),
    ):
        yield


@pytest.fixture(autouse=True, scope="function")
def seed_db(db):
    """Seed our test_db based on the contents of our csv files.

    Additionally, reset id sequences for various tables."""
    with connection.cursor() as cursor:
        for file in sorted(Path(SEED_DIRECTORY).iterdir()):
            with file.open() as f:
                colnames, *_ = f.readlines()
                colnames = colnames.strip()
                _, table_name = file.stem.split("_", maxsplit=1)

                f.seek(0)
                cursor.copy_expert(
                    f"COPY {table_name} ({colnames}) FROM STDIN CSV HEADER", f
                )

        cursor.execute("SELECT setval('participants_id_seq', 1, false);")
        cursor.execute("SELECT setval('achievements_id_seq', 1, false);")
        cursor.execute("TRUNCATE TABLE pods_participants RESTART IDENTITY CASCADE")
        cursor.execute("TRUNCATE TABLE pods RESTART IDENTITY CASCADE")
        cursor.execute(
            "TRUNCATE TABLE participant_achievements RESTART IDENTITY CASCADE"
        )

import pytest
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
        for file in sorted(Path(SEED_DIRECTORY).iterdir()):
            with file.open() as f:
                colnames, *_ = f.readlines()
                colnames = colnames.strip()
                _, table_name = file.stem.split("_", maxsplit=1)

                f.seek(0)
                cursor.copy_expert(
                    f"COPY {table_name} ({colnames}) FROM STDIN CSV HEADER", f
                )

        cursor.execute(
            """
            SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants));
        """
        )

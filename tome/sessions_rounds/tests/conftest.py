import pytest
from unittest import mock
from datetime import datetime
from users.models import Participants
from sessions_rounds.models import Sessions, Rounds

test_participants = [
    {"name": "Glennis Sansam"},
    {"name": "Sara Dewhurst"},
    {"name": "Uriel Cohani"},
    {"name": "Noella Gannon"},
]


@pytest.fixture(scope="function")
def create_base_participants(django_db_setup, django_db_blocker):
    base_participants = []
    with django_db_blocker.unblock():
        for p in test_participants:
            participant = Participants.objects.create(name=p["name"])
            base_participants.append(participant)
    return base_participants


@pytest.fixture(scope="function")
@mock.patch("users.models.datetime", side_effect=lambda *args, **kw: date(*args, **kw))
def create_base_session_and_rounds(mock_date, django_db_setup, django_db_blocker):
    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today
    mocked_mmyy = mocked_today.strftime("%m-%y")

    with django_db_blocker.unblock():
        s1 = Sessions.objects.create(id=51, month_year=mocked_mmyy, closed=False)
        s2 = Sessions.objects.create(id=52, month_year=mocked_mmyy, closed=True)
        r1 = Rounds.objects.create(id=11, session_id=s1.id, round_number=1)
        r2 = Rounds.objects.create(id=12, session_id=s1.id, round_number=2)
        r3 = Rounds.objects.create(id=13, session_id=s2.id, round_number=1)
        r4 = Rounds.objects.create(id=14, session_id=s2.id, round_number=2)

    return s1, s2, r1, r2, r3, r4

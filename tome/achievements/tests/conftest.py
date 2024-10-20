import pytest
from unittest import mock
from datetime import datetime


from achievements.models import Achievements, Restrictions
from users.models import Participants
from sessions_rounds.models import Sessions, Rounds

test_participants = [
    {"name": "Trenna Thain"},
    {"name": "Fern Penvarden"},
    {"name": "Nikita Heape"},
    {"name": "Bevon Goldster"},
]


@pytest.fixture(scope="function")
def create_base_participants(django_db_setup, django_db_blocker):
    base_participants = []
    with django_db_blocker.unblock():
        for p in test_participants:
            p = Participants.objects.create(name=p["name"])
            base_participants.append(p)
    return base_participants


@pytest.fixture(scope="function")
def create_base_achievements(django_db_setup, django_db_blocker):

    with django_db_blocker.unblock():
        a1 = Achievements.objects.create(name="Win a game", point_value=1)
        a2 = Achievements.objects.create(name="No Creatures", point_value=5)
        a3 = Achievements.objects.create(name="Monocolor Deck", point_value=3)
        a4 = Achievements.objects.create(name="Lent a deck", point_value=4)
        a5 = Achievements.objects.create(name="Flipped the table", point_value=5)
    return [a1, a2, a3, a4, a5]


@pytest.fixture(scope="function")
@mock.patch("users.models.datetime", side_effect=lambda *args, **kw: date(*args, **kw))
def create_base_session_and_rounds(mock_date, django_db_setup, django_db_blocker):
    mocked_today = datetime(2024, 11, 25)
    mock_date.today.return_value = mocked_today
    mocked_mmyy = mocked_today.strftime("%m-%y")

    with django_db_blocker.unblock():
        s1 = Sessions.objects.create(id=1, month_year=mocked_mmyy, closed=False)
        r1 = Rounds.objects.create(id=1, session_id=s1.id, round_number=1)

    return s1, r1


@pytest.fixture(scope="function")
def create_base_restrictions(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        re1 = Restrictions.objects.create(name="Once a round")
        re2 = Restrictions.objects.create(name="Once a session")

    return re1, re2

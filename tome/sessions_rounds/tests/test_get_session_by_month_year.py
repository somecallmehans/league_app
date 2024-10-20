import pytest
from datetime import datetime

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest import mock

from sessions_rounds.models import Sessions, Rounds
from users.models import Participants
from achievements.models import Achievements

from sessions_rounds.test_helpers import participant_achievement_factory


def round_maker(session):
    Rounds.objects.create(session_id=session.id, round_number=1)
    Rounds.objects.create(session_id=session.id, round_number=2)


@pytest.mark.django_db(serialized_rollback=True)
def test_get_session_info_by_mm_yy(create_base_participants):
    """Get all the necessary session info by a provided date."""
    old_mm_yy = "10_24"
    client = APIClient()
    url = reverse("sessions-and-rounds-by-date")
    query_params = {"mm_yy": old_mm_yy}

    participants = Participants.objects.all()

    ### Create some old sessions then attach some achievements to the users
    old_sesh_1 = Sessions.objects.create(id=111, month_year=old_mm_yy, closed=True)
    old_sesh_2 = Sessions.objects.create(id=112, month_year=old_mm_yy, closed=True)
    old_sesh_3 = Sessions.objects.create(id=113, month_year=old_mm_yy, closed=True)
    round_maker(old_sesh_1)
    round_maker(old_sesh_2)
    round_maker(old_sesh_3)
    rounds = Rounds.objects.all()
    round_one_lookup = {r.session_id: r for r in rounds if r.round_number == 1}
    round_two_lookup = {r.session_id: r for r in rounds if r.round_number == 2}

    ### Create some achievememnts
    participation = Achievements.objects.create(
        id=24, name="Participation Trophy", point_value=3, parent_id=None
    )
    win = Achievements.objects.create(id=4, name="Win", point_value=1, parent_id=None)
    all_creatures = Achievements.objects.create(
        id=1, name="All Creatures", point_value=1, parent_id=None
    )
    all_noncreatures = Achievements.objects.create(
        id=2, name="All Non Creatures", point_value=3, parent_id=None
    )
    all_artifacts = Achievements.objects.create(
        id=3, name="All Artifacts", point_value=2, parent_id=None
    )
    artifacts_child = Achievements.objects.create(
        id=10, name="Artifacts Child", point_value=None, parent=all_artifacts
    )

    # Everyone gets participation
    for p in participants:
        participant_achievement_factory(
            session=old_sesh_1,
            round=round_one_lookup[old_sesh_1.id],
            participant=p,
            achievement=participation,
        )
        participant_achievement_factory(
            session=old_sesh_2,
            round=round_one_lookup[old_sesh_2.id],
            participant=p,
            achievement=participation,
        )
        participant_achievement_factory(
            session=old_sesh_3,
            round=round_one_lookup[old_sesh_3.id],
            participant=p,
            achievement=participation,
        )

    # Make a bunch of random ones now
    # S1R1
    participant_achievement_factory(
        session=old_sesh_1,
        round=round_one_lookup[old_sesh_1.id],
        achievement=win,
        participant=participants[0],
    )
    # S1R1
    participant_achievement_factory(
        session=old_sesh_1,
        round=round_two_lookup[old_sesh_1.id],
        achievement=win,
        participant=participants[1],
    )
    participant_achievement_factory(
        session=old_sesh_1,
        round=round_two_lookup[old_sesh_1.id],
        achievement=all_creatures,
        participant=participants[1],
    )
    # S2R1
    participant_achievement_factory(
        session=old_sesh_2,
        round=round_one_lookup[old_sesh_2.id],
        achievement=win,
        participant=participants[2],
    )
    participant_achievement_factory(
        session=old_sesh_2,
        round=round_one_lookup[old_sesh_2.id],
        achievement=all_artifacts,
        participant=participants[2],
    )
    # S2R2
    participant_achievement_factory(
        session=old_sesh_2,
        round=round_two_lookup[old_sesh_2.id],
        achievement=win,
        participant=participants[2],
    )
    # S3R1
    participant_achievement_factory(
        session=old_sesh_3,
        round=round_one_lookup[old_sesh_3.id],
        achievement=win,
        participant=participants[3],
    )
    participant_achievement_factory(
        session=old_sesh_3,
        round=round_one_lookup[old_sesh_3.id],
        achievement=all_noncreatures,
        participant=participants[3],
    )
    participant_achievement_factory(
        session=old_sesh_3,
        round=round_one_lookup[old_sesh_3.id],
        achievement=all_artifacts,
        participant=participants[3],
    )
    # S3R2
    participant_achievement_factory(
        session=old_sesh_3,
        round=round_two_lookup[old_sesh_3.id],
        achievement=win,
        participant=participants[0],
    )
    participant_achievement_factory(
        session=old_sesh_3,
        round=round_two_lookup[old_sesh_3.id],
        achievement=artifacts_child,
        participant=participants[0],
    )

    res = client.get(url, query_params)
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == [
        {"id": 12, "name": "Noella Gannon", "total_points": 15},
        {"id": 9, "name": "Glennis Sansam", "total_points": 13},
        {"id": 11, "name": "Uriel Cohani", "total_points": 13},
        {"id": 10, "name": "Sara Dewhurst", "total_points": 11},
    ]

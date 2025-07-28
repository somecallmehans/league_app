import pytest
from itertools import islice

from utils.test_helpers import get_ids
from users.models import ParticipantAchievements, Participants
from sessions_rounds.models import Pods, PodsParticipants

ids = get_ids()

ALL_PARTICIPANTS = [
    ids.P1,
    ids.P2,
    ids.P3,
    ids.P4,
    ids.P5,
    ids.P6,
    ids.P7,
    ids.P8,
    ids.P9,
    ids.P10,
]


@pytest.fixture(scope="function")
def base_participants_list() -> list:
    """Grab a list of our baseline participants that get populated into the testdb"""
    return list(
        Participants.objects.filter(id__in=ALL_PARTICIPANTS).values("id", "name")
    )


@pytest.fixture(scope="function")
def populate_participation() -> None:
    """Give our baseline participants the participation for RD1"""
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=pid,
                achievement_id=ids.PARTICIPATION,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=3,
            )
            for pid in ALL_PARTICIPANTS
        ]
    )


@pytest.fixture(scope="function")
def build_pods_participants(request, base_participants_list) -> None:
    """For a supplied round, create our pods objects + populate our
    bridge table with pairings."""
    round_id = request.param["round_id"]

    pods = Pods.objects.bulk_create(
        [
            Pods(rounds_id=round_id, submitted=False),
            Pods(rounds_id=round_id, submitted=False),
            Pods(rounds_id=round_id, submitted=False),
        ]
    )

    participants = base_participants_list

    participants = iter(base_participants_list)
    pods_participants = []
    for pod in pods:
        players = list(islice(participants, 4 if pod == pods[0] else 3))
        pods_participants.extend(
            PodsParticipants(pods_id=pod.id, participants_id=player["id"])
            for player in players
        )

    PodsParticipants.objects.bulk_create(pods_participants)


@pytest.fixture(scope="function")
def populate_other_achievements(request) -> None:
    """For a given round and session, give our base participants various achievements."""
    round_id = request.param["round_id"]
    session_id = request.param["session_id"]
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.NO_INSTANTS_SORCERIES,
                round_id=round_id,
                session_id=session_id,
                earned_points=5,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.ALL_BASICS,
                round_id=round_id,
                session_id=session_id,
                earned_points=8,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.KILL_TABLE,
                round_id=round_id,
                session_id=session_id,
                earned_points=6,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.NO_LANDS,
                round_id=round_id,
                session_id=session_id,
                earned_points=12,
            ),
            ParticipantAchievements(
                participant_id=ids.P6,
                achievement_id=ids.NO_CREATURES,
                round_id=round_id,
                session_id=session_id,
                earned_points=6,
            ),
            ParticipantAchievements(
                participant_id=ids.P6,
                achievement_id=ids.CMDR_DMG,
                round_id=round_id,
                session_id=session_id,
                earned_points=3,
            ),
            ParticipantAchievements(
                participant_id=ids.P8,
                achievement_id=ids.KNOCK_OUT,
                round_id=round_id,
                session_id=session_id,
                earned_points=2,
            ),
            ParticipantAchievements(
                participant_id=ids.P9,
                achievement_id=ids.SNACK,
                round_id=round_id,
                session_id=session_id,
                earned_points=3,
            ),
        ]
    )

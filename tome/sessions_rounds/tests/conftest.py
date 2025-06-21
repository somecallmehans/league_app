import pytest

from utils.test_helpers import get_ids
from users.models import ParticipantAchievements, Participants
from sessions_rounds.models import Pods, PodsParticipants

ids = get_ids()


@pytest.fixture(scope="function")
def base_participants_list() -> list:
    return list(
        Participants.objects.filter(
            id__in=[
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
        ).values("id", "name")
    )


@pytest.fixture(scope="function")
def populate_participation() -> None:
    participant_list = [
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
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=pid,
                achievement_id=ids.PARTICIPATION,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=3,
            )
            for pid in participant_list
        ]
    )


@pytest.fixture(scope="function")
def build_pods_participants(base_participants_list) -> None:
    pods = Pods.objects.bulk_create(
        [
            Pods(rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, submitted=False),
            Pods(rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, submitted=False),
            Pods(rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN, submitted=False),
        ]
    )
    pod_ids = [p.id for p in pods]

    participants = base_participants_list

    pods_participants = []
    for e, p in enumerate(pod_ids):
        if e == 0:
            players = participants[:4]
            pods_participants.extend(
                PodsParticipants(pods_id=p, participants_id=player["id"])
                for player in players
            )
            participants = participants[4:]
        else:
            players = participants[:3]
            pods_participants.extend(
                PodsParticipants(pods_id=p, participants_id=player["id"])
                for player in players
            )
            participants = participants[:3]
    PodsParticipants.objects.bulk_create(pods_participants)


@pytest.fixture(scope="function")
def populate_other_achievements() -> None:
    ParticipantAchievements.objects.bulk_create(
        [
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.NO_INSTANTS_SORCERIES,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=5,
            ),
            ParticipantAchievements(
                participant_id=ids.P1,
                achievement_id=ids.ALL_BASICS,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=8,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.KILL_TABLE,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=6,
            ),
            ParticipantAchievements(
                participant_id=ids.P3,
                achievement_id=ids.NO_LANDS,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=12,
            ),
            ParticipantAchievements(
                participant_id=ids.P6,
                achievement_id=ids.NO_CREATURES,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=6,
            ),
            ParticipantAchievements(
                participant_id=ids.P6,
                achievement_id=ids.CMDR_DMG,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=3,
            ),
            ParticipantAchievements(
                participant_id=ids.P8,
                achievement_id=ids.KNOCK_OUT,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=2,
            ),
            ParticipantAchievements(
                participant_id=ids.P9,
                achievement_id=ids.SNACK,
                round_id=ids.R1_SESSION_THIS_MONTH_OPEN,
                session_id=ids.SESSION_THIS_MONTH_OPEN,
                earned_points=3,
            ),
        ]
    )

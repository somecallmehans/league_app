import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from users.models import Participants, ParticipantAchievements
from sessions_rounds.models import Sessions
from achievements.models import Achievements

from users.serializers import ParticipantsSerializer
from sessions_rounds.serializers import SessionSerializer
from achievements.serializers import AchievementsSerializer


@pytest.mark.django_db(serialized_rollback=True)
def test_post_submit_achievements(
    create_base_participants, create_base_achievements, create_base_session_and_rounds
):
    """Submit achievements for a submitted pod."""

    client = APIClient()
    url = reverse("submit_achievements")

    participant_data = Participants.objects.all()
    session_data = Sessions.objects.all()
    achievement_data = Achievements.objects.all()

    participants = ParticipantsSerializer(participant_data, many=True)
    sessions = SessionSerializer(session_data, many=True)
    achievements = AchievementsSerializer(achievement_data, many=True)

    a_data = achievements.data

    payload = {
        "participants": [
            {
                "participant": participants.data[0]["id"],
                "achievements": [
                    a_data[0]["id"],
                    a_data[1]["id"],
                    a_data[2]["id"],
                ],
            },
            {
                "participant": participants.data[1]["id"],
                "achievements": [a_data[3]["id"]],
            },
            {
                "participant": participants.data[2]["id"],
                "achievements": [a_data[4]["id"]],
            },
            {"participant": participants.data[3]["id"], "achievements": []},
        ],
        "session": sessions.data[0]["id"],
        "round": sessions.data[0]["rounds"][0]["id"],
    }

    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    participant_achievement_data = ParticipantAchievements.objects.all()
    # Five achievements sent, five made
    assert len(participant_achievement_data) == 5


@pytest.mark.django_db(serialized_rollback=True)
def test_post_submit_achievements_no_session_or_round(
    create_base_participants, create_base_achievements
):
    """Request fails if we're missing a round or session"""

    client = APIClient()
    url = reverse("submit_achievements")

    participants = Participants.objects.all()
    achievements = Achievements.objects.all()

    payload = {
        "participants": [
            {
                "participant": participants[0].id,
                "achievements": [
                    achievements[0].id,
                    achievements[1].id,
                    achievements[2].id,
                ],
            },
            {
                "participant": participants[1].id,
                "achievements": [achievements[3].id],
            },
            {
                "participant": participants[2].id,
                "achievements": [achievements[4].id],
            },
            {"participant": participants[3].id, "achievements": []},
        ],
    }

    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

import pytest
from django.urls import reverse
from rest_framework import status

from sessions_rounds.models import Pods, PodsParticipants, RoundSignups, Rounds
from users.models import Aversions, ParticipantAchievements
from utils.test_helpers import get_ids

ids = get_ids()


def _seat(round_id, groups):
    pods = []
    for participant_ids in groups:
        pod = Pods.objects.create(
            rounds_id=round_id, store_id=ids.MIMICS_ID, submitted=False
        )
        PodsParticipants.objects.bulk_create(
            PodsParticipants(pods_id=pod.id, participants_id=pid)
            for pid in participant_ids
        )
        pods.append(pod)
    return pods


def _membership(client, round_id):
    res = client.get(reverse("pods", kwargs={"round": round_id}))
    assert res.status_code == status.HTTP_200_OK
    return {
        int(pod["id"]): sorted(p["participant_id"] for p in pod["participants"])
        for pod in res.data.values()
    }


@pytest.fixture
def nine_players(base_participants_list):
    return [p["id"] for p in base_participants_list[:9]]


def test_save_pod_editor_moves_players_between_open_pods(client, nine_players):
    """A legal save moves players and leaves Sign-in and Participation alone."""
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    RoundSignups.objects.bulk_create(
        RoundSignups(participant_id=pid, round_id=round_id, store_id=ids.MIMICS_ID)
        for pid in nine_players
    )
    ParticipantAchievements.objects.create(
        participant_id=nine_players[0],
        round_id=round_id,
        session_id=ids.SESSION_THIS_MONTH_OPEN,
        achievement_id=ids.PARTICIPATION,
        earned_points=3,
        store_id=ids.MIMICS_ID,
    )

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": nine_players[:5]},
                {"id": pod_b.id, "participant_ids": nine_players[5:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    assert _membership(client, round_id) == {
        pod_a.id: sorted(nine_players[:5]),
        pod_b.id: sorted(nine_players[5:]),
    }
    counts = client.get(reverse("signin_counts"), {"round_one": round_id})
    assert counts.status_code == status.HTTP_200_OK
    assert counts.data[str(round_id)]["count"] == 9
    assert (
        ParticipantAchievements.objects.filter(
            round_id=round_id,
            achievement_id=ids.PARTICIPATION,
            deleted=False,
            store_id=ids.MIMICS_ID,
        ).count()
        == 1
    )


def test_save_pod_editor_can_add_a_pod(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": nine_players[:3]},
                {"id": pod_b.id, "participant_ids": nine_players[3:6]},
                {"id": None, "participant_ids": nine_players[6:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    membership = _membership(client, round_id)
    assert sorted(membership.values()) == [
        sorted(nine_players[:3]),
        sorted(nine_players[3:6]),
        sorted(nine_players[6:]),
    ]
    assert pod_a.id in membership
    assert pod_b.id in membership


def test_save_pod_editor_rejects_illegal_size_without_writing(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    before = _membership(client, round_id)

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": nine_players[:2]},
                {"id": pod_b.id, "participant_ids": nine_players[2:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["problems"]
    assert _membership(client, round_id) == before


def test_save_pod_editor_rejects_a_player_in_two_pods(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    before = _membership(client, round_id)
    duplicated = nine_players[:4] + [nine_players[0]]

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": duplicated[:4]},
                {"id": pod_b.id, "participant_ids": nine_players[3:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert _membership(client, round_id) == before


def test_save_pod_editor_rejects_unassigned_additions(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    before = _membership(client, round_id)

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": nine_players[:4]},
                {"id": pod_b.id, "participant_ids": nine_players[4:]},
            ],
            "unassigned": [nine_players[0]],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert _membership(client, round_id) == before


def test_save_pod_editor_removes_a_leaver(client, base_participants_list):
    """Someone seated at open and omitted from the save leaves the round."""
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    players = [p["id"] for p in base_participants_list[:8]]
    pod_a, pod_b = _seat(round_id, [players[:4], players[4:]])

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": players[:3]},
                {"id": pod_b.id, "participant_ids": players[4:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    membership = _membership(client, round_id)
    seated = {pid for group in membership.values() for pid in group}
    assert players[3] not in seated
    assert len(seated) == 7


def test_save_pod_editor_rejects_changes_to_a_submitted_pod(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    Pods.objects.filter(id=pod_b.id).update(submitted=True)
    before = _membership(client, round_id)

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {"id": pod_a.id, "participant_ids": nine_players[:5]},
                {"id": pod_b.id, "participant_ids": nine_players[5:]},
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert _membership(client, round_id) == before


def test_save_pod_editor_refuses_a_round_that_has_not_started(client, nine_players):
    res = client.post(
        reverse(
            "save_pod_editor",
            kwargs={"round_id": ids.R2_SESSION_THIS_MONTH_OPEN},
        ),
        {
            "pods": [{"id": None, "participant_ids": nine_players[:4]}],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert _membership(client, ids.R2_SESSION_THIS_MONTH_OPEN) == {}


def test_deleting_an_open_pod_lets_the_round_complete(client, base_participants_list):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    players = [p["id"] for p in base_participants_list[:8]]
    pod_a, _pod_b = _seat(round_id, [players[:4], players[4:]])

    saved = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [{"id": pod_a.id, "participant_ids": players[:4]}],
            "unassigned": [],
        },
        format="json",
    )
    assert saved.status_code == status.HTTP_200_OK

    submitted = client.post(
        reverse("scoresheet", kwargs={"round_id": round_id, "pod_id": pod_a.id}),
        {
            "end-draw": True,
            "winner": None,
            "winner-commander": None,
            "winner-achievements": None,
        },
        format="json",
    )
    assert submitted.status_code == status.HTTP_201_CREATED
    assert Rounds.objects.get(id=round_id).completed is True


def test_save_pod_editor_allows_an_averse_pair(client, nine_players):
    round_id = ids.R1_SESSION_THIS_MONTH_OPEN
    pod_a, pod_b = _seat(round_id, [nine_players[:4], nine_players[4:]])
    low, high = sorted((nine_players[0], nine_players[4]))
    Aversions.objects.create(
        participant_low_id=low,
        participant_high_id=high,
        declared_by_id=nine_players[0],
    )

    res = client.post(
        reverse("save_pod_editor", kwargs={"round_id": round_id}),
        {
            "pods": [
                {
                    "id": pod_a.id,
                    "participant_ids": [nine_players[0], *nine_players[4:7]],
                },
                {
                    "id": pod_b.id,
                    "participant_ids": nine_players[1:4] + nine_players[7:],
                },
            ],
            "unassigned": [],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    membership = _membership(client, round_id)
    together = any(
        nine_players[0] in members and nine_players[4] in members
        for members in membership.values()
    )
    assert together is True

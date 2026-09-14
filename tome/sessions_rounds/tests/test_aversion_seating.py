from unittest import mock

from utils.test_helpers import get_ids
from users.models import Aversions
from sessions_rounds.aversion_seating import (
    count_violations,
    order_participants_for_round_one,
    partition_into_pods,
    repair_adjacent_pods,
)


ids = get_ids()


class _P:
    def __init__(self, pid):
        self.id = pid
        self.total_points = 0


def test_partition_mod_zero():
    pods = partition_into_pods([1, 2, 3, 4, 5, 6, 7, 8])
    assert pods == [[1, 2, 3, 4], [5, 6, 7, 8]]


def test_partition_mod_one():
    pods = partition_into_pods(list(range(1, 10)))
    assert pods[0] == [1, 2, 3, 4]
    assert pods[1] == [5, 6, 7, 8, 9]


def test_count_violations_detects_same_pod():
    ordered = [ids.P1, ids.P2, ids.P3, ids.P4, ids.P5, ids.P6, ids.P7, ids.P8]
    pairs = [(min(ids.P1, ids.P2), max(ids.P1, ids.P2))]
    assert count_violations(ordered, pairs) == 1
    pairs_ok = [(min(ids.P1, ids.P5), max(ids.P1, ids.P5))]
    assert count_violations(ordered, pairs_ok) == 0


def test_repair_separates_adjacent_possible_pair():
    # 8 players, two pods of 4. P1 and P2 start together; repair should move one.
    ordered = [ids.P1, ids.P2, ids.P3, ids.P4, ids.P5, ids.P6, ids.P7, ids.P8]
    pair = (min(ids.P1, ids.P2), max(ids.P1, ids.P2))
    repaired = repair_adjacent_pods(ordered, [pair])
    assert count_violations(repaired, [pair]) == 0


def test_unsatisfiable_aversion_logs_and_keeps_valid_pods(caplog, db):
    """Four players, one pod — aversion cannot be satisfied; seating still returns four."""
    import logging

    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )
    participants = [_P(pid) for pid in [ids.P1, ids.P2, ids.P3, ids.P4]]

    with caplog.at_level(logging.WARNING, logger="sessions_rounds.aversion_seating"):
        result = order_participants_for_round_one(
            participants,
            retries=2,
            rng=type("R", (), {"shuffle": lambda self, xs: None})(),
        )

    assert len(result) == 4
    assert any("Unsatisfied aversion" in r.message for r in caplog.records)


def test_order_participants_respects_aversion(db):
    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )
    participants = [
        _P(pid)
        for pid in [
            ids.P1,
            ids.P2,
            ids.P3,
            ids.P4,
            ids.P5,
            ids.P6,
            ids.P7,
            ids.P8,
        ]
    ]

    class BadThenGood:
        def shuffle(self, xs):
            # Keep input order (P1,P2 together); repair must fix it
            pass

    result = order_participants_for_round_one(
        participants, retries=3, rng=BadThenGood()
    )
    ordered_ids = [p.id for p in result]
    pair = (min(ids.P1, ids.P2), max(ids.P1, ids.P2))
    assert count_violations(ordered_ids, [pair]) == 0


def test_begin_round_one_honors_aversion(client, base_participants_list, db):
    from django.urls import reverse
    from rest_framework import status
    from sessions_rounds.models import PodsParticipants

    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )

    # Deterministic bad shuffle: leave list order so P1/P2 would share first pod without aversion logic
    with mock.patch("sessions_rounds.aversion_seating.random") as rng:
        rng.shuffle = lambda xs: None
        res = client.post(
            reverse("begin_round"),
            {
                "participants": base_participants_list[:8],
                "round": ids.R1_SESSION_THIS_MONTH_OPEN,
                "session": ids.SESSION_THIS_MONTH_OPEN,
            },
            format="json",
        )

    assert res.status_code == status.HTTP_201_CREATED

    rows = PodsParticipants.objects.filter(
        pods__rounds_id=ids.R1_SESSION_THIS_MONTH_OPEN
    ).values_list("pods_id", "participants_id")
    by_pod = {}
    for pod_id, pid in rows:
        by_pod.setdefault(pod_id, set()).add(pid)

    together = any(
        ids.P1 in members and ids.P2 in members for members in by_pod.values()
    )
    assert together is False


def test_begin_round_two_ignores_aversions(
    client, base_participants_list, populate_participation, db
):
    from django.urls import reverse
    from rest_framework import status

    Aversions.objects.create(
        participant_low_id=min(ids.P1, ids.P2),
        participant_high_id=max(ids.P1, ids.P2),
        declared_by_id=ids.P1,
    )

    with mock.patch(
        "sessions_rounds.views.order_participants_for_round_one"
    ) as order_fn:
        res = client.post(
            reverse("begin_round"),
            {
                "participants": base_participants_list[:8],
                "round": ids.R2_SESSION_THIS_MONTH_OPEN,
                "session": ids.SESSION_THIS_MONTH_OPEN,
            },
            format="json",
        )

    assert res.status_code == status.HTTP_201_CREATED
    order_fn.assert_not_called()

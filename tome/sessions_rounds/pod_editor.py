from collections import Counter

from django.db import transaction

from sessions_rounds.models import Pods, PodsParticipants, Rounds

MIN_POD_SIZE = 3
MAX_POD_SIZE = 5


def save_pod_editor(round_id, store_id, pods_payload, unassigned):
    """Replace a round's Open pod seating in one step.

    Returns a list of problems. An empty list means the seating was saved.
    """
    problems = []
    if unassigned:
        problems.append("A player still needs a pod.")

    round_exists = Rounds.objects.filter(
        id=round_id, session__store_id=store_id, deleted=False
    ).exists()
    if not round_exists:
        return ["Round not found."]

    with transaction.atomic():
        existing = list(
            Pods.objects.select_for_update().filter(
                rounds_id=round_id, store_id=store_id, deleted=False
            )
        )
        if not existing:
            return ["This round has not started."]

        existing_by_id = {pod.id: pod for pod in existing}
        members = {pod.id: set() for pod in existing}
        for row in PodsParticipants.objects.filter(pods_id__in=existing_by_id):
            members[row.pods_id].add(row.participants_id)

        normalized = []
        seen = []
        for index, pod in enumerate(pods_payload or []):
            participant_ids = list(pod.get("participant_ids") or [])
            unique_ids = list(dict.fromkeys(participant_ids))
            label = index + 1
            if len(unique_ids) != len(participant_ids):
                problems.append(f"Pod {label} lists a player more than once.")
            if not MIN_POD_SIZE <= len(unique_ids) <= MAX_POD_SIZE:
                problems.append(f"Pod {label} must have 3, 4, or 5 players.")
            seen.extend(participant_ids)
            normalized.append((pod.get("id"), unique_ids))

        if any(count > 1 for count in Counter(seen).values()):
            problems.append("A player is in more than one pod.")

        payload_ids = set()
        for pod_id, participant_ids in normalized:
            if pod_id is None:
                continue
            pod = existing_by_id.get(pod_id)
            if pod is None:
                problems.append("A pod in this edit is not part of the round.")
                continue
            payload_ids.add(pod_id)
            if pod.submitted and set(participant_ids) != members.get(pod_id, set()):
                problems.append("A submitted pod's players cannot change.")

        for pod in existing:
            if pod.submitted and pod.id not in payload_ids:
                problems.append("A submitted pod's players cannot change.")

        if problems:
            return problems

        for pod in existing:
            if pod.submitted or pod.id in payload_ids:
                continue
            PodsParticipants.objects.filter(pods_id=pod.id).delete()
            pod.deleted = True
            pod.save(update_fields=["deleted"])

        for pod_id, participant_ids in normalized:
            if pod_id is None:
                pod = Pods.objects.create(
                    rounds_id=round_id, store_id=store_id, submitted=False
                )
            else:
                pod = existing_by_id[pod_id]
                if pod.submitted:
                    continue
                PodsParticipants.objects.filter(pods_id=pod.id).delete()
            PodsParticipants.objects.bulk_create(
                PodsParticipants(pods_id=pod.id, participants_id=pid)
                for pid in participant_ids
            )

    return []

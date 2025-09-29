import random
from datetime import datetime, date

from .serializers import PodsParticipantsSerializer
from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
from achievements.models import Achievements
from sessions_rounds.models import Pods, PodsParticipants, Rounds, Sessions

from users.helpers import generate_code


PARTICIPATION_ACHIEVEMENT = "participation"


def make_bridge_records(ids: list, pods: list):
    """
    Generate bridge records for PodsParticipants based on number of players.

    X mod 4 = Y, based on val we can sort pods accordingly
    8 mod 4 = 0, all 4 pods
    9 mod 4 = 1, which means all 4 pods and 1 5 pod
    10 mod 4 = 2, which means all 4 pods and 2 3 pods
    11 mod 4 = 3, which means all 4 pods and 1 3 pod
    etc etc
    """
    pod_mod = len(ids) % 4
    records = []

    if pod_mod == 1:
        ids_for_last = ids[-5:]
        ids = ids[:-5]
        last_pod = pods.pop()
        records.extend(
            [PodsParticipants(pods=last_pod, participants_id=p) for p in ids_for_last]
        )
    elif pod_mod == 2:
        for pod in reversed(pods[-2:]):
            group = ids[-3:]
            ids = ids[:-3]
            records.extend(
                [PodsParticipants(pods=pod, participants_id=p) for p in group]
            )
    elif pod_mod == 3:
        ids_for_last = ids[-3:]
        ids = ids[:-3]
        last_pod = pods.pop()
        records.extend(
            [PodsParticipants(pods=last_pod, participants_id=p) for p in ids_for_last]
        )

    for pod in pods:
        group = ids[:4]
        ids = ids[4:]
        records.extend([PodsParticipants(pods=pod, participants_id=p) for p in group])

    return records


def generate_pods(participants, round_id):
    """
    Generate pods with the following rules:
    - Prefer pods of 4
    - Only use pods of 3 or 5 at the end
    - Never create more than two pods of 3
    - No leftover participants
    """
    try:
        length = len(participants)

        pod_mod = length % 4
        ids = [p.id for p in participants]

        if pod_mod == 1:
            pods_needed = ((length - 5) // 4) + 1
        elif pod_mod == 2:
            pods_needed = ((length - 6) // 4) + 2
        elif pod_mod == 3:
            pods_needed = ((length - 3) // 4) + 1
        else:
            pods_needed = length // 4

        new_pods = Pods.objects.bulk_create(
            [Pods(rounds_id=round_id) for _ in range(pods_needed)]
        )

        records = make_bridge_records(ids, new_pods)

        return PodsParticipants.objects.bulk_create(records)
    except Exception as e:
        print(f"Exception in pod generation: {e}")
        raise Exception


def get_participants_total_scores(mm_yy):
    data = Participants.objects.filter(deleted=False)
    participants = ParticipantsSerializer(
        data, many=True, context={"mm_yy": mm_yy}
    ).data
    participants_with_points = [p for p in participants if p["total_points"] != 0]
    return participants_with_points.sort(key=lambda x: x["total_points"], reverse=True)


def handle_close_round(round_id):
    """
    If all pods in the round are submitted, mark the round as completed.
    If it's Round 2, also close the session.
    """
    round = Rounds.objects.filter(id=round_id).first()

    if not Pods.objects.filter(rounds=round, submitted=False).exists():
        round.completed = True
        round.save()

        if round.round_number == 2:
            session = Sessions.objects.filter(id=round.session_id).first()
            session.closed = True
            session.save()


class RoundInformationService:
    def __init__(self, participants, session_id, round_id):
        self.participants = participants
        self.session_id = session_id
        self.round_id = round_id
        self.participation_achievement = Achievements.objects.get(
            slug=PARTICIPATION_ACHIEVEMENT, deleted=False
        )
        self.participant_data = []
        self.existing_participants = []
        self.new_participants = []

    def categorize_participants(self):
        """Split up incoming participants into ones that exist and ones that don't"""
        try:
            self.existing_participants = [
                p for p in self.participants if p.get("id") is not None
            ]
            self.new_participants = [
                p for p in self.participants if p.get("id") is None and "name" in p
            ]
        except Exception as e:
            print(f"Error found while categorizing participants: {e}")

    def create_new_participants(self):
        """Take all of the new participants and make them into existing participants"""
        try:
            new = Participants.objects.bulk_create(
                Participants(name=p["name"], code=generate_code())
                for p in self.new_participants
            )
            self.existing_participants.extend(
                ParticipantsSerializer(new, many=True).data
            )
        except Exception as e:
            print(f"Error found in create new participants: {e}")

    def get_participants(self):
        """Get un-serialized Participants objects."""
        try:
            self.participant_data = Participants.objects.filter(
                id__in=[ep["id"] for ep in self.existing_participants]
            )
        except Exception as e:
            print(f"Error found while fetching participant data in round service: {e}")

    def create_participation_achievements(self):
        """If someone hasn't gotten the participation achievement, they get one."""
        try:
            ParticipantAchievements.objects.bulk_create(
                ParticipantAchievements(
                    participant_id=ep["id"],
                    round_id=self.round_id,
                    session_id=self.session_id,
                    achievement_id=self.participation_achievement.id,
                    earned_points=self.participation_achievement.points,
                )
                for ep in self.existing_participants
            )
        except Exception as e:
            print(f"Error found while creating participant achievements: {e}")

    def build_participants_and_achievements(self):
        """Full process to get our stuff."""

        self.categorize_participants()
        self.create_new_participants()
        self.get_participants()
        self.create_participation_achievements()

        return self.participant_data


class PodRerollService:
    def __init__(self, participants, round, pods):
        self.participants = participants
        self.round = round
        self.pods = pods
        self.existing = []
        self.new = []
        self.needs_points = []

    def categorize_participants(self):
        """Break up incoming participants into who doesn't exist,
        who needs points for the round, and who is neither of those"""
        self.needs_points = [
            p
            for p in self.participants
            if p.get("isNew") is True and p.get("id") is not None
        ]
        self.existing = [p for p in self.participants if p.get("id") is not None]
        self.new = [p for p in self.participants if p.get("id") is None and "name" in p]

        # if we're missing players who were in the original pod
        # we need to remove their points
        participant_ids = Participants.objects.filter(
            podsparticipants__pods__rounds_id=self.round.id,
            podsparticipants__pods__deleted=False,
        ).values_list("id", flat=True)
        if len(participant_ids) > len(self.existing):
            participant_diff = set(participant_ids) ^ set(
                [p["id"] for p in self.existing]
            )
            ParticipantAchievements.objects.filter(
                participant_id__in=participant_diff, round_id=self.round.id
            ).update(deleted=True)

    def create_new_participants(self):
        """Make the new people and then add them to the points needing people"""
        new_participants = Participants.objects.bulk_create(
            [Participants(name=p["name"], code=generate_code()) for p in self.new]
        )
        self.needs_points.extend(
            ParticipantsSerializer(new_participants, many=True).data
        )

    def distribute_participation(self):
        """Give everyone points then add them to the existing people"""
        ParticipantAchievements.objects.bulk_create(
            [
                ParticipantAchievements(
                    participant_id=pa["id"],
                    round_id=self.round.id,
                    session_id=self.round.session_id,
                    achievement_id=24,
                    earned_points=3,
                )
                for pa in self.needs_points
            ]
        )
        self.existing.extend(self.needs_points)

    def get_full_participant_objects(self):
        objs = Participants.objects.filter(id__in=[e["id"] for e in self.existing])
        self.existing = ParticipantsSerializer(objs, many=True).data

    def shuffle_or_sort_pods(self):
        if self.round.round_number == 1:
            random.shuffle(self.existing)
        else:
            self.existing.sort(key=lambda x: x["total_points"], reverse=True)

    def build_new_pods(self):
        # Delete our old bridge rows
        PodsParticipants.objects.filter(pods_id__in=[p.id for p in self.pods]).delete()
        ids = [p["id"] for p in self.existing]

        # Generate the new ones

        create = make_bridge_records(ids, list(self.pods))

        return PodsParticipants.objects.bulk_create(create)

    def build(self):
        if len(self.participants) < 3:
            raise Exception("Need at least 3 players")

        self.categorize_participants()

        if self.new:
            self.create_new_participants()

        if self.needs_points:
            self.distribute_participation()

        self.get_full_participant_objects()

        length = len(self.existing)

        mod = length % 4
        full_pods = length // 4
        required_pods = full_pods + (1 if mod else 0)

        current_pods = len(self.pods)

        if required_pods > current_pods:
            self.pods = list(self.pods) + list(
                Pods.objects.bulk_create(
                    [
                        Pods(rounds_id=self.round.id)
                        for _ in range(required_pods - current_pods)
                    ]
                )
            )

        self.shuffle_or_sort_pods()
        new_pods = self.build_new_pods()
        return PodsParticipantsSerializer(new_pods, many=True).data


def to_aware_datetime(val):
    if isinstance(val, str):
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        return dt

    if isinstance(val, datetime):
        return val

    if isinstance(val, date):
        from django.utils import timezone

        tz = timezone.get_current_timezone()
        naive = datetime.combine(val, datetime.min.time())
        return timezone.make_aware(naive, tz)

    raise TypeError(f"Unsupported type: {type(val)!r}")

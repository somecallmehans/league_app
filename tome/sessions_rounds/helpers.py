import math
import random

from .serializers import PodsParticipantsSerializer
from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
from achievements.models import Achievements
from sessions_rounds.models import Pods, PodsParticipants

PARTICIPATION_ACHIEVEMENT = "participation"


def generate_pods(participants, round_id):
    """Generate pods of 4 or 3"""
    try:
        length = len(participants)
        if length in {1, 2, 5}:
            return [participants]

        participant_groups = []
        mutate_ids = participants
        while length > 0:
            if length % 4 == 0 or length == 7 or (length - 4) >= 6:
                participant_groups.append(mutate_ids[:4])
                mutate_ids = mutate_ids[4:]
                length -= 4
            else:
                participant_groups.append(mutate_ids[:3])
                mutate_ids = mutate_ids[3:]
                length -= 3

        bridge_records = []
        new_pods = Pods.objects.bulk_create(
            [Pods(rounds_id=round_id) for _ in participant_groups]
        )
    except Exception as e:
        print(f"Exception found in pod generator {e}")

    try:
        for pg, p in zip(participant_groups, new_pods):
            bridge_records.extend(
                [PodsParticipants(pods=p, participants=x) for x in pg]
            )

        return PodsParticipants.objects.bulk_create(bridge_records)
    except Exception as e:
        print(f"Exception in pod generator creating bridge records: {e}")


def get_participants_total_scores(mm_yy):
    participants_data = Participants.objects.filter(deleted=False)
    serialized = ParticipantsSerializer(
        participants_data, many=True, context={"mm_yy": mm_yy}
    )
    participants = [p for p in serialized.data if p["total_points"] != 0]
    participants.sort(key=lambda x: x["total_points"], reverse=True)
    return participants


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
                Participants(name=p["name"]) for p in self.new_participants
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
            [Participants(name=p["name"]) for p in self.new]
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
        PodsParticipants.objects.filter(pods_id__in=[p.id for p in self.pods]).delete()
        ids = [p["id"] for p in self.existing]
        create = []
        pods = list(self.pods)
        while len(ids) > 0:
            current_pod = pods.pop(0)
            if len(ids) % 4 == 0 or len(ids) == 7 or (len(ids) - 4) >= 6:
                block = ids[:4]
                ids = ids[4:]
            else:
                block = ids[:3]
                ids = ids[3:]

            create.extend(
                PodsParticipants(pods_id=current_pod.id, participants_id=i)
                for i in block
            )

        return PodsParticipants.objects.bulk_create(create)

    def build(self):
        self.categorize_participants()

        if self.new:
            self.create_new_participants()

        if self.needs_points:
            self.distribute_participation()

        self.get_full_participant_objects()

        num_participants = len(self.existing)
        # pods max out at 4 participants, so if the ceil of our
        # current pods / 4 is more than our current pod number
        # then we need to make some more
        required_pods = math.ceil(num_participants / 4)
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

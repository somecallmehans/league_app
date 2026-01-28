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

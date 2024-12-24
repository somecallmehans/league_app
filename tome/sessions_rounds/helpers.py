from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
from achievements.models import Achievements
from sessions_rounds.models import Pods, PodsParticipants

PARTICIPATION_ACHIEVEMENT = "participation"


def generate_pods(participants, round):
    """Generate pods of 4 or 3"""
    length = len(participants)
    if length in {1, 2, 5}:
        return [participants]

    pods = []
    mutate_ids = participants
    while length > 0:
        if length % 4 == 0 or length == 7 or (length - 4) >= 6:
            pods.append(mutate_ids[:4])
            mutate_ids = mutate_ids[4:]
            length -= 4
        else:
            pods.append(mutate_ids[:3])
            mutate_ids = mutate_ids[3:]
            length -= 3

    pods_to_return = []
    for pod in pods:
        new_pod = Pods.objects.create(rounds=round)
        pods_to_return.append(
            [PodsParticipants.objects.create(pods=new_pod, participants=x) for x in pod]
        )

    return pods_to_return


def get_participants_total_scores(mm_yy):
    participants_data = Participants.objects.filter(deleted=False)
    serialized = ParticipantsSerializer(
        participants_data, many=True, context={"mm_yy": mm_yy}
    )
    participants = [p for p in serialized.data if p["total_points"] != 0]
    participants.sort(key=lambda x: x["total_points"], reverse=True)
    return participants


class RoundInformationService:
    def __init__(self, participants, session, round):
        self.participants = participants
        self.session = session
        self.round = round
        self.participation_achievement = Achievements.objects.get(
            slug=PARTICIPATION_ACHIEVEMENT
        )
        self.all_participants = []
        self.participant_data = []
        self.existing_participants = []
        self.new_participants = []
        self.participant_lookup = {}
        self.earned_participation_set = {}

    def categorize_participants(self):
        """Split up incoming participants into ones that exist and ones that don't"""
        self.existing_participants = [
            p for p in self.participants if p.get("id") is not None
        ]
        self.new_participants = [
            p for p in self.participants if p.get("id") is None and "name" in p
        ]

    def create_new_participants(self):
        """Take all of the new participants and make them into existing participants"""
        for p in self.new_participants:
            p_data = Participants.objects.create(name=p["name"])
            new_participant = ParticipantsSerializer(p_data)
            self.existing_participants.append(
                {"id": new_participant.data["id"], "name": new_participant.data["name"]}
            )

    def get_participants(self):
        """Get un-serialized Participants objects."""
        self.participant_data = Participants.objects.filter(
            id__in=[ep["id"] for ep in self.existing_participants]
        )

    def get_participants_serialized(self):
        """Serialize participants object."""
        all_serialized_participants = ParticipantsSerializer(
            self.participant_data, many=True
        )

        self.all_participants = all_serialized_participants.data

    def create_participants_lookup(self):
        """Create a lookup of the participants information."""
        self.participant_lookup = {p.id: p for p in self.participant_data}

    def create_participation_achievements(self):
        """If someone hasn't gotten the participation achievement, they get one."""
        new_achievements = []
        for ep in self.existing_participants:
            new_achievements.append(
                ParticipantAchievements(
                    participant=self.participant_lookup[ep["id"]],
                    round=self.round,
                    session=self.session,
                    achievement=self.participation_achievement,
                    earned_points=self.participation_achievement.points,
                )
            )
        if len(new_achievements):
            ParticipantAchievements.objects.bulk_create(new_achievements)

    def build_participants_and_achievements(self):
        """Full process to get our stuff."""

        self.categorize_participants()

        self.create_new_participants()
        self.get_participants()

        self.create_participants_lookup()

        self.create_participation_achievements()

        return self.participant_data

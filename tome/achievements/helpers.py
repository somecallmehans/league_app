from collections import defaultdict

from achievements.models import Achievements, WinningCommanders, Colors
from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
from achievements.serializers import AchievementsSerializer
from sessions_rounds.models import Sessions, Rounds, Pods
from users.serializers import ParticipantsSerializer
from sessions_rounds.serializers import RoundsSerializer


class AchievementCleaverService:
    def __init__(self, participants, session, round, pod_id, winner_info):
        self.participants = participants
        self.session = Sessions.objects.get(id=session)
        self.round = Rounds.objects.get(id=round)
        self.achievements_lookup = {}
        self.participants_lookup = {}
        self.winner_info = {
            "commander": winner_info["commander_name"],
            "color": Colors.objects.get(id=winner_info["color_id"]),
            "winner": Participants.objects.get(id=winner_info["winner_id"]),
            "pod": Pods.objects.get(id=pod_id),
        }

    def create_achievements_lookup(self):
        """Get all the achievements, make a lookup."""
        achievement_data = Achievements.objects.all()
        self.achievements_lookup = {a.id: a for a in achievement_data}

    def create_participants_lookup(self):
        """Get the participant data and make a lookup."""
        participant_data = Participants.objects.filter(
            id__in=[p["id"] for p in self.participants]
        )
        self.participants_lookup = {p.id: p for p in participant_data}

    def build_lookups(self):
        """Build some lookups."""
        self.create_achievements_lookup()
        self.create_participants_lookup()

    def build_service(self):
        """Full process of logging achievements."""
        self.build_lookups()

        for item in self.participants:
            for achievement in item["achievements"]:
                ParticipantAchievements.objects.create(
                    participant=self.participants_lookup[item["id"]],
                    achievement=self.achievements_lookup[achievement],
                    session=self.session,
                    round=self.round,
                )
        WinningCommanders.objects.create(
            name=self.winner_info["commander"],
            colors=self.winner_info["color"],
            participants=self.winner_info["winner"],
            pods=self.winner_info["pod"],
        )


def make_achievement_map(achievements):
    achievement_map = {}
    for achievement in achievements:
        if achievement["parent"] is None:
            achievement_with_children = {
                **achievement,
                "children": [],
            }
            point_value = achievement["point_value"]
            if point_value not in achievement_map:
                achievement_map[point_value] = []

            achievement_map[point_value].append(achievement_with_children)
        else:
            parent_achievement = achievement["parent"]

            parent_point_value = parent_achievement["point_value"]
            for parent in achievement_map.get(parent_point_value, []):
                if parent["id"] == parent_achievement["id"]:
                    parent["children"].append(achievement)

    return achievement_map


def all_participant_achievements_for_month(session_id):
    data = ParticipantAchievements.objects.filter(
        session=session_id, deleted=False
    ).select_related("participant", "achievement", "round")

    achievements_by_participant = defaultdict(list)
    for pa in data:
        achievements_by_participant[pa.participant].append(
            {"achievement": pa.achievement, "round": pa.round, "earned_id": pa.id}
        )

    result = []
    for participant, achievements in achievements_by_participant.items():
        participant_data = ParticipantsSerializer(participant).data
        achievements_data = [
            {
                **AchievementsSerializer(achievement["achievement"]).data,
                "round": RoundsSerializer(achievement["round"]).data,
                "earned_id": achievement["earned_id"],
            }
            for achievement in achievements
        ]
        participant_data["achievements"] = achievements_data
        result.append(participant_data)

    return result

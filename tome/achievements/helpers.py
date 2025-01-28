from collections import defaultdict

from achievements.models import Achievements, WinningCommanders, Colors
from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
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
        self.winner_info = (
            {
                "commander": winner_info["commander_name"],
                "color": Colors.objects.get(id=winner_info["color_id"]),
                "winner": Participants.objects.get(id=winner_info["winner_id"]),
                "pod": Pods.objects.get(id=pod_id),
            }
            if winner_info is not None
            else None
        )
        self.achievement_slug_lookup = {}

    def create_achievements_lookup(self):
        """Get all the achievements, make a lookup."""
        achievement_data = Achievements.objects.all()
        self.achievement_slug_lookup = {
            a.slug: a for a in achievement_data if a.slug is not None
        }
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
            for slug in item["slugs"]:
                ParticipantAchievements.objects.create(
                    participant=self.participants_lookup[item["id"]],
                    achievement=self.achievement_slug_lookup[slug],
                    session=self.session,
                    round=self.round,
                    earned_points=self.achievement_slug_lookup[slug].points,
                )
            for achievement in item["achievements"]:
                ParticipantAchievements.objects.create(
                    participant=self.participants_lookup[item["id"]],
                    achievement=self.achievements_lookup[achievement],
                    session=self.session,
                    round=self.round,
                    earned_points=self.achievements_lookup[achievement].points,
                )

        if self.winner_info:
            WinningCommanders.objects.create(
                name=self.winner_info["commander"],
                colors=self.winner_info["color"],
                participants=self.winner_info["winner"],
                pods=self.winner_info["pod"],
            )


def group_parents_by_point_value(parent_dict):
    grouped_by_points = defaultdict(list)

    for achievement_id, achievement in parent_dict.items():
        point_value = achievement["point_value"]
        grouped_by_points[point_value].append(achievement)

    return dict(grouped_by_points)


def all_participant_achievements_for_month(session_id):
    session = Sessions.objects.get(id=session_id)
    data = ParticipantAchievements.objects.filter(
        session=session_id, participant__deleted=False, deleted=False
    ).select_related("participant", "achievement", "round")

    achievements_by_participant = defaultdict(list)
    for pa in data:
        achievements_by_participant[pa.participant].append(
            {
                "name": pa.achievement.full_name,
                "round": pa.round,
                "earned_id": pa.id,
                "earned_points": pa.earned_points,
            }
        )

    result = []

    for participant, achievements in achievements_by_participant.items():
        participant_data = ParticipantsSerializer(
            participant, context={"mm_yy": session.month_year}
        ).data

        point_sum = sum([x["earned_points"] for x in achievements])

        achievements_data = [
            {
                "name": achievement["name"],
                "round": RoundsSerializer(achievement["round"]).data,
                "earned_id": achievement["earned_id"],
                "earned_points": achievement["earned_points"],
            }
            for achievement in achievements
        ]
        participant_data["achievements"] = achievements_data
        participant_data["session_points"] = point_sum
        result.append(participant_data)

    return result

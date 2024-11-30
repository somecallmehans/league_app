from django.db.models import Q

from achievements.models import WinningCommanders
from users.models import ParticipantAchievements
from achievements.serializers import WinningCommandersSerializer
from users.serializers import ParticipantsAchievementsFullModelSerializer


class MetricsCalculator:
    def __init__(self):
        self.all_winners = []
        self.color_pie = {}
        self.big_winners = []
        self.most_earned = []

    def build_color_pie(self):
        for winner in self.all_winners:
            slug = winner["colors"]["slug"]
            if self.color_pie.get(slug, None) is None:
                self.color_pie[slug] = 0
            self.color_pie[slug] += 1

    def build_big_winner(self):
        winner_map = {}
        for winner in self.all_winners:
            participant = winner["participants"]["name"]
            if winner_map.get(participant, None) is None:
                winner_map[participant] = 0
            winner_map[participant] += 1
        max_wins = max(winner_map.values())
        big_winners = [
            participant for participant, wins in winner_map.items() if wins == max_wins
        ]

        self.big_winners = big_winners

    def build_most_earned(self):
        earned = ParticipantAchievements.objects.filter(
            achievement__slug__isnull=True, deleted=False
        )

        all_earned = ParticipantsAchievementsFullModelSerializer(earned, many=True).data
        achievement_map = {}

        for earned in all_earned:
            achievement = earned["achievement"]
            if achievement_map.get(achievement["id"], None) is None:
                achievement_map[achievement["id"]] = {
                    "name": achievement["name"],
                    "count": 0,
                }
            achievement_map[achievement["id"]]["count"] += 1

        max_earned = max(am["count"] for am in achievement_map.values())

        self.most_earned = [
            ea for _, ea in achievement_map.items() if ea["count"] == max_earned
        ]

    def build_metrics(self):
        winners = WinningCommanders.objects.filter(deleted=False)
        self.all_winners = WinningCommandersSerializer(winners, many=True).data

        self.build_color_pie()
        self.build_big_winner()
        self.build_most_earned()

        return {
            "color_pie": self.color_pie,
            "big_winners": self.big_winners,
            "most_earned": self.most_earned,
        }

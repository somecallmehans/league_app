from datetime import datetime

from django.db.models import Sum, F
from django.db.models.functions import Coalesce

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
        self.big_earner = {}
        self.since_last_draw = {}

    def build_color_pie(self):
        for winner in self.all_winners:
            symbol = winner["colors"]["symbol"]
            if self.color_pie.get(symbol, None) is None:
                self.color_pie[symbol] = 0
            self.color_pie[symbol] += 1

    def build_big_winner(self):
        winner_map = {}
        for winner in self.all_winners:
            participant = winner["participants"]["name"]
            if winner_map.get(participant, None) is None:
                winner_map[participant] = 0
            winner_map[participant] += 1
        max_wins = max(winner_map.values())
        big_winners = [
            {"name": participant, "wins": wins}
            for participant, wins in winner_map.items()
            if wins == max_wins
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

    def build_big_earner(self):
        participants_with_points = (
            ParticipantAchievements.objects.filter(deleted=False)
            .annotate(
                effective_points=Coalesce(
                    F("achievement__point_value"), F("achievement__parent__point_value")
                )
            )
            .values("participant_id", "participant__name")
            .annotate(total_points=Sum("effective_points"))
            .order_by("participant_id")
        )
        self.big_earner = max(participants_with_points, key=lambda x: x["total_points"])

    def days_since_last_draw(self):
        today = datetime.today()
        last_draw = (
            ParticipantAchievements.objects.filter(
                achievement__slug="end-draw", deleted=False
            )
            .select_related("achievement", "session")
            .order_by("-session__created_at")
            .values("session__created_at")
            .first()
        )

        delta = today - last_draw["session__created_at"]
        self.since_last_draw = {"days": delta.days}

    def build_metrics(self):
        winners = WinningCommanders.objects.filter(deleted=False).select_related(
            "colors"
        )
        self.all_winners = WinningCommandersSerializer(winners, many=True).data

        self.build_color_pie()
        self.build_big_winner()
        self.build_most_earned()
        self.build_big_earner()
        self.days_since_last_draw()

        return {
            "color_pie": self.color_pie,
            "big_winners": self.big_winners,
            "most_earned": self.most_earned,
            "big_earner": self.big_earner,
            "last_draw": self.since_last_draw,
        }

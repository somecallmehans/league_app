from datetime import datetime

from django.db.models import Sum, Q

from achievements.models import WinningCommanders
from sessions_rounds.models import PodsParticipants
from users.models import ParticipantAchievements, Participants
from achievements.serializers import WinningCommandersSerializer
from users.serializers import ParticipantsAchievementsFullModelSerializer


class MetricsCalculator:
    def __init__(self):
        self.all_winners = []
        self.color_pie = {}
        self.achievement_chart = {}
        self.big_winners = []
        self.most_earned = []
        self.all_earned = []
        self.big_earner = {}
        self.since_last_draw = {}

    def build_color_pie(self):
        try:
            for winner in self.all_winners:
                symbol = winner["colors"]["symbol"]
                if self.color_pie.get(symbol, None) is None:
                    self.color_pie[symbol] = 0
                self.color_pie[symbol] += 1
        except (KeyError, TypeError) as e:
            print(f"Error building color pie: {e}")

    def build_achievement_chart(self):
        try:
            for earned in self.all_earned:
                name = earned["achievement"]["full_name"]
                id = earned["achievement"]["id"]
                point_value = earned["achievement"]["points"]
                if self.achievement_chart.get(id, None) is None:
                    self.achievement_chart[id] = {}
                    self.achievement_chart[id]["point_value"] = point_value
                    self.achievement_chart[id]["name"] = name
                    self.achievement_chart[id]["count"] = 0
                self.achievement_chart[id]["count"] += 1
        except (KeyError, TypeError) as e:
            print(f"Error building achievement chart: {e}")

    def build_big_winner(self):
        try:
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
        except Exception as e:
            print(f"Error building big winner: {e}")

    def build_most_earned(self):
        achievement_map = {}
        try:
            for earned in self.all_earned:
                achievement = earned["achievement"]
                if achievement.get("slug", None) == "precon":
                    continue

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

        except Exception as e:
            print(f"Error building most earned: {e}")

    def build_big_earner(self):
        try:
            participants_with_points = (
                ParticipantAchievements.objects.filter(deleted=False)
                .values("participant_id", "participant__name")
                .annotate(total_points=Sum("earned_points"))
                .order_by("participant_id")
            )
            self.big_earner = max(
                participants_with_points, key=lambda x: x["total_points"]
            )
        except Exception as e:
            print(f"Error building biggest earner: {e}")

    def days_since_last_draw(self):
        today = datetime.today()
        try:
            last_draw = (
                ParticipantAchievements.objects.filter(
                    achievement__slug="end-draw", deleted=False
                )
                .select_related("achievement", "round")
                .order_by("-round__created_at")
                .values("round__created_at")
                .first()
            )
            delta = today - last_draw["round__created_at"]
            self.since_last_draw = {"days": delta.days}
        except Exception as e:
            print(f"Error building since last draw: {e}")

    def build_metrics(self):
        try:
            winners = WinningCommanders.objects.filter(deleted=False).select_related(
                "colors"
            )
            earned = ParticipantAchievements.objects.filter(
                Q(achievement__slug__isnull=True) | Q(achievement__slug="precon"),
                deleted=False,
            )
            self.all_winners = WinningCommandersSerializer(winners, many=True).data
            self.all_earned = ParticipantsAchievementsFullModelSerializer(
                earned, many=True
            ).data

        except Exception as e:
            print(f"Error fetching data to build metrics: {e}")

        self.build_color_pie()
        self.build_big_winner()
        self.build_most_earned()
        self.build_big_earner()
        self.days_since_last_draw()
        self.build_achievement_chart()

        return {
            "color_pie": self.color_pie,
            "big_winners": self.big_winners,
            "most_earned": self.most_earned,
            "big_earner": self.big_earner,
            "last_draw": self.since_last_draw,
            "achievement_chart": self.achievement_chart,
        }


class IndividualMetricsCalculator:
    def __init__(self, participant_id):
        self.participant_id = participant_id
        self.participant_achievements = []
        self.participant_pods = []
        self.participant_obj = None

    def fetch_participant_achievements(self):
        """Get all of the participant achievements for a given participant."""
        try:
            self.participant_achievements = (
                ParticipantAchievements.objects.filter(
                    participant_id=self.participant_id, deleted=False
                )
                .select_related("achievement")
                .values("achievement_id", "earned_points", "achievement__slug")
            )
        except BaseException as e:
            print(
                f"Exception raised in individual metrics calculator fetch achievements: {e}"
            )

    def fetch_participant_attendance(self):
        """Get all of the records from pods that a participant has appeared in.

        This will act as our 'attendance' record."""
        try:
            self.participant_pods = PodsParticipants.objects.filter(
                participants_id=self.participant_id, pods__deleted=False
            ).select_related("pods")
        except BaseException as e:
            print(f"Exception raised in individual metrics calculator attendance: {e}")

    def fetch_participant_obj(self):
        """Get the participant object."""
        try:
            self.participant_obj = Participants.objects.get(id=self.participant_id)
        except BaseException as e:
            print(
                f"Exception raised in individual metrics calculator fetch participant: {e}"
            )

    def calculate_win_number(self):
        """Calculate the number of wins a participant has."""
        wins = [
            a
            for a in self.participant_achievements
            if a.get("achievement__slug") is not None
            and "-colors" in a.get("achievement__slug")
        ]
        return len(wins)

    def calculate_win_percentage(self):
        """Calculate players win %. Achievements with a 'win' slug / participant_pods."""
        wins = self.calculate_win_number()
        return round((wins / len(self.participant_pods)) * 100, 2)

    def calculate_lifetime_points(self):
        """Sum the number of points player has earned."""
        return sum([a["earned_points"] for a in self.participant_achievements])

    def calculate_unique_achievements(self):
        """Calculate number of unique achievements earned."""
        return len(
            list(
                {v["achievement_id"]: v for v in self.participant_achievements}.values()
            )
        )

    def build(self):
        self.fetch_participant_achievements()
        self.fetch_participant_attendance()
        self.fetch_participant_obj()

        return {
            "participant_name": self.participant_obj.name,
            "win_pct": self.calculate_win_percentage(),
            "win_number": self.calculate_win_number(),
            "attendance": len(self.participant_pods),
            "lifetime_points": self.calculate_lifetime_points(),
            "participant_since": self.participant_obj.created_at.strftime("%m/%d/%Y"),
            "unique_achievements": self.calculate_unique_achievements(),
        }

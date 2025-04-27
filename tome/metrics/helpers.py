from collections import defaultdict, Counter
from django.db.models import Sum
from django.utils.timezone import now, make_aware

from achievements.models import WinningCommanders
from sessions_rounds.models import PodsParticipants, Sessions, Rounds
from users.models import ParticipantAchievements, Participants


def calculate_full_name(child, parent):
    if parent is not None:
        return f"{parent} {child}"
    return child


class MetricsCalculator:
    def __init__(self):
        self.metrics = {}

    def build_color_pie(self, winners):
        try:
            color_pie = {}
            for winner in winners:
                symbol = winner["colors__symbol"]
                color_pie[symbol] = color_pie.get(symbol, 0) + 1
            self.metrics["color_pie"] = color_pie
        except (KeyError, TypeError) as e:
            print(f"Error building color pie: {e}")

    def build_achievement_chart(self, achievements):
        try:
            achievement_chart = defaultdict(
                lambda: {"name": "", "point_value": "", "count": 0}
            )

            for earned in achievements:
                if earned["achievement__slug"] is not None:
                    continue
                name = calculate_full_name(
                    earned["achievement__name"], earned["achievement__parent__name"]
                )
                id = earned["achievement__id"]
                point_value = earned["achievement__point_value"]

                achievement_chart[id]["name"] = name
                achievement_chart[id]["point_value"] = point_value
                achievement_chart[id]["count"] += 1
            self.metrics["achievement_chart"] = {
                k: v for k, v in achievement_chart.items() if v["count"] >= 5
            }

        except (KeyError, TypeError) as e:
            print(f"Error building achievement chart: {e}")

    def build_big_winner(self, winners):
        try:
            winner_map = defaultdict(int)
            for winner in winners:
                winner_map[winner["participants__name"]] += 1
            max_wins = max(winner_map.values(), default=0)
            self.metrics["big_winners"] = [
                {"name": participant, "wins": wins}
                for participant, wins in winner_map.items()
                if wins == max_wins
            ]
        except Exception as e:
            print(f"Error building big winner: {e}")

    def build_most_earned(self, achievements):
        try:
            achievement_map = defaultdict(lambda: {"name": "", "count": 0})
            for earned in achievements:
                slug = earned.get("achievement__slug")
                if slug is not None:
                    continue
                name = calculate_full_name(
                    earned["achievement__name"], earned["achievement__parent__name"]
                )

                achievement_map[name]["name"] = name
                achievement_map[name]["count"] += 1

            max_earned = max(
                (am["count"] for am in achievement_map.values()), default=0
            )
            self.metrics["most_earned"] = [
                ea for ea in achievement_map.values() if ea["count"] == max_earned
            ]

        except Exception as e:
            print(f"Error building most earned: {e}")

    def build_big_earner(self):
        try:
            self.metrics["big_earner"] = (
                ParticipantAchievements.objects.filter(deleted=False)
                .values("participant_id", "participant__name")
                .annotate(total_points=Sum("earned_points"))
                .order_by("-total_points")
                .first()
            )
        except Exception as e:
            print(f"Error building biggest earner: {e}")

    def days_since_last_draw(self):
        today = now()
        try:
            last_draw = (
                ParticipantAchievements.objects.filter(
                    achievement__slug="end-draw", deleted=False
                )
                .select_related("round")
                .order_by("-round__created_at")
                .values_list("round__created_at", flat=True)
                .first()
            )
            if last_draw:
                last_draw = make_aware(last_draw)
            self.metrics["last_draw"] = (
                {"days": (today - last_draw).days} if last_draw else {"days": None}
            )

        except Exception as e:
            print(f"Error building since last draw: {e}")

    def top_five_commanders(self, winners):
        try:
            commander_wins = Counter()
            participant_wins = Counter()
            for winner in winners:
                if winner["name"] and winner["name"] != "UNKNOWN":
                    commander_wins[winner["name"]] += 1
                participant_wins[winner["participants__name"]] += 1
            self.metrics["common_commanders"] = dict(
                Counter(commander_wins).most_common(5)
            )
            self.metrics["top_winners"] = dict(
                Counter(participant_wins).most_common(6)[1:]
            )
        except Exception as e:
            print(f"Error building top 5: {e}")

    def highest_attendence_and_overall_points(self, achievements):
        try:
            highest_round = Counter()
            points_by_participant = Counter()
            for achievement in achievements:
                points_by_participant[achievement["participant__name"]] += achievement[
                    "earned_points"
                ]
                if achievement["achievement__slug"] == "participation":
                    highest_round[achievement["round_id"]] += 1
            round = max(highest_round, key=highest_round.get)
            round_obj = Rounds.objects.get(id=round)
            self.metrics["highest_attendence"] = {
                "date": round_obj.created_at,
                "total": highest_round[round],
                "round_number": round_obj.round_number,
            }
            self.metrics["overall_points"] = dict(
                Counter(points_by_participant).most_common(6)[1:]
            )
        except Exception as e:
            print(f"Error building highest attendence: {e}")

    def build_metrics(self):
        try:
            winners = list(
                WinningCommanders.objects.filter(deleted=False)
                .select_related("colors", "participants")
                .values("name", "colors__symbol", "participants__name")
            )
            achievements = list(
                ParticipantAchievements.objects.filter(deleted=False)
                .select_related("achievement", "participant")
                .values(
                    "earned_points",
                    "round_id",
                    "achievement__id",
                    "achievement__name",
                    "achievement__slug",
                    "achievement__point_value",
                    "achievement__parent__name",
                    "participant__name",
                )
            )

        except Exception as e:
            print(f"Error fetching data to build metrics: {e}")

        self.build_color_pie(winners)
        self.build_big_winner(winners)
        self.build_most_earned(achievements)
        self.top_five_commanders(winners)
        self.highest_attendence_and_overall_points(achievements)
        self.build_big_earner()
        self.days_since_last_draw()
        self.build_achievement_chart(achievements)

        return self.metrics


class IndividualMetricsCalculator:
    def __init__(self, participant_id):
        self.participant_id = participant_id
        self.participant_achievements = []
        self.participant_pods = []
        self.participant_obj = None
        self.sessions = []

    def fetch_participant_achievements(self):
        """Get all of the participant achievements for a given participant."""
        try:
            self.participant_achievements = (
                ParticipantAchievements.objects.filter(
                    participant_id=self.participant_id, deleted=False
                )
                .select_related("achievement")
                .select_related("round")
                .select_related("session")
                .values(
                    "achievement_id",
                    "session_id",
                    "round_id",
                    "session__month_year",
                    "earned_points",
                    "achievement__slug",
                )
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

    def fetch_sessions(self):
        """Fetch all existing sessions."""
        self.sessions = Sessions.objects.filter(deleted=False).values(
            "id", "month_year"
        )

    def make_sessions_dict_by_month_year(self):
        """Make a dict of sessions by month_year."""
        out = defaultdict(list)
        for s in self.sessions:
            out[s["month_year"]].append(s)
        return out

    def calculate_win_number(self):
        """Calculate the number of wins a participant has."""
        wins = [
            a
            for a in self.participant_achievements
            if a.get("achievement__slug") is not None
            and "-colors" in a.get("achievement__slug")
        ]
        return len(wins)

    def calculate_average_win_points(self):
        """Calculate players win %. Achievements with a 'win' slug / participant_pods."""
        wins = self.calculate_win_number()
        if wins == 0:
            return 0
        round_list = [
            w["round_id"]
            for w in self.participant_achievements
            if w["achievement__slug"] and "-colors" in w.get("achievement__slug")
        ]
        total = sum(
            pa["earned_points"]
            for pa in self.participant_achievements
            if pa["round_id"] in round_list
        )

        return round((total / wins), 2)

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

    def calculate_session_points(self):
        """Sum all of the points for each session, then format them in a way the
        line chart would expect."""
        out = defaultdict(list)
        tmp = defaultdict(int)
        session_dicts = self.make_sessions_dict_by_month_year()
        for pa in self.participant_achievements:
            tmp[pa["session_id"], pa["session__month_year"]] += pa["earned_points"]
        sorted_list = sorted(
            [
                {"session_id": id1, "month_year": id2, "points": v}
                for (id1, id2), v in tmp.items()
            ],
            key=lambda d: d["session_id"],
        )

        session_index_map = {
            mm_yy: {s["id"]: idx + 1 for idx, s in enumerate(session_dicts[mm_yy])}
            for mm_yy in session_dicts
        }

        for so in sorted_list:
            mm_yy = so["month_year"]
            session_num = session_index_map[mm_yy].get(so["session_id"], None)
            if session_num is not None:
                out[mm_yy].append({"session": session_num, "points": so["points"]})
        return out

    def build(self):
        self.fetch_participant_achievements()
        self.fetch_participant_attendance()
        self.fetch_participant_obj()
        self.fetch_sessions()

        win_count = WinningCommanders.objects.filter(
            participants_id=self.participant_id, deleted=False
        ).count()

        return {
            "participant_name": self.participant_obj.name,
            "avg_win_points": self.calculate_average_win_points(),
            "win_number": win_count,
            "attendance": len(self.participant_pods),
            "lifetime_points": self.calculate_lifetime_points(),
            "participant_since": self.participant_obj.created_at.strftime("%m/%d/%Y"),
            "unique_achievements": self.calculate_unique_achievements(),
            "session_points": self.calculate_session_points(),
        }

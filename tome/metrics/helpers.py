from collections import defaultdict, Counter, OrderedDict
from django.db.models import Sum, Q
from django.utils.timezone import now, make_aware

from achievements.models import WinningCommanders
from sessions_rounds.models import PodsParticipants, Sessions
from users.models import ParticipantAchievements, Participants


def first_of_month(dt):
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def shift_months(dt, months_back):
    """Return dt shifted back by `months_back` months (same day/time when possible)."""
    y, m = dt.year, dt.month

    total = dt.year * 12 + (dt.month - 1) - months_back
    y = total // 12
    m = total % 12 + 1

    return dt.replace(year=y, month=m, day=1)


def get_bounds(period: str = None):
    """Set our time bound delta"""

    n = now()
    end = n
    start_of_this_month = first_of_month(n)

    if period is None:
        return None, end

    if period == "mtd":
        start = start_of_this_month

    elif period == "3m":
        start = shift_months(start_of_this_month, 2)
    elif period == "6m":
        start = shift_months(start_of_this_month, 5)
    elif period == "ytd":
        start = shift_months(start_of_this_month, 11)
    else:
        return None, end

    return start, end


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
            # achievement_map = defaultdict(lambda: {"name": "", "count": 0})
            most_earned = Counter()
            for achievement in achievements:
                slug = achievement.get("achievement__slug")
                if slug is not None:
                    continue

                name = calculate_full_name(
                    achievement["achievement__name"],
                    achievement["achievement__parent__name"],
                )

                most_earned[name] += 1

            self.metrics["most_earned"] = dict(Counter(most_earned).most_common(5))

        except Exception as e:
            print(f"Error building most earned: {e}")

    def build_big_earner(self, filters):
        try:
            self.metrics["big_earner"] = (
                ParticipantAchievements.objects.filter(filters)
                .select_related("round")
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
                Counter(participant_wins).most_common(5)[1:]
            )
        except Exception as e:
            print(f"Error building top 5: {e}")

    def build_top_fives(self, achievements):
        snack_leaders = Counter()
        points_by_participant = Counter()
        most_draws = Counter()
        most_knockouts = Counter()
        most_last_wins = Counter()
        biggest_burger = defaultdict(Counter)
        round_meta = {}

        for achievement in achievements:
            player_name = achievement["participant__name"]
            points = achievement["earned_points"]
            slug = achievement.get("achievement__slug")
            rnd = str(achievement["round_id"])

            round_meta[rnd] = (
                achievement["round__round_number"],
                achievement["round__created_at"],
            )

            points_by_participant[player_name] += points
            biggest_burger[rnd][player_name] += points

            if slug == "best-snack" or slug == "bring-snack":
                snack_leaders[player_name] += points

            if slug == "end-draw":
                most_draws[player_name] += 1

            if slug == "knock-out":
                most_knockouts[player_name] += 1

            if slug == "last-in-order":
                most_last_wins[player_name] += 1

        winners_by_round = []
        for rid, counter in biggest_burger.items():
            if not counter:
                continue
            player, pts = counter.most_common(1)[0]
            rnum, rdate = round_meta[rid]
            winners_by_round.append(
                {
                    "round_id": rid,
                    "player": player,
                    "points": pts,
                    "round_number": rnum,
                    "round_date": rdate,
                }
            )
        top5 = sorted(winners_by_round, key=lambda x: x["points"], reverse=True)[:5]

        burger_display = OrderedDict()
        for w in top5:
            dt = w["round_date"]
            when = dt.strftime("%b %d, %Y") if hasattr(dt, "strftime") else str(dt)
            key = f'{w["player"]}, Round {w["round_number"]} on {when}'
            burger_display[key] = w["points"]

        self.metrics["snack_leaders"] = dict(Counter(snack_leaders).most_common(5))
        self.metrics["overall_points"] = dict(
            Counter(points_by_participant).most_common(5)[1:]
        )
        self.metrics["most_draws"] = dict(Counter(most_draws).most_common(5))
        self.metrics["most_knockouts"] = dict(Counter(most_knockouts).most_common(5))
        self.metrics["most_last_wins"] = dict(Counter(most_last_wins).most_common(5))
        self.metrics["biggest_burger"] = burger_display

    def build_metrics(self, period):
        try:
            start, end = get_bounds(period)

            winners_filters = Q(deleted=False) & ~Q(name="END IN DRAW")
            achievement_filters = Q(deleted=False)
            if start is not None:
                winners_filters &= Q(pods__rounds__created_at__gte=start) & Q(
                    pods__rounds__created_at__lt=end
                )
                achievement_filters &= Q(round__created_at__gte=start) & Q(
                    round__created_at__lt=end
                )

            winners = list(
                WinningCommanders.objects.filter(winners_filters)
                .select_related("colors", "participants", "pods")
                .values("name", "colors__symbol", "participants__name")
            )
            achievements = list(
                ParticipantAchievements.objects.filter(achievement_filters)
                .select_related("achievement", "participant", "round")
                .values(
                    "earned_points",
                    "round_id",
                    "achievement__id",
                    "achievement__name",
                    "achievement__slug",
                    "achievement__point_value",
                    "achievement__parent__name",
                    "participant__name",
                    "round__round_number",
                    "round__created_at",
                )
            )

        except Exception as e:
            print(f"Error fetching data to build metrics: {e}")

        self.build_color_pie(winners)
        self.build_big_winner(winners)
        self.build_most_earned(achievements)
        self.top_five_commanders(winners)
        self.build_big_earner(filters=achievement_filters)
        self.days_since_last_draw()
        self.build_achievement_chart(achievements)
        self.build_top_fives(achievements)

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

    def calculate_average_win_points(self, win_count):
        """Calculate players win %. Achievements with a 'win' slug / participant_pods."""
        if win_count == 0:
            return 0
        round_list = [
            w["round_id"]
            for w in self.participant_achievements
            if w["achievement__slug"]
            and (
                "-colors" in w.get("achievement__slug")
                or "precon" in w.get("achievement__slug")
            )
        ]
        total = sum(
            pa["earned_points"]
            for pa in self.participant_achievements
            if pa["round_id"] in round_list
        )

        return round((total / win_count), 2)

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
            "avg_win_points": self.calculate_average_win_points(win_count),
            "win_number": win_count,
            "attendance": len(self.participant_pods),
            "lifetime_points": self.calculate_lifetime_points(),
            "participant_since": self.participant_obj.created_at.strftime("%m/%d/%Y"),
            "unique_achievements": self.calculate_unique_achievements(),
            "session_points": self.calculate_session_points(),
        }

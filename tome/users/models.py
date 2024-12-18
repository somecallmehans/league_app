from datetime import datetime

from django.db import models

from sessions_rounds.models import Rounds, Sessions
from achievements.models import Achievements


class Participants(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "participants"

    @property
    def total_points(self):
        return self.get_total_points()

    def get_total_points(self, mm_yy=None):
        if mm_yy is None:
            today = datetime.today()
            mm_yy = today.strftime("%m-%y")
        return self._calculate_points(month_year=mm_yy)

    def get_round_points(self, round_id=None):
        if round_id is None:
            return None
        return self._calculate_points(round_id=round_id)

    def _calculate_points(self, month_year=None, round_id=None):
        """
        This internal method handles both total points (by month-year)
        and round points by determining which filter to apply.
        """
        filters = {
            "participant": self.id,
            "deleted": False,
        }

        if month_year:
            filters["session__month_year"] = month_year
        elif round_id:
            filters["round"] = round_id
        else:
            return 0

        total_points = ParticipantAchievements.objects.filter(**filters).aggregate(
            total_points=models.Sum(
                models.Case(
                    models.When(
                        achievement__point_value__isnull=False,
                        then="achievement__point_value",
                    ),
                    models.When(
                        achievement__point_value__isnull=True,
                        then="achievement__parent__point_value",
                    ),
                    default=0,
                    output_field=models.IntegerField(),
                )
            )
        )["total_points"]

        return total_points if total_points is not None else 0

    def get_round_ponts(self, round_id=None):
        if round_id is None:
            return None

        points = ParticipantAchievements.objects.filter(
            participant=self.participants.id, deleted=False, round=round_id
        ).aggregate(
            total_points=models.Sum(
                models.Case(
                    models.When(
                        achievement__point_value__isnull=False,
                        then="achievement__point_value",
                    ),
                    models.When(
                        achievement__point_value__isnull=True,
                        then="achievement__parent__point_value",
                    ),
                    default=0,
                    output_field=models.IntegerField(),
                )
            )
        )[
            "total_points"
        ]
        return points if points is not None else 0


class ParticipantAchievements(models.Model):
    participant = models.ForeignKey(Participants, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievements, on_delete=models.CASCADE)
    round = models.ForeignKey(Rounds, on_delete=models.CASCADE)
    session = models.ForeignKey(Sessions, on_delete=models.CASCADE)
    deleted = models.BooleanField(default=False)
    earned_points = models.IntegerField()

    class Meta:
        db_table = "participant_achievements"


class Users(models.Model):

    username = None
    name = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    admin = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    password = models.CharField(max_length=50)

    class Meta:
        db_table = "users"

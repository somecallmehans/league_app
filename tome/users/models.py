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

        total_points = ParticipantAchievements.objects.filter(
            participant=self.id,
            deleted=False,
            session__month_year=mm_yy,
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
        return total_points if total_points is not None else 0


class ParticipantAchievements(models.Model):
    participant = models.ForeignKey(Participants, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievements, on_delete=models.CASCADE)
    round = models.ForeignKey(Rounds, on_delete=models.CASCADE)
    session = models.ForeignKey(Sessions, on_delete=models.CASCADE)
    deleted = models.BooleanField(default=False)

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

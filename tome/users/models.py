from datetime import datetime

from django.db import models, IntegrityError, transaction
from django.db.models import Sum, F
from django.db.models.functions import Coalesce

from sessions_rounds.models import Rounds, Sessions
from achievements.models import Achievements, Commanders

from users.helpers import generate_code


class Participants(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    discord_user_id = models.PositiveBigIntegerField(null=True, unique=True, blank=True)
    code = models.CharField(max_length=6, unique=True, default=None)

    class Meta:
        db_table = "participants"

    def save(self, *args, **kwargs):
        if not self.code:
            for _ in range(6):
                self.code = generate_code()
                try:
                    with transaction.atomic():
                        return super().save(*args, **kwargs)
                except IntegrityError:
                    self.code = None
        return super().save(*args, **kwargs)

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

        if round_id:
            filters["round"] = round_id

        total_points = ParticipantAchievements.objects.filter(**filters).aggregate(
            total_points=models.Sum("earned_points")
        )["total_points"]

        return total_points if total_points is not None else 0


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


class Decklists(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    url = models.TextField(null=False, blank=False)
    participant = models.ForeignKey(
        Participants, on_delete=models.CASCADE, blank=True, null=True
    )
    code = models.CharField(max_length=10, unique=True, editable=False)
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    commander = models.ForeignKey(
        Commanders, related_name="commander_decklists", on_delete=models.CASCADE
    )
    partner = models.ForeignKey(
        Commanders,
        related_name="partner_decklists",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    companion = models.ForeignKey(
        Commanders,
        related_name="companion_decklists",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    achievement = models.ManyToManyField(
        Achievements, through="DecklistsAchievements", related_name="decklists"
    )

    class Meta:
        db_table = "decklists"

    def save(self, *args, **kwargs):
        if not self.code:
            for _ in range(4):
                code = generate_code(4)
                try:
                    self.code = f"DL-{code}"
                    with transaction.atomic():
                        return super().save(*args, **kwargs)
                except IntegrityError:
                    self.code = None
        return super().save(*args, **kwargs)

    @property
    def points(self) -> int:
        return self.achievements.annotate(
            effective_points=Coalesce("point_value", F("parent__point_value"), 0)
        ).aggregate(total=Coalesce(Sum("effective_points"), 0))["total"]


class DecklistsAchievements(models.Model):
    achievement = models.ForeignKey(Achievements, on_delete=models.CASCADE)
    decklist = models.ForeignKey(Decklists, on_delete=models.CASCADE)

    class Meta:
        db_table = "decklists_achievements"

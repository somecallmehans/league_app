from django.db import models


class Restrictions(models.Model):
    name = models.CharField(max_length=255)
    url = models.CharField(max_length=255)
    deleted = models.BooleanField(default=False)
    nested = models.BooleanField(default=False)

    class Meta:
        db_table = "restrictions"


class Achievements(models.Model):
    name = models.CharField(max_length=255)
    point_value = models.IntegerField(null=True, blank=True)
    deleted = models.BooleanField(default=False)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)

    restrictions = models.ManyToManyField(
        "Restrictions", through="AchievementsRestrictions"
    )

    class Meta:
        db_table = "achievements"


class AchievementsRestrictions(models.Model):
    achievements = models.ForeignKey(Achievements, on_delete=models.CASCADE)
    restrictions = models.ForeignKey(Restrictions, on_delete=models.CASCADE)

    class Meta:
        db_table = "achievements_restrictions"


class Colors(models.Model):
    symbol = models.CharField(max_length=5)
    slug = models.CharField(max_length=26)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = "colors"


class ColorFactions(models.Model):
    name = models.CharField(max_length=50)
    colors = models.ForeignKey(Colors, on_delete=models.CASCADE)

    class Meta:
        db_table = "color_factions"


class WinningCommanders(models.Model):
    name = models.CharField(max_length=255)
    deleted = models.BooleanField(default=False)

    colors = models.ForeignKey(Colors, on_delete=models.CASCADE)
    pods = models.ForeignKey("sessions_rounds.Pods", on_delete=models.CASCADE)
    participants = models.ForeignKey("users.Participants", on_delete=models.CASCADE)

    class Meta:
        db_table = "winning_commanders"

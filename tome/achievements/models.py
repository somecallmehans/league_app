from django.db import models


class Restrictions(models.Model):
    name = models.CharField(max_length=255)
    url = models.CharField(max_length=255)
    deleted = models.BooleanField(default=False)
    nested = models.BooleanField(default=False)

    class Meta:
        db_table = "restrictions"


class AchievementType(models.Model):
    name = models.CharField(max_length=255)
    hex_code = models.CharField(max_length=7)
    description = models.TextField(null=True, blank=True, default=None)

    class Meta:
        db_table = "achievement_type"


class Achievements(models.Model):
    name = models.CharField(max_length=255)
    point_value = models.IntegerField(null=True, blank=True)
    deleted = models.BooleanField(default=False)
    slug = models.SlugField(unique=True, null=True, blank=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    type = models.ForeignKey(
        AchievementType,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="achievements",
    )

    restrictions = models.ManyToManyField(
        "Restrictions", through="AchievementsRestrictions"
    )

    class Meta:
        db_table = "achievements"

    @property
    def points(self):
        return self.parent.point_value if self.parent is not None else self.point_value

    @property
    def full_name(self):
        return (
            f"{self.parent.name} {self.name}" if self.parent is not None else self.name
        )


class AchievementsRestrictions(models.Model):
    achievements = models.ForeignKey(Achievements, on_delete=models.CASCADE)
    restrictions = models.ForeignKey(Restrictions, on_delete=models.CASCADE)

    class Meta:
        db_table = "achievements_restrictions"


class Colors(models.Model):
    symbol = models.CharField(max_length=5)
    slug = models.CharField(max_length=26)
    name = models.CharField(max_length=50)
    mask = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "colors"

    @property
    def symbol_length(self):
        if self.symbol == "c":
            return 0
        return len(self.symbol)


class ColorFactions(models.Model):
    name = models.CharField(max_length=50)
    colors = models.ForeignKey(Colors, on_delete=models.CASCADE)

    class Meta:
        db_table = "color_factions"


class WinningCommanders(models.Model):
    name = models.CharField(max_length=255)
    deleted = models.BooleanField(default=False)

    colors = models.ForeignKey(Colors, on_delete=models.CASCADE, null=True, blank=True)
    pods = models.ForeignKey("sessions_rounds.Pods", on_delete=models.CASCADE)
    participants = models.ForeignKey(
        "users.Participants", on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        db_table = "winning_commanders"


class Commanders(models.Model):
    name = models.CharField(max_length=255)
    deleted = models.BooleanField(default=False)
    has_partner = models.BooleanField(default=False)
    is_background = models.BooleanField(default=False)
    is_companion = models.BooleanField(default=False)

    colors = models.ForeignKey(Colors, on_delete=models.CASCADE)

    class Meta:
        db_table = "commanders"

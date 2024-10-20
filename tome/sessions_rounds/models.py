from django.db import models


class Sessions(models.Model):
    month_year = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)
    closed = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "sessions"


class RoundOptions(models.IntegerChoices):
    ONE = 1
    TWO = 2


class Rounds(models.Model):
    session = models.ForeignKey(Sessions, on_delete=models.CASCADE)
    round_number = models.IntegerField(choices=RoundOptions.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "rounds"


class Pods(models.Model):
    rounds = models.ForeignKey(Rounds, on_delete=models.CASCADE)
    deleted = models.BooleanField(default=False)
    submitted = models.BooleanField(default=False)

    class Meta:
        db_table = "pods"


class PodsParticipants(models.Model):
    pods = models.ForeignKey(Pods, on_delete=models.CASCADE)
    participants = models.ForeignKey("users.Participants", on_delete=models.CASCADE)

    class Meta:
        db_table = "pods_participants"

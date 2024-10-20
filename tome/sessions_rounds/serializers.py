from rest_framework import serializers
from .models import Sessions, Rounds, Pods, PodsParticipants
from users.serializers import ParticipantsSerializer


class RoundsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rounds
        fields = ["id", "round_number", "completed", "deleted"]


class SessionSerializer(serializers.ModelSerializer):
    rounds = RoundsSerializer(many=True, read_only=True, source="rounds_set")

    class Meta:
        model = Sessions
        fields = ["id", "month_year", "closed", "deleted", "created_at", "rounds"]


class PodsSerializer(serializers.ModelSerializer):
    rounds = RoundsSerializer(many=True, read_only=True, source="rounds_set")

    class Meta:
        model = Pods
        fields = ["id", "rounds", "submitted"]


class PodsParticipantsSerializer(serializers.ModelSerializer):
    pods = PodsSerializer(read_only=True)
    participants = ParticipantsSerializer(read_only=True)

    class Meta:
        model = PodsParticipants
        fields = ["id", "pods", "participants"]

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
    participant_id = serializers.IntegerField(source="participants.id")
    name = serializers.CharField(source="participants.name")
    total_points = serializers.IntegerField(source="participants.total_points")
    round_points = serializers.SerializerMethodField()

    class Meta:
        model = PodsParticipants
        fields = ["pods", "participant_id", "name", "total_points", "round_points"]

    def get_round_points(self, obj):
        round_id = self.context.get("round_id")
        if round_id:
            return obj.participants.get_round_points(round_id=round_id)
        return 0

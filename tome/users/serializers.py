from rest_framework import serializers
from .models import Participants, ParticipantAchievements


class ParticipantsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Participants
        fields = ["id", "name"]


class ParticipantsAchievementsSerializer(serializers.ModelSerializer):
    participant = serializers.PrimaryKeyRelatedField(read_only=True)
    session = serializers.PrimaryKeyRelatedField(read_only=True)
    round = serializers.PrimaryKeyRelatedField(read_only=True)
    achievement = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ParticipantAchievements
        fields = [
            "id",
            "participant",
            "achievement",
            "round",
            "session",
            "earned_points",
        ]

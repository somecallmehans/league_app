from rest_framework import serializers
from .models import Participants, ParticipantAchievements


class ParticipantsSerializer(serializers.ModelSerializer):
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = Participants
        fields = ["id", "name", "total_points"]

    def get_total_points(self, obj):
        mm_yy = self.context.get("mm_yy", None)
        return obj.get_total_points(mm_yy)


class ParticipantsAchievementsSerializer(serializers.ModelSerializer):
    participant = serializers.PrimaryKeyRelatedField(read_only=True)
    session = serializers.PrimaryKeyRelatedField(read_only=True)
    round = serializers.PrimaryKeyRelatedField(read_only=True)
    achievement = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ParticipantAchievements
        fields = ["id", "participant", "achievement", "round", "session"]


class ParticipantsAchievementsFullModelSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()

    def get_participant(self, obj):
        participant_data = ParticipantsSerializer(obj.participant).data
        mm_yy = self.context.get("mm_yy")

        total_points = obj.participant.get_total_points(mm_yy=mm_yy)

        participant_data["total_points"] = total_points
        return participant_data

    def to_representation(self, instance):
        from achievements.serializers import AchievementsSerializer

        self.fields["achievement"] = AchievementsSerializer(read_only=True)
        return super(
            ParticipantsAchievementsFullModelSerializer, self
        ).to_representation(instance)

    class Meta:
        model = ParticipantAchievements
        fields = ["id", "participant", "achievement"]

from rest_framework import serializers
from .models import Achievements, Restrictions, Colors, WinningCommanders
from sessions_rounds.serializers import PodsSerializer
from users.serializers import ParticipantsSerializer


class RestrictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restrictions
        fields = ["id", "name", "url", "nested"]


class AchievementsSerializer(serializers.ModelSerializer):
    restrictions = RestrictionSerializer(many=True, read_only=True)
    parent = serializers.SerializerMethodField()
    points = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Achievements
        fields = [
            "id",
            "name",
            "point_value",
            "parent",
            "restrictions",
            "slug",
            "points",
            "full_name",
        ]

    def get_parent(self, obj):
        if obj.parent is not None:
            return AchievementsSerializer(obj.parent).data
        return None


class ColorsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colors
        fields = ["id", "slug", "name", "symbol"]


class WinningCommandersSerializer(serializers.ModelSerializer):
    colors = ColorsSerializer(read_only=True)
    pods = PodsSerializer(read_only=True)
    participants = ParticipantsSerializer(read_only=True)

    class Meta:
        model = WinningCommanders
        fields = ["id", "name", "deleted", "colors", "pods", "participants"]

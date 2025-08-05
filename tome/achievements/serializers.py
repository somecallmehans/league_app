from rest_framework import serializers
from .models import Achievements, Restrictions, Colors, WinningCommanders, Commanders
from sessions_rounds.serializers import PodsSerializer
from users.serializers import ParticipantsSerializer


class RestrictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restrictions
        fields = ["id", "name", "url", "nested"]


class AchievementsSerializer(serializers.ModelSerializer):
    restrictions = RestrictionSerializer(many=True, read_only=True)
    parent = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(read_only=True)
    points = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    deleted = serializers.BooleanField(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Achievements
        fields = [
            "id",
            "name",
            "point_value",
            "parent",
            "parent_id",
            "restrictions",
            "slug",
            "points",
            "full_name",
            "deleted",
        ]

    def get_parent(self, obj):
        if obj.parent is not None:
            return AchievementsSerializer(obj.parent).data
        return None

    def get_full_name(self, obj):
        return obj.full_name


class ColorsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colors
        fields = ["id", "slug", "name", "symbol", "symbol_length"]


class WinningCommandersSerializer(serializers.ModelSerializer):
    colors = ColorsSerializer(read_only=True)
    pods = PodsSerializer(read_only=True)
    participants = ParticipantsSerializer(read_only=True)

    class Meta:
        model = WinningCommanders
        fields = ["id", "name", "deleted", "colors", "pods", "participants"]

    @staticmethod
    def by_pods(pods):
        winning_commanders = WinningCommanders.objects.filter(pods_id__in=pods)

        winners_by_pod = {
            winner.pods_id: WinningCommandersSerializer(winner).data
            for winner in winning_commanders
        }
        return winners_by_pod


class CommandersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commanders
        fields = ["id", "name", "colors_id", "has_partner", "is_background"]

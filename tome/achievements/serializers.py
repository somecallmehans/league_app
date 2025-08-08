from rest_framework import serializers
from .models import (
    Achievements,
    Restrictions,
    Colors,
    WinningCommanders,
    Commanders,
    AchievementType,
)
from sessions_rounds.serializers import PodsSerializer
from users.serializers import ParticipantsSerializer


class RestrictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restrictions
        fields = ["id", "name", "url", "nested"]


class AchievementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementType
        fields = ["id", "name", "hex_code", "description"]


class ParentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievements
        fields = ("id", "name", "point_value")


class AchievementTypeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementType
        fields = ("id", "name", "description", "hex_code")


class RestrictionMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restrictions
        fields = ("id", "name", "url")


class AchievementSerializerV2(serializers.ModelSerializer):
    restrictions = RestrictionMiniSerializer(many=True, read_only=True)
    parent = ParentMiniSerializer(read_only=True)
    parent_id = serializers.IntegerField(read_only=True)
    type = AchievementTypeMiniSerializer(read_only=True)
    type_id = serializers.IntegerField(read_only=True)
    points = serializers.IntegerField(source="points_anno", read_only=True)
    full_name = serializers.CharField(source="full_name_anno", read_only=True)

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
            "type",
            "type_id",
        ]


class AchievementsSerializer(serializers.ModelSerializer):
    restrictions = RestrictionSerializer(many=True, read_only=True)
    parent = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(read_only=True)
    type = serializers.SerializerMethodField()
    type_id = serializers.IntegerField(read_only=True)
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
            "type",
            "type_id",
        ]

    def get_parent(self, obj):
        if obj.parent is not None:
            return AchievementsSerializer(obj.parent).data
        return None

    def get_full_name(self, obj):
        return obj.full_name

    def get_type(self, obj):
        if obj.type:
            return AchievementTypeSerializer(obj.type).data
        return None


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

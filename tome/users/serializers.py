from rest_framework import serializers
from .models import Participants, ParticipantAchievements


class ParticipantsSerializer(serializers.ModelSerializer):
    # TODO: Investigate thoroughly if we can just delete this. Would save a big headache.
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = Participants
        fields = ["id", "name", "total_points"]

    # TODO: Delete
    # def get_total_points(self, obj):
    #     mm_yy = self.context.get("mm_yy", None)
    #     return obj.get_total_points(mm_yy)


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


# TODO: Delete
# class ParticipantsAchievementsFullModelSerializer(serializers.ModelSerializer):
#     participant = serializers.SerializerMethodField()

#     def get_participant(self, obj):
#         participant_data = ParticipantsSerializer(obj.participant).data
#         mm_yy = self.context.get("mm_yy")

#         total_points = obj.participant.get_total_points(mm_yy=mm_yy)

#         participant_data["total_points"] = total_points
#         return participant_data

#     def to_representation(self, instance):
#         from achievements.serializers import AchievementsSerializer

#         self.fields["achievement"] = AchievementsSerializer(read_only=True)
#         return super(
#             ParticipantsAchievementsFullModelSerializer, self
#         ).to_representation(instance)

#     def to_dict(self, instances):
#         out = []
#         for ins in instances:
#             participant = ins.participant
#             achievement = ins.achievement

#             out.append(
#                 {
#                     "id": ins.id,
#                     "achievement_id": achievement.id if achievement else None,
#                     "achievement_name": achievement.full_name if achievement else None,
#                     "participant_id": participant.id if participant else None,
#                     "participant_name": participant.name if participant else None,
#                     "points": achievement.points if achievement else None,
#                     "slug": achievement.slug if achievement else None,
#                     "earned_points": ins.earned_points,
#                     "deleted": ins.deleted,
#                 }
#             )
#         return out

#     class Meta:
#         model = ParticipantAchievements
#         fields = ["id", "participant", "achievement", "earned_points", "deleted"]

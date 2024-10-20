from users.models import ParticipantAchievements


def participant_achievement_factory(session, round, participant, achievement):
    ParticipantAchievements.objects.create(
        session=session,
        round=round,
        participant=participant,
        achievement=achievement,
    )

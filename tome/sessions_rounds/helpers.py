from datetime import datetime, timedelta
from typing import Optional

from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.utils import timezone

from users.models import Participants, ParticipantAchievements
from users.serializers import ParticipantsSerializer
from achievements.models import Achievements
from achievements.earned_count_helpers import (
    decrement_earned_counts,
    increment_earned_counts,
    pairs_from_participant_achievements,
    pairs_from_queryset_values,
)
from sessions_rounds.models import Pods, PodsParticipants, Rounds, Sessions
from sessions_rounds.pod_sizing import partition_into_pods
from stores.models import StoreParticipant
from users.helpers import generate_code


PARTICIPATION_ACHIEVEMENT = "participation"

PATREON_ONLY_HOURS = 24
OPEN_TO_ALL_BEFORE_ROUND_HOURS = 48
PATREON_REJECTION_MESSAGE = (
    "Sign-ins are currently limited to Patreon subscribers only. "
    "Regular sign-ins will open 48 hours before Round 1 begins."
)


def _as_aware(dt: datetime) -> datetime:
    if timezone.is_aware(dt):
        return dt
    return timezone.make_aware(dt, timezone.get_current_timezone())


def is_patreon_only_window(session: Sessions) -> bool:
    """True when sign-ins should be restricted to Patreon subscribers."""
    now = timezone.now()
    patreon_window_end = _as_aware(session.created_at) + timedelta(
        hours=PATREON_ONLY_HOURS
    )

    rounds = Rounds.objects.filter(session=session, deleted=False).order_by("starts_at")
    earliest_round = rounds.first()
    if earliest_round and earliest_round.starts_at:
        open_to_all_time = _as_aware(earliest_round.starts_at) - timedelta(
            hours=OPEN_TO_ALL_BEFORE_ROUND_HOURS
        )
        if now >= open_to_all_time:
            return False

    return now < patreon_window_end


def get_session_for_rounds(round_ids: list[int], store_id: int) -> Optional[Sessions]:
    """Return the session for the given round ids scoped to a store."""
    session_id = (
        Rounds.objects.filter(
            id__in=round_ids, deleted=False, session__store_id=store_id
        )
        .values_list("session_id", flat=True)
        .first()
    )
    if not session_id:
        return None
    return Sessions.objects.filter(
        id=session_id, deleted=False, store_id=store_id
    ).first()


def patreon_signin_rejection_message(session: Sessions) -> str:
    """Return a user-facing message when sign-in is Patreon-only."""
    now = timezone.now()
    patreon_window_end = _as_aware(session.created_at) + timedelta(
        hours=PATREON_ONLY_HOURS
    )
    general_open_at = patreon_window_end
    rounds = Rounds.objects.filter(session=session, deleted=False).order_by("starts_at")
    earliest_round = rounds.first()
    if earliest_round and earliest_round.starts_at:
        open_to_all_time = _as_aware(earliest_round.starts_at) - timedelta(
            hours=OPEN_TO_ALL_BEFORE_ROUND_HOURS
        )
        general_open_at = min(patreon_window_end, open_to_all_time)

    remaining = general_open_at - now
    if remaining.total_seconds() <= 0:
        return PATREON_REJECTION_MESSAGE

    hours = int(remaining.total_seconds() // 3600)
    minutes = int((remaining.total_seconds() % 3600) // 60)
    if hours > 0:
        time_left = f"{hours}h"
        if minutes > 0:
            time_left = f"{hours}h {minutes}m"
    elif minutes > 0:
        time_left = f"{minutes}m"
    else:
        time_left = "less than a minute"

    return (
        "Sign-ins are currently limited to Patreon subscribers only. "
        f"General sign-ins open in {time_left}."
    )


def generate_pods(participants, round_id, store_id, prefer_5_pod: bool = True):
    """
    Generate pods with the following rules:
    - Prefer pods of 4
    - Use pods of 3 or 5 only for remainders (5 only when prefer_5_pod)
    - At most three pods of 3 when avoiding 5s; otherwise at most two
    - No leftover participants
    """
    try:
        ids = [p.id for p in participants]
        groups = partition_into_pods(ids, prefer_5_pod=prefer_5_pod)

        new_pods = Pods.objects.bulk_create(
            [
                Pods(rounds_id=round_id, store_id=store_id)
                for _ in range(len(groups))
            ]
        )

        records = []
        for pod, group in zip(new_pods, groups):
            records.extend(
                [PodsParticipants(pods=pod, participants_id=p) for p in group]
            )

        return PodsParticipants.objects.bulk_create(records)
    except Exception as e:
        print(f"Exception in pod generation: {e}")
        raise Exception


def handle_close_round(round_id):
    """
    If all pods in the round are submitted, mark the round as completed.
    If it's Round 2, also close the session.
    """
    round = Rounds.objects.filter(id=round_id).first()

    if not Pods.objects.filter(rounds=round, submitted=False).exists():
        round.completed = True
        round.save()

        if round.round_number == 2:
            session = Sessions.objects.filter(id=round.session_id).first()
            session.closed = True
            session.save()


class RoundInformationService:
    def __init__(self, participants, session_id, round_id, store_id):
        self.participants = participants
        self.session_id = session_id
        self.round_id = round_id
        self.store_id = store_id
        self.participation_achievement = Achievements.objects.get(
            slug=PARTICIPATION_ACHIEVEMENT, deleted=False
        )
        self.participant_data = []
        self.existing_participants = []
        self.new_participants = []

    def categorize_participants(self):
        """Split up incoming participants into ones that exist and ones that don't"""
        try:
            self.existing_participants = [
                p for p in self.participants if p.get("id") is not None
            ]
            self.new_participants = [
                p for p in self.participants if p.get("id") is None and "name" in p
            ]
        except Exception as e:
            print(f"Error found while categorizing participants: {e}")

    def create_new_participants(self):
        """Take all of the new participants and make them into existing participants"""
        try:
            new = Participants.objects.bulk_create(
                Participants(name=p["name"], code=generate_code())
                for p in self.new_participants
            )
            StoreParticipant.objects.bulk_create(
                [StoreParticipant(store_id=self.store_id, participant=n) for n in new]
            )
            self.existing_participants.extend(
                ParticipantsSerializer(new, many=True).data
            )
        except Exception as e:
            print(f"Error found in create new participants: {e}")

    def get_participants(self):
        """Get un-serialized Participants objects."""
        try:
            today = datetime.today()
            mm_yy = today.strftime("%m-%y")
            self.participant_data = Participants.objects.filter(
                id__in=[ep["id"] for ep in self.existing_participants]
            ).annotate(
                total_points=Coalesce(
                    Sum(
                        "participantachievements__earned_points",
                        filter=Q(
                            participantachievements__deleted=False,
                            participantachievements__store_id=self.store_id,
                            participantachievements__session__month_year=mm_yy,
                        ),
                    ),
                    0,
                )
            )
        except Exception as e:
            print(f"Error found while fetching participant data in round service: {e}")

    def create_participation_achievements(self):
        """If someone hasn't gotten the participation achievement, they get one."""
        try:
            records = [
                ParticipantAchievements(
                    participant_id=ep["id"],
                    round_id=self.round_id,
                    session_id=self.session_id,
                    achievement_id=self.participation_achievement.id,
                    earned_points=self.participation_achievement.points,
                    store_id=self.store_id,
                )
                for ep in self.existing_participants
            ]
            ParticipantAchievements.objects.bulk_create(records)
            increment_earned_counts(pairs_from_participant_achievements(records))
        except Exception as e:
            print(f"Error found while creating participant achievements: {e}")

    def build_participants_and_achievements(self):
        """Full process to get our stuff."""

        self.categorize_participants()
        self.create_new_participants()
        self.get_participants()
        self.create_participation_achievements()

        return self.participant_data

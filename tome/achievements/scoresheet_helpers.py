from typing import NamedTuple, Optional
from rest_framework.exceptions import NotFound
from django.db.models.functions import Coalesce

from sessions_rounds.models import Rounds, PodsParticipants, Pods
from achievements.models import Achievements, Commanders, WinningCommanders
from users.models import ParticipantAchievements, Decklists, DecklistsAchievements

from achievements.helpers import calculate_color_mask

pod_slugs = {
    "bring-snack",
    "submit-to-discord",
    "lend-deck",
    "knock-out",
    "money-pack",
}

winner_slugs = {
    "last-in-order",
    "commander-damage",
    "lose-the-game-effect",
    "win-the-game-effect",
    "zero-or-less-life",
}

DRAW_NAME = "END IN DRAW"


class ScoresheetBuildResult(NamedTuple):
    records: list[ParticipantAchievements]
    commander_name: Optional[str]
    colors_id: Optional[int]
    session_id: int
    winner_id: Optional[int]
    pods_participants: list[int]
    commander_id: int
    partner_id: Optional[int]
    companion_id: Optional[int]
    decklist_id: Optional[int]


class CommanderResult(NamedTuple):
    commander: Optional[dict]
    partner: Optional[dict]
    participant_id: Optional[int]


class GETScoresheetHelper:
    """Tab to assemble and return achievements for a given round/pod"""

    def __init__(self, round_id, pod_id):
        self.round_id = round_id
        self.pod_id = pod_id
        self.session_id = (
            Rounds.objects.filter(id=round_id)
            .values_list("session_id", flat=True)
            .first()
        )
        self.pod_participants = list(
            PodsParticipants.objects.filter(pods_id=self.pod_id)
            .select_related("participants")
            .values("participants_id", "participants__name")
        )

    def handle_commander(self):
        """Handle getting colors + names for a logged commander."""
        wc = (
            WinningCommanders.objects.filter(pods_id=self.pod_id, deleted=False)
            .values("participants_id", "name", "colors_id")
            .first()
        )
        if wc is None:
            return CommanderResult(commander=None, partner=None, participant_id=None)

        if wc.get("name") == DRAW_NAME:
            return CommanderResult(commander=None, partner=None, participant_id=None)

        name_list = wc["name"].split("+")
        commander = (
            Commanders.objects.filter(name=name_list[0])
            .values("id", "name", "colors_id")
            .first()
        )
        if len(name_list) > 1:

            partner = (
                Commanders.objects.filter(name=name_list[1])
                .values("name", "colors_id")
                .first()
            )

            return CommanderResult(
                commander=commander,
                partner=partner,
                participant_id=wc["participants_id"],
            )
        return CommanderResult(
            commander=commander, partner=None, participant_id=wc["participants_id"]
        )

    def build(self):
        is_submitted = (
            Pods.objects.filter(id=self.pod_id)
            .values_list("submitted", flat=True)
            .first()
        )
        if is_submitted is False:
            return {"meta": {"isSubmitted": is_submitted}}

        participant_rows = list(
            PodsParticipants.objects.filter(pods_id=self.pod_id)
            .select_related("participants")
            .values("participants_id", "participants__name")
        )
        participant_ids = [r["participants_id"] for r in participant_rows]
        participant_name_by_id = {
            r["participants_id"]: r["participants__name"] for r in participant_rows
        }

        qs = ParticipantAchievements.objects.filter(
            participant_id__in=participant_ids,
            round_id=self.round_id,
            session_id=self.session_id,
            deleted=False,
        ).select_related("achievement", "achievement__parent")

        earned = [
            {
                "participant_id": pa.participant_id,
                "achievement_id": pa.achievement_id,
                "achievement__slug": pa.achievement.slug,
                "achievement_full_name": pa.achievement.full_name,
            }
            for pa in qs
        ]

        wc = self.handle_commander()
        winner_id = None
        if wc.commander is not None:
            winner_id = wc.participant_id
            winner_dict = {
                "id": winner_id,
                "name": participant_name_by_id.get(winner_id),
            }

        else:
            winner_dict = None

        payload = {slug: [] for slug in pod_slugs} | {
            "meta": {"isSubmitted": is_submitted}
        }
        bool_slugs = winner_slugs | {"end-draw"}
        for slug in bool_slugs:
            payload[slug] = False

        payload.update(
            {
                "winner": winner_dict,
                "winner-commander": wc.commander,
                "partner-commander": wc.partner,
                "winner-achievements": [],
            }
        )

        winner_slug_set = set()

        for row in earned:
            pid = row["participant_id"]
            slug = row["achievement__slug"]

            if not slug or slug == "precon":
                if winner_id and pid == winner_id:
                    payload["winner-achievements"].append(
                        {
                            "id": row["achievement_id"],
                            "name": row["achievement_full_name"],
                        }
                    )
                continue

            if slug in pod_slugs:
                payload[slug].append(
                    {"id": pid, "name": participant_name_by_id.get(pid)}
                )
                continue

            if slug in bool_slugs:
                if slug == "end-draw":
                    payload["end-draw"] = True
                elif winner_id and pid == winner_id:
                    winner_slug_set.add(slug)

        for slug in winner_slugs:
            payload[slug] = slug in winner_slug_set

        return payload


class POSTScoresheetHelper:
    """Special class to help tabulate and assign points
    for a scoresheet."""

    def __init__(self, round_id, pod_id, **kwargs):
        self.records: list[ParticipantAchievements] = []
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.session_id = (
            Rounds.objects.filter(id=round_id)
            .values_list("session_id", flat=True)
            .first()
        )
        self.slug_achievements = Achievements.objects.filter(
            slug__isnull=False, deleted=False
        ).values("id", "slug", "point_value")
        self.pod_participants = PodsParticipants.objects.filter(
            pods_id=pod_id
        ).values_list("participants_id", flat=True)
        self.round_id = round_id
        self.pod_id = pod_id

    def build_slug_dicts(self):
        """Compose our slugged achievements into dicts, one
        for points and one for ids."""

        self.ids_by_slug = {i["slug"]: i["id"] for i in self.slug_achievements}
        self.points_by_slug = {
            i["slug"]: i["point_value"] for i in self.slug_achievements
        }

    def build_points_dict(self, achievement_ids):
        """Compose a dict of points by ID"""
        qs = (
            Achievements.objects.filter(id__in=achievement_ids, deleted=False)
            .annotate(true_value=Coalesce("point_value", "parent__point_value"))
            .values_list("id", "true_value")
        )

        return dict(qs)

    def build_pod_achievements(self):
        """Build achievement records for general pod achievements."""

        for poa in pod_slugs:
            pids = getattr(self, poa, [])

            if not pids:
                continue

            for p in pids:
                self.records.append(
                    ParticipantAchievements(
                        participant_id=p,
                        achievement_id=self.ids_by_slug[poa],
                        round_id=self.round_id,
                        session_id=self.session_id,
                        earned_points=self.points_by_slug[poa],
                    )
                )

    def build_winner_achievements(self):
        """Build achievement records for winner achievements."""
        winner = self.winner
        winner_achievements = getattr(self, "winner-achievements", [])

        for ws in winner_slugs:
            isTrue = getattr(self, ws, False)
            if isTrue:
                self.records.append(
                    ParticipantAchievements(
                        participant_id=winner,
                        achievement_id=self.ids_by_slug[ws],
                        round_id=self.round_id,
                        session_id=self.session_id,
                        earned_points=self.points_by_slug[ws],
                    )
                )

        points_dict = self.build_points_dict(winner_achievements)

        for wa in winner_achievements:
            self.records.append(
                ParticipantAchievements(
                    participant_id=winner,
                    achievement_id=wa,
                    round_id=self.round_id,
                    session_id=self.session_id,
                    earned_points=points_dict[wa],
                )
            )

    def build_win_colors(self):
        """Build the winning commander record."""
        winner_commander = getattr(self, "winner-commander", None)
        partner_commander = getattr(self, "partner-commander", None)
        companion_commander = getattr(self, "companion-commander", None)
        if winner_commander is None:
            raise NotFound(detail="Winner commander is required for non-draw games")

        c1 = Commanders.objects.get(id=winner_commander)
        c2 = Commanders.objects.filter(id=partner_commander).first()
        c3 = Commanders.objects.filter(id=companion_commander).first()

        color_ids = [c1.colors_id]
        name_list = [c1.name]

        if c2:
            name_list.append(c2.name)
            color_ids.append(c2.colors_id)

        if c3:
            name_list.append(c3.name)

        win_colors, colors_id = calculate_color_mask(color_ids)

        self.records.append(
            ParticipantAchievements(
                participant_id=self.winner,
                achievement_id=self.ids_by_slug[f"win-{win_colors}-colors"],
                round_id=self.round_id,
                session_id=self.session_id,
                earned_points=self.points_by_slug[f"win-{win_colors}-colors"],
            )
        )

        out_name = "+".join(name_list)

        return out_name, colors_id

    def build_draw(self):
        """Build records for all participants in the event of a draw."""

        self.records.extend(
            ParticipantAchievements(
                participant_id=p,
                achievement_id=self.ids_by_slug["end-draw"],
                round_id=self.round_id,
                session_id=self.session_id,
                earned_points=self.points_by_slug["end-draw"],
            )
            for p in self.pod_participants
        )

    def build(self):
        """Compile all of the data and ship it back to be saved"""

        if not self.session_id:
            raise NotFound(detail="Session not found for round")

        self.build_slug_dicts()

        self.build_pod_achievements()

        is_draw = getattr(self, "end-draw", False)
        if is_draw:
            self.build_draw()
            return ScoresheetBuildResult(
                self.records,
                None,
                None,
                self.session_id,
                None,
                self.pod_participants,
                None,
                None,
                None,
                None,
            )
        else:
            self.build_winner_achievements()
            combined_name, color_id = self.build_win_colors()
            code = getattr(self, "decklist-code", None)
            commander = getattr(self, "winner-commander")
            partner_commander = getattr(self, "partner-commander", None)
            companion_commander = getattr(self, "companion-commander", None)
            decklist_id = None

            if code:
                decklist = Decklists.objects.get(code=f"DL-{code}")
                decklist_id = decklist.id

            return ScoresheetBuildResult(
                self.records,
                combined_name,
                color_id,
                self.session_id,
                self.winner,
                self.pod_participants,
                commander,
                partner_commander,
                companion_commander,
                decklist_id,
            )

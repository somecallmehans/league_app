from typing import NamedTuple, Optional
from rest_framework.exceptions import NotFound

from sessions_rounds.models import Rounds, PodsParticipants
from achievements.models import Achievements, Commanders
from users.models import ParticipantAchievements

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


class ScoresheetBuildResult(NamedTuple):
    records: list
    commander_name: Optional[str]
    colors_id: Optional[int]
    pod_id: int
    round_id: int
    session_id: int
    winner_id: Optional[int]


class ScoresheetHelper:
    """Special class to help tabulate and assign points
    for a scoresheet."""

    def __init__(self, **kwargs):
        self.records: list[ParticipantAchievements] = []
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.session_id = (
            Rounds.objects.filter(id=kwargs["round_id"])
            .values_list("session_id", flat=True)
            .first()
        )
        self.slug_achievements = Achievements.objects.filter(
            slug__isnull=False, deleted=False
        ).values("id", "slug", "point_value")

    def build_slug_dicts(self):
        """Compose our slugged achievements into dicts, one
        for points and one for ids."""

        self.ids_by_slug = {i["slug"]: i["id"] for i in self.slug_achievements}
        self.points_by_slug = {
            i["slug"]: i["point_value"] for i in self.slug_achievements
        }

    def build_pod_achievements(self):
        """Build achievement records for general pod achievements."""

        for poa in pod_slugs:
            pids = getattr(self, poa)
            for p in pids:
                self.records.append(
                    ParticipantAchievements(
                        participant_id=p,
                        achievement_id=self.ids_by_slug[poa],
                        round_id=self.round_id,
                        session_id=self.session_id,
                        earned_points=self.ids_by_slug[poa],
                    )
                )

    def build_winner_achievements(self):
        """Build achievement records for winner achievements."""
        winner = self.winner
        winner_achievements = getattr(self, "winner-achievements")

        for ws in winner_slugs:
            isTrue = getattr(self, ws)
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
        points = Achievements.objects.filter(id__in=winner_achievements).values(
            "id", "point_value"
        )
        points_dict = {p["id"]: p["point_value"] for p in points}

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
        winner_commander = getattr(self, "winner-commander")
        partner_commander = getattr(self, "partner-commander")
        c1 = Commanders.objects.get(id=winner_commander)
        c2 = Commanders.objects.filter(id=partner_commander).first()
        cids = [c1.colors_id]
        c_name = c1.name
        if c2:
            c_name = f"{c1.name}+{c2.name}"
            cids.append(c2.colors_id)

        win_colors, colors_id = calculate_color_mask(cids)

        self.records.append(
            ParticipantAchievements(
                participant_id=self.winner,
                achievement_id=self.ids_by_slug[f"win-{win_colors}-colors"],
                round_id=self.round_id,
                session_id=self.session_id,
                earned_points=self.points_by_slug[f"win-{win_colors}-colors"],
            )
        )

        return c_name, colors_id

    def build_draw(self):
        """Build records for all participants in the event of a draw."""

        pids = PodsParticipants.objects.filter(pods_id=self.pod_id).values_list(
            "participants_id", flat=True
        )
        self.records.extend(
            ParticipantAchievements(
                participant_id=p,
                achievement_id=self.ids_by_slug["end-draw"],
                round_id=self.round_id,
                session_id=self.session_id,
                earned_points=self.points_by_slug["end-draw"],
            )
            for p in pids
        )

    def build(self):
        """Compile all of the data and ship it back to be saved"""

        if not self.session_id:
            raise NotFound(detail="Session not found for round")

        self.build_slug_dicts()

        self.build_pod_achievements()

        is_draw = getattr(self, "end-draw")
        if is_draw:
            self.build_draw()

            return ScoresheetBuildResult(
                self.records,
                None,
                None,
                self.pod_id,
                self.round_id,
                self.session_id,
                None,
            )
        else:
            self.build_winner_achievements()
            c_name, c_id = self.build_win_colors()
            return ScoresheetBuildResult(
                self.records,
                c_name,
                c_id,
                self.pod_id,
                self.round_id,
                self.session_id,
                self.winner,
            )

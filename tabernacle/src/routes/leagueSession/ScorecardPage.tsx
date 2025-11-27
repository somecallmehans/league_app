const PLAYER_ACHIEVEMENT_MAP = [
  { label: "Did anyone bring a snack to share?", slug: "bring-snack" },
  {
    label: "Did anyone use a decklist that has been shared on Discord?",
    slug: "submit-to-discord",
  },
  {
    label: "Did anyone lend a deck to another league participant?",
    slug: "lend-deck",
  },
  {
    label: "Did anyone who did not win knock out other players?",
    slug: "knock-out",
  },
];

const PLAYER_WIN_MAP = [
  {
    label: "Win while going last in turn order",
    slug: "last-in-order",
  },
  {
    label: "Win while dealing lethal commander damage",
    slug: "commander-damage",
  },
  {
    label: "Win via a lose the game effect",
    slug: "lose-the-game-effect",
  },
  {
    label: "Win via a win the game effect",
    slug: "win-the-game-effect",
  },
  {
    label: "Win while being at zero or less life",
    slug: "zero-or-less-life",
  },
];

export default function ScorecardPage() {
  return <div>SCORING!</div>;
}

export type NodeChild = { id: string; name: string; to: string };

export type Node = {
  id: number;
  name: string;
  to: string;
  admin: boolean;
  icon: string;
  children?: Array<NodeChild>;
};

export const navLinks: Array<Node> = [
  { id: 1, name: "Home", to: "/", admin: false, icon: "fa-solid fa-house" },
  {
    id: 2,
    name: "Info",
    to: "/info",
    admin: false,
    icon: "fa-solid fa-circle-info",
  },
  {
    id: 3,
    name: "Standings",
    admin: false,
    icon: "fa-solid fa-ranking-star",
    to: "",
    children: [
      { id: "3a", name: "Leaderboard", to: "/leaderboard" },
      { id: "3b", name: "Champions", to: "/champions" },
    ],
  },
  {
    id: 8,
    name: "Pairings",
    to: "/pods",
    admin: false,
    icon: "fa-solid fa-landmark",
  },
  {
    id: 4,
    name: "Achievements",
    to: "/achievements",
    admin: false,
    icon: "fa-solid fa-star",
  },
  {
    id: 7,
    name: "Stats",
    to: "/metrics",
    icon: "fa-solid fa-square-poll-vertical",
    admin: false,
  },
  {
    id: 5,
    name: "Admin",
    to: "/management",
    admin: true,
    icon: "fa-solid fa-list-check",
  },
  {
    id: 6,
    name: "Rounds",
    to: "/league-session",
    admin: true,
    icon: "fa-solid fa-gamepad",
  },
];

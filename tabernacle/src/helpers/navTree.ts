export type NodeChild = { id: string; name: string; to: string };

export type Node = {
  id: number;
  name: string;
  to: string;
  admin: boolean;
  icon: string;
  children?: Array<NodeChild>;
  hideWhenLoggedIn?: boolean;
};

export const navLinks: Array<Node> = [
  { id: 1, name: "Home", to: "/", admin: false, icon: "fa-solid fa-house" },
  {
    id: 2,
    name: "Info",
    to: "",
    admin: false,
    icon: "fa-solid fa-circle-info",
    children: [
      { id: "2a", name: "Resources & FAQs", to: "/faqs" },
      { id: "2b", name: "Submitted Decklists", to: "/decklists" },
    ],
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
    id: 9,
    name: "Admin",
    to: "",
    admin: false,
    icon: "fa-solid fa-lock",
    hideWhenLoggedIn: true,
    children: [{ id: "9a", name: "Login", to: "/login" }],
  },
  {
    id: 10,
    name: "Admin",
    to: "",
    admin: true,
    icon: "fa-solid fa-unlock",
    children: [
      { id: "10a", name: "Rounds", to: "/league-session" },
      { id: "10b", name: "Management", to: "/management" },
      { id: "10c", name: "Logout", to: "/logout" },
    ],
  },
];

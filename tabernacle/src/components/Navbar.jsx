import React from "react";
import { NavLink } from "react-router-dom";
import LoginPopover from "./LoginPopover";

const navLinks = [
  { id: 1, name: "Home", to: "/", admin: false },
  { id: 2, name: "FAQ", to: "/faq", admin: false },
  { id: 3, name: "Leaderboard", to: "/leaderboard", admin: false },
  { id: 4, name: "Achievements", to: "/achievements", admin: false },
  { id: 5, name: "Admin", to: "/management", admin: true },
  {
    id: 6,
    name: "League",
    to: "/league-session",
    admin: true,
  },
];

export default function Navbar({ loggedIn, setLoggedIn }) {
  return (
    <nav className="container flex p-5 bg-slate-800 max-w-full">
      <div className="flex items-center text-base">
        {navLinks
          .filter((link) => !link.admin || (link.admin && loggedIn))
          .map(({ id, name, to }) => (
            <NavLink
              key={id}
              className="mr-5 text-slate-50 text-2xl hover:text-sky-200 hover:underline "
              to={to}
            >
              {name}
            </NavLink>
          ))}
      </div>
      <div className="flex-grow" />
      <LoginPopover loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </nav>
  );
}

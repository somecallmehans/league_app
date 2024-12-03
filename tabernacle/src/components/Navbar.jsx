import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import LoginPopover from "./LoginPopover";

const navLinks = [
  { id: 1, name: "Home", to: "/", admin: false },
  { id: 2, name: "FAQ", to: "/faq", admin: false },
  { id: 3, name: "Leaderboard", to: "/leaderboard", admin: false },
  { id: 4, name: "Achievements", to: "/achievements", admin: false },
  {
    id: 7,
    name: "Metrics",
    to: "/metrics",
  },
  { id: 5, name: "Admin", to: "/management", admin: true },
  {
    id: 6,
    name: "League",
    to: "/league-session",
    admin: true,
  },
];

export default function Navbar({ loggedIn, setLoggedIn }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="text-slate-50 bg-slate-800">
      <div className="container mx-auto flex items-center justify-between p-4">
        <button
          className="sm:hidden focus:outline-none"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="material-icons text-slate-50">
            <i className="fa-solid fa-bars" />
          </span>
        </button>

        <div className="hidden sm:flex space-x-4">
          {navLinks
            .filter((link) => !link.admin || (link.admin && loggedIn))
            .map(({ id, name, to }) => (
              <NavLink
                key={id}
                className="text-slate-50 text-2xl hover:text-sky-200 hover:underline "
                to={to}
              >
                {name}
              </NavLink>
            ))}
        </div>

        <div className="flex-grow ml-4" />
        <LoginPopover loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      </div>
      {menuOpen && (
        <div className="sm:hidden bg-slate-700">
          {navLinks
            .filter((link) => !link.admin || (link.admin && loggedIn))
            .map(({ id, name, to }) => (
              <NavLink
                key={id}
                className="block px-4 py-2 text-lg hover:bg-slate-600 hover:text-sky-200"
                to={to}
                onClick={() => setMenuOpen(false)}
              >
                {name}
              </NavLink>
            ))}
        </div>
      )}
    </nav>
  );
}

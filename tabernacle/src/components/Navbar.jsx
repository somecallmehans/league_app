import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import LoginPopover from "./LoginPopover";

const navLinks = [
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
    name: "Leaderboard",
    to: "/leaderboard",
    admin: false,
    icon: "fa-solid fa-ranking-star",
  },
  {
    id: 8,
    name: "History",
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

export default function Navbar({ loggedIn, setLoggedIn }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
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
        <div className="hidden sm:flex sm:gap-4">
          {navLinks
            .filter((link) => !link.admin || (link.admin && loggedIn))
            .map(({ id, name, to, icon }) => {
              const activeTab = pathname === to;
              return (
                <NavLink key={id} to={to}>
                  <div
                    className={`${
                      activeTab ? "text-sky-300" : ""
                    }  hover:text-sky-200 
                  flex flex-col items-center
                  transition-all duration-200 ease-out
                  hover:-translate-y-0.5`}
                  >
                    <i className={`${icon} no-underline text-xl`} />
                    <div>{name}</div>
                  </div>
                </NavLink>
              );
            })}
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

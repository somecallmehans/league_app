import React, { useState, Fragment } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, Transition, Disclosure } from "@headlessui/react";
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
    name: "Standings",
    admin: false,
    icon: "fa-solid fa-ranking-star",
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

function DesktopDropdown({ link }) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={`flex flex-col items-center hover:text-sky-200 transition-all duration-200 ease-out hover:-translate-y-0.5`}
      >
        {link.icon && <i className={`${link.icon} text-xl`} />}
        <div className="flex items-center gap-1">
          <span>{link.name}</span>
          <i className="fa-solid fa-chevron-down text-xs mt-[2px]" />
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Menu.Items className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 origin-top rounded-xl bg-slate-800 shadow-lg ring-1 ring-black/10 focus:outline-none py-2">
          {link.children.map((child) => (
            <Menu.Item key={child.id}>
              {({ active }) => (
                <NavLink
                  to={child.to}
                  className={`block px-4 py-2 text-sm ${
                    active ? "bg-slate-700 text-sky-200" : "text-slate-100"
                  }`}
                >
                  {child.name}
                </NavLink>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function MobileDisclosure({ link, close, isActive }) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="text-left">
          <Disclosure.Button className="flex w-full items-center justify-end rounded-xl py-3 text-2xl font-medium text-slate-100">
            <i
              className={`fa-solid  mr-2 text-base transition-transform ${
                open ? "-rotate-180 fa-minus" : "fa-plus"
              }`}
            />
            <span>{link.name}</span>
          </Disclosure.Button>

          <div className="relative">
            <span
              className="pointer-events-none absolute right-0 top-0 w-[2px] bg-sky-500 origin-top transition-transform duration-300 ease-in-out"
              style={{
                transform: open ? "scaleY(1)" : "scaleY(0)",
                height: "100%",
              }}
            />
            <Disclosure.Panel static>
              <div
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out
                        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
              >
                {link.children.map((child) => (
                  <div key={child.id} className="pl-6">
                    <NavLink
                      to={child.to}
                      onClick={close}
                      className={`${
                        isActive(child.to) ? "text-sky-300" : "text-slate-200 "
                      } block rounded-lg px-4 py-2 text-xl text-right`}
                    >
                      {child.name}
                    </NavLink>
                  </div>
                ))}
              </div>
            </Disclosure.Panel>
          </div>
        </div>
      )}
    </Disclosure>
  );
}

export default function Navbar({ loggedIn, setLoggedIn }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const filtered = navLinks.filter((l) => !l.admin || (l.admin && loggedIn));

  const isActive = (to) => pathname === to;
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
          {filtered.map((link) => {
            if (link.children?.length) {
              return (
                <DesktopDropdown
                  key={link.id}
                  link={link}
                  isActive={isActive(link.to)}
                />
              );
            }
            const { id, to, icon, name } = link;
            return (
              <NavLink key={id} to={to}>
                <div
                  className={`${
                    isActive(link.to) ? "text-sky-300" : ""
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
      {/* Mobile nav */}
      <div
        id="mobile-nav-overlay"
        role="dialog"
        aria-modal="true"
        className={`sm:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70"
          onClick={() => setMenuOpen(false)}
        />

        <button
          aria-label="Close navigation menu"
          className={`absolute right-4 top-4 text-slate-200 hover:text-white transition ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        >
          <i className="fa-solid fa-xmark text-2xl" />
        </button>

        <div
          className={`relative mx-auto w-full max-w-md px-6 
                      transition-transform duration-300 ease-out
                      ${menuOpen ? "translate-y-0" : "translate-y-3"}`}
          style={{ top: "25%" }}
        >
          <nav className="flex flex-col items-stretch text-right space-y-1">
            {filtered.map((link) =>
              link.children?.length ? (
                <MobileDisclosure
                  key={link.id}
                  link={link}
                  close={() => setMenuOpen(false)}
                  isActive={isActive}
                />
              ) : (
                <NavLink
                  key={link.id}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block w-full rounded-xl py-3 text-2xl font-medium 
                              ${
                                isActive(link.to)
                                  ? "text-sky-300"
                                  : "text-slate-100"
                              }`}
                >
                  {link.name}
                </NavLink>
              )
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}

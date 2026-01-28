import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-gradient-to-t from-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500 leading-relaxed">
            <p>
              Magic: the Gathering card information and graphics on this website
              are copyright Wizards of the Coast, a subsidiary of Hasbro, Inc.
              Commander League is not produced by, endorsed by, supported by, or
              affiliated with Wizards of the Coast
            </p>
            <p>
              All card data is provided by Scryfall. Commander League is not
              produced by or endorsed by Scryfall.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600">
            <Link
              to="/leaderboard"
              className="hover:text-zinc-900 transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              to="/decklists"
              className="hover:text-zinc-900 transition-colors"
            >
              Decklists
            </Link>
            <Link
              to="/achievements"
              className="hover:text-zinc-900 transition-colors"
            >
              Achievements
            </Link>
            <Link to="/faqs" className="hover:text-zinc-900 transition-colors">
              FAQs
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

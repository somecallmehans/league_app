import React from "react";

import Tooltip from "../../components/Tooltip";

const CodeOfConduct = () => (
  <section className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 mb-8 shadow-lg">
    <h2 className="text-2xl font-bold text-blue-600 mb-4">
      Be Excellent to Each Other
    </h2>
    <p className="leading-relaxed">
      There is inherent tension between the Commander format and leagues as
      concepts. While Commander was invented as a strictly casual respite for
      judges, leagues of any kind are inherently competitive.
    </p>
    <p className="leading-relaxed mt-4">
      League participants are required to be kind and respectful to all other
      league participants at all times. Bigotry in any form will not be
      tolerated, nor will cheating.
    </p>
    <p className="leading-relaxed mt-4">
      Respecting fellow participants also requires maintaining a basic standard
      of cleanliness. Mimic’s Market sells artisanal soaps if you would like to
      go above and beyond in this regard!
    </p>
  </section>
);

const SuddenDeathContent = () => (
  <div className="flex flex-col p-2">
    <span className="mb-2">All players life totals become 1.</span>
    <span className="mb-2">
      Life cannot be gained, damage cannot be prevented, extra turns are
      skipped.
    </span>
    <span className="mb-2">
      Each player gets one more full turn, after which the game is a draw.
    </span>
  </div>
);

const ScheduleSection = () => (
  <section className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 mb-8 shadow-lg">
    <h2 className="text-2xl font-bold text-blue-600 mb-4">League Schedule</h2>
    <p className="leading-relaxed">
      Each league begins on the first Sunday of the month, repeats weekly, and
      concludes on the month’s final Sunday.
    </p>
    <ul className="list-disc pl-5 mt-4">
      <li>
        <b className="text-blue-600">Round One:</b> 12:30 PM
      </li>
      <li>
        <b className="text-blue-600">Round Two:</b> 2:30 PM
      </li>
    </ul>
    <p className="leading-relaxed mt-4">
      Pod assignments for round one are random. In round two, pod assignments
      are ranked by league standings.
    </p>
    <Tooltip content={<SuddenDeathContent />} direction="top">
      <div className="bg-blue-400 text-black text-center py-2 mt-4 rounded-lg font-bold">
        Sudden Death Rules Apply After 90 Minutes
      </div>
    </Tooltip>
  </section>
);

const DescriptionSection = () => (
  <section className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 mb-8 shadow-lg">
    <h2 className="text-2xl font-bold text-blue-600 mb-4">
      What is Commander League?
    </h2>
    <p className="leading-relaxed">
      During each month’s league, players earn points by winning official games
      with decks that meet criteria for “achievements.” The more restrictive the
      criteria, the more points an achievement is worth. Essentially, Commander
      League is a month-long tournament of deck building challenges roughly
      weighted by difficulty.
    </p>
    <p className="leading-relaxed mt-4">
      Commander League offers a fun and challenging experience for intermediate
      and advanced players. Beginners are welcome too and will have fun! But
      note:{" "}
      <span className="underline decoration-blue-800">
        players are empowered to use any and all strategies in pursuit of league
        points.
      </span>
    </p>
  </section>
);

const HomeHeader = () => (
  <header className="text-center mb-4">
    <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-blue-600 to-blue-200 py-2">
      Greetings Elder Dragons
    </h1>
    <p className="text-xl font-bold mt-4">Welcome to Commander League!</p>
    <p className="text-sm mt-2">
      A unique play environment for advanced “Elder Dragon Highlander” games of
      Magic: The Gathering!
    </p>
  </header>
);

export default function Home() {
  return (
    <div className="min-h-screen text-black p-8">
      <div className="max-w-4xl mx-auto">
        <HomeHeader />
        <DescriptionSection />
        <ScheduleSection />
        <CodeOfConduct />
      </div>
    </div>
  );
}

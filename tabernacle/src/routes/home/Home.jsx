import React from "react";
import PageTitle from "../../components/PageTitle";

export default function Home() {
  return (
    <div className="p-8">
      <PageTitle title="Greetings Elder Dragons" />
      <p>
        …and welcome to Commander League: A unique play environment for advanced
        “Elder Dragon Highlander” a.k.a. “Commander” games of “Magic: The
        Gathering!” During each month’s league, players earn points by winning
        official games with decks that meet criteria for “achievements.” The
        more restrictive the criteria, the more points an achievement is worth.
        Basically, Commander League is a month-long tournament of deck building
        challenges roughly weighted by difficulty. Commander League offers a fun
        and challenging experience for intermediate and advanced players.
        Beginners are welcome too and will have fun! But note:{" "}
        <u>
          players are empowered to use any and all strategies in pursuit of
          league points.
        </u>
      </p>
      <p className="my-4">
        Each league begins on the first Sunday of the month, repeats weekly, and
        concludes on the month’s final Sunday. Each week,{" "}
        <b>round one begins at 12:30pm</b>, and <b>round two at 2:30pm</b>. Pod
        assignments for round one are random. In round two, pod assignments are
        ranked by league standings: players with the most points are grouped
        together, as are players with the fewest points. Each round, after 90
        minutes, “sudden death” ensues. As the next turn begins, all players’
        life totals become 1. For the rest of the game, players can’t gain life,
        damage can’t be prevented, and extra turns are skipped. Each player may
        play one more full turn, after which the game is a draw.
      </p>
      <div className="text-2xl font-bold border-0 border-t py-2 border-slate-400">
        Be Excellent to Each Other
      </div>
      <p className="my-2">
        There is inherent tension between the Commander format and leagues as
        concepts. Where Commander was invented as a strictly casual respite for
        judges after long days working Magic events, leagues of any kind are
        inherently competitive. “Commander League’s” difficult task is to add a
        degree of competitive intrigue that only an LGS can offer, without
        abandoning Commander’s core “fun and fair” ethos.
      </p>
      <p className="my-2">
        The current iteration of league is a fourth attempt at this challenge.
        While each iteration brings us closer to our target metagame, there will
        inevitably be imbalances and oversights. As these are discovered, please
        approach them patiently and constructively.
      </p>
      <p className="my-2">
        League participants are required to be kind and respectful to all other
        league participants at all times. Bigotry in any form will not be
        tolerated, nor will cheating. Respecting fellow participants also
        requires maintaining a basic standard of cleanliness. Mimic’s Market
        sells artisanal soaps if you would like to go above and beyond in this
        regard!
      </p>
    </div>
  );
}

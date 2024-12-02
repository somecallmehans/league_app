import React from "react";

export const faqInfo = [
  {
    id: 1,
    title: "League Schedule",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Each league begins on the first Sunday of the month, repeats weekly,
          and concludes on the month’s final Sunday.
        </p>
        <p className="mb-2">
          Each week, round one begins at 12:30pm, and round two at 2:30pm. Pod
          assignments for round one are random. In round two, pod assignments
          are ranked by league standings: players with the most points are
          grouped together, as are players with the fewest points.
        </p>
        <p className="mb-2">
          Each round, after 90 minutes, “sudden death” ensues. As the next turn
          begins, all players’ life totals become 1. For the rest of the game,
          players can’t gain life, damage can’t be prevented, and extra turns
          are skipped. Each player may play one more full turn, after which the
          game is a draw.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Proxy Policy",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Players are allowed to use any number of proxies during league games.
          Two of these proxies may be of comparable quality to “basic land with
          sharpie writing.” The rest must be visually distinct from one another
          such that players can easily distinguish them from a across the table.
        </p>
        <p className="mb-2">
          <a href="https://mtgprint.net/">MTG Print</a> is a useful resource for
          formatting proxy prints and Mimic’s Market offers color printing at a
          reasonable price! League participants also periodically order
          high-quality proxies as a group - ask around!
        </p>
      </div>
    ),
  },
  {
    id: 3,
    title: "Booster Packs",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Players must purchase one booster pack from Mimic’s Market for each
          league game that they participate in. These packs begin in each
          player’s command zone and may be given to other players throughout the
          game. When a pack is given away, it is removed from the game and
          cannot be given away again. At the end of the game, booster packs
          remaining in command zones must be given away.
        </p>
        <p className="mb-2">
          These packs may be used politically. For example, a player selected to
          separate “Fact or Fiction” piles might put a booster pack in one pile,
          and all five cards in the other. Or, at the beginning of combat, a
          player may offer their pack in exchange for their opponent attacking
          someone else. Often, players wait until the end of the game to give
          away packs, in turn order. Any mix of these approaches is fine! And if
          players would like to support the store even more (and have slightly
          more leverage in their game), they are welcome to buy premium packs
          for entry!
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: "Winning the League",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          While someone will finish with more points than others, the real
          winner is the player who has the most fun along the way. In that
          spirit, prizes for winning are much less valuable than the booster
          packs most players will earn over the course of league games.
        </p>
        <p className="mb-2">
          At the end of each season, Mimic’s Market will provide eight prize
          piles. The league champion will choose one pile to keep. The runner up
          chooses second, third place chooses third, and so on. If a player is
          absent, Mimic’s Market will hold their prize until they return!
        </p>
      </div>
    ),
  },
  {
    id: 5,
    title: "Updating the League",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Currently, Commander League’s rules are the product of benevolent
          dictatorship. While lively discussion about the league continues on
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://discord.com/channels/1123750208937938964/1203058271620038756"
          >
            {" "}
            Mimic’s Market’s Discord server
          </a>
          , ultimately, just one person finalizes each season’s rules, without
          any defined process. Every effort is made to integrate community
          feedback and govern by consensus, but a more democratic model might be
          preferable someday.
        </p>
        <p className="mb-2">
          Until then, any changes to league rules will occur between monthly
          seasons. If you have ideas for new achievements or would like to see a
          rule changed, bring it up at league or on Discord!
        </p>
      </div>
    ),
  },
  {
    id: 6,
    title: "League Location + Discord",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          You can find us at our home,{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://mimicsmarket.com/"
            target="_blank"
            rel="noreferrer"
          >
            Mimic’s Market
          </a>
          , located at 4707 Liberty Ave, Pittsburgh, PA 15224; visit their site
          to learn about all of their events and more!
        </p>
        <p className="mb-2">
          Also visit our online home,{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://discord.gg/zmfQbzmU7u"
            target="_blank"
            rel="noreferrer"
          >
            the Mimic’s Market Discord Server!
          </a>
        </p>
      </div>
    ),
  },
  {
    id: 7,
    title: "Shared Decklists",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          If you&apos;d like opportunity to win more points during league, be
          sure to submit your decklist to{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://docs.google.com/document/d/1OoR3nKuWdfuEOzegfyM4QuPZFXtYOi-fsrKGOGlplpM/edit?tab=t.0"
            target="_blank"
            rel="noreferrer"
          >
            our shared league decklist page.
          </a>
        </p>
        <p className="mb-2">
          Please note: you <b>MUST</b> share your decklist in the
          mtg-commander-league channel on the official{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://discord.gg/zmfQbzmU7u"
            target="_blank"
            rel="noreferrer"
          >
            Mimic&apos;s Market Discord Server
          </a>{" "}
          to be elligible for this achievement.
        </p>
      </div>
    ),
  },
];

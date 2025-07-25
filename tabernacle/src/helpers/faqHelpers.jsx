import React from "react";

export const resourceInfo = [
  {
    id: 1,
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
  {
    id: 2,
    title: "Deckbuilding For Commander League 101 (by pogobat)",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Learn more about how to make engaging in Commander League&apos;s point
          structure easier by{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://youtu.be/YhOVOVesfY8?si=2zqfl_k_NwvNk818"
            target="_blank"
            rel="noreferrer"
          >
            checking out this 30 minute video lesson
          </a>{" "}
          by pogobat.
        </p>
        <p className="mb-2">In this video you&apos;ll learn:</p>
        <ul>
          <li className="italic text-sm">
            - How to use Scryfall.com for advanced card queries
          </li>
          <li className="italic text-sm">
            - How to use Moxfield.com to design decks
          </li>
          <li className="italic text-sm">
            - How to copy/paste Scryfall queries into Moxfield so that you can
            add search results to your deck with one click{" "}
          </li>
          <li className="italic text-sm">
            - How to order search results by “EDHREC Rank” to save time finding
            the best cards How to “Update to Cheapest” on Moxfield for our
            budget achievements
          </li>{" "}
          <li className="italic text-sm">
            - How Moxfield’s tagging system can help you understand your own
            decks (and figure out what to cut)
          </li>
        </ul>
      </div>
    ),
  },
  //
  {
    id: 3,
    title: "Decklist Point Tracker (by redwizard42)",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          A tool for tallying the number of deckbuilding achievements a deck is
          worth. Click <b>file</b> -{">"} <b>Make a copy</b> to create a copy
          for personal use.
        </p>
        <p className="mb-2">
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://docs.google.com/spreadsheets/d/1_5DisOFwnczODFYLu01vRSJ839GmUvJ7dNyVkvP5A3c/edit?gid=0#gid=0"
            target="_blank"
            rel="noreferrer"
          >
            Link to the spreadsheet tool.
          </a>
        </p>
      </div>
    ),
  },
];

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
          Each week, round one begins at 1:30pm, and round two at 3:30pm. Pod
          assignments for round one are random. In round two, pod assignments
          are ranked by league standings: players with the most points are
          grouped together, as are players with the fewest points.
        </p>
        <p className="mb-2">
          Each round, after 90 minutes, “sudden death” ensues. As the next turn
          begins, each player plays one more turn. If the game is not over, it
          is a draw.
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
          such that players can easily distinguish them from across the table.
        </p>
        <p className="mb-2">
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://mtgprint.net/"
            target="_blank"
            rel="noreferrer"
          >
            MTG Print
          </a>{" "}
          is a useful resource for formatting proxy prints and Mimic’s Market
          offers color printing at a reasonable price! League participants also
          periodically order high-quality proxies as a group - ask around!
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
  // {
  //   id: 4,
  //   title: "Winning the League",
  //   Component: () => (
  //     <div className="py-2">
  //       <p className="mb-2">
  //         While someone will finish with more points than others, the real
  //         winner is the player who has the most fun along the way. In that
  //         spirit, prizes for winning are much less valuable than the booster
  //         packs most players will earn over the course of league games.
  //       </p>
  //       {/* <p className="mb-2">
  //         At the end of each season, Mimic’s Market will provide eight prize
  //         piles. The league champion will choose one pile to keep. The runner up
  //         chooses second, third place chooses third, and so on. If a player is
  //         absent, Mimic’s Market will hold their prize until they return!
  //       </p> */}
  //     </div>
  //   ),
  // },
  {
    id: 5,
    title: "Updating the League",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Commander League&apos;s rules are the product of a council of
          dedicated players who monitor league play and meet bi-quarterly to
          discuss potential changes to league structure, with the changes
          themselves rolled out quarterly. Lively discussion about the league
          continues on
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://discord.com/channels/1123750208937938964/1203058271620038756"
          >
            {" "}
            Mimic’s Market’s Discord server
          </a>{" "}
          and every effort is made to integrate community feedback.
        </p>
        {/* <p className="mb-2">
          Until then, any changes to league rules will occur between monthly
          seasons. If you have ideas for new achievements or would like to see a
          rule changed, bring it up at league or on Discord!
        </p> */}
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
    id: 8,
    title: "About This Site",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          This site is built and maintained by{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://christianwillanderson.com"
            target="_blank"
            rel="noreferrer"
          >
            Christian (Christo) Anderson
          </a>
          .
        </p>
        <p>
          Questions, comments, or feedback? Email him at{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            target="_blank"
            rel="noreferrer"
            href="mailto:christianwillanderson@gmail.com"
          >
            christianwillanderson@gmail.com
          </a>
          .
        </p>
      </div>
    ),
  },
];

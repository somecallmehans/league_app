import { type ReactNode } from "react";

type ResourceInfo = {
  id: number;
  title: string;
  Component: () => ReactNode;
};

export const resourceInfo: ResourceInfo[] = [
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
    title: "When Is Commander League?",
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
    id: 10,
    title: "Do I Need A Special Deck To Participate?",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Nope! Any (commander legal) deck is valid to participate in league.
          The league meta tries to target around precon power-level, but playing
          games higher (or lower) in power is not uncommon. The most important
          thing is to have a Rule 0 conversation with your pod prior to the game
          starting, especially if you're playing a deck that wasn't built with
          league points in mind.{" "}
        </p>
        <p className="mb-2">
          If you want to participate but feel your deck might be overpowered for
          your pod, many league participants would be more than happy to lend a
          deck as well!
        </p>
      </div>
    ),
  },
  {
    id: 11,
    title: "How Do Achievements Work?",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          Achievements are split into several categories which you can view on
          our{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://commanderleague.xyz/achievements"
          >
            Achievement's Page
          </a>
          . Each month, participants brew decks that abide by as many or as few
          of these achievements as they'd like; for each achievement your deck
          qualifies for, you are awarded those points when you meet the
          achievement's criteria.
        </p>
        <p className="mb-2">
          For example: a two-color (3pts) deck that is modern legal (2pts) with
          at least 44 legendary cards (3pts) and no instants or sorceries (4pts)
          would earn 12 points upon winning a game.
        </p>
        <p className="mb-2">
          Achievement points aren't just awarded for deckbuilding either! You
          can earn additional achievements by doing things like bringing a
          snack, sharing your decklist in our discord channel, lending a deck,
          etc.
        </p>
      </div>
    ),
  },
  {
    id: 12,
    title: "I Want To Participate, How Do I Sign Up?",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          There are multiple ways that you can register for league in advance!
          Additionally, as long as there is space available, walk ins are always
          welcome!
        </p>
        <h3 className="mb-2 font-bold">1. How can I sign in via discord?</h3>
        <p className="mb-2">
          If you aren't already a member, head over to the{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://discord.com/channels/1123750208937938964/1203058271620038756"
          >
            {" "}
            Mimic’s Market’s Discord server
          </a>{" "}
          and join our Commander League channel. If you've previously
          participated in league, you just need to type{" "}
          <code className="bg-slate-200">/link</code> in the message box, then
          use <code className="bg-slate-200">/signin</code> to register for any
          upcoming league rounds.
        </p>

        <h3 className="mb-2 font-bold">
          2. How can I sign in via this website?{" "}
        </h3>
        <p className="mb-2">
          Similar to option 1, head over to discord and{" "}
          <code className="bg-slate-200">/link</code> your discord to your
          league history. You will be provided a unique, six character sign-in
          code that you can use to sign in for open rounds on{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://www.commanderleague.xyz/pods"
          >
            our pairings page
          </a>
          . Just click the big blue "Sign In" button, enter your code, and
          select the rounds you'd like to participate in.
        </p>

        <h3 className="mb-2 font-bold">
          3. I have never participated in commander league and can't use{" "}
          <code className="bg-slate-200">/link</code> in the discord, what
          should I do?
        </h3>
        <p className="mb-2">
          That's no problem! Post in the commander league channel and an admin
          will add you to our league database. You will be able to use the
          command after that.
        </p>

        <h3 className="mb-2 font-bold">
          4. I don't have discord, what should I do?
        </h3>
        <p>
          That's no problem either! Feel free to stop by Mimic's Market during
          league or reach out to{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://christianwillanderson.com"
            target="_blank"
            rel="noreferrer"
          >
            Christian (Christo) Anderson
          </a>
          . He will set you up in the league database and provide you a unique
          login code you can use on our sign in page (i.e. option 2 above).
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "What Is Commander League's Proxy Policy?",
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
    title: "Do I Need To Purchase Booster Packs To Participate?",
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
    title: "How Often Does the League Get Updated?",
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
    title: "Where Does League Take Place?",
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
    title: "Fan Content Policy",
    Component: () => (
      <div className="py-2">
        <p className="mb-2">
          All images and related card data are provided via{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://scryfall.com/docs/api"
            target="_blank"
            rel="noreferrer"
          >
            Scryfall&apos;s public API
          </a>
          . Scryfall does not endorse Commander League.
        </p>
        <p className="mb-2">
          The information on this site is provided free of charge in accordance
          with the{" "}
          <a
            className="text-sky-500 hover:text-sky-300"
            href="https://company.wizards.com/en/legal/fancontentpolicy"
            target="_blank"
            rel="noreferrer"
          >
            Wizards of the Coast Fan Content Policy
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    id: 9,
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

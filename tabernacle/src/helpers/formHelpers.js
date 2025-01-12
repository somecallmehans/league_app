function composeDeckbuildingAchievements(achievements, winnerId) {
  return achievements
    .filter(
      ({ participant: { id }, achievement: { slug } }) =>
        id === winnerId && !slug
    )
    .map(({ id, achievement: { id: achievement_id, full_name } }) => ({
      id,
      achievement_id,
      name: full_name,
    }));
}

const slugkeys = [
  "bring-snack",
  "lend-deck",
  "knock-out",
  "submit-to-discord",
  "end-draw",
  "last-in-order",
  "commander-damage",
  "win-the-game-effect",
  "zero-or-less-life",
  "lose-the-game-effect",
];

function capitalizeColorStrings(colors) {
  if (!colors) return [];
  return colors.split(" ").map((w) => w[0].toUpperCase() + w.slice(1));
}

function mapParticipants(achievements, checkSlug) {
  return achievements
    .filter(({ achievement: { slug } }) => slug === checkSlug)
    .map(({ participant: { id, name }, id: earnedId }) => ({
      id,
      earnedId,
      name,
    }));
}

export function formatInitialValues(podData) {
  if (!podData) {
    return {};
  }

  const winningColors = capitalizeColorStrings(
    podData?.winning_commander?.colors?.name
  ).reduce((acc, curr) => ((acc[curr] = true), acc), {});

  // const winnerAchievements = getWinnerAchievements(winner, [
  //   { key: "lastInTurnOrder", slug: "last-in-order" },
  //   { key: "commanderDamage", slug: "commander-damage" },
  //   { key: "winTheGameEffect", slug: "win-the-game-effect" },
  //   { key: "zeroOrLessLife", slug: "zero-or-less-life" },
  //   { key: "loseTheGameEffect", slug: "lose-the-game-effect" },
  // ]);

  console.log(mapParticipants(podData?.pod_achievements, "commander-damage"));

  const mappedAchievements = slugkeys.reduce((acc, key) => {
    const mapped = mapParticipants(podData?.pod_achievements, key);
    acc[key] = mapped.length > 0 ? mapped : false;
    return acc;
  }, {});

  return {
    snack: mappedAchievements["bring-snack"],
    loanedDeck: mappedAchievements["lend-deck"],
    knockOuts: mappedAchievements["knock-out"],
    shareToDiscord: mappedAchievements["submit-to-discord"],
    winner: [
      {
        name: podData?.winning_commander?.participants?.name,
        id: podData?.winning_commander?.participants?.id,
      },
    ],
    endInDraw: !!mappedAchievements["end-draw"],
    winnersCommander: podData?.winning_commander?.name,
    colors: winningColors,
    lastInTurnOrder: !!mappedAchievements["last-in-order"],
    commanderDamage: !!mappedAchievements["commander-damage"],
    winTheGameEffect: !!mappedAchievements["win-the-game-effect"],
    zeroOrLessLife: !!mappedAchievements["zero-or-less-life"],
    loseTheGameEffect: !!mappedAchievements["lose-the-game-effect"],
    winnerDeckbuildingAchievements: composeDeckbuildingAchievements(
      podData?.pod_achievements,
      podData?.winning_commander?.participants?.id
    ),
  };
}

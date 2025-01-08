function hasSlug(slug) {
  return (achievement) => achievement?.slug?.includes(slug);
}

function capitalizeColorStrings(colors) {
  if (!colors) return [];
  return colors.split(" ").map((w) => w[0].toUpperCase() + w.slice(1));
}

function mapParticipants(participants, slug) {
  return participants
    .filter(({ achievements }) => achievements.find(hasSlug(slug)))
    .map(({ name, participant_id }) => ({ name, participant_id }));
}

function getWinnerAchievements(winner, slugs) {
  return slugs.reduce((result, slug) => {
    result[slug.key] = !!winner?.achievements?.find(hasSlug(slug.slug));
    return result;
  }, {});
}

export function formatInitialValues({ participants, winnerInfo }) {
  if (!participants) {
    return {};
  }

  const winner = participants.find(
    ({ participant_id }) => participant_id === winnerInfo?.participants?.id
  );

  const winningColors = capitalizeColorStrings(winnerInfo?.colors?.name).reduce(
    (acc, curr) => ((acc[curr] = true), acc),
    {}
  );

  const winnerAchievements = getWinnerAchievements(winner, [
    { key: "lastInTurnOrder", slug: "last-in-order" },
    { key: "commanderDamage", slug: "commander-damage" },
    { key: "winTheGameEffect", slug: "win-the-game-effect" },
    { key: "zeroOrLessLife", slug: "zero-or-less-life" },
    { key: "loseTheGameEffect", slug: "lose-the-game-effect" },
  ]);

  return {
    snack: mapParticipants(participants, "bring-snack"),
    loanedDeck: mapParticipants(participants, "lend-deck"),
    knockOuts: mapParticipants(participants, "knock-out"),
    shareToDiscord: mapParticipants(participants, "submit-to-discord"),
    winner: [
      {
        name: winnerInfo?.participants?.name,
        participant: winnerInfo?.participants?.id,
      },
    ],
    winnerDeckbuildingAchievements: winner?.achievements
      ?.filter(({ slug }) => !slug)
      .map(({ full_name, id }) => ({ name: full_name, id })),
    endInDraw: mapParticipants(participants, "end-draw").length > 0,
    winnersCommander: winnerInfo?.name,
    colors: winningColors,
    ...winnerAchievements,
  };
}

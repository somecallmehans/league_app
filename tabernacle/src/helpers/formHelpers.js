function composeDeckbuildingAchievements(achievements, winnerId) {
  return achievements
    .filter(({ participant_id, slug }) => participant_id === winnerId && !slug)
    .map(({ id, achievement_id, achievement_name }) => ({
      id,
      achievement_id,
      name: achievement_name,
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
    .filter(({ slug }) => slug === checkSlug)
    .map(({ participant_id, participant_name, id }) => ({
      earned_id: id,
      id: participant_id,
      participant_id: participant_id,
      name: participant_name,
    }));
}

export function formatInitialValues(podData) {
  if (!podData) {
    return {};
  }

  const winningColors = capitalizeColorStrings(
    podData?.winning_commander?.colors?.name
  ).reduce((acc, curr) => ((acc[curr] = true), acc), {
    Black: false,
    Blue: false,
    White: false,
    Green: false,
    Red: false,
    Colorless: false,
  });

  const mappedAchievements = slugkeys.reduce((acc, key) => {
    const mapped = mapParticipants(podData?.pod_achievements, key);
    acc[key] = mapped.length > 0 ? mapped : false;
    return acc;
  }, {});

  return {
    "bring-snack": mappedAchievements["bring-snack"],
    "lend-deck": mappedAchievements["lend-deck"],
    "knock-out": mappedAchievements["knock-out"],
    "submit-to-discord": mappedAchievements["submit-to-discord"],
    winner: [
      {
        name: podData?.winning_commander?.participants?.name,
        participant_id: podData?.winning_commander?.participants?.id,
        id: podData?.winning_commander?.id,
      },
    ],
    "end-draw": !!mappedAchievements["end-draw"],
    "winner-commander": podData?.winning_commander?.name,
    colors: winningColors,
    "last-in-order": !!mappedAchievements["last-in-order"],
    "commander-damage": !!mappedAchievements["commander-damage"],
    "win-the-game-effect": !!mappedAchievements["win-the-game-effect"],
    "zero-or-less-life": !!mappedAchievements["zero-or-less-life"],
    "lose-the-game-effect": !!mappedAchievements["lose-the-game-effect"],
    "winner-achievements": composeDeckbuildingAchievements(
      podData?.pod_achievements,
      podData?.winning_commander?.participants?.id
    ),
  };
}

const generalSlugs = [
  "bring-snack",
  "lend-deck",
  "knock-out",
  "submit-to-discord",
];

export function formatUpdate(newValues, existingValues) {
  const out = { new: [], update: [] };
  // our goal should be to either construct objs that the backend will roughly expect
  // OR if we are soft deleting, send the earned_id + deleted

  // form keys should be the slugs for each of the achievements that have them

  // handle adds/updates for bring-snack, lend-deck, knock-out, submit-to-discord

  // figure out if the winner + commander + colors is the same or different

  // use the info above to then figure out adds/updates for the bool fields
  // and the earned achievements

  console.log(out);
  return out;
}

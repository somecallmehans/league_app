import { colorIdFinder } from "../components/ColorInputs";

export const getWinSlug = (colorObj) => {
  let slug_value = 0;
  if (!colorObj.Colorless) {
    slug_value = Object.keys(colorObj).reduce((count, color) => {
      if (color !== "Colorless" && colorObj[color]) {
        count++;
      }
      return count;
    }, 0);
  }

  return `win-${slug_value}-colors`;
};

function composeDeckbuildingAchievements(achievements, winnerId) {
  return achievements
    .filter(({ participant_id, slug }) => participant_id === winnerId && !slug)
    .map(({ id, achievement_id, achievement_name }) => ({
      id,
      achievement_id,
      name: achievement_name,
    }));
}

const allSlugKeys = [
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

  const mappedAchievements = allSlugKeys.reduce((acc, key) => {
    const mapped = mapParticipants(podData?.pod_achievements, key);
    acc[key] = mapped.length > 0 ? mapped : false;
    return acc;
  }, {});

  return {
    "bring-snack": mappedAchievements["bring-snack"],
    "lend-deck": mappedAchievements["lend-deck"],
    "knock-out": mappedAchievements["knock-out"],
    "submit-to-discord": mappedAchievements["submit-to-discord"],
    winner: {
      name: podData?.winning_commander?.participants?.name,
      participant_id: podData?.winning_commander?.participants?.id,
      id: podData?.winning_commander?.id,
    },
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

const winnerBoolSlugs = [
  "last-in-order",
  "commander-damage",
  "win-the-game-effect",
  "lose-the-game-effect",
  "zero-or-less-life",
];

const winSlugs = [
  "win-0-colors",
  "win-1-colors",
  "win-2-colors",
  "win-3-colors",
  "win-4-colors",
  "win-5-colors",
];

export function formatUpdate(
  newValues,
  existingValues,
  roundId,
  colorsData,
  participantIds,
  podId
) {
  const existingAchievements = existingValues?.pod_achievements;
  const existingCommander = existingValues?.winning_commander;
  const out = { new: [], update: [] };

  // Handle general achievements that everyone is eligible for
  generalSlugs.forEach((key) => {
    const newVals = newValues[key] || [];
    const newValIds = newVals
      .filter((n) => n?.earned_id)
      .map((n) => n?.earned_id);
    const existingVals = existingValues.pod_achievements
      .filter((v) => v.slug === key)
      .map((v) => v.id);

    newVals.forEach((v) => {
      if (!v?.earned_id) {
        out.new.push({
          slug: key,
          participant_id: v?.participant_id,
          round_id: roundId,
        });
      }
    });
    existingVals.forEach((e) => {
      if (!newValIds.includes(e)) {
        out.update.push({ id: e, deleted: true });
      }
    });
  });

  // If we originally had a draw, and still do, escape
  if (
    existingAchievements?.some(({ slug }) => slug === newValues["end-draw"]) &&
    newValues["end-draw"]
  ) {
    return out;
  }
  // Else if we have a draw now, but didn't before, remove all of the original achievements
  // that the winner earned and then submit
  else if (
    newValues["end-draw"] &&
    !existingAchievements?.some(({ slug }) => slug === newValues["end-draw"])
  ) {
    existingAchievements
      ?.filter(
        (pa) =>
          !pa.slug ||
          winnerBoolSlugs.includes(pa?.slug) ||
          winSlugs.includes(pa?.slug)
      )
      .forEach((pa) => out.update.push({ id: pa.id, deleted: true }));

    participantIds?.forEach((p) =>
      out.new.push({
        participant_id: p,
        slug: "end-draw",
        round_id: roundId,
      })
    );

    out.winnerInfo = {
      id: existingCommander?.id,
      participant_id: null,
      color_id: null,
      commander_name: "END IN DRAW",
      pod_id: podId,
    };

    return out;
  }

  // If we no longer have a draw, but did before, then we need to remove
  // all of the credit players got for said draw before
  if (
    !newValues["end-draw"] &&
    existingAchievements?.some(({ slug }) => slug === "end-draw")
  ) {
    existingAchievements
      ?.filter((pa) => pa.slug === "end-draw")
      .forEach((pa) =>
        out.update.push({
          id: pa.id,
          deleted: true,
        })
      );
  }

  // If we never heard of a draw, we must have a winner and can proceed as normal
  const winnerId =
    newValues?.winner?.participant_id === existingCommander?.participants?.id
      ? existingCommander?.participants?.id
      : newValues?.winner?.participant_id;

  const commanderName =
    newValues["winner-commander"] === existingCommander?.name
      ? existingCommander?.name
      : newValues?.["winner-commander"];

  // jk bc if the winner changes than we ALSO have to remove all of the previous
  // winners achievements also

  out.winnerInfo = {
    id: existingCommander?.id,
    participant_id: winnerId,
    color_id: colorIdFinder(newValues?.colors, colorsData),
    commander_name: commanderName,
    pod_id: podId,
  };

  // handle winner achievements that are bool centric
  winnerBoolSlugs.forEach((key) => {
    const newVal = newValues[key];
    const existingId = existingValues.pod_achievements
      .filter((v) => v.slug === key)
      .map((v) => v.id);

    if (newVal && !existingId[0]) {
      out.new.push({
        slug: key,
        participant_id: winnerId,
        round_id: roundId,
      });
    }

    if (!newVal && existingId[0]) {
      out.update.push({ id: existingId[0], deleted: true });
    }
  });

  const submittedAchievements = newValues["winner-achievements"];

  // handle if the win has changed or not
  const newWinSlug = getWinSlug(newValues["colors"]);
  const foundWin = existingAchievements.find(({ slug }) =>
    winSlugs.includes(slug)
  );
  const preconWin =
    submittedAchievements?.findIndex(({ slug }) => slug === "precon") > 0;

  if (foundWin?.existingWinSlug && newWinSlug !== foundWin?.existingWinSlug) {
    out.update.push({
      id: foundWin?.id,
      slug: preconWin ? "win-3-colors" : newWinSlug,
    });
  } else if (newWinSlug && !foundWin?.existingWinSlug) {
    out.new.push({
      participant_id: winnerId,
      slug: preconWin ? "win-3-colors" : newWinSlug,
      round_id: roundId,
    });
  }

  // handle achievements that are pickable
  const existingIds = existingAchievements
    ?.filter(({ slug }) => !slug)
    .map((x) => x.id);

  submittedAchievements.forEach((a) => {
    if (a?.new) {
      out.new.push({
        achievement_id: a.achievement_id,
        participant_id: winnerId,
        round_id: roundId,
      });
    }
  });

  existingIds.forEach((a) => {
    if (!submittedAchievements.some((s) => s.id === a)) {
      out.update.push({
        id: a,
        deleted: true,
      });
    }
  });

  return out;
}

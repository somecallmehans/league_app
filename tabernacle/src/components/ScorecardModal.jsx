import React, { Fragment } from "react";
import { useForm, Controller } from "react-hook-form";

import StandardButton from "./Button";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { TextInput, CheckBoxInput, Selector } from "./FormInputs";
import {
  useGetAchievementsQuery,
  usePostRoundScoresMutation,
  useGetAllColorsQuery,
} from "../api/apiSlice";
import { ColorCheckboxes, colorIdFinder } from "./ColorInputs";

const slugRegex = /win-\d-colors/i;

const getWinSlug = (colorObj) => {
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

const ScorecardFormFields = ({
  focusedPod,
  sessionId,
  roundId,
  closeModal,
}) => {
  const [postRoundScores] = usePostRoundScoresMutation();
  const { data: colorsData, isLoading: colorsLoading } = useGetAllColorsQuery();
  const { data: achievementData, isLoading } = useGetAchievementsQuery();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
  } = useForm();

  const { endInDraw } = watch();

  if (isLoading || colorsLoading) {
    return null;
  }

  const filteredAchievementData = achievementData.data
    .filter((achievement) => !achievementData.parents.includes(achievement.id))
    .filter(({ slug }) => !slug?.match(slugRegex))
    .map((achievement) => ({
      id: achievement?.id,
      name: achievement?.full_name,
    }));

  const handleFormSubmit = async (formData) => {
    // each of these is a list of participants except for:
    // winner is a participant dict
    // winnerDeckbuildingAchievements is a list of achievements
    const {
      snack = [],
      loanedDeck = [],
      knockOuts = [],
      shareToDiscord = [],
      winner,
      lastInTurnOrder,
      commanderDamage,
      winTheGameEffect,
      zeroOrLessLife,
      loseTheGameEffect,
      winnersCommander,
      winnerDeckbuildingAchievements = [],
      colors,
      endInDraw,
    } = formData;

    const colorId = colorIdFinder(colors, colorsData);

    let winSlug = "";
    // Precon wins are always worth +2 points no matter what, so if we have that
    // we can just give them the 3 win colors for now
    if (
      winnerDeckbuildingAchievements.some(({ name }) => name.includes("precon"))
    ) {
      winSlug = "win-3-colors";
    } else {
      winSlug = getWinSlug(colors);
    }

    const boolConditions = [
      { condition: lastInTurnOrder, slug: "last-in-order" },
      { condition: commanderDamage, slug: "commander-damage" },
      { condition: winTheGameEffect, slug: "win-the-game-effect" },
      { condition: zeroOrLessLife, slug: "zero-or-less-life" },
      { condition: loseTheGameEffect, slug: "lose-the-game-effect" },
    ];

    const participantAchievementMap = endInDraw
      ? focusedPod.participants.reduce((acc, { participant_id }) => {
          acc[participant_id] = {
            id: participant_id,
            slugs: ["end-draw"],
            achievements: [],
          };
          return acc;
        }, {})
      : {
          [winner?.participant_id]: {
            id: winner?.participant_id,
            slugs: [winSlug],
            achievements: [],
          },
        };

    const addAchievements = (participants, slug) => {
      participants.forEach(({ participant_id }) => {
        const entry = participantAchievementMap[participant_id] || {
          id: participant_id,
          slugs: [],
          achievements: [],
        };
        entry.slugs.push(slug);
        participantAchievementMap[participant_id] = entry;
      });
    };

    addAchievements(snack, "bring-snack");
    addAchievements(loanedDeck, "lend-deck");
    addAchievements(knockOuts, "knock-out");
    addAchievements(shareToDiscord, "submit-to-discord");

    winnerDeckbuildingAchievements.forEach(({ id }) =>
      participantAchievementMap[winner?.participant_id]["achievements"].push(id)
    );

    boolConditions.forEach(({ condition, slug }) => {
      if (condition && slug) {
        participantAchievementMap[winner?.participant_id]["slugs"].push(slug);
      }
    });

    const participantList = Object.keys(participantAchievementMap).map(
      (x) => participantAchievementMap[x]
    );

    const winnerInfo = endInDraw
      ? null
      : {
          winner_id: winner?.participant_id,
          color_id: colorId,
          commander_name: winnersCommander,
        };

    const formattedData = {
      round: roundId,
      session: sessionId,
      pod: focusedPod.podId,
      winnerInfo: winnerInfo,
      participants: participantList,
    };

    try {
      await postRoundScores(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error("Failed to post round scores: ", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
      <Selector
        name="snack"
        control={control}
        options={focusedPod.participants}
        placeholder="Did Anyone Bring a Snack"
        classes="mb-2"
        isMulti
      />
      <Selector
        name="loanedDeck"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone lend a deck?"
        classes="mb-2"
        isMulti
      />
      <Selector
        name="knockOuts"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone who did not win knock out other players?"
        classes="mb-2"
        isMulti
      />
      <Selector
        name="shareToDiscord"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone use a decklist for the first time that has been shared on discord?"
        classes="mb-2"
        isMulti
      />
      <div className="mb-2 flex gap-2">
        Did the game end in a draw?
        <Controller
          name="endInDraw"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxInput {...field} checked={field.value} />
          )}
        />
      </div>
      {errors?.winner && errors?.winner?.type === "required" && !endInDraw && (
        <span className="text-xs italic text-rose-400">Required</span>
      )}
      <Selector
        name="winner"
        placeholder="Winner"
        control={control}
        options={focusedPod.participants}
        // getOptionLabel={(option) => option.name}
        // getOptionValue={(option) => option.participant_id}
        classes="mb-2"
        disabled={endInDraw}
      />
      {/* When redis gets rolling this should be a selector from that data */}
      <TextInput
        classes="basis-2/3 border py-2 mb-2 data-[hover]:shadow data-[focus]:bg-blue-100"
        name="winnersCommander"
        placeholder="Winner's Commander"
        control={control}
        disabled={endInDraw}
      />

      <ColorCheckboxes control={control} watch={watch} />
      <div className="mb-2 flex gap-2">
        Were they last in turn order:{" "}
        <Controller
          name="lastInTurnOrder"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxInput
              {...field}
              checked={field.value}
              disabled={endInDraw}
            />
          )}
        />
      </div>
      <div className="mb-2">
        <span>Did they win via:</span>
        <div className="grid grid-cols-2 gap-2">
          <Controller
            name="commanderDamage"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <CheckBoxInput
                {...field}
                classes="flex items-center gap-2"
                label="Commander Damage"
                checked={field.value}
                disabled={endInDraw}
              />
            )}
          />
          <Controller
            name="winTheGameEffect"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <CheckBoxInput
                {...field}
                classes="flex items-center gap-2"
                label="Win The Game Effect"
                checked={field.value}
                disabled={endInDraw}
              />
            )}
          />
          <Controller
            name="zeroOrLessLife"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <CheckBoxInput
                {...field}
                label="Having Zero Or Less Life"
                classes="flex items-center gap-2"
                checked={field.value}
                disabled={endInDraw}
              />
            )}
          />
          <Controller
            name="loseTheGameEffect"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <CheckBoxInput
                {...field}
                classes="flex items-center gap-2"
                label="Lose The Game Effect"
                checked={field.value}
                disabled={endInDraw}
              />
            )}
          />
        </div>
      </div>
      <Selector
        control={control}
        name="winnerDeckbuildingAchievements"
        options={filteredAchievementData}
        placeholder="Other Deck Building Achievements"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => `${option.id}-${Math.random()}`}
        isMulti
        disabled={endInDraw}
      />
      <div className="mt-2">
        <StandardButton disabled={isSubmitting} title="Submit" type="submit" />
      </div>
    </form>
  );
};

export default function ScorecardModal({
  isOpen,
  closeModal,
  focusedPod,
  sessionId,
  roundId,
}) {
  if (!focusedPod) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-4/5 items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="mb-2 text-xl font-medium leading-6 text-gray-900"
                >
                  Submit Score Card
                </DialogTitle>
                <ScorecardFormFields
                  focusedPod={focusedPod}
                  roundId={roundId}
                  sessionId={sessionId}
                  closeModal={closeModal}
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

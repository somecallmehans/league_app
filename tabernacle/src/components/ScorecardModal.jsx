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
  useGetAllColorsQuery,
  useGetPodsAchievementsQuery,
  usePostUpsertEarnedV2Mutation,
} from "../api/apiSlice";
import { formatInitialValues, formatUpdate } from "../helpers/formHelpers";
import { ColorCheckboxes } from "./ColorInputs";
import LoadingSpinner from "./LoadingSpinner";

const slugRegex = /win-\d-colors/i;

const ScorecardFormFields = ({
  focusedPod,
  sessionId,
  roundId,
  closeModal,
  initialValues,
  podData,
  refetch,
}) => {
  const [postUpsertEarnedV2] = usePostUpsertEarnedV2Mutation();
  const { data: colorsData, isLoading: colorsLoading } = useGetAllColorsQuery();
  const { data: achievementData, isLoading } = useGetAchievementsQuery();
  const focusedIds = focusedPod?.participants?.map((p) => p?.participant_id);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
  } = useForm({ defaultValues: initialValues });

  const { "end-draw": endInDraw } = watch();

  if (isLoading || colorsLoading) {
    return null;
  }

  let counter = 0;

  // achievements that get passed in as initial values won't have
  // "new", so we set it here for future reference
  const filteredAchievementData = achievementData.data
    .filter((achievement) => !achievementData.parents.includes(achievement.id))
    .filter(({ slug }) => !slug?.match(slugRegex))
    .map((achievement) => ({
      id: `${counter++}`,
      achievement_id: achievement?.id,
      name: achievement?.full_name,
      new: true,
    }));

  const handleFormSubmit = async (formData) => {
    const updates = formatUpdate(
      formData,
      podData,
      roundId,
      sessionId,
      colorsData,
      focusedIds,
      focusedPod?.id
    );
    try {
      await postUpsertEarnedV2(updates).unwrap();
      closeModal();
      refetch();
    } catch (err) {
      console.error("Failed to upsert round scores: ", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
      <Selector
        name="bring-snack"
        control={control}
        options={focusedPod.participants}
        placeholder="Did Anyone Bring a Snack"
        classes="mb-2"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.participant_id}
        isMulti
      />
      <Selector
        name="lend-deck"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone lend a deck?"
        classes="mb-2"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.participant_id}
        isMulti
      />
      <Selector
        name="knock-out"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone who did not win knock out other players?"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.participant_id}
        classes="mb-2"
        isMulti
      />
      <Selector
        name="submit-to-discord"
        control={control}
        options={focusedPod.participants}
        placeholder="Did anyone use a decklist for the first time that has been shared on discord?"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.participant_id}
        classes="mb-2"
        isMulti
      />
      <div className="mb-2 flex gap-2">
        Did the game end in a draw?
        <Controller
          name="end-draw"
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
        classes="mb-2"
        disabled={endInDraw}
      />
      {/* When redis gets rolling this should be a selector from that data */}
      <TextInput
        classes="basis-2/3 border py-2 mb-2 data-[hover]:shadow data-[focus]:bg-blue-100"
        name="winner-commander"
        placeholder="Winner's Commander"
        control={control}
        disabled={endInDraw}
      />

      <ColorCheckboxes control={control} watch={watch} />
      <div className="mb-2 flex gap-2">
        Were they last in turn order:{" "}
        <Controller
          name="last-in-order"
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
            name="commander-damage"
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
            name="win-the-game-effect"
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
            name="zero-or-less-life"
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
            name="lose-the-game-effect"
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
        name="winner-achievements"
        options={filteredAchievementData}
        placeholder="Other Deck Building Achievements"
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) =>
          option?.achievement_id ? option.id : option.id
        }
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
  const {
    data: podData,
    isLoading,
    refetch,
  } = useGetPodsAchievementsQuery(
    { round: roundId, pod: focusedPod?.id },
    {
      skip: !focusedPod?.id,
    }
  );
  if (!focusedPod) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner />;
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
                  initialValues={formatInitialValues(podData)}
                  podData={podData}
                  refetch={refetch}
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

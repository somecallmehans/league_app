import React, { useState } from "react";

import { Link, useLocation } from "react-router-dom";
import { useForm, Controller, FormProvider } from "react-hook-form";

import { useGetPodsQuery, usePostRerollPodsMutation } from "../../api/apiSlice";

import { useRouteParticipants } from "../../hooks";
import { podCalculator } from "../../helpers/helpers";
import { getLobbyKey } from "../../helpers/formHelpers";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import CreatableSelect from "react-select/creatable";
import ScorecardModal from "../../components/Modals/ScorecardModal";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import RerollPodsModal from "../../components/Modals/RerollPodsModal";
import PointsModal from "./PointsModal";
import ColorGrid from "../../components/ColorGrid";

const PodSquare = ({
  participant_id,
  name,
  total_points,
  round_points,
  colSize,
  handleOnClick,
  colors,
  winnerId,
  winnerCommander,
  submitted,
}) => {
  return (
    <div
      key={participant_id}
      className={`p-4 sm:p-6 border border-blue-300 grid grid-cols-1 overflow-y-auto text-center ${
        colSize ? "sm:col-span-2" : ""
      }`}
    >
      <span className="text-xl md:text-xl font-semibold">{name}</span>
      <div className="flex justify-center gap-2">
        <span className="text-sm md:text-base">{round_points} Round</span> /
        <span className="text-sm md:text-base">{total_points} Month</span>
      </div>
      <ColorGrid
        submitted={submitted}
        show={winnerId === participant_id}
        colors={colors}
        containerClasses="mt-2"
        action={() =>
          handleOnClick(
            name,
            round_points,
            participant_id,
            winnerCommander,
            colors,
            participant_id === winnerId
          )
        }
      />
    </div>
  );
};

const PodGrouping = ({
  participants,
  winnerInfo,
  handleOnClick,
  submitted,
}) => (
  <div className="shadow-lg border border-blue-300 grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
    {participants.map((participant, index) => (
      <PodSquare
        key={participant?.participant_id}
        handleOnClick={handleOnClick}
        colSize={
          [3, 5].includes(participants?.length) &&
          index === participants?.length - 1
        }
        colors={winnerInfo?.colors?.name}
        winnerId={winnerInfo?.participants?.id}
        winnerCommander={winnerInfo?.name}
        submitted={submitted}
        {...participant}
      />
    ))}
  </div>
);

function Pods({
  pods,
  podKeys,
  isOpen,
  focusedPod,
  openModal,
  closeModal,
  sessionId,
  roundId,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState();

  if (!pods) {
    return null;
  }

  const handleOnClick = (
    participant,
    round_points,
    participant_id,
    winnerCommander,
    colors,
    isWinner
  ) => {
    setSelected({
      participant,
      round_points,
      participant_id,
      roundId,
      winnerCommander,
      colors,
      isWinner,
    });
    setModalOpen(!modalOpen);
  };

  const handleClose = () => {
    setSelected(undefined);
    setModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6 pb-8 mt-4">
      {podKeys.map((pod_id, index) => {
        const { participants, submitted, id, winner_info } = pods[pod_id];
        return (
          <div key={pod_id}>
            <div className="flex items-end justify-center content-center text-xl md:text-3xl mb-2">
              <div className="mr-4">Pod {index + 1}</div>
              <i
                className={`fa-solid fa-${
                  submitted ? "pen-to-square" : "circle-exclamation"
                } text-sky-600 hover:text-sky-500`}
                onClick={() =>
                  openModal(participants, id, winner_info, submitted)
                }
              />
              <div
                className={`ml-4 text-sm p-2 rounded-lg text-white ${
                  submitted ? "bg-sky-500" : "bg-green-500"
                }`}
              >
                {submitted ? "Submitted" : "Open"}
              </div>
            </div>
            <PodGrouping
              participants={participants}
              winnerInfo={winner_info}
              handleOnClick={handleOnClick}
              submitted={submitted}
            />
          </div>
        );
      })}
      <ScorecardModal
        isOpen={isOpen}
        closeModal={closeModal}
        focusedPod={focusedPod}
        sessionId={sessionId}
        roundId={roundId}
      />
      <PointsModal
        isOpen={modalOpen}
        closeModal={() => handleClose()}
        selected={selected}
      />
    </div>
  );
}

const CheckedInRow = ({ participant, checkNumber, removeParticipant, idx }) => (
  <div className="w-full sm:w-2/4 mx-auto flex items-center justify-between p-2">
    <span className="text-lg md:text-xl">
      {checkNumber}{" "}
      <i
        className="fa-solid fa-trash-can mx-2 cursor-pointer text-red-500"
        onClick={() => removeParticipant(idx)}
      />{" "}
      {participant.label}
    </span>
  </div>
);

function RoundLobby({ roundId, sessionId, previousRoundId, control }) {
  const {
    filtered,
    selected,
    submitForm,
    addParticipant,
    removeParticipant,
    loading,
  } = useRouteParticipants(roundId, sessionId, previousRoundId);
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-4">
      <form className="flex w-full justify-center gap-2 md:gap-4">
        <Controller
          control={control}
          name="participants"
          render={({ field }) => (
            <CreatableSelect
              className="grow mr-2"
              {...field}
              isClearable
              options={filtered}
              onChange={(selectedOption) => addParticipant(selectedOption)}
              onCreateOption={(inputValue) =>
                addParticipant({ value: undefined, label: inputValue })
              }
              isValidNewOption={(inputValue) => !!inputValue}
              formatCreateLabel={(option) => `Create ${option}`}
            />
          )}
        />
        <StandardButton
          disabled={[1, 2].includes(selected.length)}
          action={() => setIsOpen(true)}
          type="button"
          title="Submit"
        />
      </form>
      <div className="mt-4 text-xl flex flex-col items-center text-center">
        <span className="align-center">
          Checked In Players: {selected.length === 0 ? 0 : selected.length}
        </span>
        <span className="text-sm">{podCalculator(selected.length)}</span>
      </div>
      {selected.length > 0 && (
        <div className="mt-2 w-full mx-auto">
          {selected.map((participant, index) => (
            <CheckedInRow
              key={participant?.value}
              participant={participant}
              checkNumber={index + 1}
              removeParticipant={removeParticipant}
              idx={index}
            />
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={isOpen}
        title="Begin Round?"
        confirmAction={() => submitForm()}
        closeModal={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}

function RoundLobbyFormWrapper({ roundId, sessionId, previousRoundId }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const methods = useForm({ defaultValues: { participants: [] } });
  const { control, reset } = methods;

  return (
    <FormProvider {...methods}>
      <StandardButton title="Clear" action={() => setShowConfirm(true)} />
      <RoundLobby
        roundId={roundId}
        sessionId={sessionId}
        previousRoundId={previousRoundId}
        control={control}
      />
      <ConfirmModal
        isOpen={showConfirm}
        title="Clear lobby?"
        confirmAction={() => {
          reset({ participants: [] });
          localStorage.removeItem(getLobbyKey(roundId));
          setShowConfirm(false);
        }}
        closeModal={() => setShowConfirm(!showConfirm)}
      />
    </FormProvider>
  );
}

function FocusedRound({ pods = {}, sessionId, roundId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedPod, setFocusedPod] = useState({});

  function closeModal() {
    setFocusedPod({});
    setIsOpen(false);
  }

  function openModal(p, id, w_info, submitted) {
    setFocusedPod({
      id,
      submitted,
      participants: p,
      winnerInfo: w_info,
    });
    setIsOpen(true);
  }

  return (
    <Pods
      podKeys={Object.keys(pods)}
      pods={pods}
      isOpen={isOpen}
      focusedPod={focusedPod}
      openModal={openModal}
      closeModal={closeModal}
      sessionId={sessionId}
      roundId={roundId}
    />
  );
}

function RoundDisplay({
  roundId,
  previousRoundId,
  sessionId,
  completed,
  setModalOpen,
}) {
  const { data: pods, isLoading: podsLoading } = useGetPodsQuery(roundId);

  if (podsLoading) {
    return <LoadingSpinner />;
  }

  const showFocusedRound = pods && Object?.keys(pods)?.length > 0;

  const somePodsSubmitted =
    pods && Object.values(pods)?.some(({ submitted }) => submitted);

  if (showFocusedRound) {
    return (
      <>
        <StandardButton
          title="Update Pods"
          action={() => setModalOpen(true)}
          disabled={somePodsSubmitted}
        />
        <FocusedRound
          sessionId={sessionId}
          roundId={roundId}
          completed={completed}
          pods={pods}
        />
      </>
    );
  }

  return (
    <RoundLobbyFormWrapper
      sessionId={sessionId}
      roundId={roundId}
      previousRoundId={previousRoundId}
    />
  );
}

export default function RoundPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [postRerollPods] = usePostRerollPodsMutation();

  const location = useLocation();
  const { roundNumber, date, roundId } = location.state;

  const handleModalSubmit = async (participants) => {
    try {
      await postRerollPods({
        round: roundId,
        participants,
      });
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to update pods: ", error);
    }
  };

  return (
    <div className="bg-white p-4 mb-4 h-full">
      <PageTitle title={`Round ${roundNumber} for ${date}`} />
      <Link to={"/league-session"}>
        <StandardButton title="Back" />
      </Link>
      <RoundDisplay {...location.state} setModalOpen={setModalOpen} />
      <RerollPodsModal
        isOpen={modalOpen}
        confirmAction={(participants) => handleModalSubmit(participants)}
        closeModal={() => setModalOpen(!modalOpen)}
        round={roundId}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";

import { Link, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";

import {
  useGetParticipantsQuery,
  useGetPodsQuery,
  usePostBeginRoundMutation,
  usePostRerollPodsMutation,
} from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import CreatableSelect from "react-select/creatable";
import ScorecardModal from "../../components/Modals/ScorecardModal";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import RerollPodsModal from "../../components/Modals/RerollPodsModal";
import PointsModal from "./PointsModal";
import ColorGrid from "../../components/ColorGrid";

const getLocalStorageKey = (roundId) => `roundLobby_participants_${roundId}`;

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
        <span className="text-sm md:text-md">{round_points} Round</span> /
        <span className="text-sm md:text-md">{total_points} Month</span>
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

const podCalculator = (len) => {
  let threePods = 0;
  let fourPods = 0;
  let fivePods = 0;

  if (len <= 2) {
    return "Not enough players to begin round";
  }

  while (len > 0) {
    if ((len - 5) % 4 === 0 || len === 5) {
      fivePods += 1;
      len -= 5;
    } else if (len % 4 === 0 || len === 7 || len - 4 >= 6) {
      fourPods += 1;
      len -= 4;
    } else {
      threePods += 1;
      len -= 3;
    }
  }

  return `${fivePods} Five Pods, ${fourPods} Four Pods, ${threePods} Three Pods`;
};

function RoundLobby({ roundId, sessionId, previousRoundId }) {
  const LOCAL_STORAGE_KEY = getLocalStorageKey(roundId);

  const [postBeginRound] = usePostBeginRoundMutation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: previousPods, isLoading: podsLoading } = useGetPodsQuery(
    previousRoundId,
    {
      skip: !previousRoundId,
    }
  );
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();

  const { control, setValue, watch, reset } = useForm({
    defaultValues: {
      participants: [],
    },
  });

  const selectedParticipants = watch("participants");

  const previousParticipants = useMemo(() => {
    if (!previousPods) return [];

    return Object.values(previousPods)
      .flatMap(({ participants }) => Object.values(participants))
      .map((p) => ({
        value: p?.participant_id,
        label: p?.name,
      }));
  }, [previousPods]);

  const filteredParticipants = useMemo(() => {
    if (!participants) return [];

    return participants
      .filter(
        (participant) =>
          !selectedParticipants.some(
            (_participant) => _participant.label === participant.name
          )
      )
      .map(({ id, name }) => ({ value: id, label: name }));
  }, [participants, selectedParticipants]);

  useEffect(() => {
    // This useEffect is essentially responsible for loading our existing participants from the
    // prior round or localstorage into our form state if they exist
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log(parsed);
          reset({ participants: parsed });
          return;
        }
      } catch (e) {
        console.error("Failed to parse localStorage data: ", e);
      }
    }

    if (previousParticipants) {
      reset({ participants: previousParticipants });
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(previousParticipants)
      );
    }
  }, [previousPods, reset]);

  useEffect(() => {
    if (selectedParticipants.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(selectedParticipants)
      );
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [selectedParticipants]);

  const submitForm = async () => {
    try {
      const normalizedParticipants = selectedParticipants.map((p) => ({
        name: p?.label,
        id: p?.value,
      }));
      await postBeginRound({
        round: roundId,
        session: sessionId,
        participants: normalizedParticipants,
      }).unwrap();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to begin round: ", err);
    }
  };

  const addParticipant = (participant) => {
    if (participant) {
      const updatedParticipants = [
        ...selectedParticipants,
        {
          label: participant.label,
          value: participant.value,
        },
      ];
      setValue("participants", updatedParticipants);
    }
  };

  const removeParticipant = (index) => {
    const updatedParticipants = [
      ...selectedParticipants.slice(0, index),
      ...selectedParticipants.slice(index + 1),
    ];
    setValue("participants", updatedParticipants);
  };

  if (participantsLoading || podsLoading) {
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
              options={filteredParticipants}
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
          disabled={[1, 2].includes(selectedParticipants.length)}
          action={() => setIsOpen(true)}
          type="button"
          title="Submit"
        />
      </form>
      <div className="mt-4 text-xl flex flex-col items-center text-center">
        <span className="align-center">
          Checked In Players:{" "}
          {selectedParticipants.length === 0 ? 0 : selectedParticipants.length}
        </span>
        <span className="text-sm">
          {podCalculator(selectedParticipants.length)}
        </span>
      </div>
      {selectedParticipants.length > 0 && (
        <div className="mt-2 w-full mx-auto">
          {selectedParticipants.map((participant, index) => (
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

  const showInFocus = pods && Object?.keys(pods)?.length > 0;

  const somePodsSubmitted =
    pods && Object.values(pods)?.some(({ submitted }) => submitted);

  if (showInFocus) {
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
    <RoundLobby
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
        <StandardButton
          title="Back"
          onClick={() => localStorage.removeItem(getLocalStorageKey(roundId))}
        />
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

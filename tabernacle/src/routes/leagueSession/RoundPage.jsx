import React, { useState } from "react";

import { Link, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";

import {
  useGetParticipantsQuery,
  useGetPodsQuery,
  usePostBeginRoundMutation,
  usePostCloseRoundMutation,
} from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import CreatableSelect from "react-select/creatable";
import ScorecardModal from "../../components/ScorecardModal";
import PointsModal from "./PointsModal";

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

  const handleOnClick = (participant, achievements, round_points) => {
    setSelected({ participant, achievements, round_points });
    setModalOpen(!modalOpen);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6 pb-8">
      {podKeys.map((pod_id, index) => {
        const { participants, submitted, id } = pods[pod_id];
        return (
          <div key={pod_id}>
            <div className="flex items-end justify-center content-center text-xl md:text-3xl mb-2">
              <div className="mr-4">Pod {index + 1}</div>
              {submitted ? (
                <i className="fa-regular fa-circle-check text-slate-600" />
              ) : (
                <i
                  className="fa-regular fa-circle-exclamation text-sky-600 hover:text-sky-500"
                  onClick={() => openModal(participants, id)}
                />
              )}
            </div>
            <div className="shadow-lg border border-blue-300 grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
              {participants.map(
                (
                  {
                    participant_id,
                    name,
                    total_points,
                    round_points,
                    achievements,
                  },
                  index
                ) => (
                  <div
                    key={participant_id}
                    className={`p-4 sm:p-6 border border-blue-300 grid grid-cols-1 overflow-y-auto text-center ${
                      participants.length === 3 && index === 2
                        ? "sm:col-span-2"
                        : ""
                    }`}
                  >
                    <span className="text-xl md:text-xl">
                      <a
                        className="hover:text-sky-500"
                        onClick={() =>
                          handleOnClick(name, achievements, round_points)
                        }
                      >
                        {name}
                      </a>
                    </span>
                    <span className="text-xs md:text-xs">
                      {round_points} Points This Round
                    </span>
                    <span className="text-xs md:text-xs">
                      {total_points} Points This Month
                    </span>
                  </div>
                )
              )}
            </div>
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

function RoundLobby({ roundId, sessionId, previousRoundParticipants = [] }) {
  const [postBeginRound] = usePostBeginRoundMutation();
  const { data: participantsData, isLoading } = useGetParticipantsQuery();
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      participants: previousRoundParticipants?.map((p) => ({
        value: p?.participant_id,
        label: p?.name,
      })),
    },
  });
  const selectedParticipants = watch("participants");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredData = participantsData
    .filter(
      (largeItem) =>
        !selectedParticipants.some(
          (smallItem) => smallItem.label === largeItem.name
        )
    )
    .map(({ id, name }) => ({ value: id, label: name }));

  const onSubmit = async () => {
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

  return (
    <div>
      <form
        className="flex w-full justify-center gap-2 md:gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="participants"
          render={({ field }) => (
            <CreatableSelect
              className="grow mr-2"
              {...field}
              isClearable
              options={filteredData}
              onChange={(selectedOption) => addParticipant(selectedOption)}
              onCreateOption={(inputValue) =>
                addParticipant({ value: undefined, label: inputValue })
              }
              isValidNewOption={(inputValue) => !!inputValue}
              formatCreateLabel={(option) => `Create ${option}`}
            />
          )}
        />
        <StandardButton disabled={isSubmitting} type="submit" title="Submit" />
      </form>
      <div className="mt-4 text-xl flex justify-center">
        <span>
          Checked In Players:{" "}
          {selectedParticipants.length === 0 ? "" : selectedParticipants.length}
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

  function openModal(p, id) {
    setFocusedPod({
      participants: p,
      podId: id,
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

export default function RoundPage() {
  const [postCloseRound] = usePostCloseRoundMutation();
  const location = useLocation();
  const {
    roundNumber,
    date,
    sessionId,
    roundId,
    completed,
    previousRoundParticipants,
  } = location.state;

  const { data, isLoading } = useGetPodsQuery(roundId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleCloseRound = async () => {
    try {
      await postCloseRound({
        round: { id: roundId, round_number: roundNumber },
        session: sessionId,
      }).unwrap();
    } catch (error) {
      console.error("Failed to close round: ", error);
    }
  };

  const allPodsSubmitted =
    data && Object.values(data)?.every(({ submitted }) => submitted);

  return (
    <div className="bg-white p-4 mb-4 h-full">
      <PageTitle title={`Round ${roundNumber} for ${date}`} />
      <Link to={"/league-session"}>
        <StandardButton title="Back" />
      </Link>

      {data && Object?.keys(data)?.length > 0 && (
        <Link to={"/league-session"}>
          <StandardButton
            title="Close"
            action={() => handleCloseRound()}
            disabled={allPodsSubmitted && completed}
          />
        </Link>
      )}

      <div className="mt-4">
        {!completed && data && Object.keys(data).length === 0 ? (
          <RoundLobby
            sessionId={sessionId}
            roundId={roundId}
            previousRoundParticipants={previousRoundParticipants}
          />
        ) : (
          <FocusedRound
            sessionId={sessionId}
            roundId={roundId}
            completed={completed}
            pods={data}
          />
        )}
      </div>
    </div>
  );
}

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
  if (!pods) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 gap-6">
      {podKeys.map((pod_id, index) => {
        const { participants, submitted, id } = pods[pod_id];
        return (
          <div key={pod_id}>
            <div className="flex items-end justify-center content-center text-3xl mb-2">
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
            <div className="border border-blue-300 grid grid-cols-2 overflow-y-auto">
              {participants.map(
                (
                  { participant_id, name, total_points, round_points },
                  index
                ) => (
                  <div
                    key={participant_id}
                    className={`p-8 border border-blue-300 grid grid-cols-1 overflow-y-auto text-center ${
                      participants.length === 3 && index === 2
                        ? "col-span-2"
                        : ""
                    }`}
                  >
                    <span className="text-xl">{name}</span>
                    <span className="text-xs">
                      {round_points} Points This Round
                    </span>
                    <span className="text-xs">
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
    </div>
  );
}

function RoundLobby({ roundId, sessionId, previousRoundParticipants }) {
  const [postBeginRound] = usePostBeginRoundMutation();
  const { data: participantsData, isLoading } = useGetParticipantsQuery();
  const { handleSubmit, control, setValue, watch } = useForm({
    defaultValues: {
      participants:
        previousRoundParticipants?.map((p) => ({
          value: p.participant_id,
          label: p.name,
        })) || [],
    },
  });
  const selectedParticipants = watch("participants");

  console.log(selectedParticipants);

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

  console.log(selectedParticipants);

  return (
    <div>
      <form
        className="flex w-full justify-center"
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
        <StandardButton type="submit" title="Submit" />
      </form>
      <div className="mt-4 text-2xl flex justify-center">
        <span>
          Checked In Players{" "}
          {selectedParticipants.length === 0 ? "" : selectedParticipants.length}
        </span>
      </div>
      {selectedParticipants.length > 0 && (
        <div className="mt-2 w-1/2 mx-auto">
          {selectedParticipants.map((participant, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 items-center">
              <span className="text-xl col-span-3">{participant.label}</span>
              <div className="justify-self-end">
                <i
                  className="fa-solid fa-trash-can mr-4"
                  onClick={() => removeParticipant(index)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FocusedRound({ pods, sessionId, roundId }) {
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

  return (
    <div className="bg-white p-4 mb-4 h-full">
      <PageTitle title={`Round ${roundNumber} for ${date}`} />
      <Link to={"/league-session"}>
        <StandardButton title="Back" />
      </Link>

      {Object?.keys(data)?.length > 0 && (
        <Link to={"/league-session"}>
          <StandardButton
            title="Close"
            action={() => handleCloseRound()}
            disabled={completed}
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

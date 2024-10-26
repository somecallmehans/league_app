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
  roundParticipantList,
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
        roundParticipantList={roundParticipantList}
        sessionId={sessionId}
        roundId={roundId}
      />
    </div>
  );
}

function RoundLobby({ roundId, sessionId, previousRoundParticipants }) {
  const [selectedParticipants, setSelectedParticipants] = useState(
    previousRoundParticipants || []
  );
  const [postBeginRound] = usePostBeginRoundMutation();
  const { data, isLoading } = useGetParticipantsQuery();
  const { handleSubmit, control } = useForm();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredData = data.filter(
    (largeItem) =>
      !selectedParticipants.some(
        (smallItem) => smallItem.name === largeItem.name
      )
  );

  const onSubmit = async () => {
    try {
      await postBeginRound({
        round: roundId,
        session: sessionId,
        participants: selectedParticipants,
      }).unwrap();
    } catch (err) {
      console.error("Failed to begin round: ", err);
    }
  };

  const addParticipant = (participant) => {
    if (
      participant &&
      !selectedParticipants.some((p) => p.name === participant?.name)
    )
      setSelectedParticipants([...selectedParticipants, participant]);
  };

  const removeParticipant = (index) => {
    setSelectedParticipants(selectedParticipants.filter((_, i) => i !== index));
  };

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
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => ({
                id: option.id,
                name: option.name,
              })}
              getNewOptionData={(option) => ({
                name: option,
                id: undefined,
              })}
              onChange={(selectedOption) => addParticipant(selectedOption)}
              onCreateOption={(inputValue) =>
                addParticipant({ name: inputValue, id: undefined })
              }
              isValidNewOption={(option) => option}
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
            <div key={index} className="grid grid-cols-2 gap-4 items-center">
              <span className="text-xl">{participant.name}</span>
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

function FocusedRound({ completed, pods, sessionId, roundId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedPod, setFocusedPod] = useState({});
  const roundParticipantList = Object.values(pods).flatMap(({ participants }) =>
    Object.values(participants)
  );

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
      roundParticipantList={roundParticipantList}
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

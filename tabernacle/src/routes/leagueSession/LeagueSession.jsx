import React, { useState } from "react";
import { Route, Routes, Link } from "react-router-dom";

import RoundPage from "./RoundPage";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";
import {
  useGetAllSessionsQuery,
  usePostCreateSessionMutation,
  useGetPodsQuery,
} from "../../api/apiSlice";
import { formatDateString, formatMonthYear } from "../../helpers/dateHelpers";
import PageTitle from "../../components/PageTitle";
import Modal from "../../components/Modal";

const Round = ({
  id,
  sessionId,
  roundNumber,
  previousRoundId,
  created_at,
  completed,
}) => {
  let previousRoundParticipants = [];

  if (previousRoundId) {
    const { data, isLoading } = useGetPodsQuery(previousRoundId);

    previousRoundParticipants =
      !isLoading &&
      data &&
      Object.values(data).flatMap(({ participants }) =>
        Object.values(participants)
      );
  }

  return (
    <div className={`justify-self-end ${!completed ? "animate-pulse" : ""}`}>
      <Link
        to={`${id}`}
        state={{
          roundId: id,
          completed: completed,
          sessionId: sessionId,
          roundNumber: roundNumber,
          date: created_at,
          previousRoundParticipants: previousRoundParticipants,
        }}
      >
        <StandardButton title={`View Round ${roundNumber}`} />
      </Link>
    </div>
  );
};

function LeagueSession() {
  const { data, isLoading } = useGetAllSessionsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return Object.keys(data).map((month_year) => {
    const sessions = data[month_year];
    return (
      <div className="bg-white p-4 mb-4 rounded shadow-sm" key={month_year}>
        <div className="text-lg md:text-2xl mb-2 underline">
          {formatMonthYear(month_year)} Season
        </div>
        {sessions.map(({ id, created_at, rounds }) => {
          const roundOne = rounds.find(
            ({ round_number }) => round_number === 1
          );
          const roundTwo = rounds.find(
            ({ round_number }) => round_number === 2
          );
          return (
            <div
              className="border-b border-slate-300 grid grid-cols-3 gap-4 mb-4 py-4 items-center"
              key={id}
            >
              <div className="text-sm md:text-base">
                {formatDateString(created_at)}
              </div>
              {/* Sessions will always have 2 rounds, no more no less. */}
              <Round
                sessionId={id}
                id={roundOne.id}
                roundNumber={roundOne.round_number}
                completed={roundOne.completed}
                created_at={formatDateString(created_at)}
              />
              <Round
                sessionId={id}
                id={roundTwo.id}
                previousRoundId={roundOne.id}
                roundNumber={roundTwo.round_number}
                completed={roundTwo.completed}
                created_at={formatDateString(created_at)}
              />
              {/* Readd this back in at some point */}
              {/* <div className="justify-self-end">
                <i className="fa-solid fa-trash-can mr-4" />
              </div> */}
            </div>
          );
        })}
      </div>
    );
  });
}

function LeagueManagementPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [postCreateSession] = usePostCreateSessionMutation();

  const handleCreateSession = async () => {
    try {
      await postCreateSession().unwrap();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create new league session: ", err);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <PageTitle title="League Season Management" />
      <div className="mb-4">
        <StandardButton title="Start New" action={() => setIsOpen(!isOpen)} />
      </div>
      <LeagueSession />
      <Modal
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        action={() => handleCreateSession()}
        title="Begin new session?"
        actionTitle="Begin"
        closeTitle="Cancel"
      />
    </div>
  );
}

export default function LeagueRouter() {
  return (
    <Routes>
      <Route path="/" element={<LeagueManagementPage />} />
      <Route path="/:round_id" element={<RoundPage />} />
    </Routes>
  );
}

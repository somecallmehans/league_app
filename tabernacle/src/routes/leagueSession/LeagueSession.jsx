import React from "react";
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

// Fix this later
// const disableRoundButtons = (
//   roundNumber,
//   sessionClosed,
//   completed,
//   otherRoundStatus
// ) => {
//   // if a session is closed then no buttons should be disabled
//   if (sessionClosed) {
//     return false;
//   }

//   // if round 1 is finished disable that button
//   if (roundNumber === 1 && completed) {
//     return true;
//   }

//   // if round 2 is not finished and the other round is also not finished disable round 2
//   if (roundNumber === 2 && !completed && !otherRoundStatus) {
//     return true;
//   }

//   return false;
// };

const Round = ({
  id,
  sessionId,
  roundNumber,
  previousRoundId,
  created_at,
  completed,
  sessionClosed,
  otherRoundStatus,
}) => {
  let previousRoundParticipants = [];

  if (previousRoundId) {
    const { data, isLoading } = useGetPodsQuery(previousRoundId);

    previousRoundParticipants =
      !isLoading &&
      Object.values(data).flatMap(({ pods }) =>
        Object.values(pods).flatMap((item) => item.participants)
      );
  }

  function roundText() {
    if (completed) {
      return "View ";
    }
    if (roundNumber === 2 && !completed && !otherRoundStatus) {
      return "Begin ";
    }
    return "Continue ";
  }
  return (
    <div className="justify-self-end">
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
        <StandardButton title={`${roundText()}Round ${roundNumber}`} />
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
      <div className="bg-white p-4 mb-4" key={month_year}>
        <div className="text-2xl mb-2 underline">
          {formatMonthYear(month_year)} Season
        </div>
        {sessions.map(({ id, created_at, rounds, closed }) => {
          const roundOne = rounds.find(
            ({ round_number }) => round_number === 1
          );
          const roundTwo = rounds.find(
            ({ round_number }) => round_number === 2
          );
          return (
            <div
              className="border border-transparent border-b-slate-300 grid grid-cols-4 gap-4 mb-4 py-2 items-center"
              key={id}
            >
              {formatDateString(created_at)}
              {/* Sessions will always have 2 rounds, no more no less. */}
              <Round
                sessionId={id}
                id={roundOne.id}
                roundNumber={roundOne.round_number}
                completed={roundOne.completed}
                created_at={formatDateString(created_at)}
                sessionClosed={closed}
                otherRoundStatus={roundTwo.completed}
              />
              <Round
                sessionId={id}
                id={roundTwo.id}
                previousRoundId={roundOne.id}
                roundNumber={roundTwo.round_number}
                completed={roundTwo.completed}
                created_at={formatDateString(created_at)}
                sessionClosed={closed}
                otherRoundStatus={roundOne.completed}
              />
              <div className="justify-self-end">
                <i className="fa-solid fa-trash-can mr-4" />
              </div>
            </div>
          );
        })}
      </div>
    );
  });
}

function LeagueManagementPage() {
  const [postCreateSession] = usePostCreateSessionMutation();

  const handleCreateSession = async () => {
    try {
      await postCreateSession().unwrap();
    } catch (err) {
      console.error("Failed to create new league session: ", err);
    }
  };

  return (
    <div className="p-4">
      <PageTitle title="League Season Management" />
      <div className="mb-4">
        <StandardButton
          title="Start New"
          action={() => handleCreateSession()}
        />
      </div>
      <LeagueSession />
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

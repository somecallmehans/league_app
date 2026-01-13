import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { Route, Routes, Link } from "react-router-dom";

import "react-datepicker/dist/react-datepicker.css";

import RoundPage from "./RoundPage";
import ScorecardPage from "./ScorecardPage";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";
import {
  useGetAllSessionsQuery,
  usePostCreateSessionMutation,
} from "../../api/apiSlice";
import { useSessionRoundInfo } from "../../hooks";
import {
  formatDateString,
  formatMonthYear,
  formatToYYYYDDMM,
} from "../../helpers/dateHelpers";
import PageTitle from "../../components/PageTitle";
import Modal from "../../components/Modal";

const Round = ({ id, sessionId, roundNumber }) => {
  return (
    <div className="justify-self-end">
      <Link to={`${sessionId}/${id}`}>
        <StandardButton title={`View Round ${roundNumber}`} />
      </Link>
    </div>
  );
};

function LeagueSession() {
  const { data: sessions, isLoading: sessionsLoading } =
    useGetAllSessionsQuery();

  if (sessionsLoading) {
    return <LoadingSpinner />;
  }

  const sessionKeys = Object.keys(sessions);

  return sessionKeys.map((month_year) => {
    const sessionList = sessions[month_year];

    return (
      <div className="bg-white p-4 mb-4 rounded shadow-sm" key={month_year}>
        <div className="text-lg md:text-2xl mb-2 underline">
          {formatMonthYear(month_year)} Season
        </div>
        {sessionList.map(({ id, rounds, session_date }) => {
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
                {formatDateString(session_date)}
              </div>
              {/* Sessions will always have 2 rounds, no more no less. */}
              <Round
                sessionId={id}
                id={roundOne.id}
                roundNumber={roundOne.round_number}
              />
              <Round
                sessionId={id}
                id={roundTwo.id}
                roundNumber={roundTwo.round_number}
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
  const [startDate, setStartDate] = useState(new Date());
  const [postCreateSession] = usePostCreateSessionMutation();

  const handleCreateSession = async () => {
    try {
      const session_date = formatToYYYYDDMM(startDate);
      await postCreateSession({ session_date }).unwrap();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create new league session: ", err);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <PageTitle title="Round Manager" />
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
        body={
          <div className="my-2">
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                if (date) {
                  setStartDate(date);
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-900"
              calendarClassName="rounded-lg shadow-lg bg-white border border-gray-200"
              popperClassName="z-50"
            />
          </div>
        }
      />
    </div>
  );
}

export default function LeagueRouter() {
  return (
    <Routes>
      <Route path="/" element={<LeagueManagementPage />} />
      <Route path="/:session_id/:round_id" element={<RoundPage />} />
      <Route
        path="/:session_id/:round_id/scorecard/:pod_id"
        element={<ScorecardPage />}
      />
    </Routes>
  );
}

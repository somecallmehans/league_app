import React, { useState } from "react";
import { Route, Routes, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { handleNavClick } from "../../helpers/helpers";

import PageTitle from "../../components/PageTitle";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  apiSlice,
  useGetUniqueMonthsQuery,
  useGetRoundsByMonthQuery,
  usePostSignupMutation,
  useGetSigninsQuery,
} from "../../api/apiSlice";
import { useMonthYear } from "../../hooks";

import { SimpleSelect } from "../crud/CrudComponents";
import { monthMap, monthStr } from "../../helpers/dateHelpers";
import FocusedPod from "./FocusedPod";
import SignInModal from "../../components/Modals/SignInModal";
import InfoModal from "../../components/InfoModal";

function dateSort(a, b) {
  const parseDate = (str) => {
    const [month, day] = str.split("/").map(Number);
    return new Date(new Date().getFullYear(), month - 1, day);
  };

  return parseDate(b) - parseDate(a);
}

const roundTimes = {
  1: "1:30 PM",
  2: "3:30 PM",
};

const roundDisplay = (id) => (id % 2 === 0 ? "3:30PM" : "1:30PM");

const configKeys = {
  "1:30PM": "round_one_cap",
  "3:30PM": "round_two_cap",
};

const SignInArea = ({ roundInfo }) => {
  const ids = roundInfo.map(({ id }) => id);
  const { data } = useSelector(apiSlice.endpoints.getAllConfigs.select());

  const configs = data?.byKey;

  const [showModal, setShowModal] = useState(false);
  const [showParticipants, setShowParticipants] = useState([]);
  const { data: signIns, isLoading: signInsLoading } = useGetSigninsQuery({
    round_one: ids[0],
    round_two: ids[1],
  });

  const [postSignup] = usePostSignupMutation();

  const handleSubmit = async (formVals) => {
    try {
      const res = await postSignup(formVals);
      setShowModal(false);
      toast.success(res.data.message);
    } catch (error) {
      setShowModal(false);
      console.error("Failed to sign in for round.", error);
    }
  };
  if (signInsLoading) {
    return null;
  }
  return (
    <div className="flex flex-wrap justify-center p-4 drop-shadow-md">
      <div className="flex flex-col gap-2 items-center justify-center text-center">
        <div className="text-center text-[8px] sm:text-xs text-gray-500 italic">
          Use /link in Discord to connect your account, then /mycode to get your
          code.
        </div>
        <div className="text-center text-[6px] sm:text-xs text-gray-500 italic">
          You may also check-in in-store as long as there are open spots.
        </div>
        <div
          className="bg-sky-400 hover:bg-sky-300 text-white drop-shadow-md  rounded-md
              px-16 py-4 sm:px-24  text-lg md:text-3xl"
          onClick={() => setShowModal(true)}
        >
          Sign In
        </div>

        <div className="flex gap-4 text-center text-xs sm:text-sm drop-shadow-md">
          {ids.map((id) => {
            const count = signIns[id]["count"];
            const participants = signIns[id]["participants"];
            const rDisplay = roundDisplay(id);
            const roundLimit = configs[configKeys[rDisplay]].value;
            return (
              <div
                key={id}
                className="border  hover:border-sky-500 p-2 rounded-lg"
                onClick={() => setShowParticipants(participants)}
              >
                {rDisplay} Players:{" "}
                <span className="font-bold">
                  {count}/{roundLimit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <SignInModal
        isOpen={showModal}
        closeModal={() => setShowModal(false)}
        action={handleSubmit}
        title="Round Sign In"
        actionTitle="Confirm"
        closeTitle="Cancel"
        ids={ids}
        signIns={signIns}
      />
      <InfoModal
        isOpen={showParticipants.length > 0}
        closeModal={() => setShowParticipants([])}
        title="Signed In Participants"
        body={
          <div className="grid grid-cols-2 gap-y-1 px-8">
            {showParticipants.map(({ name }) => (
              <div key={name} className="text-sm">
                {name}
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
};

const RoundDisplay = ({ roundInfo, dateKey, renderRoundLink }) => {
  const signInOpen = roundInfo.every(
    ({ started, closed }) => !started && !closed
  );

  if (signInOpen) {
    return <SignInArea roundInfo={roundInfo} />;
  }

  return (
    <div className="flex flex-wrap w-full justify-around p-4 drop-shadow-md">
      {[...roundInfo]
        .sort((a, b) => {
          return a.round_number - b.round_number;
        })
        .map(({ id, round_number, completed, started }) => {
          let iconText = "fa-regular fa-circle-check";
          let buttonColor = "bg-emerald-500";
          let hoverColor = "bg-emerald-400";
          if (started && !completed) {
            iconText = "fa-solid fa-circle-exclamation";
            buttonColor = "bg-yellow-500";
            hoverColor = "bg-yellow-400";
          } else if (!started && !completed) {
            iconText = "fa-solid fa-clock";
            buttonColor = "bg-slate-500";
            hoverColor = "bg-slate-400";
          }

          return (
            <div
              key={id}
              className="flex flex-col items-center justify-center text-center"
            >
              <Link
                key={id}
                to={renderRoundLink(id)}
                state={{
                  roundId: id,
                  roundNumber: round_number,
                  date: dateKey,
                }}
                disabled={!completed && !started}
              >
                <div
                  className={`${buttonColor} hover:${hoverColor} text-white drop-shadow-md  rounded-md
                    px-2 py-4 sm:px-8 sm:py-8 text-lg md:text-3xl`}
                  onClick={() => handleNavClick(`round_${id}`)}
                >
                  <i
                    className={`${iconText} text-base md:text-xl lg:text-2xl mr-2`}
                  />
                  Round {round_number}
                </div>
              </Link>
              <div className="text-center sm:text-xl">
                {roundTimes[round_number]}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const SessionPill = ({
  roundInfo,
  dateKey,
  selectedMonth,
  renderRoundLink,
}) => {
  const dater = roundInfo[0].starts_at;
  const d = new Date(dater);

  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();

  return (
    <div className="flex flex-col mb-8">
      <div className="border rounded-lg w-full  sm:h-48 flex">
        <div className="bg-white text-black border border-gray-200 text-center  rounded-l-lg basis-1/4 p-8 font-bold flex flex-col">
          <div className="text-lg">{dayOfWeek}</div>
          <div className="text-xl sm:text-2xl">{month}</div>
          <div className="text-3xl sm:text-6xl">{day}</div>
        </div>
        <div className="bg-white w-full border border-gray-200 rounded-r-lg flex justify-around">
          <RoundDisplay
            roundInfo={roundInfo}
            dateKey={dateKey}
            selectedMonth={selectedMonth}
            renderRoundLink={renderRoundLink}
          />
        </div>
      </div>
    </div>
  );
};

const RoundList = ({ rounds, selectedMonth, renderRoundLink }) => {
  if (!rounds || Object.keys(rounds).length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        <p>No data available for this league month.</p>
      </div>
    );
  }
  return Object.keys(rounds)
    .sort(dateSort)
    .map((round) => {
      const roundInfo = rounds[round];
      return (
        <SessionPill
          key={round}
          roundInfo={roundInfo}
          dateKey={round}
          selectedMonth={selectedMonth}
          renderRoundLink={renderRoundLink}
        />
      );
    });
};

function Page() {
  const { selectedMonth, setSelectedMonth, month, year } = useMonthYear();
  const { data: months, isLoading: monthsLoading } = useGetUniqueMonthsQuery();
  const { data: rounds, isLoading: roundsLoading } = useGetRoundsByMonthQuery(
    selectedMonth,
    { skip: !selectedMonth }
  );

  const loading = monthsLoading || roundsLoading;

  if (loading) {
    return <LoadingSpinner />;
  }

  const options = [...months]
    ?.sort((a, b) => {
      const [monthA, yearA] = a.split("-").map(Number);
      const [monthB, yearB] = b.split("-").map(Number);

      return yearB - yearA || monthB - monthA;
    })
    ?.map((month) => ({
      label: monthStr(month),
      value: month,
    }));

  const value = selectedMonth
    ? { label: monthStr(selectedMonth), value: selectedMonth }
    : null;

  return (
    <div className="p-4 md:p-8">
      <PageTitle
        title={
          selectedMonth
            ? `${monthStr(selectedMonth)} Pods`
            : `${monthMap[month]} '${year} Pods`
        }
      />
      <div className="mb-6">
        <SimpleSelect
          placeholder="Select League Month"
          options={options}
          classes="md:w-1/2 mb-4"
          value={value}
          onChange={(obj) => setSelectedMonth(obj.value)}
          isClearable={false}
        />
      </div>
      <RoundList
        rounds={rounds}
        selectedMonth={selectedMonth}
        renderRoundLink={(roundId) => ({
          pathname: `/pods/${roundId}`,
          search: `?m=${selectedMonth}`,
        })}
      />
    </div>
  );
}

export default function PodRouter() {
  return (
    <Routes>
      <Route path="/" element={<Page />} />
      <Route path="/:round_id" element={<FocusedPod />} />
    </Routes>
  );
}

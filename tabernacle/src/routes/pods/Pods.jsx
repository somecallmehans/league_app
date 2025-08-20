import React from "react";
import { Route, Routes, Link } from "react-router-dom";

import { handleNavClick } from "../../helpers/helpers";

import PageTitle from "../../components/PageTitle";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  useGetUniqueMonthsQuery,
  useGetRoundsByMonthQuery,
} from "../../api/apiSlice";
import { useMonthYear } from "../../hooks";

import { SimpleSelect } from "../crud/CrudComponents";
import { monthMap, monthStr } from "../../helpers/dateHelpers";
import FocusedPod from "./FocusedPod";

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

const RoundDisplay = ({ roundInfo, dateKey, renderRoundLink }) => {
  return (
    <div className="flex flex-wrap w-full justify-around p-4 drop-shadow-md">
      {[...roundInfo]
        .sort((a, b) => {
          return a.round_number - b.round_number;
        })
        .map(({ id, round_number, completed, started }) => {
          let iconText = "fa-regular fa-circle-check";
          let buttonColor = "bg-emerald-500";
          if (!completed && !started) {
            iconText = "fa-regular fa-circle-stop";
            buttonColor = "bg-slate-400";
          } else if (started && !completed) {
            iconText = "fa-solid fa-circle-exclamation";
            buttonColor = "bg-yellow-500";
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
                  className={`${buttonColor} text-white drop-shadow-md  rounded-md
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
  const dater = roundInfo[0].created_at;
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

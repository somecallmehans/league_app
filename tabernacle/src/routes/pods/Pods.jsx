import React, { useState } from "react";
import { Route, Routes, Link, useLocation } from "react-router-dom";

import PageTitle from "../../components/PageTitle";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  useGetUniqueMonthsQuery,
  useGetRoundsByMonthQuery,
} from "../../api/apiSlice";

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

const RoundDisplay = ({ info, dateKey, selectedMonth }) => {
  return (
    <div className="flex flex-wrap w-full justify-around p-4 bg-white drop-shadow-md">
      {[...info]
        .sort((a, b) => {
          return a.round_number - b.round_number;
        })
        .map(({ id, round_number }) => (
          <Link
            key={id}
            to={`${id}`}
            state={{
              roundId: id,
              roundNumber: round_number,
              date: dateKey,
              selectedMonth,
            }}
          >
            <div
              className="bg-sky-300 hover:bg-sky-200 drop-shadow-md text-center rounded-md
                     py-4 px-6 sm:py-6 sm:px-12 md:py-8 md:px-32 lg:py-10 lg:px-42 text-lg md:text-2xl"
            >
              Round {round_number}
            </div>
          </Link>
        ))}
    </div>
  );
};

function Page() {
  const location = useLocation();
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear().toString().substr(-2);
  const defaultMonth = `${month < 10 ? "0" : ""}${month}-${year}`;

  const [selectedMonth, setSelectedMonth] = useState(
    location.state?.selectedMonth || defaultMonth
  );

  const { data: months, isLoading: monthsLoading } = useGetUniqueMonthsQuery();
  const { data: rounds, isLoading: roundsLoading } = useGetRoundsByMonthQuery(
    selectedMonth,
    { skip: !selectedMonth }
  );

  if (monthsLoading || roundsLoading) {
    return <LoadingSpinner />;
  }
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
          options={[...months]
            ?.sort((a, b) => {
              const [monthA, yearA] = a.split("-").map(Number);
              const [monthB, yearB] = b.split("-").map(Number);

              return yearB - yearA || monthB - monthA;
            })
            ?.map((month) => ({
              label: monthStr(month),
              value: month,
            }))}
          classes="md:w-1/2 mb-4"
          onChange={(obj) => {
            setSelectedMonth(obj.value);
          }}
          defaultValue={{ label: selectedMonth, value: selectedMonth }}
        />
      </div>
      {Object.keys(rounds)
        .sort(dateSort)
        .map((round) => {
          const dateKey = round;
          const roundInfo = rounds[round];
          return (
            <div className="flex flex-col" key={round}>
              <div className="text-3xl font-bold my-2">{dateKey}</div>
              <RoundDisplay
                info={roundInfo}
                dateKey={dateKey}
                selectedMonth={selectedMonth}
              />
            </div>
          );
        })}
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

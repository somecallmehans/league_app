import React, { useState } from "react";
import {
  useGetAchievementsForMonthQuery,
  useGetUniqueMonthsQuery,
} from "../../api/apiSlice";
import { monthMap } from "../../helpers/dateHelpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const placeBg = (idx) => {
  if (idx === 0) return "bg-yellow-300 text-black font-semibold";
  if (idx === 1) return "bg-gray-300 text-black font-semibold";
  if (idx === 2) return "bg-orange-300 text-black font-semibold";
  return "bg-white text-gray-700";
};

const LeaderboardGrid = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0)
    return (
      <div className="text-center text-gray-600 py-8">
        <p>No data available for this league month.</p>
      </div>
    );

  return (
    <div className="border border-gray-300 rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-5 bg-gray-100 text-center font-medium text-gray-800 py-2 border-b">
        <div className="col-span-1">Place</div>
        <div className="col-span-2">Name</div>
        <div className="col-span-2">Points</div>
      </div>
      {leaderboard.map(({ id, total_points, name }, idx) => (
        <div
          key={id}
          className={`grid grid-cols-5 py-3 px-4 text-center ${placeBg(idx)}`}
        >
          <div className="col-span-1">{idx + 1}</div>
          <div className="col-span-2">{name}</div>
          <div className="col-span-2">{total_points}</div>
        </div>
      ))}
    </div>
  );
};

export default function Leaderboard() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear().toString().substr(-2);
  const [selectedMonth, setSelectedMonth] = useState(
    month && year ? `${month < 10 ? "0" : ""}${month}-${year}` : undefined
  );

  const { data: months, isLoading: monthsLoading } = useGetUniqueMonthsQuery();
  const { data: achievementsForMonth, isLoading: achievementsLoading } =
    useGetAchievementsForMonthQuery(selectedMonth, { skip: !selectedMonth });

  if (achievementsLoading || monthsLoading) {
    return <LoadingSpinner />;
  }

  const monthStr = (month) => {
    const split = month.split("-");
    return `${monthMap[split[0]]} '${split[1]}`;
  };

  return (
    <div className="p-4 md:p-8 mx-auto">
      <PageTitle
        title={
          selectedMonth
            ? `${monthStr(selectedMonth)} Leaderboard`
            : `${monthMap[month]} '${year} Leaderboard`
        }
      />
      <div className="mb-6">
        <SimpleSelect
          placeholder="Select League Month"
          options={months?.map((month) => ({
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
      <LeaderboardGrid leaderboard={achievementsForMonth} />
    </div>
  );
}

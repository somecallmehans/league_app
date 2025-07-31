import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAchievementsForMonthQuery,
  useGetUniqueMonthsQuery,
} from "../../api/apiSlice";
import { monthMap, monthStr } from "../../helpers/dateHelpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const zebraStripe = (idx) => {
  if (idx % 2 === 0) {
    return "bg-gray-50";
  }
  return "bg-white";
};

const placeBadge = (idx) => {
  if (idx === 0) return <span className="text-xl md:text-2xl">🥇</span>;
  if (idx === 1) return <span className="text-xl md:text-2xl">🥈</span>;
  if (idx === 2) return <span className="text-xl md:text-2xl">🥉</span>;
  return <span>{idx + 1}</span>;
};

const LeaderboardGrid = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0)
    return (
      <div className="text-center text-gray-600 py-8">
        <p>No data available for this league month.</p>
      </div>
    );

  const navigate = useNavigate();

  return (
    <div className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
      <div className="grid grid-cols-5 px-4 bg-gray-100 text-center font-medium text-gray-800 py-2 border-b">
        <div className="col-span-1 font-extrabold text-md md:text-lg">
          Place
        </div>
        <div className="col-span-2 font-extrabold text-md md:text-lg">Name</div>
        <div className="col-span-2 font-extrabold text-md md:text-lg">
          Points
        </div>
      </div>
      {leaderboard.map(({ id, total_points, name }, idx) => (
        <div
          key={id}
          onClick={() => navigate(`/metrics/${id}/`)}
          className={`grid grid-cols-5 py-3 px-4 text-center  ${zebraStripe(
            idx
          )} hover:bg-sky-50 transition-colors duration-200 hover:text-sky-500 text-sm md:text-lg`}
        >
          <div className="col-span-1">{placeBadge(idx)}</div>
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

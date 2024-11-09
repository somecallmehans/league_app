import React, { useState } from "react";
import {
  useGetAchievementsForMonthQuery,
  useGetUniqueMonthsQuery,
} from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const placeBg = (idx) => {
  if (idx === 0) return "font-bold bg-yellow-300";
  if (idx === 1) return "font-bold bg-slate-300";
  if (idx === 2) return "font-bold bg-orange-300";

  return "";
};

const LeaderboardGrid = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0)
    return <div>No Data For This League Month</div>;

  return (
    <React.Fragment>
      <div className="grid grid-cols-5 border-0 border-b-2 text-center">
        <div className="col-span-1">Places</div>
        <div className="col-span-2">Name</div>
        <div className="col-span-2">Points</div>
      </div>
      {leaderboard.map(({ id, total_points, name }, idx) => (
        <div
          key={id}
          className={`grid grid-cols-5 py-2 border-0 border-b-2 border-slate-400 text-center ${placeBg(
            idx
          )}`}
        >
          <div className="col-span-1">{idx + 1}</div>
          <div className="col-span-2">{name}</div>
          <div className="col-span-2">{total_points}</div>
        </div>
      ))}
    </React.Fragment>
  );
};

export default function Leaderboard() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear().toString().substr(-2);
  const [selectedMonth, setSelectedMonth] = useState(
    month && year ? `${month}-${year}` : undefined
  );

  const { data: months, isLoading: monthsLoading } = useGetUniqueMonthsQuery();
  const { data: achievementsForMonth, isLoading: achievementsLoading } =
    useGetAchievementsForMonthQuery(selectedMonth, { skip: !selectedMonth });

  if (achievementsLoading || monthsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8">
      <PageTitle title="Leaderboard" />
      <SimpleSelect
        placeholder="Select League Month"
        options={months?.map((month) => ({ label: month, value: month }))}
        classes="w-1/2 mb-4"
        onChange={(obj) => {
          setSelectedMonth(obj.value);
        }}
        defaultValue={{ label: selectedMonth, value: selectedMonth }}
      />
      <LeaderboardGrid leaderboard={achievementsForMonth} />
    </div>
  );
}

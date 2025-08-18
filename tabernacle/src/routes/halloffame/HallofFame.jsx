import React from "react";
import { Route, Routes, Link } from "react-router-dom";

import { useGetLeagueWinnersQuery } from "../../api/apiSlice";

import { formatMonthYear } from "../../helpers/dateHelpers";

import PageTitle from "../../components/PageTitle";

const HallofFamePill = ({
  participant_name,
  session__month_year,
  total_points,
}) => {
  return (
    <div className="border rounded-lg bg-white flex flex-col text-center shadow-md">
      <div className="text-2xl border py-4 flex justify-center items-center">
        <i className="fa-solid fa-trophy mr-2 text-yellow-400" />
        <div className="font-bold"> {formatMonthYear(session__month_year)}</div>
        <i className="fa-solid fa-trophy ml-2 text-yellow-400" />
      </div>

      <div className="text-4xl  p-2 ">{participant_name}</div>
      <div className="text-xl text-gray-400">{total_points} Points</div>
      <div className="text-right p-2 hover:text-sky-500">
        <Link key={session__month_year} to={session__month_year}>
          <i className="fa-solid fa-arrow-up-right-from-square " />
        </Link>
      </div>
    </div>
  );
};

function HallofFameContainer() {
  const { data: winners, isLoading: winnersLoading } =
    useGetLeagueWinnersQuery();
  console.log(winners);
  if (winnersLoading) return null;
  return (
    <div className="p-4 md:p-8 mx-auto">
      <PageTitle title="Hall of Fame" />
      <div className="grid gap-4 md:grid-cols-2">
        {winners.map((winner) => (
          <HallofFamePill key={winner.session__month_year} {...winner} />
        ))}
      </div>
    </div>
  );
}

export default function HOFRouter() {
  return (
    <Routes>
      <Route path="/" element={<HallofFameContainer />} />
      <Route path="/:mm_yy" element={<div />} />
    </Routes>
  );
}

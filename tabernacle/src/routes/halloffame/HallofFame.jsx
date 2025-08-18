import React from "react";

import { useGetLeagueWinnersQuery } from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";

export default function HallofFameContainer() {
  const { data: winners, isLoading: winnersLoading } =
    useGetLeagueWinnersQuery();
  console.log(winners);
  if (winnersLoading) return null;
  return (
    <div className="p-4 md:p-8 mx-auto">
      <PageTitle title="Hall of Fame" />
      {winners.map((w) => (
        <div key={w.session__month_year}>{w.participant_name}</div>
      ))}
    </div>
  );
}

import React from "react";

import { useGetMetricsQuery } from "../../api/apiSlice";

import ColorBarChart from "./ColorBarChart";

const MetricWrapper = ({ title, classes, children }) => (
  <div
    className={`${classes} bg-gray-100 border border-gray-300 rounded-md h-full p-4 flex flex-col items-center justify-between rounded-lg shadow-lg`}
  >
    <div className="text-xl font-bold">{title}</div>
    {children}
  </div>
);

export default function Metrics() {
  const { data, isLoading } = useGetMetricsQuery();

  if (isLoading) {
    return null;
  }

  console.log(data);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <MetricWrapper>Box 1</MetricWrapper>
      <MetricWrapper title="Most Match Wins">
        <div className="text-4xl font-extrabold">
          {data?.big_winners.map((x) => x)}
        </div>
      </MetricWrapper>
      <MetricWrapper title="Most Earned Achievement">
        <div className="text-2xl font-extrabold text-center flex flex-grow items-center justify-center">
          {data?.most_earned.map((x) => x.name)}
        </div>
      </MetricWrapper>
      <MetricWrapper title="All Time Color Wins" classes="col-span-2">
        <ColorBarChart colorPie={data?.color_pie} />
      </MetricWrapper>
    </div>
  );
}

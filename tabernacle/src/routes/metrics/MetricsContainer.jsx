import React, { useState } from "react";

import { useGetMetricsQuery } from "../../api/apiSlice";

import ColorBarChart from "./ColorBarChart";

const MetricBlock = ({ data, mainKey, subtitleKey }) => (
  <React.Fragment>
    <div className="text-4xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
      {data?.[mainKey]}
    </div>
    {subtitleKey && (
      <div className="text-xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
        {data?.[subtitleKey]} Points
      </div>
    )}
  </React.Fragment>
);

const MetricBlockWithCycle = ({ data, subtitleKey }) => {
  const [idx, setIdx] = useState(0);
  const showIncrementers = data.length > 1;

  const incUp = () => {
    if (idx === data.length - 1) {
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  };
  const incDown = () => {
    if (idx === 0) {
      setIdx(data.length - 1);
    } else {
      setIdx(idx - 1);
    }
  };

  return (
    <React.Fragment>
      <div className="font-extrabold font-extrabold text-center flex flex-grow w-full justify-between">
        {showIncrementers && (
          <i
            onClick={() => incDown()}
            className="fa-solid fa-chevron-left text-2xl mr-4"
          />
        )}
        <span className="text-4xl">{data[idx].name}</span>
        {showIncrementers && (
          <i
            onClick={() => incUp()}
            className="fa-solid fa-chevron-right text-2xl ml-4"
          />
        )}
      </div>
      {subtitleKey && (
        <div className="text-xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
          {data[0][subtitleKey]} Wins
        </div>
      )}
    </React.Fragment>
  );
};

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

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <MetricWrapper
        title="Most Earned Points"
        mainKey="name"
        subtitleKey="total_points"
      >
        <MetricBlock
          data={data?.big_earner}
          mainKey="participant__name"
          subtitleKey="total_points"
        />
      </MetricWrapper>

      <MetricWrapper title="Most Match Wins">
        <MetricBlockWithCycle data={data?.big_winners} subtitleKey="wins" />
      </MetricWrapper>

      <MetricWrapper title="Most Earned Achievement">
        <MetricBlockWithCycle data={data?.most_earned} />
      </MetricWrapper>

      <MetricWrapper title="Days Since Last Draw">
        <MetricBlock data={data?.last_draw} mainKey="days" />
      </MetricWrapper>

      <MetricWrapper
        title="All Time Color Wins"
        classes="col-span-2 max-h-[36rem] p-8"
      >
        <ColorBarChart colorPie={data?.color_pie} />
      </MetricWrapper>
    </div>
  );
}

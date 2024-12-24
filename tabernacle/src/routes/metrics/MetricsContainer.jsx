import React, { useState } from "react";

import { useGetMetricsQuery } from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";

import PageTitle from "../../components/PageTitle";
import ColorBarChart from "./ColorBarChart";
import AchievementBarChart from "./AchievementBarChart";

const colorMap = {
  1: "rgba(31, 119, 180, 0.8)",
  2: "rgba(255, 127, 14, 0.8)",
  3: "rgba(44, 160, 44, 0.8)",
  4: "rgba(148, 103, 189, 0.8)",
  5: "rgba(140, 86, 75, 0.8)",
  6: "rgba(255, 71, 76, 0.8)",
  8: "rgba(188, 189, 34, 0.8)",
  16: "rgba(23, 190, 207, 0.8)",
};

const AchievementBarTitle = () => (
  <React.Fragment>
    <div className="text-center">All Earned Achievements</div>
    <div className="flex flex-wrap">
      {Object.entries(colorMap).map(([pointValue, color]) => (
        <div key={pointValue} className="w-1/8 md:w-16">
          <div
            className="text-xs p-0.5 md:text-sm rounded-md text-white flex justify-center align-center mx-2"
            style={{
              backgroundColor: color,
            }}
          >
            <span>{pointValue}p</span>
          </div>
        </div>
      ))}
    </div>
  </React.Fragment>
);

const MetricBlock = ({ data, mainKey, subtitleKey }) => (
  <React.Fragment>
    <div className="text-3xl md:text-4xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
      {data?.[mainKey]}
    </div>
    {subtitleKey && (
      <div className="text-slate-500 text-lg md:text-xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
        {data?.[subtitleKey]} Points
      </div>
    )}
  </React.Fragment>
);

const MetricBlockWithCycle = ({ data, subtitle, subtitleKey }) => {
  const [idx, setIdx] = useState(0);
  const showIncrementers = data?.length > 1;

  const incUp = () => {
    if (idx === data?.length - 1) {
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  };
  const incDown = () => {
    if (idx === 0) {
      setIdx(data?.length - 1);
    } else {
      setIdx(idx - 1);
    }
  };

  return (
    <React.Fragment>
      <div
        className={`font-extrabold text-center items-center flex flex-grow w-full justify-${
          showIncrementers ? "between" : "center"
        }`}
      >
        {showIncrementers && (
          <i
            onClick={() => incDown()}
            className="hover:text-sky-500 fa-solid fa-chevron-left text-xl md:text-2xl mr-4 md:mr-4 cursor-pointer"
          />
        )}
        <span className="text-2xl md:text-xl">{data[idx]?.name}</span>
        {showIncrementers && (
          <i
            onClick={() => incUp()}
            className="hover:text-sky-500 fa-solid fa-chevron-right text-xl md:text-2xl ml-4 md:ml-4 cursor-pointer"
          />
        )}
      </div>
      {subtitleKey && (
        <div className="text-slate-500 text-lg md:text-xlfont-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
          {data[0][subtitleKey]} {subtitle}
        </div>
      )}
    </React.Fragment>
  );
};

const MetricWrapper = ({ title, classes, children }) => (
  <div
    className={`${classes} bg-gray-100 border border-gray-300 rounded-md h-full p-4 flex flex-col text-center justify-between rounded-lg shadow-lg`}
  >
    <div className="text-lg md:text-xl text-xl font-bold">{title}</div>
    {children}
  </div>
);

export default function Metrics() {
  const { data, isLoading } = useGetMetricsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-8 mx-auto">
      <PageTitle title="Metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <MetricBlockWithCycle
            data={data?.big_winners}
            subtitle="Wins"
            subtitleKey="wins"
          />
        </MetricWrapper>

        <MetricWrapper title="Most Earned Deckbuilding Achievement">
          <MetricBlockWithCycle
            data={data?.most_earned}
            subtitle="Times"
            subtitleKey="count"
          />
        </MetricWrapper>

        <MetricWrapper title="Days Since Last Draw">
          <MetricBlock data={data?.last_draw} mainKey="days" />
        </MetricWrapper>

        <MetricWrapper
          title="All Time Color Wins"
          classes="col-span-1 sm:col-span-2 max-h-[24rem] md:max-h-[36rem] md:pb-12"
        >
          <ColorBarChart colorPie={data?.color_pie} />
        </MetricWrapper>
        <MetricWrapper
          title={<AchievementBarTitle />}
          classes="col-span-1 sm:col-span-2 max-h-[24rem] md:max-h-[36rem] md:pb-16"
        >
          <AchievementBarChart
            data={data?.achievement_chart}
            colorMap={colorMap}
          />
        </MetricWrapper>
      </div>
    </div>
  );
}

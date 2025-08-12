import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import { useGetMetricsQuery } from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";

import PageTitle from "../../components/PageTitle";
import ColorBarChart from "./ColorBarChart";
import AchievementBarChart from "./AchievementBarChart";
import IndividualMetrics from "./IndividualMetrics";

const colorMap = {
  1: "rgba(31, 119, 180, 0.8)", // Blue
  2: "rgba(255, 127, 14, 0.8)", // Orange
  3: "rgba(44, 160, 44, 0.8)", // Green
  4: "rgba(148, 103, 189, 0.8)", // Purple
  5: "rgba(140, 86, 75, 0.8)", // Brown
  6: "rgba(255, 71, 76, 0.8)", // Red
  8: "rgba(188, 189, 34, 0.8)", // Yellow
  9: "rgba(227, 119, 194, 0.8)", // Pink
  12: "rgba(127, 127, 127, 0.8)", // Gray
  15: "rgba(255, 165, 0, 0.8)", // Deep Orange
  16: "rgba(23, 190, 207, 0.8)", // Cyan
  18: "rgba(0, 128, 128, 0.8)", // Teal
  21: "rgba(75, 0, 130, 0.8)", // Indigo
  24: "rgba(128, 0, 128, 0.8)", // Dark Purple
};

const AchievementBarTitle = () => (
  <React.Fragment>
    <div className="text-center">Popular Deckbuilding Achievements</div>
    <div className="flex flex-wrap justify-center">
      {Object.entries(colorMap).map(([pointValue, color]) => (
        <div key={pointValue} className="w-1/8 md:w-16">
          <div
            className="text-xs p-0.5 md:text-sm rounded-md text-white flex justify-center align-center items-center mx-2"
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

export const MetricBlock = ({ data, mainKey, subtitleKey, suffix = "" }) => (
  <React.Fragment>
    <div className="text-3xl md:text-4xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
      {data?.[mainKey]}
      {suffix}
    </div>
    {subtitleKey && (
      <div className="text-slate-500 text-lg md:text-xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
        {data?.[subtitleKey]} Points
      </div>
    )}
  </React.Fragment>
);

const MetricBlockWithCycle = ({ data, subtitle, subtitleKey, smallText }) => {
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
        <span
          className={`${
            smallText ? "text-sm md:text-lg" : "text-3xl md:text-4xl"
          }`}
        >
          {data[idx]?.name}
        </span>
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

// Not used right now but might be useful in the future
// const RoundDateBlock = ({ data: { date, total, round_number } }) => (
//   <React.Fragment>
//     <div className="text-xl md:text-2xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
//       Round {round_number} {formatDateString(date)}
//     </div>
//     <div className="text-slate-500 text-lg md:text-xl font-extrabold font-extrabold text-center flex flex-grow items-center justify-center">
//       {total} Participants
//     </div>
//   </React.Fragment>
// );

export const MetricWrapper = ({ title, classes, children }) => (
  <div
    className={`${classes} bg-white border border-gray-300 rounded-md w-full h-full p-4 flex flex-col text-center justify-between rounded-lg shadow-lg`}
  >
    <div className="text-lg md:text-xl text-xl font-bold">{title}</div>
    {children}
  </div>
);

const TopFiveList = ({ data, list, script, mod = 1, truncate }) =>
  list.map((name, idx) => (
    <div
      key={idx}
      className="flex items-center justify-between gap-4 text-sm sm:text-base border-b border-gray-200 py-2"
    >
      <span className={`${truncate ? "truncate" : "wrap"} text-left`}>
        {/* We have a different metric for the "top" so we use mod to make sure the list looks right */}
        {idx + mod}. {name}
      </span>
      <span className="font-medium">
        {data[name]} {script}
      </span>
    </div>
  ));

function Page() {
  const { data: metrics, isLoading: metricsLoading } = useGetMetricsQuery();

  if (metricsLoading || !metrics) {
    return <LoadingSpinner />;
  }

  const {
    big_earner,
    big_winners,
    overall_points,
    top_winners,
    most_earned,
    common_commanders,
    snack_leaders,
    last_draw,
    color_pie,
    achievement_chart,
    most_draws,
    most_knockouts,
    most_last_wins,
    biggest_burger,
  } = metrics;

  return (
    <div className="p-4 md:p-8 mx-auto">
      <PageTitle title="League Stats" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricWrapper title="Most Earned Points">
          <MetricBlock
            data={big_earner}
            mainKey="participant__name"
            subtitleKey="total_points"
          />
        </MetricWrapper>

        <MetricWrapper title="Most Match Wins">
          <MetricBlockWithCycle
            data={big_winners}
            subtitle="Wins"
            subtitleKey="wins"
          />
        </MetricWrapper>
        <MetricWrapper title="Overall Earned">
          <TopFiveList
            data={overall_points}
            list={Object.keys(overall_points)}
            script="Points"
            mod={2}
          />
        </MetricWrapper>

        <MetricWrapper title="Top Match Wins">
          <TopFiveList
            data={top_winners}
            list={Object.keys(top_winners)}
            script="Wins"
            mod={2}
          />
        </MetricWrapper>

        <MetricWrapper title="All Time Snack Leaders">
          <TopFiveList
            data={snack_leaders}
            list={Object.keys(snack_leaders)}
            script="Points"
          />
        </MetricWrapper>
        <MetricWrapper title="Top Commanders">
          <TopFiveList
            data={common_commanders}
            list={Object.keys(common_commanders)}
            script="Wins"
          />
        </MetricWrapper>

        <MetricWrapper
          title="Most Earned Deckbuilding Achievements"
          classes="col-span-full"
        >
          <TopFiveList data={most_earned} list={Object.keys(most_earned)} />
        </MetricWrapper>

        {/* 
        <MetricWrapper title="Highest Attendence">
          <RoundDateBlock data={data?.highest_attendence} />
        </MetricWrapper> */}

        <MetricWrapper title="Most Draws">
          <TopFiveList data={most_draws} list={Object.keys(most_draws)} />
        </MetricWrapper>

        <MetricWrapper title="Most Knockouts (Without Winning)">
          <TopFiveList
            data={most_knockouts}
            list={Object.keys(most_knockouts)}
          />
        </MetricWrapper>

        <MetricWrapper title="Most Wins While Going Last">
          <TopFiveList
            data={most_last_wins}
            list={Object.keys(most_last_wins)}
            script="Wins"
          />
        </MetricWrapper>

        <MetricWrapper title="Most Points Earned in a Round">
          <TopFiveList
            data={biggest_burger}
            list={Object.keys(biggest_burger)}
            script="Points"
          />
        </MetricWrapper>

        <MetricWrapper title="Days Since Last Draw">
          <MetricBlock data={last_draw} mainKey="days" />
        </MetricWrapper>

        <MetricWrapper
          title="All Time Color Wins"
          classes="col-span-1 sm:col-span-2 max-h-[24rem] md:max-h-[36rem] md:pb-12"
        >
          <ColorBarChart colorPie={color_pie} />
        </MetricWrapper>
        <MetricWrapper
          title={<AchievementBarTitle />}
          classes="col-span-1 sm:col-span-2 max-h-[24rem] md:max-h-[36rem] md:pb-12"
        >
          <AchievementBarChart data={achievement_chart} colorMap={colorMap} />
        </MetricWrapper>
      </div>
    </div>
  );
}

export default function MetricsRouter() {
  return (
    <Routes>
      <Route path="/" element={<Page />} />
      <Route path="/:participant_id" element={<IndividualMetrics />} />
    </Routes>
  );
}

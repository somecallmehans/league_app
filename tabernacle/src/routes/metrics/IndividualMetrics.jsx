import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import {
  useGetIndividualMetricsQuery,
  useGetParticipantPodsQuery,
} from "../../api/apiSlice";
import { MetricWrapper, MetricBlock } from "./MetricsContainer";
import StandardButton from "../../components/Button";
import LineChart from "./PointsByMonthLineChart";
import ParticipantPods from "./ParticipantPods";

export default function IndividualMetrics() {
  const { participant_id } = useParams();
  const navigation = useNavigate();

  const { data: metrics, isLoading: metricsLoading } =
    useGetIndividualMetricsQuery(participant_id, { skip: !participant_id });
  const { data: pods, isLoading: podsLoading } = useGetParticipantPodsQuery(
    participant_id,
    { skip: !participant_id }
  );

  if (metricsLoading || podsLoading) {
    return <LoadingSpinner />;
  }

  const fallback = "/leaderboard";
  const onBack = () => {
    const canGoBack = window.history.state?.idx > 0;
    if (canGoBack) navigation(-1);
    else navigation(fallback, { replace: true });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex mb-2">
        <span>
          <StandardButton action={() => onBack()} title="Back" />
        </span>

        <Link
          to={`earned/`}
          className="flex items-center justify-center bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded text-white w-[80px] h-[37px] ml-2 mr-2"
        >
          <span className="bg-sky-600 hover:bg-sky-500 rounded mx-8">
            <i className="fa-solid fa-trophy text-yellow-400" />
          </span>
        </Link>
      </div>
      <PageTitle title={metrics.participant_name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricWrapper title="Average Win Points">
          <MetricBlock data={metrics} mainKey="avg_win_points" />
        </MetricWrapper>
        <MetricWrapper title="Participant Since">
          <MetricBlock data={metrics} mainKey="participant_since" />
        </MetricWrapper>
        <MetricWrapper title="Lifetime Points">
          <MetricBlock data={metrics} mainKey="lifetime_points" />
        </MetricWrapper>
        <MetricWrapper title="Matches Won">
          <MetricBlock data={metrics} mainKey="win_number" />
        </MetricWrapper>
        <MetricWrapper title="Matches Played">
          <MetricBlock data={metrics} mainKey="attendance" />
        </MetricWrapper>
        <MetricWrapper title="Unique Achievements Earned">
          <MetricBlock data={metrics} mainKey="unique_achievements" />
        </MetricWrapper>
      </div>
      {pods?.length > 0 && (
        <MetricWrapper title="Recent Pods" classes="my-4">
          <ParticipantPods pods={pods} participant_id={participant_id} />
        </MetricWrapper>
      )}
      <LineChart data={metrics.session_points} />
    </div>
  );
}

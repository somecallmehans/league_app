import React from "react";
import { useParams, useNavigate } from "react-router-dom";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { useGetIndividualMetricsQuery } from "../../api/apiSlice";
import { MetricWrapper, MetricBlock } from "./MetricsContainer";
import StandardButton from "../../components/Button";
import LineChart from "./PointsByMonthLineChart";

export default function InvdividualMetrics() {
  const { participant_id } = useParams();
  const navigation = useNavigate();

  const { data: metrics, isLoading: metricsLoading } =
    useGetIndividualMetricsQuery(participant_id, { skip: !participant_id });

  if (metricsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex">
        <span>
          <StandardButton action={() => navigation(-1)} title="Back" />
        </span>
        <PageTitle title={metrics.participant_name} />
      </div>
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
        <LineChart data={metrics.session_points} />
      </div>
    </div>
  );
}

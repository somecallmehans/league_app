import React from "react";

import { useGetMetricsQuery } from "../../api/apiSlice";

import ColorBarChart from "./ColorBarChart";

export default function Metrics() {
  const { data, isLoading } = useGetMetricsQuery();

  if (isLoading) {
    return null;
  }

  return (
    <div>
      <ColorBarChart colorPie={data?.color_pie} />
    </div>
  );
}

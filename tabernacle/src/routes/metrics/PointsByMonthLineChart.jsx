import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ data }) => {
  const sessionLabels = ["1", "2", "3", "4", "5"];

  const datasets = Object.entries(data).map(([month, sessions], index) => ({
    label: month,
    data: sessionLabels.map(
      (session) =>
        sessions.find((s) => s.session === Number(session))?.points || 0
    ),
    borderColor: `hsl(${(index * 70) % 360}, 70%, 50%)`,
    backgroundColor: `hsla(${(index * 70) % 360}, 70%, 50%, 0.3)`,
    fill: false,
    tension: 0.3,
    pointRadius: 5,
  }));

  const chartData = {
    labels: sessionLabels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Points by Session Across League Months" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Session Number" } },
      y: { title: { display: true, text: "Points" }, beginAtZero: true },
    },
  };

  return <Line data={chartData} height={100} options={{ ...options }} />;
};

export default LineChart;

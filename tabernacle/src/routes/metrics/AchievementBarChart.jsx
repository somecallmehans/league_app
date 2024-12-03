import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const options = {
  responsive: true,
  scales: {
    x: {
      display: false,
      text: "Achievement Name",
    },
  },
};

export default function AchievementBarChart({ data, colorMap }) {
  const sorted = Object.values(data).sort((a, b) => b["count"] - a["count"]);
  const labels = sorted.map(({ name }) => name);
  const newData = {
    labels,
    datasets: [
      {
        label: "Earned",
        data: sorted.map(({ count }) => count),
        backgroundColor: sorted.map(
          ({ point_value }) =>
            colorMap[point_value] || "rgba(201, 203, 207, 0.8)"
        ),
      },
    ],
  };

  return <Bar data={newData} options={options} />;
}

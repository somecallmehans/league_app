import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title);

const options = {
  responsive: true,
  barPercentage: 0.5,
  maintainAspectRatio: false,
};

// this should probably be in the db
const labelColors = {
  c: "rgb(169, 169, 169)",
  w: "rgba(248, 231, 185, 0.8)",
  u: "rgba(179, 206, 234, 0.8)",
  b: "rgba(166, 159, 157, 0.8)",
  r: "rgba(235, 159, 130, 0.8)",
  g: "rgba(196, 241, 202, 0.8)",
  rw: "rgb(255, 182, 193, 0.8)",
  wu: "rgb(173, 216, 230, 0.8)",
  ub: "rgb(0, 128, 128, 0.8)",
  bg: "rgb(85, 107, 47, 0.8)",
  rg: "rgb(255, 140, 0, 0.8)",
  br: "rgb(128, 0, 32, 0.8)",
  ur: "rgb(139, 0, 139, 0.8)",
  wb: "rgb(105, 105, 105, 0.8)",
  gw: "rgb(152, 251, 152, 0.8)",
  gu: "rgb(0, 255, 255, 0.8)",
  wbg: "rgb(34, 139, 34, 0.8)",
  gwu: "rgb(60, 179, 113, 0.8)",
  wub: "rgb(128, 0, 128, 0.8)",
  ubr: "rgb(25, 25, 112, 0.8)",
  urw: "rgb(255, 218, 185, 0.8)",
  brg: "rgb(75, 83, 32, 0.8)",
  rwb: "rgb(183, 65, 14, 0.8)",
  rgw: "rgb(218, 165, 32, 0.8)",
  bgu: "rgb(46, 139, 87, 0.8)",
  gur: "rgb(0, 168, 107, 0.8)",
  ubrg: "rgb(0, 85, 85, 0.8)",
  rgbw: "rgb(139, 69, 19, 0.8)",
  rgwu: "rgb(255, 127, 80, 0.8)",
  wubg: "rgb(0, 206, 209, 0.8)",
  wubr: "rgb(221, 160, 221, 0.8)",
  wubrg: "rgb(255, 215, 0, 0.8)",
};

export default function ColorBarChart({ colorPie }) {
  const labels = Object.keys(colorPie).sort(
    (a, b) => colorPie[b] - colorPie[a]
  );
  const newData = {
    labels,
    datasets: [
      {
        label: "All Time Color Wins",
        data: labels.map((x) => colorPie[x]),
        backgroundColor: labels.map(
          (label) => labelColors[label] || "rgba(201, 203, 207, 0.8)"
        ),
      },
    ],
  };

  return <Bar data={newData} options={options} />;
}

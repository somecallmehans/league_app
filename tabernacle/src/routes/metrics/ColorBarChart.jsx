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
};

// this should probably be in the db
const labelColors = {
  colorless: "rgb(169, 169, 169)",
  white: "rgba(248, 231, 185, 0.8)",
  blue: "rgba(179, 206, 234, 0.8)",
  black: "rgba(166, 159, 157, 0.8)",
  red: "rgba(235, 159, 130, 0.8)",
  green: "rgba(196, 211, 202, 0.8)",
  "red-white": "rgb(255, 182, 193, 0.8)",
  "white-blue": "rgb(173, 216, 230, 0.8)",
  "blue-black": "rgb(0, 128, 128, 0.8)",
  "black-green": "rgb(85, 107, 47, 0.8)",
  "red-green": "rgb(255, 140, 0, 0.8)",
  "black-red": "rgb(128, 0, 32, 0.8)",
  "blue-red": "rgb(139, 0, 139, 0.8)",
  "white-black": "rgb(105, 105, 105, 0.8)",
  "green-white": "rgb(152, 251, 152, 0.8)",
  "green-blue": "rgb(0, 255, 255, 0.8)",
  "white-black-green": "rgb(34, 139, 34, 0.8)",
  "green-white-blue": "rgb(60, 179, 113, 0.8)",
  "white-blue-black": "rgb(128, 0, 128, 0.8)",
  "blue-black-red": "rgb(25, 25, 112, 0.8)",
  "blue-red-white": "rgb(255, 218, 185, 0.8)",
  "black-red-green": "rgb(75, 83, 32, 0.8)",
  "red-white-black": "rgb(183, 65, 14, 0.8)",
  "red-green-white": "rgb(218, 165, 32, 0.8)",
  "black-green-blue": "rgb(46, 139, 87, 0.8)",
  "green-blue-red": "rgb(0, 168, 107, 0.8)",
  "blue-black-red-green": "rgb(0, 85, 85, 0.8)",
  "red-green-black-white": "rgb(139, 69, 19, 0.8)",
  "red-green-white-blue": "rgb(255, 127, 80, 0.8)",
  "white-blue-black-green": "rgb(0, 206, 209, 0.8)",
  "white-blue-black-red": "rgb(221, 160, 221, 0.8)",
  "white-blue-black-red-green": "rgb(255, 215, 0, 0.8)",
};

export default function ColorBarChart({ colorPie }) {
  const labels = Object.keys(colorPie);
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

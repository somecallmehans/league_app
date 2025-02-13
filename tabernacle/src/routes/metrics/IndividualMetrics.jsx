import React from "react";
import { useParams } from "react-router-dom";

export default function InvdividualMetrics() {
  const { participant_id } = useParams();
  return <div>Individual {participant_id}</div>;
}

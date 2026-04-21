import React from "react";

import { Navigate, useParams } from "react-router-dom";

import { useSessionRoundInfo } from "../../hooks";

export default function RoundPage() {
  const { session_id: sessionId } = useParams();
  const roundInfo = useSessionRoundInfo();

  const roundNumber = roundInfo?.roundNumber;

  const to = sessionId
    ? `/league-session/${sessionId}${roundNumber === 2 ? "?round=2" : ""}`
    : "/league-session";

  return <Navigate to={to} replace />;
}

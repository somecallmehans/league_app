import React from "react";

import { Navigate, useParams } from "react-router-dom";

import { useSessionRoundInfo } from "../../hooks";
import { sessionLobbyPath } from "./sessionRoundTab";

export default function RoundPage() {
  const { session_id: sessionId } = useParams();
  const roundInfo = useSessionRoundInfo();

  const roundNumber = roundInfo?.roundNumber;

  const to = sessionId
    ? sessionLobbyPath(sessionId, roundNumber)
    : "/league-session";

  return <Navigate to={to} replace />;
}

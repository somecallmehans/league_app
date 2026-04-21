import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useGetPodsQuery,
  useGetRoundsBySessionQuery,
  useGetSigninsQuery,
} from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import AddParticipantBar from "./sessionLobby/AddParticipantBar";
import RoundFocusedAdmin from "./sessionLobby/RoundFocusedAdmin";
import RoundLobbyAdmin from "./sessionLobby/RoundLobbyAdmin";

type TabKey = "round1" | "round2";

export default function SessionLobbyPage() {
  const { session_id: sessionId } = useParams();

  const [activeTab, setActiveTab] = useState<TabKey>(() => "round1");

  const token = sessionId ? { session_id: sessionId } : skipToken;
  const { data: roundsById, isLoading } = useGetRoundsBySessionQuery(token);

  const { roundOneId, roundTwoId, sessionDate } = useMemo(() => {
    const rounds = roundsById ? Object.entries(roundsById) : [];
    const roundOne = rounds.find(([, r]) => r?.roundNumber === 1);
    const roundTwo = rounds.find(([, r]) => r?.roundNumber === 2);

    return {
      roundOneId: roundOne ? Number(roundOne[0]) : null,
      roundTwoId: roundTwo ? Number(roundTwo[0]) : null,
      sessionDate:
        roundOne?.[1]?.sessionDate ?? roundTwo?.[1]?.sessionDate ?? "",
    };
  }, [roundsById]);

  const signinsToken =
    roundOneId && roundTwoId
      ? { round_one: roundOneId, round_two: roundTwoId }
      : skipToken;
  const { data: signIns, isLoading: signInsLoading } =
    useGetSigninsQuery(signinsToken);

  const { data: podsRoundOne, isLoading: podsOneLoading } = useGetPodsQuery(
    roundOneId ?? skipToken,
  );
  const { data: podsRoundTwo, isLoading: podsTwoLoading } = useGetPodsQuery(
    roundTwoId ?? skipToken,
  );
  const roundOneStarted =
    !!podsRoundOne && Object.keys(podsRoundOne).length > 0;
  const roundTwoStarted =
    !!podsRoundTwo && Object.keys(podsRoundTwo).length > 0;

  if (isLoading || signInsLoading || podsOneLoading || podsTwoLoading) {
    return <LoadingSpinner />;
  }

  if (!sessionId || !roundOneId || !roundTwoId) {
    return (
      <div className="bg-white p-4 mb-4 h-full">
        <PageTitle title="Session not found" />
        <Link to="/league-session">
          <StandardButton title="Back" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 mb-4 h-full">
      <PageTitle title={`Session ${sessionDate}`} />
      <Link to="/league-session">
        <StandardButton title="Back" />
      </Link>

      <AddParticipantBar
        roundOneId={roundOneId}
        roundTwoId={roundTwoId}
        roundOneStarted={roundOneStarted}
        roundTwoStarted={roundTwoStarted}
      />

      <div className="mt-4 flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("round1")}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === "round1"
              ? "border-b-2 border-sky-600 text-sky-700"
              : "text-slate-600"
          }`}
        >
          Round 1{" "}
          <span className="text-xs font-semibold text-slate-500">
            ({signIns?.[String(roundOneId)]?.count ?? 0})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("round2")}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === "round2"
              ? "border-b-2 border-sky-600 text-sky-700"
              : "text-slate-600"
          }`}
        >
          Round 2{" "}
          <span className="text-xs font-semibold text-slate-500">
            ({signIns?.[String(roundTwoId)]?.count ?? 0})
          </span>
        </button>
      </div>

      {activeTab === "round1" ? (
        <RoundTab
          sessionId={Number(sessionId)}
          roundId={roundOneId}
          signIns={signIns?.[String(roundOneId)]?.participants ?? []}
          pods={podsRoundOne}
        />
      ) : (
        <RoundTab
          sessionId={Number(sessionId)}
          roundId={roundTwoId}
          signIns={signIns?.[String(roundTwoId)]?.participants ?? []}
          pods={podsRoundTwo}
        />
      )}
    </div>
  );
}

function RoundTab({
  sessionId,
  roundId,
  signIns,
  pods,
}: {
  sessionId: number;
  roundId: number;
  signIns: Array<{ id: number; name: string }>;
  pods?: Record<string, any>;
}) {
  const showFocusedRound = pods && Object.keys(pods).length > 0;

  if (showFocusedRound) {
    return (
      <RoundFocusedAdmin
        pods={pods as any}
        podKeys={Object.keys(pods)}
        sessionId={sessionId}
        roundId={roundId}
      />
    );
  }

  return (
    <RoundLobbyAdmin
      sessionId={sessionId}
      roundId={roundId}
      participants={signIns}
    />
  );
}

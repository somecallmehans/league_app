import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useDeleteSessionMutation,
  useGetPodsQuery,
  useGetRoundsBySessionQuery,
  useGetSigninsQuery,
} from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import { useConfig } from "../../hooks/useConfigs";
import AddParticipantBar from "./sessionLobby/AddParticipantBar";
import RoundFocusedAdmin from "./sessionLobby/RoundFocusedAdmin";
import RoundLobbyAdmin from "./sessionLobby/RoundLobbyAdmin";
import {
  sessionRoundTabFromParam,
  type SessionRoundTab,
} from "./sessionRoundTab";

function roundHeadcount(
  pods: { participants?: { participant_id: number }[] }[] | undefined,
  signInCount: number,
) {
  if (!pods || pods.length === 0) return signInCount;
  const seated = new Set<number>();
  for (const pod of pods) {
    for (const person of pod.participants ?? []) {
      seated.add(person.participant_id);
    }
  }
  return seated.size;
}

export default function SessionLobbyPage() {
  const { session_id: sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = sessionRoundTabFromParam(searchParams.get("round"));
  const roundOneStart = useConfig("round_one_start");
  const roundTwoStart = useConfig("round_two_start");

  const setActiveTab = (tab: SessionRoundTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "round2") next.set("round", "2");
    else next.delete("round");
    setSearchParams(next, { replace: true });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lockDelete, setLockDelete] = useState(false);
  const deleteLockRef = useRef(false);
  const [deleteSession] = useDeleteSessionMutation();

  const token = sessionId ? { session_id: sessionId } : skipToken;
  const { data: roundsById, isLoading, isFetching: roundsFetching } =
    useGetRoundsBySessionQuery(token);

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
  const {
    data: signIns,
    isLoading: signInsLoading,
    isFetching: signInsFetching,
  } = useGetSigninsQuery(signinsToken);

  const {
    data: podsRoundOne,
    isLoading: podsOneLoading,
    isFetching: podsOneFetching,
  } = useGetPodsQuery(roundOneId ?? skipToken);
  const {
    data: podsRoundTwo,
    isLoading: podsTwoLoading,
    isFetching: podsTwoFetching,
  } = useGetPodsQuery(roundTwoId ?? skipToken);
  const roundOneStarted =
    !!podsRoundOne && Object.keys(podsRoundOne).length > 0;
  const roundTwoStarted =
    !!podsRoundTwo && Object.keys(podsRoundTwo).length > 0;

  const handleDeleteSession = () => {
    if (!sessionId || deleteLockRef.current) return;
    deleteLockRef.current = true;
    setLockDelete(true);
    deleteSession({ session_id: Number(sessionId) })
      .unwrap()
      .then(() => {
        setShowDeleteConfirm(false);
        navigate("/league-session");
      })
      .catch((err) => console.error("Failed to delete session: ", err))
      .finally(() => {
        deleteLockRef.current = false;
        setLockDelete(false);
      });
  };

  const waitingForLobby =
    (!roundsById && (isLoading || roundsFetching)) ||
    (roundOneId != null &&
      roundTwoId != null &&
      signIns == null &&
      (signInsLoading || signInsFetching)) ||
    (roundOneId != null &&
      podsRoundOne == null &&
      (podsOneLoading || podsOneFetching)) ||
    (roundTwoId != null &&
      podsRoundTwo == null &&
      (podsTwoLoading || podsTwoFetching));

  if (waitingForLobby) {
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
      <div className="flex items-center justify-between mb-4">
        <Link to="/league-session">
          <StandardButton title="Back" />
        </Link>
        <StandardButton
          title="Delete session"
          action={() => setShowDeleteConfirm(true)}
          className="bg-red-600 text-white data-[hover]:bg-red-500 data-[active]:bg-red-700"
          disabled={lockDelete}
        />
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete this session?"
        bodyText={
          <div className="text-sm text-red-600 leading-relaxed space-y-2">
            <span className="block font-bold">
              You are about to permanently delete this session and all its data.
            </span>
            <span className="block">
              This is a destructive action and may not be possible to recover
              lost data.
            </span>
            <span className="block">
              All rounds, pods, achievements, and results tied to this session
              will be removed.
            </span>
          </div>
        }
        confirmAction={handleDeleteSession}
        closeModal={() => setShowDeleteConfirm(false)}
        disableSubmit={lockDelete}
        enableCheckbox
      />

      <AddParticipantBar
        roundOneId={roundOneId}
        roundTwoId={roundTwoId}
        roundOneStarted={roundOneStarted}
        roundTwoStarted={roundTwoStarted}
        viewing={activeTab}
        roundOneStart={roundOneStart}
        roundTwoStart={roundTwoStart}
        onViewRound={setActiveTab}
      />

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Viewing
        </div>
        <div className="grid grid-cols-2 gap-3" role="tablist">
          <RoundViewButton
            label="Round 1"
            time={roundOneStart}
            count={roundHeadcount(
              podsRoundOne ? Object.values(podsRoundOne) : undefined,
              signIns?.[String(roundOneId)]?.count ?? 0,
            )}
            selected={activeTab === "round1"}
            onSelect={() => setActiveTab("round1")}
          />
          <RoundViewButton
            label="Round 2"
            time={roundTwoStart}
            count={roundHeadcount(
              podsRoundTwo ? Object.values(podsRoundTwo) : undefined,
              signIns?.[String(roundTwoId)]?.count ?? 0,
            )}
            selected={activeTab === "round2"}
            onSelect={() => setActiveTab("round2")}
          />
        </div>
      </div>

      <div
        className="mt-4 border-t-4 border-sky-500 pt-4"
      >
        {activeTab === "round1" ? (
          <RoundTab
            sessionId={Number(sessionId)}
            roundId={roundOneId}
            signIns={signIns?.[String(roundOneId)]?.participants ?? []}
            pods={podsRoundOne}
            roundNumber="1"
          />
        ) : (
          <RoundTab
            sessionId={Number(sessionId)}
            roundId={roundTwoId}
            signIns={signIns?.[String(roundTwoId)]?.participants ?? []}
            pods={podsRoundTwo}
            roundNumber="2"
          />
        )}
      </div>
    </div>
  );
}

function RoundViewButton({
  label,
  time,
  count,
  selected,
  onSelect,
}: {
  label: string;
  time: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={`rounded-lg border px-4 py-3 text-left ${
        selected
          ? "border-sky-700 bg-sky-600 text-white shadow-sm"
          : "border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div
        className={`mt-1 text-xs font-medium ${
          selected ? "text-white/80" : "text-sky-800"
        }`}
      >
        {time ? `${time} · ` : ""}
        {count} player{count === 1 ? "" : "s"}
      </div>
    </button>
  );
}

function RoundTab({
  sessionId,
  roundId,
  signIns,
  pods,
  roundNumber,
}: {
  sessionId: number;
  roundId: number;
  signIns: Array<{ id: number; name: string }>;
  pods?: Record<string, any>;
  roundNumber: string;
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
      roundNumber={roundNumber}
    />
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";

import StandardButton from "../../../components/Button";
import RoundParticipantModal, {
  RoundParticipantSummary,
} from "./RoundParticipantModal";

type WinnerInfo = {
  name?: string;
  participants?: { id: number };
};

type FocusedPod = {
  id: number;
  submitted: boolean;
  winner_info?: WinnerInfo;
  participants: Array<{
    participant_id: number;
    name: string;
    total_points: number;
    round_points: number;
  }>;
};

export default function RoundFocusedAdmin({
  pods,
  podKeys,
  sessionId,
  roundId,
}: {
  pods: Record<string, FocusedPod>;
  podKeys: string[];
  sessionId: number;
  roundId: number;
}) {
  const [participantModalOpen, setParticipantModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<RoundParticipantSummary>();

  const anyOpen = Object.values(pods).some((pod) => !pod.submitted);

  const openParticipantModal = (p: RoundParticipantSummary) => {
    setSelectedParticipant(p);
    setParticipantModalOpen(true);
  };

  return (
    <div>
      {anyOpen && (
        <div className="mb-4">
          <Link to={`/league-session/${sessionId}/${roundId}/pods`}>
            <StandardButton title="Edit pods" />
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {podKeys.map((podId, index) => {
        const pod = pods[podId];
        if (!pod) return null;
        const winnerId = pod?.winner_info?.participants?.id;
        const endInDraw = pod?.submitted && !pod?.winner_info;

        return (
          <div key={podId} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold text-slate-900">
                  Pod {index + 1}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    pod?.submitted ? "text-sky-700" : "text-green-700"
                  }`}
                >
                  {pod?.submitted ? "Submitted" : "Open"}
                </div>
              </div>

              <div className="flex items-center gap-5 text-2xl">
                <Link
                  to={`/league-session/${sessionId}/${roundId}/scorecard/${podId}`}
                >
                  <i
                    className={`fa-solid fa-${
                      pod?.submitted ? "pen-to-square" : "circle-exclamation"
                    } text-sky-600 hover:text-sky-500`}
                  />
                </Link>
              </div>
            </div>

            <ul className="mt-3 list-disc pl-5 space-y-2">
              {pod.participants.map((p) => {
                const isWinner = winnerId === p.participant_id;

                return (
                  <li key={p.participant_id} className="text-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        openParticipantModal({
                          participant_id: p.participant_id,
                          name: p.name,
                          round_points: p.round_points,
                          total_points: p.total_points,
                          round_id: roundId,
                        })
                      }
                      className={`text-left hover:text-sky-700 ${
                        endInDraw ? "text-slate-500" : ""
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          !endInDraw && isWinner ? "text-green-700" : ""
                        }`}
                      >
                        {p.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      </div>

      <RoundParticipantModal
        isOpen={participantModalOpen}
        closeModal={() => {
          setParticipantModalOpen(false);
          setSelectedParticipant(undefined);
        }}
        selected={selectedParticipant}
      />
    </div>
  );
}

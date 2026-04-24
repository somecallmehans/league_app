import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import StandardButton from "../../../components/Button";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { podCalculator } from "../../../helpers/helpers";
import {
  useDeleteLobbySignInMutation,
  usePostBeginRoundMutation,
} from "../../../api/apiSlice";

export default function RoundLobbyAdmin({
  sessionId,
  roundId,
  participants,
}: {
  sessionId: number;
  roundId: number;
  participants: Array<{ id: number; name: string }>;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lockSubmit, setLockSubmit] = useState(false);

  const [deleteLobbySignIn] = useDeleteLobbySignInMutation();
  const [postBeginRound] = usePostBeginRoundMutation();

  const count = participants?.length ?? 0;
  const disableBegin = [0, 1, 2].includes(count) || lockSubmit;

  const removeParticipant = async (participant_id: number) => {
    try {
      await deleteLobbySignIn({ round_id: roundId, participant_id }).unwrap();
      toast.success("Updated successfully");
    } catch (err) {
      toast.error("Removing sign-in failed");
      console.error("sign-in failed", err);
    }
  };

  const beginRound = async () => {
    try {
      setLockSubmit(true);
      await postBeginRound({
        round: roundId,
        session: sessionId,
        participants: participants.map((p) => ({ id: p.id, name: p.name })),
      }).unwrap();
      setShowConfirm(false);
    } catch (err) {
      console.error("Failed to begin round: ", err);
      setLockSubmit(false);
    }
  };

  const helper = useMemo(() => podCalculator(count), [count]);

  if (!participants) return <LoadingSpinner />;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-slate-700">
          <div className="text-sm font-semibold">Checked in</div>
          <div className="text-sm">
            {count} player{count === 1 ? "" : "s"} ·{" "}
            <span className="text-slate-600">{helper}</span>
          </div>
        </div>
        <StandardButton
          title="Begin round"
          action={() => setShowConfirm(true)}
          disabled={disableBegin}
          type="button"
        />
      </div>

      <div className="mt-4">
        {participants.length === 0 && (
          <div className="text-sm text-slate-600">
            No one is checked in yet.
          </div>
        )}

        <ul className="space-y-2">
          {participants.map((p, idx) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
            >
              <span className="text-slate-800 font-medium">
                {idx + 1}. {p.name}
              </span>
              <button
                type="button"
                onClick={() => removeParticipant(p.id)}
                className="text-red-600 hover:text-red-500"
                aria-label={`Remove ${p.name}`}
              >
                <i className="fa-solid fa-trash-can" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Begin round?"
        bodyText="This will create pods from the currently checked-in players."
        confirmAction={() => void beginRound()}
        closeModal={() => setShowConfirm(false)}
        disableSubmit={lockSubmit}
      />
    </div>
  );
}

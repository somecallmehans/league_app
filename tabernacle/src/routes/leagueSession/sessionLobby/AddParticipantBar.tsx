import { useEffect, useMemo, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";

import StandardButton from "../../../components/Button";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  useGetParticipantsQuery,
  usePostLobbySignInMutation,
  usePostUpsertParticipantMutation,
} from "../../../api/apiSlice";

type RoundTarget = "round1" | "round2" | "both";

type SelectOption = { value: number; label: string };

export default function AddParticipantBar({
  roundOneId,
  roundTwoId,
  roundOneStarted,
  roundTwoStarted,
}: {
  roundOneId: number;
  roundTwoId: number;
  roundOneStarted: boolean;
  roundTwoStarted: boolean;
}) {
  const [target, setTarget] = useState<RoundTarget>("round1");
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const { data: participants, isLoading } = useGetParticipantsQuery();

  const [postLobbySignIn] = usePostLobbySignInMutation();
  const [postUpsertParticipant] = usePostUpsertParticipantMutation();

  const options = useMemo(() => {
    if (!participants) return [];
    return participants.map((p) => ({ value: p.id, label: p.name }));
  }, [participants]);

  const canAddRoundOne = !roundOneStarted;
  const canAddRoundTwo = !roundTwoStarted;
  const canAddBoth = canAddRoundOne && canAddRoundTwo;

  useEffect(() => {
    // Normalize target without causing render loops.
    // Never auto-select "both" unless it is valid.
    if (!canAddRoundOne && !canAddRoundTwo) return;

    const desired =
      target === "round1" && !canAddRoundOne
        ? "round2"
        : target === "round2" && !canAddRoundTwo
          ? "round1"
          : target === "both" && !canAddBoth
            ? canAddRoundOne
              ? "round1"
              : "round2"
            : target;

    // If the desired option is still invalid (e.g. only one round available),
    // force to the available round.
    const next =
      desired === "round1" && !canAddRoundOne
        ? "round2"
        : desired === "round2" && !canAddRoundTwo
          ? "round1"
          : desired === "both" && !canAddBoth
            ? canAddRoundOne
              ? "round1"
              : "round2"
            : desired;

    if (next !== target) setTarget(next);
  }, [target, canAddRoundOne, canAddRoundTwo, canAddBoth]);

  const roundIds = useMemo(() => {
    if (target === "round1") return canAddRoundOne ? [roundOneId] : [];
    if (target === "round2") return canAddRoundTwo ? [roundTwoId] : [];
    return canAddBoth ? [roundOneId, roundTwoId] : [];
  }, [target, roundOneId, roundTwoId, canAddRoundOne, canAddRoundTwo, canAddBoth]);

  const addExisting = async (opt: SelectOption) => {
    if (roundIds.length === 0) return;
    try {
      await Promise.all(
        roundIds.map((round_id) =>
          postLobbySignIn({ round_id, participant_id: opt.value }).unwrap(),
        ),
      );
      toast.success("Updated successfully");
    } catch (err) {
      toast.error("Sign-in failed");
      console.error("sign-in failed", err);
    }
  };

  const addNew = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (roundIds.length === 0) return;

    try {
      const created = await postUpsertParticipant({ name: trimmed }).unwrap();
      const participantId = created?.id;
      if (participantId == null) {
        toast.error("Create failed");
        return;
      }
      await Promise.all(
        roundIds.map((round_id) =>
          postLobbySignIn({ round_id, participant_id: participantId }).unwrap(),
        ),
      );
      toast.success("Created and added successfully");
    } catch (err) {
      toast.error("Create failed");
      console.error("create failed", err);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!canAddRoundOne && !canAddRoundTwo) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-slate-700">Add to</div>
          <div className="flex rounded-md border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setTarget("round1")}
              disabled={!canAddRoundOne}
              className={`px-3 py-2 text-sm font-semibold ${
                target === "round1"
                  ? "bg-sky-600 text-white"
                  : !canAddRoundOne
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700"
              }`}
            >
              Round 1
            </button>
            <button
              type="button"
              onClick={() => setTarget("round2")}
              disabled={!canAddRoundTwo}
              className={`px-3 py-2 text-sm font-semibold border-l border-slate-200 ${
                target === "round2"
                  ? "bg-sky-600 text-white"
                  : !canAddRoundTwo
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700"
              }`}
            >
              Round 2
            </button>
            <button
              type="button"
              onClick={() => setTarget("both")}
              disabled={!canAddBoth}
              className={`px-3 py-2 text-sm font-semibold border-l border-slate-200 ${
                target === "both"
                  ? "bg-sky-600 text-white"
                  : !canAddBoth
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700"
              }`}
            >
              Both
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="grow">
            <CreatableSelect
              value={selected}
              isClearable
              options={options}
              isDisabled={roundIds.length === 0}
              onChange={(opt) => {
                setSelected(opt);
                if (opt) void addExisting(opt);
              }}
              onCreateOption={(inputValue) => void addNew(inputValue)}
              isValidNewOption={(inputValue) => !!inputValue?.trim()}
              formatCreateLabel={(inputValue) =>
                `Create "${inputValue.trim()}" and add`
              }
            />
          </div>
          <div className="sm:w-auto">
            <StandardButton
              title="Clear"
              action={() => setSelected(null)}
              type="button"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


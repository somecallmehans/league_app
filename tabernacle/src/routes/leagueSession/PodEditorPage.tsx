import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";

import {
  useGetParticipantsQuery,
  useGetPodsQuery,
  usePostUpsertParticipantMutation,
  useSavePodEditorMutation,
} from "../../api/apiSlice";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import PageTitle from "../../components/PageTitle";

type DraftPod = {
  key: string;
  id: number | null;
  submitted: boolean;
  participantIds: number[];
};

type SelectOption = { value: number; label: string; seated?: boolean };
type MoveOption = { value: string; label: string };

function MoveSelect({
  placeholder,
  options,
  onPick,
}: {
  placeholder: string;
  options: MoveOption[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="w-44 shrink-0">
      <Select<MoveOption, false>
        value={null}
        placeholder={placeholder}
        isSearchable={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        options={options}
        onChange={(option) => {
          if (option) onPick(option.value);
        }}
      />
    </div>
  );
}

export default function PodEditorPage() {
  const { session_id: sessionId, round_id: roundIdParam } = useParams();
  const roundId = roundIdParam ? Number(roundIdParam) : null;
  const navigate = useNavigate();

  const { data: pods, isLoading: podsLoading } = useGetPodsQuery(
    roundId ?? skipToken,
  );
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();
  const [upsertParticipant] = usePostUpsertParticipantMutation();
  const [savePods, { isLoading: saving }] = useSavePodEditorMutation();

  const [draft, setDraft] = useState<DraftPod[] | null>(null);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [extraNames, setExtraNames] = useState<Record<number, string>>({});
  const [problems, setProblems] = useState<string[]>([]);
  const [confirmLeavers, setConfirmLeavers] = useState<string[] | null>(null);

  useEffect(() => {
    if (!pods || draft) return;
    setDraft(
      Object.values(pods).map((pod) => ({
        key: `pod-${pod.id}`,
        id: pod.id,
        submitted: pod.submitted,
        participantIds: pod.participants.map((p) => p.participant_id),
      })),
    );
  }, [pods, draft]);

  const names = useMemo(() => {
    const map = new Map<number, string>();
    for (const person of participants ?? []) {
      if (person.id != null) map.set(person.id, person.name);
    }
    for (const pod of Object.values(pods ?? {})) {
      for (const person of pod.participants) {
        map.set(person.participant_id, person.name);
      }
    }
    for (const [id, name] of Object.entries(extraNames)) {
      map.set(Number(id), name);
    }
    return map;
  }, [participants, pods, extraNames]);

  const originalSeated = useMemo(() => {
    const seated = new Set<number>();
    for (const pod of Object.values(pods ?? {})) {
      for (const person of pod.participants) seated.add(person.participant_id);
    }
    return seated;
  }, [pods]);

  const nameOf = (id: number) => names.get(id) ?? `Player ${id}`;

  const seatedNow = useMemo(() => {
    const seated = new Set<number>();
    for (const pod of draft ?? []) {
      for (const id of pod.participantIds) seated.add(id);
    }
    return seated;
  }, [draft]);

  const unassigned = useMemo(() => {
    const ids = new Set<number>(addedIds);
    for (const id of originalSeated) ids.add(id);
    for (const id of seatedNow) ids.delete(id);
    return [...ids];
  }, [addedIds, originalSeated, seatedNow]);

  const place = (playerId: number, podKey: string | null) => {
    setDraft((current) => {
      if (!current) return current;
      return current.map((pod) => {
        if (pod.submitted) return pod;
        const without = pod.participantIds.filter((id) => id !== playerId);
        if (pod.key === podKey) {
          return { ...pod, participantIds: [...without, playerId] };
        }
        return { ...pod, participantIds: without };
      });
    });
    setProblems([]);
  };

  const addExisting = (option: SelectOption) => {
    if (
      seatedNow.has(option.value) ||
      addedIds.includes(option.value) ||
      originalSeated.has(option.value)
    ) {
      return;
    }
    setAddedIds((current) => [...current, option.value]);
    setExtraNames((current) => ({ ...current, [option.value]: option.label }));
  };

  const addNew = async (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    try {
      const created = await upsertParticipant({ name }).unwrap();
      if (created.id == null || created.id < 0) {
        toast.error("Create failed");
        return;
      }
      setAddedIds((current) => [...current, created.id as number]);
      setExtraNames((current) => ({
        ...current,
        [created.id as number]: name,
      }));
    } catch (err) {
      console.error("create failed", err);
    }
  };

  const removeAdded = (playerId: number) => {
    setAddedIds((current) => current.filter((id) => id !== playerId));
    place(playerId, null);
  };

  const addPod = () => {
    setDraft((current) => [
      ...(current ?? []),
      {
        key: `new-${Date.now()}`,
        id: null,
        submitted: false,
        participantIds: [],
      },
    ]);
  };

  const removePod = (key: string) => {
    setDraft((current) => current?.filter((pod) => pod.key !== key) ?? current);
  };

  const commit = async () => {
    if (!draft || roundId == null) return;
    const addedUnassigned = addedIds.filter((id) => !seatedNow.has(id));
    const sizeProblems = draft.flatMap((pod, index) => {
      const size = new Set(pod.participantIds).size;
      if (size < 3 || size > 5) {
        return [`Pod ${index + 1} must have 3, 4, or 5 players.`];
      }
      return [];
    });
    if (addedUnassigned.length > 0 || sizeProblems.length > 0) {
      setProblems([
        ...addedUnassigned.map((id) => `${nameOf(id)} still needs a pod.`),
        ...sizeProblems,
      ]);
      setConfirmLeavers(null);
      return;
    }

    const leavers = [...originalSeated].filter((id) => !seatedNow.has(id));
    if (leavers.length > 0 && confirmLeavers == null) {
      setConfirmLeavers(leavers.map(nameOf));
      return;
    }

    try {
      await savePods({
        round_id: roundId,
        pods: draft.map((pod) => ({
          id: pod.id,
          participant_ids: pod.participantIds,
        })),
        unassigned: [],
      }).unwrap();
      toast.success("Pods saved");
      navigate(`/league-session/${sessionId}`);
    } catch (err) {
      const data = (err as { data?: { problems?: string[] } }).data;
      setProblems(data?.problems ?? ["Save failed."]);
      setConfirmLeavers(null);
      console.error("pod editor save failed", err);
    }
  };

  if (podsLoading || participantsLoading || !draft) return <LoadingSpinner />;

  if (!sessionId || roundId == null) {
    return (
      <div className="bg-white p-4">
        <PageTitle title="Round not found" />
      </div>
    );
  }

  const openPods = draft.filter((pod) => !pod.submitted);

  return (
    <div className="bg-white p-4 mb-4">
      <PageTitle title="Pod editor" />
      <div className="flex items-center justify-between mb-4">
        <Link to={`/league-session/${sessionId}`}>
          <StandardButton title="Back" />
        </Link>
        <StandardButton
          title={saving ? "Saving..." : "Save"}
          action={() => void commit()}
          disabled={saving}
        />
      </div>

      {problems.length > 0 && (
        <ul className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="mb-4 rounded-lg border border-slate-200 p-3">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          Add a player
        </div>
        <CreatableSelect<SelectOption, false>
          value={null}
          options={(participants ?? []).map((person) => ({
            value: person.id,
            label: person.name,
            seated: seatedNow.has(person.id),
          }))}
          formatOptionLabel={(option) => (
            <span className="inline-flex items-center gap-2">
              <span>{option.label}</span>
              {option.seated && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                  Seated
                </span>
              )}
            </span>
          )}
          isOptionDisabled={(option) => !!option.seated}
          onChange={(option) => {
            if (option) addExisting(option);
          }}
          onCreateOption={(input) => void addNew(input)}
          isValidNewOption={(input) => !!input?.trim()}
          formatCreateLabel={(input) => `Create "${input.trim()}"`}
          placeholder="Find or create a player"
        />
      </div>

      {unassigned.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-sm font-semibold text-amber-900 mb-2">
            Not in a pod
          </div>
          <ul className="space-y-2">
            {unassigned.map((id) => (
              <li
                key={id}
                className="flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <span className="text-slate-800 font-medium sm:w-48">
                  {nameOf(id)}
                </span>
                <MoveSelect
                  placeholder="Move to a pod"
                  options={openPods.map((pod) => ({
                    value: pod.key,
                    label: `Pod ${draft.indexOf(pod) + 1}`,
                  }))}
                  onPick={(podKey) => place(id, podKey)}
                />
                {addedIds.includes(id) && (
                  <button
                    type="button"
                    className="text-sm text-red-600"
                    onClick={() => removeAdded(id)}
                  >
                    Remove from this edit
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {draft.map((pod, index) => (
          <div key={pod.key} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Pod {index + 1}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    pod.submitted ? "text-sky-700" : "text-green-700"
                  }`}
                >
                  {pod.submitted ? "Submitted" : "Open"}
                </div>
              </div>
              {!pod.submitted && (
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() => removePod(pod.key)}
                >
                  Remove pod
                </button>
              )}
            </div>
            <ul className="mt-3 space-y-2">
              {pod.participantIds.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-slate-800">{nameOf(id)}</span>
                  {!pod.submitted && (
                    <MoveSelect
                      placeholder="Stay"
                      options={[
                        { value: "unassigned", label: "Unassigned" },
                        ...openPods
                          .filter((other) => other.key !== pod.key)
                          .map((other) => ({
                            value: other.key,
                            label: `Pod ${draft.indexOf(other) + 1}`,
                          })),
                      ]}
                      onPick={(next) =>
                        place(id, next === "unassigned" ? null : next)
                      }
                    />
                  )}
                </li>
              ))}
              {pod.participantIds.length === 0 && (
                <li className="text-sm text-slate-500">No players yet</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <StandardButton title="Add pod" action={addPod} />
      </div>

      <ConfirmModal
        isOpen={confirmLeavers != null}
        title="These players will leave the round"
        bodyText={
          <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
            {(confirmLeavers ?? []).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        }
        confirmAction={() => void commit()}
        closeModal={() => setConfirmLeavers(null)}
        disableSubmit={saving}
      />
    </div>
  );
}

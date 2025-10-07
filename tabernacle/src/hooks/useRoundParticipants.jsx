import { useEffect, useMemo, useState } from "react";

import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { getLobbyKey } from "../helpers/formHelpers";
import { readTemps, writeTemps } from "../helpers/helpers";
import {
  usePostBeginRoundMutation,
  useGetPodsQuery,
  useGetParticipantsQuery,
  usePostLobbySignInMutation,
  useDeleteLobbySignInMutation,
} from "../api/apiSlice";

export default function useRouteParticipants(roundId, sessionId, signIns) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [postLobbySignIn] = usePostLobbySignInMutation();
  const [deleteLobbySignIn] = useDeleteLobbySignInMutation();
  const [postBeginRound] = usePostBeginRoundMutation();
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();
  const { watch, setValue, reset } = useFormContext();

  const selected = watch("participants") ?? [];

  const submitForm = async () => {
    try {
      const normalizedParticipants = selected.map((p) => ({
        name: p?.name || p?.label,
        id: p?.id || p?.value,
      }));
      await postBeginRound({
        round: roundId,
        session: sessionId,
        participants: normalizedParticipants,
      }).unwrap();
      localStorage.removeItem(getLobbyKey(roundId));
    } catch (err) {
      console.error("Failed to begin round: ", err);
    }
  };

  const addParticipant = async (participant) => {
    if (!participant) return;

    // If we're adding an existing participant, stick them in our table
    if (participant.value) {
      try {
        await postLobbySignIn({
          round_id: roundId,
          participant_id: participant.value,
        });
      } catch (error) {
        toast.error("Sign-in failed");
        console.error("sign-in failed", e);
        return;
      }
      toast.success("Updated successfully");
      return;
    }

    // Otherwise we put them in local storage
    const next = { label: participant.label };
    const temps = readTemps(roundId);
    if (temps.some((t) => t.label === next.label)) return;

    const updated = [...temps, next];
    writeTemps(roundId, updated);
    const fromServer = signIns.map((p) => ({ value: p.id, label: p.name }));

    setValue("participants", [...fromServer, ...updated], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const removeParticipant = async (idx) => {
    const list = watch("participants") ?? [];
    const p = list[idx];
    if (!p) return;

    // Same as above, if we have an ID hit the API
    if (p.value) {
      try {
        await deleteLobbySignIn({ round_id: roundId, participant_id: p.value });
      } catch (error) {
        toast.error("Removing sign-in failed");
        console.error("sign-in failed", e);
        return;
      }
      toast.success("Updated successfully");
      return;
    }

    // Otherwise update local storage
    const temps = readTemps(roundId);
    const updated = temps.filter((t) => t.label !== p.label);
    writeTemps(roundId, updated);
    const serverOpts = signIns.map((s) => ({
      value: s.id,
      label: s.name,
    }));

    setValue("participants", [...serverOpts, ...updated], {
      shouldDirty: true,
    });
  };

  const filtered = useMemo(() => {
    if (!participants) return [];
    return participants
      .filter((p) => !selected.some((s) => s.value === p.id || s.id === p.id))
      .map((p) => ({ value: p.id, label: p.name }));
  }, [participants, selected]);

  return {
    filtered,
    selected,
    submitForm,
    addParticipant,
    removeParticipant,
    loading: participantsLoading,
  };
}

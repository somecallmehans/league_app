import { useEffect, useMemo, useState } from "react";

import { useFormContext } from "react-hook-form";

import { getLobbyKey } from "../helpers/formHelpers";
import {
  usePostBeginRoundMutation,
  useGetPodsQuery,
  useGetParticipantsQuery,
} from "../api/apiSlice";

export default function useRouteParticipants(
  roundId,
  sessionId,
  previousRoundId
) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [postBeginRound] = usePostBeginRoundMutation();
  const { data: previousPods, isLoading: podsLoading } = useGetPodsQuery(
    previousRoundId,
    {
      skip: !previousRoundId,
    }
  );
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();
  const { watch, setValue, reset } = useFormContext();

  const selected = watch("participants");

  const previous = useMemo(() => {
    if (!previousPods) return [];
    return Object.values(previousPods).flatMap(({ participants }) =>
      Object.values(participants).map((p) => ({
        value: p?.participant_id,
        label: p?.name,
      }))
    );
  }, [previousPods]);

  useEffect(() => {
    // Try restoring from localStorage first
    const stored = localStorage.getItem(getLobbyKey(roundId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          reset({ participants: parsed });
          setHasHydrated(true);
          return;
        }
      } catch (e) {
        console.error("Failed to parse localStorage data", e);
      }
    }

    if (previous.length) {
      reset({ participants: previous });
      localStorage.setItem(getLobbyKey(roundId), JSON.stringify(previous));
    }

    setHasHydrated(true);
  }, [roundId]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (selected.length > 0) {
      localStorage.setItem(getLobbyKey(roundId), JSON.stringify(selected));
    } else {
      console.log("removing storage");
      localStorage.removeItem(getLobbyKey(roundId));
    }
  }, [selected, hasHydrated, roundId]);

  const submitForm = async () => {
    try {
      const normalizedParticipants = selected.map((p) => ({
        name: p?.label,
        id: p?.value,
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

  const addParticipant = (participant) => {
    if (participant) {
      const updatedParticipants = [
        ...selected,
        {
          label: participant.label,
          value: participant.value,
        },
      ];
      console.log(updatedParticipants);
      setValue("participants", updatedParticipants);
    }
  };

  const removeParticipant = (index) => {
    const updatedParticipants = [
      ...selected.slice(0, index),
      ...selected.slice(index + 1),
    ];
    setValue("participants", updatedParticipants);
  };

  const filtered = useMemo(() => {
    if (!participants) return [];
    return participants
      .filter((p) => !selected.some((s) => s.value === p.id))
      .map((p) => ({ value: p.id, label: p.name }));
  }, [participants, selected]);

  return {
    filtered,
    selected,
    submitForm,
    addParticipant,
    removeParticipant,
    loading: participantsLoading || podsLoading,
  };
}

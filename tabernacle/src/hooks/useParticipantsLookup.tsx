import { useMemo } from "react";
import { useGetParticipantsQuery } from "../api/apiSlice";

export default function useParticipantsLookup() {
  const { data: participants = [], ...rest } = useGetParticipantsQuery();

  const lookup = useMemo(() => {
    return participants.reduce<Record<number, string>>((acc, p) => {
      if (p.id !== undefined) acc[p.id] = p.name;
      return acc;
    }, {});
  }, [participants]);

  return { lookup, participants, ...rest };
}

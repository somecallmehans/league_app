import { useMemo } from "react";
import { useGetCommandersQuery } from "../api/apiSlice";

export default function useCommanderOptions() {
  const { data: commanders, isLoading: commandersLoading } =
    useGetCommandersQuery();

  const commanderOptions = useMemo(() => {
    return [
      { id: -1, name: "Type To Select a Primary Commander" },
      ...(commanders?.commanders ?? []),
    ];
  }, [commanders]);

  const partnerOptions = useMemo(() => {
    return [
      { id: -1, name: "Type To Select a Partner/Background/Companion" },
      ...(commanders?.partners ?? []),
    ];
  }, [commanders]);

  const companionOptions = commanders?.companions ?? [];

  if (commandersLoading) {
    return { commanderOptions: [], partnerOptions: [], companionOptions: [] };
  }

  return { commanderOptions, partnerOptions, companionOptions };
}

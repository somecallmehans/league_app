import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetAchievementsQuery,
  useGetCommandersQuery,
  useGetPodParticipantsQuery,
} from "../api/apiSlice";

const slugRegex = /win-\d-colors/i;

export default function useScorecardInfo() {
  const { pod_id } = useParams<{
    pod_id: string;
  }>();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsQuery();
  const { data: commanders, isLoading: commandersLoading } =
    useGetCommandersQuery();
  const podParticipantsQueryArg = pod_id ? { pod_id } : skipToken;

  const { data: participants, isLoading: participantsLoading } =
    useGetPodParticipantsQuery(podParticipantsQueryArg);

  const filteredAchievements = useMemo(() => {
    if (!achievements?.data) return [];
    return achievements.data
      .filter((a) => !achievements.parents.includes(a.id))
      .filter(({ slug }) => !slug?.match(slugRegex))
      .map((a) => ({ id: a.id, name: a.full_name }));
  }, [achievements]);

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

  return {
    filteredAchievements,
    participants,
    commanderOptions,
    partnerOptions,
  };
}

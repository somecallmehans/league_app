import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetScorecardAchievementOptionsQuery,
  useGetPodParticipantsQuery,
} from "../api/apiSlice";

export default function useScorecardInfo() {
  const { pod_id } = useParams<{
    pod_id: string;
  }>();
  const { data: achievementOptions, isLoading: achievementsLoading } =
    useGetScorecardAchievementOptionsQuery();

  const podParticipantsQueryArg = pod_id ? { pod_id } : skipToken;

  const { data: participants, isLoading: participantsLoading } =
    useGetPodParticipantsQuery(podParticipantsQueryArg);

  const filteredAchievements = useMemo(() => {
    if (!achievementOptions) return [];
    const legacy = achievementOptions.legacy.map((a) => ({
      id: a.id,
      name: a.name,
    }));
    const scalable = achievementOptions.scalable.map((a) => ({
      achievement_id: a.achievement_id,
      scalable_term_id: a.scalable_term_id,
      name: a.name,
    }));
    return [...legacy, ...scalable];
  }, [achievementOptions]);

  if (achievementsLoading || participantsLoading) {
    return { filteredAchievements: [], participants: [] };
  }

  return {
    filteredAchievements,
    participants,
  };
}

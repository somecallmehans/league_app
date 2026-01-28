import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetAchievementsQuery,
  useGetPodParticipantsQuery,
} from "../api/apiSlice";

const slugRegex = /win-\d-colors/i;

export default function useScorecardInfo() {
  const { pod_id } = useParams<{
    pod_id: string;
  }>();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsQuery();

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

  if (achievementsLoading || participantsLoading) {
    return { filteredAchievements: [], participants: [] };
  }

  return {
    filteredAchievements,
    participants,
  };
}

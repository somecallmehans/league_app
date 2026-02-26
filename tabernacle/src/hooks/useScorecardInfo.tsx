import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetPodParticipantsQuery } from "../api/apiSlice";
import useScorecardAchievementOptions from "./useScorecardAchievementOptions";

export default function useScorecardInfo() {
  const { pod_id } = useParams<{
    pod_id: string;
  }>();
  const { options: filteredAchievements, isLoading: achievementsLoading } =
    useScorecardAchievementOptions();

  const podParticipantsQueryArg = pod_id ? { pod_id } : skipToken;

  const { data: participants, isLoading: participantsLoading } =
    useGetPodParticipantsQuery(podParticipantsQueryArg);

  if (achievementsLoading || participantsLoading) {
    return { filteredAchievements: [], participants: [] };
  }

  return {
    filteredAchievements,
    participants,
  };
}

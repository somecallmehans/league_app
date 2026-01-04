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

  if (achievementsLoading || commandersLoading || participantsLoading) {
    return {
      filteredAchievements: [],
      commanders: [],
      partners: [],
      participants: [],
    };
  }

  const filteredAchievements = achievements?.data
    .filter((achievement) => !achievements.parents.includes(achievement.id))
    .filter(({ slug }) => !slug?.match(slugRegex))
    .map((achievement) => ({
      id: achievement?.id,
      name: achievement?.full_name,
    }));

  const commanderOptions = [
    { id: -1, name: "Type To Select a Primary Commander" },
    ...(commanders?.commanders ?? []),
  ];
  const partnerOptions = [
    { id: -1, name: "Type To Select a Partner/Background/Companion" },
    ...(commanders?.partners ?? []),
  ];

  return {
    filteredAchievements,
    participants,
    commanderOptions,
    partnerOptions,
  };
}

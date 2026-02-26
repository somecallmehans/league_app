import { useMemo } from "react";
import { useGetAchievementsListQuery } from "../api/apiSlice";
import useScorecardAchievementOptions from "./useScorecardAchievementOptions";

export default function useDecklistCart() {
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();
  const { options: filteredAchievements, isLoading: optionsLoading } =
    useScorecardAchievementOptions();

  const loading = achievementsLoading || optionsLoading;

  const pointLookup = useMemo(() => {
    if (!achievements) return {};
    const byId: Record<number, number> = {};
    for (const a of achievements) {
      byId[a.id] = a.points ?? 0;
    }
    return byId;
  }, [achievements]);

  if (loading) {
    return { achievements: [], lookup: {} };
  }

  return { achievements: filteredAchievements, lookup: pointLookup };
}

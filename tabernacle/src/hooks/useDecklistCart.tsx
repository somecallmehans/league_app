import { useMemo } from "react";
import {
  useGetAchievementsListQuery,
  useGetAchievementsQuery,
} from "../api/apiSlice";

export default function useDecklistCart() {
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();
  const { data: achievementsObj, isLoading: achievementsObjLoading } =
    useGetAchievementsQuery();

  const loading = achievementsLoading || achievementsObjLoading;

  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements
      .filter(({ slug }) => !slug || slug === "precon")
      .filter(({ id }) => !achievementsObj?.parents.includes(id))
      .map((a) => ({ id: a.id, name: a.full_name }));
  }, [achievements, achievementsObj]);

  const pointLookup = useMemo(() => {
    if (!achievements) return {};

    return achievements.reduce<Record<number, number>>((acc, curr) => {
      acc[curr.id] = curr.points ?? 0;
      return acc;
    }, {});
  }, [achievements]);

  if (loading) {
    return { achievements: [], lookup: {} };
  }

  return { achievements: filteredAchievements, lookup: pointLookup };
}

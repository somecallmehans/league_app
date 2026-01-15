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

  if (loading) {
    return {};
  }

  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements
      .filter(({ slug }) => !slug)
      .filter(({ id }) => !achievementsObj?.parents.includes(id))
      .map((a) => ({ id: a.id, name: a.full_name }));
  }, [achievements, achievementsObj]);

  const pointLookup = useMemo(() => {
    if (!achievements) return {};
    return achievements?.reduce((acc: any, curr) => {
      acc[curr.id] = curr.points;
      return acc;
    }, {});
  }, [achievements]);

  return { achievements: filteredAchievements, lookup: pointLookup };
}

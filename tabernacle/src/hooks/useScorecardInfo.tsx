import { useGetAchievementsQuery } from "../api/apiSlice";

const slugRegex = /win-\d-colors/i;

export default function useScorecardInfo() {
  const { data: achievements } = useGetAchievementsQuery();
  const filteredAchievements = achievements?.data
    .filter((achievement) => !achievements.parents.includes(achievement.id))
    .filter(({ slug }) => !slug?.match(slugRegex))
    .map((achievement) => ({
      id: achievement?.id,
      name: achievement?.full_name,
    }));

  return { filteredAchievements };
}

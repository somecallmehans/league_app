import { type Achievement } from "../types/achievement_schemas";

export type AchievementWithChildren = Achievement & {
  children: AchievementWithChildren[];
};

export const associateParentsChildren = (achievements: Achievement[]) => {
  if (!achievements) return [];
  const lookup = new Map<number, AchievementWithChildren>();
  const roots: AchievementWithChildren[] = [];

  for (const temp of achievements) {
    const achievement: AchievementWithChildren = { ...temp, children: [] };
    lookup.set(achievement.id, achievement);
  }

  for (const temp of achievements) {
    const achievement = lookup.get(temp.id);
    if (!achievement) continue;

    if (temp.parent_id) {
      const parent = lookup.get(temp.parent_id);
      if (parent) {
        parent.children.push(achievement);
      }
    } else {
      roots.push(achievement);
    }
  }

  return roots;
};

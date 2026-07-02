import { useState } from "react";

const useAchievementSearch = (
  achievements,
  achievementLookup,
  typeFilter,
  rarityFilter,
) => {
  const [searchTerm, setSearchTerm] = useState();

  if (!achievements) return { filteredData: [], setSearchTerm };

  if (!searchTerm && !typeFilter && !rarityFilter) {
    return { filteredData: achievements, setSearchTerm };
  }

  const out = [];
  const seen = new Set();

  const isParent = (achievement) => !achievement.parent_id;

  const getDisplayRarity = (achievement) => {
    if (achievement.parent_id) {
      const parent = achievementLookup[achievement.parent_id];
      return parent?.rarity ?? achievement.rarity;
    }
    return achievement.rarity;
  };

  const matchesSearch = (achievement) =>
    !searchTerm ||
    achievement.full_name.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesType = (achievement) =>
    !typeFilter?.value ||
    (achievementLookup[achievement.parent_id]?.type_id ??
      achievement.type_id) === typeFilter?.value;

  const matchesRarity = (achievement) => {
    if (!rarityFilter?.value) return true;
    const rarity = getDisplayRarity(achievement);
    if (!isParent(achievement)) {
      const parent = achievementLookup[achievement.parent_id];
      return getDisplayRarity(parent ?? achievement) === rarityFilter.value;
    }
    return rarity === rarityFilter.value;
  };

  const addAchievement = (achievement) => {
    if (!seen.has(achievement.id)) {
      out.push(achievement);
      seen.add(achievement.id);
    }
  };

  const addAllChildren = (parentId) => {
    achievements.forEach((child) => {
      if (child.parent_id === parentId) {
        addAchievement(child);
      }
    });
  };

  achievements.forEach((achievement) => {
    const parent = isParent(achievement)
      ? achievement
      : achievementLookup[achievement.parent_id];

    if (!matchesType(achievement) || !matchesRarity(achievement)) return;

    const isSearchMatch = matchesSearch(achievement);
    if (isParent(achievement) && !searchTerm && (typeFilter?.value || rarityFilter?.value)) {
      addAchievement(achievement);
      addAllChildren(achievement.id);
      return;
    }

    if (isSearchMatch) {
      addAchievement(achievement);
      if (!isParent(achievement)) addAchievement(parent);
    }
  });

  return { filteredData: out, setSearchTerm };
};

export default useAchievementSearch;

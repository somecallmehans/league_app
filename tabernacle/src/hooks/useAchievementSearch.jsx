import { useState } from "react";

const useAchievementSearch = (
  achievements,
  achievementLookup,
  pointFilter,
  typeFilter
) => {
  // This is a special version of the search since we need to search
  // on a nested list.
  const [searchTerm, setSearchTerm] = useState();

  if (!achievements) return { filteredData: [], setSearchTerm };

  if (!searchTerm && !pointFilter && !typeFilter) {
    return { filteredData: achievements, setSearchTerm };
  }

  const out = [];
  const seen = new Set();

  const isParent = (achievement) => !achievement.parent_id;
  const matchesPoint = (achievement) =>
    !pointFilter ||
    (achievementLookup[achievement.parent_id]?.point_value ??
      achievement.point_value) === pointFilter;
  const matchesSearch = (achievement) =>
    !searchTerm ||
    achievement.full_name.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesType = (achievement) =>
    !typeFilter?.value ||
    (achievementLookup[achievement.parent_id]?.type_id ??
      achievement.type_id) === typeFilter?.value;

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

    // check the parent, since children don't have point_value
    if (!matchesPoint(parent) || !matchesType(achievement)) return;

    const isSearchMatch = matchesSearch(achievement);
    if (
      isParent(achievement) &&
      pointFilter &&
      !searchTerm &&
      typeFilter?.value
    ) {
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

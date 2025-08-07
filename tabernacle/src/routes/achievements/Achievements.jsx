import React, { useState, useMemo } from "react";

import { useGetAchievementsQuery } from "../../api/apiSlice";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";
import { SearchComponent } from "../../hooks/useSearch";

const useAchievementSearch = (achievements, pointFilter) => {
  // This is a special version of the search since we need to search
  // on a nested list.
  const [searchTerm, setSearchTerm] = useState();

  if (!achievements) return { filteredData: [], setSearchTerm };
  const { data, lookup } = achievements;

  if (!searchTerm && !pointFilter) {
    return { filteredData: data, setSearchTerm };
  }

  const out = [];
  const seen = new Set();

  const isParent = (achievement) => !achievement.parent_id;
  const matchesPoint = (achievement) =>
    !pointFilter ||
    (lookup[achievement.parent_id]?.point_value ?? achievement.point_value) ===
      pointFilter;
  const matchesSearch = (achievement) =>
    !searchTerm ||
    achievement.full_name.toLowerCase().includes(searchTerm.toLowerCase());

  const addAchievement = (achievement) => {
    if (!seen.has(achievement.id)) {
      out.push(achievement);
      seen.add(achievement.id);
    }
  };

  const addAllChildren = (parentId) => {
    data.forEach((child) => {
      if (child.parent_id === parentId) {
        addAchievement(child);
      }
    });
  };

  data.forEach((achievement) => {
    const parent = isParent(achievement)
      ? achievement
      : lookup[achievement.parent_id];

    // check the parent, since children don't have point_value
    if (!matchesPoint(parent)) return;

    const isSearchMatch = matchesSearch(achievement);
    if (isParent(achievement) && pointFilter && !searchTerm) {
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

const Achievement = ({
  name,
  achievementChildren,
  restrictions,
  point_value,
}) => {
  const [toggle, setToggle] = useState();
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
      <div className="flex flex-col  sm:justify-between sm:items-start gap-2">
        <button
          onClick={() => setToggle(!toggle)}
          className="text-left font-medium text-gray-500 text-sm"
        >
          {point_value} Point{point_value !== 1 ? "s" : ""}
          {restrictions.length > 0 && (
            <button
              onClick={() => setToggle(!toggle)}
              className="text-gray-500 hover:text-sky-500 self-start sm:self-center"
              aria-label="Toggle restrictions"
            >
              <i
                className={`fa-solid fa-chevron-right transition-transform duration-200 ml-2 ${
                  toggle ? "rotate-90" : ""
                }`}
              />
            </button>
          )}
        </button>
        <span className="font-bold text-md">{name}</span>
      </div>

      {toggle && restrictions.length > 0 && (
        <div className="mt-2 space-y-2">
          {restrictions.map(({ id, name, url }) => (
            <div
              key={id}
              className="sm:text-base italic text-gray-600 flex items-start"
            >
              <a
                className={`${
                  url ? "hover:text-sky-500 underline" : ""
                } transition text-sm `}
                href={url || undefined}
                target={url ? "_blank" : undefined}
                rel={url ? "noreferrer" : undefined}
              >
                {name}
                {url && <i className="fa-solid fa-link ml-1 text-gray-400" />}
              </a>
            </div>
          ))}
        </div>
      )}
      {achievementChildren?.length > 0 && (
        <div className="mt-4">
          {achievementChildren
            .slice(0, showAll ? achievementChildren.length : 4)
            .map(({ id, name }) => (
              <div key={id} className="ml-4 text-sm italic text-gray-500">
                <i className="fa-solid fa-minus fa-list mr-2 text-sky-400" />
                {name}
              </div>
            ))}

          {achievementChildren.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="ml-4 mt-2 text-sm text-sky-500 hover:underline"
            >
              Show {showAll ? "Less" : "More"}...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const associateParentsChildren = (achievements) => {
  if (!achievements) return [];
  const lookup = new Map();
  const roots = [];

  for (const temp of achievements) {
    const achievement = { ...temp, children: [] };
    lookup.set(achievement.id, achievement);
  }

  for (const temp of achievements) {
    const achievement = lookup.get(temp.id);
    if (temp.parent_id) {
      const parent = lookup.get(temp.parent_id);
      if (parent) {
        parent.children.push(achievement);
      }
    } else {
      roots.push(achievement);
    }
  }

  return roots.sort((a, b) => a.point_value - b.point_value);
};

export default function AchievementsPage() {
  const [pointFilter, setPointFilter] = useState();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsQuery();

  const { filteredData, setSearchTerm } = useAchievementSearch(
    achievements,
    pointFilter
  );

  const associatedList = useMemo(
    () => associateParentsChildren(filteredData),
    [achievements, filteredData]
  );

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  const handleSelectClear = (obj) => {
    if (!obj) {
      setPointFilter(null);
      return;
    }
    setPointFilter(obj.value);
  };

  return (
    <div className="p-4 md:p-8">
      <PageTitle title="Achievements" />
      <div className="text-xs md:text-sm font-light text-gray-800 italic w-full md:w-1/2 mb-2">
        Use the filters below to sort by point value, name, or both. For
        achievements with special restrictions or external references, click the
        chevron in the row to view details or navigate to Moxfield.
      </div>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-2">
          <SimpleSelect
            placeholder="Point Value"
            options={achievements?.points_set.map((v) => ({
              label: v,
              value: v,
            }))}
            value={
              pointFilter ? { label: pointFilter, value: pointFilter } : null
            }
            isClearable
            onChange={handleSelectClear}
            classes="w-full md:w-1/6"
          />
          <SearchComponent
            setSearchTerm={setSearchTerm}
            placeholder="Search By Name"
            classes="grow"
          />
        </div>
      </div>
      {associatedList.map(
        ({
          id,
          name,
          children: achievementChildren,
          restrictions,
          point_value,
        }) => (
          <Achievement
            key={id}
            name={name}
            achievementChildren={achievementChildren}
            restrictions={restrictions}
            point_value={point_value}
          />
        )
      )}
    </div>
  );
}

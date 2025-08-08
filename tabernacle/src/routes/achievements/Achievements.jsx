import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice, useGetAchievementsListQuery } from "../../api/apiSlice";
import { useAchievementSearch } from "../../hooks";
import { associateParentsChildren } from "../../helpers/achievementHelpers";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { AchievementCard, TypeInfo } from "./AchievementComponents";
import { SimpleSelect } from "../crud/CrudComponents";
import { SearchComponent } from "../../hooks/useSearch";

const AchievementFilters = ({
  pointSet,
  pointFilter,
  typeFilter,
  setSearchTerm,
  setPointFilter,
  setTypeFilter,
}) => {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined)
  );
  const handlePointSelectClear = (obj) => {
    if (!obj) {
      setPointFilter(null);
      return;
    }
    setPointFilter(obj.value);
  };

  const handleTypeSelectClear = (obj) => {
    if (!obj) {
      setTypeFilter(null);
      return;
    }
    setTypeFilter(obj);
  };
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-2">
        <SimpleSelect
          placeholder="Point Value"
          options={pointSet.map((v) => ({
            label: v,
            value: v,
          }))}
          value={
            pointFilter ? { label: pointFilter, value: pointFilter } : null
          }
          isClearable
          onChange={handlePointSelectClear}
          classes="w-full md:w-1/6"
        />
        <SimpleSelect
          placeholder="Type"
          options={types.map((t) => ({
            label: t.name,
            value: t.id,
          }))}
          value={
            typeFilter
              ? { label: typeFilter.label, value: typeFilter.value }
              : null
          }
          isClearable
          onChange={handleTypeSelectClear}
          classes="w-full md:w-1/3"
        />
        <SearchComponent
          setSearchTerm={setSearchTerm}
          placeholder="Search By Name"
          classes="grow"
        />
      </div>
    </div>
  );
};

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const [pointFilter, setPointFilter] = useState();
  const [typeFilter, setTypeFilter] = useState();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();

  useEffect(() => {
    dispatch(apiSlice.endpoints.getAchievementTypes.initiate(undefined));
  });

  const achievementLookup = useMemo(() => {
    if (!achievements) return {};

    return achievements.reduce((acc, achievement) => {
      acc[achievement.id] = achievement;
      return acc;
    }, {});
  }, [achievements]);

  const pointSet = useMemo(() => {
    if (!achievements) return [];
    const all_points = achievements
      .filter((achievement) => achievement.point_value)
      .map((achievement) => {
        if (!achievement.point_value) {
          return;
        }
        return achievement.point_value;
      })
      .sort((a, b) => a - b);
    const points = new Set(all_points);
    return [...points];
  }, [achievements]);

  // Doing this the un-ideal way to start. Eventually/soon filtering will
  // be handled by the backend to support more complex filtering.
  const { filteredData, setSearchTerm } = useAchievementSearch(
    achievements,
    achievementLookup,
    pointFilter,
    typeFilter
  );

  const groupedAchievements = useMemo(() => {
    if (!achievements) return [];

    const associated = associateParentsChildren(filteredData);
    const groups = {};
    for (const achievement of associated) {
      const points = achievement.point_value ?? 0;
      if (!groups[points]) {
        groups[points] = [];
      }
      groups[points].push(achievement);
    }
    return groups;
  }, [filteredData]);

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-8">
      <PageTitle title="Achievements" />
      <div className="text-xs md:text-sm font-light text-gray-800 italic w-full md:w-1/2 mb-2">
        Use the filters below to sort by point value, name, or both. If an
        achievement has special notes, external links, or nested achievements
        (like scalable or “X or more”), click its tile to see the full details.
      </div>

      <AchievementFilters
        pointSet={pointSet}
        pointFilter={pointFilter}
        typeFilter={typeFilter}
        setSearchTerm={setSearchTerm}
        setPointFilter={setPointFilter}
        setTypeFilter={setTypeFilter}
      />
      <TypeInfo />
      {Object.keys(groupedAchievements).map((key) => (
        <div key={key} className="my-4">
          <div className="grid md:grid-cols-4 gap-4">
            {groupedAchievements[key].map((achievement) => (
              <AchievementCard key={achievement.id} {...achievement} />
            ))}
          </div>
          <hr className="h-px my-8 bg-gray-300 border-0"></hr>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice, useGetAchievementsListQuery } from "../../api/apiSlice";
import { useAchievementSearch } from "../../hooks";
import { associateParentsChildren } from "../../helpers/achievementHelpers";

import { Input } from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { AchievementCard, TypeInfo } from "./AchievementComponents";
import { SimpleSelect } from "../crud/CrudComponents";

const SearchFilter = ({ setSearchTerm, placeholder, classes }) => (
  <Input
    placeholder={placeholder}
    className={`text-gray-600 bg-white py-1.5 w-full sm:w-2/3 px-1 rounded  border border-zinc-300 ${classes}`}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
);

const TypeSelectFilter = ({ typeFilter, setTypeFilter }) => {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined)
  );

  return (
    <SimpleSelect
      placeholder="Type"
      options={(types ?? []).map((t) => ({ label: t.name, value: t.id }))}
      value={
        typeFilter ? { label: typeFilter.label, value: typeFilter.value } : null
      }
      isClearable
      onChange={(obj) => setTypeFilter(obj || null)}
      classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0  md:w-1/3 text-gray-600 "
      menuPlacement="top"
    />
  );
};

const SortPoints = ({ sort, setSort }) => (
  <button
    className="bg-white border border-zinc-300 rounded text-xs h-9 px-2 flex items-center justify-center sm:w-1/6 text-gray-600"
    onClick={() => setSort(!sort)}
    aria-label={`Sort by points ${sort ? "ascending" : "descending"}`}
  >
    <span className="mr-1 text-gray-400">Points</span>
    <span
      className={`inline-block transition-transform ${
        sort ? "rotate-180" : ""
      }`}
    >
      <i className="fa-solid fa-sort-up text-gray-400" />
    </span>
  </button>
);

const ShowHideInfo = ({ showInfo, setShowInfo }) => (
  <button
    className="bg-white sm:w-1/6 border border-zinc-300 rounded text-xs h-9 px-2 flex items-center justify-center text-gray-400"
    onClick={() => setShowInfo(!showInfo)}
    aria-label="Show or hide achievement type info"
  >
    {showInfo ? "Hide Info" : "Show Info"}
    <i className={`fa-solid ml-1 fa-eye${showInfo ? "-slash" : ""}`} />
  </button>
);

const AchievementFilters = ({
  typeFilter,
  setSearchTerm,
  setTypeFilter,
  setSort,
  sort,
  showInfo,
  setShowInfo,
}) => {
  return (
    <>
      {/* Mobile layout */}
      <div className="fixed sm:hidden bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t shadow-lg p-2 pb-[calc(env(safe-area-inset-bottom,0)+0.5rem)]">
        <div className="grid grid-cols-3 gap-2 items-center">
          <SortPoints sort={sort} setSort={setSort} />
          <TypeSelectFilter
            setTypeFilter={setTypeFilter}
            typeFilter={typeFilter}
          />

          <ShowHideInfo showInfo={showInfo} setShowInfo={setShowInfo} />
          <div className="col-span-3">
            <SearchFilter
              setSearchTerm={setSearchTerm}
              placeholder="Search by name…"
              classes="w-full h-10 text-base"
            />
          </div>
        </div>
      </div>
      {/* Desktop layout */}
      <div className="hidden sm:block sm:mb-4 sm:flex sm:gap-2">
        <TypeSelectFilter
          setTypeFilter={setTypeFilter}
          typeFilter={typeFilter}
        />
        <SearchFilter
          setSearchTerm={setSearchTerm}
          placeholder="Filter By Name"
          classes="grow"
        />
        <SortPoints sort={sort} setSort={setSort} />
        <ShowHideInfo showInfo={showInfo} setShowInfo={setShowInfo} />
      </div>
    </>
  );
};

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const [sort, setSort] = useState(true);
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 640px)").matches;
  });

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

  // Doing this the un-ideal way to start. Eventually/soon filtering will
  // be handled by the backend to support more complex filtering.
  const { filteredData, setSearchTerm } = useAchievementSearch(
    achievements,
    achievementLookup,
    typeFilter
  );

  const { groups, orderedKeys } = useMemo(() => {
    if (!filteredData) return {};

    const associated = associateParentsChildren(filteredData);
    const sorted = [...associated].sort((a, b) =>
      sort ? b.point_value - a.point_value : a.point_value - b.point_value
    );

    const obj = {};
    const keys = [];
    for (const achievement of sorted) {
      const points = achievement.point_value;
      if (!obj[points]) {
        obj[points] = [];
        keys.push(points);
      }
      obj[points].push(achievement);
    }
    return { groups: obj, orderedKeys: keys };
  }, [filteredData, sort]);

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
        typeFilter={typeFilter}
        setSearchTerm={setSearchTerm}
        setTypeFilter={setTypeFilter}
        sort={sort}
        setSort={setSort}
        showInfo={showInfo}
        setShowInfo={setShowInfo}
      />
      <TypeInfo showInfo={showInfo} setShowInfo={setShowInfo} />
      {orderedKeys.map((key) => (
        <div key={key} className="my-4">
          <div className="grid md:grid-cols-4 gap-4">
            {groups[key].map((achievement) => (
              <AchievementCard key={achievement.id} {...achievement} />
            ))}
          </div>
          <hr className="h-px my-8 bg-gray-300 border-0"></hr>
        </div>
      ))}
    </div>
  );
}

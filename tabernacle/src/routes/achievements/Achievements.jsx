import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  apiSlice,
  useGetAchievementsListQuery,
  useGetMostEarnedAchievementsQuery,
} from "../../api/apiSlice";
import { useAchievementSearch } from "../../hooks";
import { associateParentsChildren } from "../../helpers/achievementHelpers";
import {
  RARITY_ORDER,
  getAchievementTypeOrderIndex,
} from "../../types/achievement_schemas";

import {
  Input,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import CalloutCard from "../../components/CalloutCard";
import {
  AchievementCard,
  AchievementEarningRules,
} from "./AchievementComponents";
import { SimpleSelect } from "../crud/CrudComponents";

const tabButtonClass = ({ selected }) =>
  [
    "rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
    selected
      ? "bg-sky-600 text-white shadow"
      : "bg-white text-gray-700 border border-zinc-300 hover:bg-gray-50",
  ].join(" ");

const RARITY_FILTER_OPTIONS = [
  { label: "Most Popular", value: "Most Popular" },
  { label: "Uncommon", value: "Uncommon" },
  { label: "Rare", value: "Rare" },
  { label: "Mythic", value: "Mythic" },
];

const SORT_MODES = {
  RARITY: "rarity",
  POINTS: "points",
};

function normalizeAchievementForCard(achievement) {
  return {
    ...achievement,
    children: achievement.children ?? [],
    restrictions: achievement.restrictions ?? [],
    point_value: achievement.point_value ?? achievement.points ?? 0,
  };
}

function getRaritySortValue(achievement) {
  if (!achievement?.rarity) return Number.MAX_SAFE_INTEGER;
  return RARITY_ORDER[achievement.rarity] ?? Number.MAX_SAFE_INTEGER;
}

function getTypeSortKey(achievement) {
  return achievement.type?.name ?? "Uncategorized";
}

const SearchFilter = ({ setSearchTerm, placeholder, classes }) => (
  <Input
    placeholder={placeholder}
    className={`text-gray-600 bg-white py-1.5 w-full sm:w-2/3 px-1 rounded  border border-zinc-300 ${classes}`}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
);

function TypeSelectFilter({ typeFilter, setTypeFilter }) {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined),
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
}

function RaritySelectFilter({ rarityFilter, setRarityFilter }) {
  return (
    <SimpleSelect
      placeholder="Rarity"
      options={RARITY_FILTER_OPTIONS}
      value={
        rarityFilter
          ? { label: rarityFilter.label, value: rarityFilter.value }
          : null
      }
      isClearable
      onChange={(obj) => setRarityFilter(obj || null)}
      classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0 md:w-1/3 text-gray-600"
      menuPlacement="top"
    />
  );
}

function SortToggle({ sortMode, setSortMode, sortAsc, setSortAsc }) {
  const isRarity = sortMode === SORT_MODES.RARITY;
  const label = isRarity ? "Rarity" : "Points";

  return (
    <div className="flex gap-1">
      <button
        type="button"
        className={`bg-white border border-zinc-300 rounded text-xs h-9 px-2 flex items-center justify-center text-gray-600 ${
          isRarity ? "ring-1 ring-sky-400" : ""
        }`}
        onClick={() => setSortMode(SORT_MODES.RARITY)}
        aria-label="Sort by rarity"
      >
        Rarity
      </button>
      <button
        type="button"
        className={`bg-white border border-zinc-300 rounded text-xs h-9 px-2 flex items-center justify-center text-gray-600 ${
          !isRarity ? "ring-1 ring-sky-400" : ""
        }`}
        onClick={() => setSortMode(SORT_MODES.POINTS)}
        aria-label="Sort by points"
      >
        Points
      </button>
      <button
        type="button"
        className="bg-white border border-zinc-300 rounded text-xs h-9 px-3 flex items-center justify-center sm:w-1/5 text-gray-600"
        onClick={() => setSortAsc(!sortAsc)}
        aria-label={`Sort ${label} ${sortAsc ? "ascending" : "descending"}`}
      >
        <span className="text-[10px] font-medium text-gray-500">
          {sortAsc ? "ASC" : "DESC"}
        </span>
      </button>
    </div>
  );
}

const AchievementFilters = ({
  typeFilter,
  rarityFilter,
  setSearchTerm,
  setTypeFilter,
  setRarityFilter,
  sortMode,
  setSortMode,
  sortAsc,
  setSortAsc,
}) => {
  return (
    <>
      <div className="fixed sm:hidden bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t shadow-lg p-2 pb-[calc(env(safe-area-inset-bottom,0)+0.5rem)]">
        <div className="grid grid-cols-2 gap-2 items-center">
          <TypeSelectFilter
            setTypeFilter={setTypeFilter}
            typeFilter={typeFilter}
          />
          <RaritySelectFilter
            rarityFilter={rarityFilter}
            setRarityFilter={setRarityFilter}
          />
          <div className="col-span-2">
            <SortToggle
              sortMode={sortMode}
              setSortMode={setSortMode}
              sortAsc={sortAsc}
              setSortAsc={setSortAsc}
            />
          </div>
          <div className="col-span-2">
            <SearchFilter
              setSearchTerm={setSearchTerm}
              placeholder="Search by name…"
              classes="w-full h-10 text-base"
            />
          </div>
        </div>
      </div>
      <div className="hidden sm:block sm:mb-4 sm:flex sm:gap-2 sm:flex-wrap">
        <TypeSelectFilter
          setTypeFilter={setTypeFilter}
          typeFilter={typeFilter}
        />
        <RaritySelectFilter
          rarityFilter={rarityFilter}
          setRarityFilter={setRarityFilter}
        />
        <SearchFilter
          setSearchTerm={setSearchTerm}
          placeholder="Filter By Name"
          classes="grow min-w-[12rem]"
        />
        <SortToggle
          sortMode={sortMode}
          setSortMode={setSortMode}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
        />
      </div>
    </>
  );
};

function TypeGroupHeader({ typeName, hexCode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-1 h-8 rounded"
        style={{ backgroundColor: hexCode || "#9CA3AF", opacity: 0.6 }}
      />
      <h2 className="text-lg font-semibold text-gray-800">{typeName}</h2>
    </div>
  );
}

function MostEarnedAchievementsPanel() {
  const { data, isLoading } = useGetMostEarnedAchievementsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-gray-600">
        No matching earned achievements to show yet.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-600 mb-4">
        The most frequently earned achievements in commander league.
      </p>
      <div className="my-4">
        <div className="grid md:grid-cols-4 gap-4">
          {data.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              {...normalizeAchievementForCard(achievement)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function AllAchievementsTab() {
  const [sortMode, setSortMode] = useState(SORT_MODES.RARITY);
  const [sortAsc, setSortAsc] = useState(true);
  const [typeFilter, setTypeFilter] = useState();
  const [rarityFilter, setRarityFilter] = useState();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();

  const achievementLookup = useMemo(() => {
    if (!achievements) return {};

    return achievements.reduce((acc, achievement) => {
      acc[achievement.id] = achievement;
      return acc;
    }, {});
  }, [achievements]);

  const { filteredData, setSearchTerm } = useAchievementSearch(
    achievements,
    achievementLookup,
    typeFilter,
    rarityFilter,
  );

  const { groups, orderedKeys } = useMemo(() => {
    if (!filteredData) return { groups: {}, orderedKeys: [] };

    const associated = associateParentsChildren(filteredData);

    const sorted = [...associated].sort((a, b) => {
      if (sortMode === SORT_MODES.POINTS) {
        const diff = (a.point_value ?? 0) - (b.point_value ?? 0);
        return sortAsc ? diff : -diff;
      }

      const diff = getRaritySortValue(a) - getRaritySortValue(b);
      if (diff !== 0) return sortAsc ? diff : -diff;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    const obj = {};
    for (const achievement of sorted) {
      const typeKey = getTypeSortKey(achievement);
      if (!obj[typeKey]) {
        obj[typeKey] = {
          type: achievement.type,
          achievements: [],
        };
      }
      obj[typeKey].achievements.push(achievement);
    }

    const keys = Object.keys(obj).filter(
      (key) => obj[key]?.achievements?.length,
    );
    keys.sort((a, b) => {
      const orderDiff =
        getAchievementTypeOrderIndex(a) - getAchievementTypeOrderIndex(b);
      if (orderDiff !== 0) return orderDiff;
      return a.localeCompare(b);
    });
    return { groups: obj, orderedKeys: keys };
  }, [filteredData, sortMode, sortAsc]);

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <AchievementFilters
        typeFilter={typeFilter}
        rarityFilter={rarityFilter}
        setSearchTerm={setSearchTerm}
        setTypeFilter={setTypeFilter}
        setRarityFilter={setRarityFilter}
        sortMode={sortMode}
        setSortMode={setSortMode}
        sortAsc={sortAsc}
        setSortAsc={setSortAsc}
      />
      {orderedKeys.map((key) => (
        <div key={key} className="my-4">
          <TypeGroupHeader
            typeName={key}
            hexCode={groups[key].type?.hex_code}
          />
          <div className="grid md:grid-cols-4 gap-4">
            {groups[key].achievements.map((achievement) => (
              <AchievementCard key={achievement.id} {...achievement} />
            ))}
          </div>
          <hr className="h-px my-8 bg-gray-300 border-0"></hr>
        </div>
      ))}
    </>
  );
}

function EarningRulesToggle({ showRules, setShowRules }) {
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 sm:text-sm"
      onClick={() => setShowRules(!showRules)}
      aria-expanded={showRules}
      aria-controls="achievement-earning-rules"
    >
      {showRules ? "Hide rules" : "Show rules"}
      <i
        className={`fa-solid fa-eye${showRules ? "-slash" : ""}`}
        aria-hidden
      />
    </button>
  );
}

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const [showEarningRules, setShowEarningRules] = useState(true);

  useEffect(() => {
    dispatch(apiSlice.endpoints.getAchievementTypes.initiate(undefined));
  }, [dispatch]);

  return (
    <div className="p-4 md:p-8">
      <PageTitle title="Achievements" />
      <div className="my-2 w-full">
        <CalloutCard
          tag="Info"
          title="How to browse this page"
          tagClassName="bg-violet-600"
          items={[
            <>
              <strong>Commonly Earned</strong> shows the ten achievements
              players have earned the most often. It's likely a deck you own
              earns one or more of these.
            </>,
            <>
              <strong>All</strong> lists every achievement grouped by type. Use
              the filters to sort by rarity or points, filter by type or rarity,
              and search by name.
            </>,
            <>
              Tiles with a{" "}
              <i
                className="fa-solid fa-circle-info text-gray-500"
                aria-hidden
              />{" "}
              icon have important notes. Click the tile to view full details.
            </>,
            <>
              Tiles with nested achievements have a{" "}
              <i
                className="fa-solid fa-layer-group text-gray-500"
                aria-hidden
              />{" "}
              icon and can be clicked for full context.
            </>,
            <>
              The color bar on each tile shows rarity (top) and achievement type
              (bottom).
            </>,
          ]}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <EarningRulesToggle
          showRules={showEarningRules}
          setShowRules={setShowEarningRules}
        />
      </div>
      <div id="achievement-earning-rules">
        <AchievementEarningRules showRules={showEarningRules} />
      </div>

      <TabGroup defaultIndex={0}>
        <TabList className="flex flex-wrap gap-2 mb-4">
          <Tab className={tabButtonClass}>Commonly Earned</Tab>
          <Tab className={tabButtonClass}>All</Tab>
        </TabList>
        <TabPanels>
          <TabPanel className="focus:outline-none pb-24 sm:pb-0">
            <MostEarnedAchievementsPanel />
          </TabPanel>
          <TabPanel className="focus:outline-none pb-24 sm:pb-0">
            <AllAchievementsTab />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

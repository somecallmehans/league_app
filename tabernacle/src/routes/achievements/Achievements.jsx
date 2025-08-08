import React, { useState, useMemo } from "react";

import {
  useGetAchievementsListQuery,
  useGetAchievementTypesQuery,
} from "../../api/apiSlice";

import { hexToRgb } from "../../helpers/helpers";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";
import { SearchComponent } from "../../hooks/useSearch";
import Drawer from "../../components/Drawer";

const useAchievementSearch = (achievements, achievementLookup, pointFilter) => {
  // This is a special version of the search since we need to search
  // on a nested list.
  const [searchTerm, setSearchTerm] = useState();

  if (!achievements) return { filteredData: [], setSearchTerm };

  if (!searchTerm && !pointFilter) {
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

const RestrictionsList = ({ restrictions }) => {
  if (!restrictions.length > 0) return null;

  return (
    <div className="p-4">
      <div className="text-lg font-bold">Achievement Info</div>
      {restrictions.map(({ id, name, url }) => (
        <div key={id} className="py-1 text-md text-gray-600 italic">
          <a
            className={`${url ? "hover:text-sky-500" : ""} transition text-md`}
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
  );
};

const ChildrenList = ({ achievements }) => {
  if (!achievements.length > 0) return null;

  return (
    <div className="p-4">
      <div className="rounded-lg">
        {[...achievements]
          .sort((a, b) => a - b)
          .map(({ id, name }) => (
            <div
              key={id}
              className="bg-white flex items-center text-sm md:text-md rounded-lg mb-1 border p-2"
            >
              {name}
            </div>
          ))}
      </div>
    </div>
  );
};

const AchievementPanel = ({
  point_value,
  children: achievementChildren,
  restrictions,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="text-xl grow  p-4 font-bold">
        {point_value} Point{point_value === 1 ? "" : "s"}
      </div>
      <RestrictionsList restrictions={restrictions} />
      <ChildrenList achievements={achievementChildren} />
    </div>
  );
};

const AchievementCard = (props) => {
  const {
    name,
    point_value,
    children: achievementChildren,
    restrictions,
    type,
  } = props;
  const [open, setOpen] = useState(false);
  const hex_code = type?.hex_code;

  const hasSubAchievements = achievementChildren.length > 0;
  const hasRestristictions = restrictions.length > 0;

  const hasAdditionalInformation = hasSubAchievements || hasRestristictions;

  return (
    <>
      <div
        onClick={() => (hasAdditionalInformation ? setOpen(!open) : "")}
        className={`py-3 px-4 relative bg-white rounded border border-solid shadow-md ${
          hasAdditionalInformation ? "hover:border-sky-400" : ""
        } md:min-h-24`}
      >
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          {point_value} Point{point_value === 1 ? "" : "s"}
          <div className="flex gap-1 pt-1">
            {hasSubAchievements && <i className="fa-solid fa-layer-group" />}
            {hasRestristictions && <i className="fa-solid fa-circle-info" />}
          </div>
        </div>
        <div>{name}</div>
        {hasAdditionalInformation && (
          <div className="absolute bottom-2 right-2">
            <i className="fa-solid fa-angle-right text-sky-400" />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l"
          style={{ backgroundColor: hex_code, opacity: "60%" }}
        />
      </div>
      <Drawer isOpen={open} onClose={() => setOpen(false)} title={name}>
        <AchievementPanel {...props} />
      </Drawer>
    </>
  );
};

const TypeInfo = () => {
  const { data: types } = useGetAchievementTypesQuery();
  if (!types) return null;

  return (
    <div className="w-100 bg-white border shadow-md flex flex-col md:flex-row justify-between p-3 gap-4">
      {types.map(({ id, name, hex_code, description }) => {
        const rgbVal = hexToRgb(hex_code);
        const rgbString = `rgb(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.4)`;

        return (
          <div key={id} className={`basis-1/${types.length}`}>
            <div
              className="text-center rounded mb-1"
              style={{
                backgroundColor: rgbString,
              }}
            >
              {name}
            </div>
            <div className="text-xs">{description}</div>
          </div>
        );
      })}
    </div>
  );
};

export default function AchievementsPage() {
  const [pointFilter, setPointFilter] = useState();
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();

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
    pointFilter
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
        Use the filters below to sort by point value, name, or both. If an
        achievement has special notes, external links, or nested achievements
        (like scalable or “X or more”), click its tile to see the full details.
      </div>
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

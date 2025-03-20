import React, { useState } from "react";

import { useGetAchievementsQuery } from "../../api/apiSlice";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const Achievement = ({ name, achievementChildren, restrictions }) => {
  const [toggle, setToggle] = useState();
  const [showAll, setShowAll] = useState();

  return (
    <div className="p-2">
      <div className="text-lg">
        <div
          onClick={() => setToggle(!toggle)}
          className={`text-lg font-semibold ${
            restrictions.length > 0 ? "hover:text-sky-500" : ""
          } inline-block align-middle`}
        >
          {name}
        </div>
      </div>
      {toggle &&
        restrictions?.map(({ id, name, url }) => (
          <div
            key={id}
            className="text-sm italic text-gray-600 flex items-center"
          >
            <i className="fa-solid fa-minus mr-2" />{" "}
            <a
              className={`${url ? "hover:text-sky-500" : ""}`}
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {name}
              {url && (
                <i className="fa-solid fa-link hover:text-sky-500 ml-1" />
              )}
            </a>
          </div>
        ))}
      {achievementChildren?.length > 0 &&
        achievementChildren
          ?.slice(0, showAll ? achievementChildren.length : 4)
          .map(({ id, name }) => (
            <div key={id} className="ml-4 italic text-gray-500">
              {name}
            </div>
          ))}
      {achievementChildren.length > 4 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="ml-4 text-blue-500 italic hover:underline"
        >
          Show More
        </button>
      )}
    </div>
  );
};

export default function AchievementsPage() {
  const [filteredValues, setFilteredValues] = useState([]);
  const { data, isLoading } = useGetAchievementsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filterAchievements = (key) =>
    !filteredValues.length
      ? true
      : filteredValues.length && filteredValues.includes(key);

  const handleFilterChange = (val) => {
    setFilteredValues(val.map(({ value }) => value));
  };
  const achievementKeys = Object.keys(data?.map) || [];

  return (
    <div className="p-4 md:p-8">
      <PageTitle title="Achievements" />
      <div className="mb-6">
        <SimpleSelect
          placeholder="Filter By Point Value"
          options={achievementKeys.map((v) => ({ label: v, value: v }))}
          onChange={handleFilterChange}
          isMulti
        />
      </div>
      {achievementKeys.filter(filterAchievements).map((x) => (
        <div key={x} className="p-2">
          <div className="font-bold text-xl md:text-2xl text-gray-800 border-b border-gray-400 pb-2 mb-4">
            {x} Points
          </div>
          {data.map[x]?.map(
            ({ id, name, children: achievementChildren, restrictions }) => (
              <Achievement
                key={id}
                name={name}
                achievementChildren={achievementChildren}
                restrictions={restrictions}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}

import React, { useMemo, useState } from "react";

import { useGetAchievementsQuery } from "../../api/apiSlice";

import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const Achievement = ({ name, children, restrictions }) => {
  const [toggle, setToggle] = useState();

  return (
    <div>
      <div className="text-lg">
        - {name}{" "}
        {restrictions.length > 0 && (
          <i
            className={`fa-solid fa-caret-${toggle ? "down" : "right"}`}
            onClick={() => setToggle(!toggle)}
          />
        )}
      </div>
      {toggle &&
        restrictions?.map(({ id, name }) => (
          <div key={id} className="ml-3 text-sm italic">
            <i className="fa-solid fa-minus mr-2" /> {name}
          </div>
        ))}
      {children?.length > 0 &&
        children?.map(({ id, name }) => (
          <div key={id} className="ml-3 italic">
            {name}
          </div>
        ))}
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
    <div className="p-4">
      <PageTitle title="Achievements" />
      <SimpleSelect
        placeholder="Filter By Point Value"
        options={achievementKeys.map((v) => ({ label: v, value: v }))}
        onChange={handleFilterChange}
        isMulti
      />
      {achievementKeys.filter(filterAchievements).map((x) => (
        <div key={x} className="p-2">
          <div className="font-bold text-2xl">{x} Points</div>
          {data.map[x]?.map(({ id, name, children, restrictions }) => (
            <Achievement
              key={id}
              name={name}
              children={children}
              restrictions={restrictions}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

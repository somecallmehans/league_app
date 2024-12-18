import React, { useState } from "react";

import { Input } from "@headlessui/react";

const SearchComponent = ({ setSearchTerm }) => (
  <Input
    placeholder="Filter participants by name"
    className="py-1.5 w-full md:w-1/2 px-1 rounded bg-zinc-100 border border-slate-400"
    onChange={(e) => setSearchTerm(e.target.value)}
  />
);

const FilterList = ({ data, listKey, classes, Component, componentProps }) => {
  if (!data) {
    return "None Found";
  }

  return data.map((d) => (
    <div className={classes} key={d[`${listKey}`]}>
      <Component {...d} {...componentProps} />
    </div>
  ));
};

export default function useSearch(data) {
  const [searchTerm, setSearchTerm] = useState();

  const filteredData = !searchTerm
    ? data
    : data.filter((x) =>
        JSON.stringify(x).toLowerCase().includes(searchTerm.toLowerCase())
      );

  return [
    filteredData,
    () => <SearchComponent key="key" setSearchTerm={setSearchTerm} />,
    FilterList,
  ];
}

import React, { useState } from "react";

import { Input } from "@headlessui/react";

export const SearchComponent = ({ setSearchTerm, placeholder, classes }) => (
  <Input
    placeholder={placeholder}
    className={`bg-white py-1.5 w-full md:w-1/2 px-1 rounded  border border-zinc-300 ${classes}`}
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

export default function useSearch(data, placeholder) {
  const [searchTerm, setSearchTerm] = useState();

  const filteredData = !searchTerm
    ? data
    : data.filter((x) =>
        JSON.stringify(x).toLowerCase().includes(searchTerm.toLowerCase())
      );

  return [
    filteredData,
    () => (
      <SearchComponent
        key="key"
        setSearchTerm={setSearchTerm}
        placeholder={placeholder}
      />
    ),
    FilterList,
  ];
}

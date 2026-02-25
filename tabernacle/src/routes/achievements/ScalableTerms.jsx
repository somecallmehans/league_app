import React, { useMemo, useState } from "react";
import { useGetScalableTermsQuery } from "../../api/apiSlice";
import { Input } from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import { SimpleSelect } from "../crud/CrudComponents";

const SearchFilter = ({ value, onChange, placeholder, classes }) => (
  <Input
    placeholder={placeholder}
    value={value}
    className={`text-gray-600 bg-white py-1.5 w-full px-2 rounded border border-zinc-300 ${classes}`}
    onChange={(e) => onChange(e.target.value)}
  />
);

function TypeSection({ typeGroup, isExpanded }) {
  const terms = typeGroup.terms;

  return (
    <section
      className={`bg-white rounded-lg border border-zinc-200 shadow-md overflow-hidden flex flex-col min-h-0 ${
        isExpanded ? "col-span-full" : ""
      }`}
    >
      <div className="px-4 py-3 bg-slate-50 border-b border-zinc-200 shrink-0">
        <h2 className="text-base md:text-lg font-semibold text-slate-800">
          {typeGroup.name}
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          {terms.length} term{terms.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div
        className={`divide-y divide-slate-100 min-h-0 ${
          isExpanded ? "overflow-visible" : "overflow-y-auto max-h-[20rem]"
        }`}
      >
        {terms.map((term, idx) => (
          <div
            key={term.id}
            className={`px-4 py-2.5 text-sm md:text-base text-slate-800 ${
              idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            {term.term_display}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ScalableTermsPage() {
  const { data, isLoading } = useGetScalableTermsQuery();
  const [typeFilter, setTypeFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const typeOptions = useMemo(() => {
    if (!data?.types) return [];
    return data.types.map((t) => ({
      label: t.name,
      value: t.name,
    }));
  }, [data?.types]);

  const filteredTypes = useMemo(() => {
    if (!data?.types) return [];
    let types = typeFilter?.value
      ? data.types.filter((t) => t.name === typeFilter.value)
      : data.types;
    const q = searchTerm?.trim().toLowerCase();
    if (q) {
      types = types
        .map((t) => ({
          ...t,
          terms: t.terms.filter((term) =>
            term.term_display.toLowerCase().includes(q)
          ),
        }))
        .filter((t) => t.terms.length > 0);
    }
    return types;
  }, [data?.types, typeFilter, searchTerm]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-8 pb-24 sm:pb-8">
      <PageTitle title="Scalable Terms" />
      <div className="text-xs md:text-sm font-light text-gray-800 italic w-full md:max-w-2xl mb-2">
        Browse scalable terms used in achievements. These terms plug into parent
        achievements (e.g., &quot;Win with X colors&quot;) to form specific
        variants. Filter by type or search by name.
      </div>

      {/* Mobile: fixed bottom filter bar */}
      <div className="fixed sm:hidden bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t shadow-lg p-2 pb-[calc(env(safe-area-inset-bottom,0)+0.5rem)]">
        <div className="flex flex-col gap-2">
          <SimpleSelect
            placeholder="Filter by type"
            options={typeOptions}
            value={typeFilter}
            onChange={(obj) => setTypeFilter(obj || null)}
            isClearable
            classes="bg-white h-10 text-base [&>div]:h-10 [&>div]:min-h-0 w-full text-gray-600 border border-zinc-300 rounded"
            menuPlacement="top"
          />
          <SearchFilter
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search terms…"
            classes="w-full h-10 text-base"
          />
        </div>
      </div>

      {/* Desktop: inline filters */}
      <div className="hidden sm:flex sm:mb-4 sm:gap-2">
        <SimpleSelect
          placeholder="Filter by type"
          options={typeOptions}
          value={typeFilter}
          onChange={(obj) => setTypeFilter(obj || null)}
          isClearable
          classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0 md:w-1/3 text-gray-600 border border-zinc-300 rounded"
          menuPlacement="top"
        />
        <SearchFilter
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name"
          classes="grow"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.length === 0 ? (
          <div className="col-span-full text-slate-500 py-8 text-center">
            No scalable terms found.
          </div>
        ) : (
          filteredTypes.map((typeGroup) => (
            <TypeSection
              key={typeGroup.name}
              typeGroup={typeGroup}
              isExpanded={filteredTypes.length === 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

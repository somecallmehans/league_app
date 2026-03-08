import React, { useMemo, useState } from "react";
import { useGetScalableTermsQuery } from "../../api/apiSlice";
import { Input } from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageTitle from "../../components/PageTitle";
import CalloutCard from "../../components/CalloutCard";
import { SimpleSelect } from "../crud/CrudComponents";

const TYPE_COLORS = [
  "#3b82f6", // blue
  "#f97316", // orange
  "#22c55e", // green
  "#a855f7", // purple
  "#eab308", // yellow
  "#ec4899", // pink
  "#14b8a6", // teal
  "#ef4444", // red
  "#64748b", // slate
  "#0ea5e9", // sky
];

const SearchFilter = ({ value, onChange, placeholder, classes }) => (
  <Input
    placeholder={placeholder}
    value={value}
    className={`text-gray-600 bg-white py-1.5 w-full px-2 rounded border border-zinc-300 ${classes}`}
    onChange={(e) => onChange(e.target.value)}
  />
);

function TypeSection({ typeGroup, isExpanded, colorIndex }) {
  const terms = typeGroup.terms;
  const barColor = TYPE_COLORS[colorIndex % TYPE_COLORS.length];

  return (
    <section
      className={`bg-white rounded-lg border border-zinc-200 shadow-md overflow-hidden flex flex-col min-h-0 relative ${
        isExpanded ? "col-span-full" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l"
        style={{ backgroundColor: barColor, opacity: "0.6" }}
      />
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
            term.term_display.toLowerCase().includes(q),
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
      <div className="my-2 w-full md:max-w-3/4">
        <CalloutCard
          tag="Info"
          title="How scalable terms work"
          tagClassName="bg-violet-600"
          items={[
            "This is a comprehensive list of all terms that apply to scalable achievements.",
            'A "scalable" achievement is awarded for winning with a deck that includes cards referencing a shared mechanic or quality.',
            "Scalable tiers do not stack. E.x. if you qualify for 33 of a term, you do not also earn 22 and 11.",
            "Filter by type or search by term name.",
          ]}
        />
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
          filteredTypes.map((typeGroup, idx) => (
            <TypeSection
              key={typeGroup.name}
              typeGroup={typeGroup}
              isExpanded={filteredTypes.length === 1}
              colorIndex={idx}
            />
          ))
        )}
      </div>
    </div>
  );
}

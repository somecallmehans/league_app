import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ColorKey } from "../../../public/images";
import { SimpleSelect } from "../crud/CrudComponents";
import { useGetDecklistSubmittersQuery } from "../../api/apiSlice";
import {
  DECKLIST_SORTS,
  activeFilterSummary,
  colorMatch,
  type ColorMatch,
  type DecklistParams,
} from "./decklistParams";

const PAGE_SIZE_OPTIONS = [
  { label: "20 per page", value: 20 },
  { label: "50 per page", value: 50 },
  { label: "100 per page", value: 100 },
] as const;

const colorMap: Record<ColorKey, number> = {
  white: 1,
  blue: 2,
  black: 4,
  red: 8,
  green: 16,
  colorless: 0,
};

const colorStyles: Record<ColorKey, { background: string; symbol: string }> = {
  white: { background: "bg-[#F8E7B9]", symbol: "W" },
  blue: { background: "bg-[#B3CEEA]", symbol: "U" },
  black: { background: "bg-[#A69F9D]", symbol: "B" },
  red: { background: "bg-[#EB9F82]", symbol: "R" },
  green: { background: "bg-[#C4D6C4]", symbol: "G" },
  colorless: { background: "bg-[#E8E8E8]", symbol: "C" },
};

const COLORS = Object.keys(colorMap) as ColorKey[];

const ColorCheckbox = ({
  name,
  checked,
  onChange,
}: {
  name: ColorKey;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>, name: ColorKey) => void;
}) => {
  const { background, symbol } = colorStyles[name];
  const classes = `peer h-8 w-8 appearance-none rounded-2xl
        border border-slate-400 ${background}
        accent-black cursor-pointer`;
  return (
    <div className="relative flex mx-1">
      <input
        type="checkbox"
        name={name}
        aria-label={name}
        checked={checked}
        onChange={(e) => onChange(e, name)}
        className={classes}
      />
      <span
        className="
    pointer-events-none absolute top-1.5 left-3
    flex items-center justify-center
    text-sm font-semibold tracking-wide
    text-black/60
    opacity-0 scale-75
    peer-checked:opacity-100 peer-checked:scale-100
    transition-all duration-150 ease-out
    "
      >
        {symbol}
      </span>
    </div>
  );
};

function checksFromMask(
  mask: number | null | undefined,
): Record<ColorKey, boolean> {
  const blank = Object.fromEntries(
    COLORS.map((color) => [color, false]),
  ) as Record<ColorKey, boolean>;
  if (mask === undefined || mask === null) return blank;
  if (mask === 0) return { ...blank, colorless: true };
  return {
    ...blank,
    white: (mask & colorMap.white) !== 0,
    blue: (mask & colorMap.blue) !== 0,
    black: (mask & colorMap.black) !== 0,
    red: (mask & colorMap.red) !== 0,
    green: (mask & colorMap.green) !== 0,
  };
}

function maskFromChecks(checks: Record<ColorKey, boolean>): number | undefined {
  if (checks.colorless) return 0;
  const mask = COLORS.filter((color) => color !== "colorless").reduce(
    (sum, color) => (checks[color] ? sum + colorMap[color] : sum),
    0,
  );
  return mask > 0 ? mask : undefined;
}

type FiltersProps = {
  params: DecklistParams;
  setParams: Dispatch<SetStateAction<DecklistParams>>;
};

function SubmitterSelect({ params, setParams }: FiltersProps) {
  const { data: submitters = [] } = useGetDecklistSubmittersQuery();
  const options = submitters.map((person) => ({
    label: person.name,
    value: person.id,
  }));
  const selected =
    options.find((option) => option.value === params.submitted_by) ?? null;

  return (
    <div className="w-full">
      <div className="text-xs font-semibold text-slate-600 mb-1">
        Submitted by
      </div>
      <SimpleSelect
        placeholder="Anyone"
        options={options}
        classes="w-full"
        onChange={(option: { label: string; value: number } | null) =>
          setParams((prev) => ({
            ...prev,
            submitted_by: option?.value ?? null,
            page: 1,
          }))
        }
        isMulti={false}
        isClearable={true}
        menuPlacement="bottom"
        value={selected}
      />
    </div>
  );
}

export default function DecklistFilters({ params, setParams }: FiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState(params.search ?? "");
  const checkedColors = checksFromMask(params.colors);
  const selectedMatch = colorMatch(params.color_match);
  const submitterName = useGetDecklistSubmittersQuery().data?.find(
    (person) => person.id === params.submitted_by,
  )?.name;
  const summary = activeFilterSummary(params, submitterName);

  useEffect(() => {
    setSearchText(params.search ?? "");
  }, [params.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParams((prev) => {
        const trimmed = searchText.trim();
        if ((prev.search ?? "").trim() === trimmed) return prev;
        return { ...prev, search: trimmed, page: 1 };
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchText, setParams]);

  const onToggle = (e: ChangeEvent<HTMLInputElement>, name: ColorKey) => {
    const isChecked = e.target.checked;
    const next = { ...checkedColors };
    if (name === "colorless" && isChecked) {
      COLORS.forEach((color) => {
        next[color] = color === "colorless";
      });
    } else if (name !== "colorless" && isChecked) {
      next.colorless = false;
      next[name] = true;
    } else {
      next[name] = isChecked;
    }
    setParams((prev) => ({
      ...prev,
      colors: maskFromChecks(next),
      page: 1,
    }));
  };

  const sortValue =
    DECKLIST_SORTS.find((option) => option.value === params.sort_order) ??
    DECKLIST_SORTS.find((option) => option.value === "newest") ??
    null;
  const pageSize = params.page_size ?? 20;
  const pageSizeValue =
    PAGE_SIZE_OPTIONS.find((option) => option.value === pageSize) ??
    PAGE_SIZE_OPTIONS[0];

  const modeButton = (mode: ColorMatch, label: string) => (
    <button
      type="button"
      aria-pressed={selectedMatch === mode}
      className={`flex-1 px-2 py-2 text-xs sm:text-sm font-semibold leading-tight ${
        selectedMatch === mode
          ? "bg-sky-600 text-white"
          : "bg-white text-slate-700 hover:bg-sky-50"
      }`}
      onClick={() =>
        setParams((prev) => ({
          ...prev,
          color_match: mode,
          page: 1,
        }))
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 mb-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="w-full md:flex-1 md:min-w-0">
          <span className="text-xs font-semibold text-slate-600 mb-1 block">
            Search
          </span>
          <input
            type="search"
            value={searchText}
            placeholder="Deck name or commander"
            aria-label="Search decklists"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
        <div className="hidden md:block md:w-64 shrink-0">
          <SubmitterSelect params={params} setParams={setParams} />
        </div>
      </div>

      <button
        type="button"
        className="md:hidden w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        Filters
      </button>

      <div
        className={`${filtersOpen ? "flex" : "hidden"} md:flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end`}
      >
        <div className="w-full md:hidden">
          <SubmitterSelect params={params} setParams={setParams} />
        </div>

        <div className="w-full md:w-auto md:min-w-[16rem]">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Color match
          </div>
          <div className="flex overflow-hidden rounded-lg border border-slate-300">
            {modeButton("exact", "Exactly these colors")}
            {modeButton("any", "Including these colors")}
          </div>
        </div>

        <div className="w-full md:flex-1 md:min-w-0">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Colors
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {COLORS.map((color) => (
              <ColorCheckbox
                key={color}
                name={color}
                onChange={onToggle}
                checked={!!checkedColors[color]}
              />
            ))}
          </div>
        </div>

        <div className="w-full md:w-56 shrink-0">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Sorting
          </div>
          <SimpleSelect
            placeholder="Sort"
            options={[...DECKLIST_SORTS]}
            classes="w-full"
            onChange={(option: { label: string; value: string } | null) =>
              setParams((prev) => ({
                ...prev,
                sort_order: option?.value ?? "newest",
                page: 1,
              }))
            }
            isMulti={false}
            isClearable={false}
            menuPlacement="bottom"
            value={sortValue}
          />
        </div>

        <div className="w-full md:w-40 shrink-0">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Per page
          </div>
          <SimpleSelect
            placeholder="Page size"
            options={[...PAGE_SIZE_OPTIONS]}
            classes="w-full"
            onChange={(option: { label: string; value: number } | null) =>
              setParams((prev) => ({
                ...prev,
                page_size: option?.value ?? 20,
                page: 1,
              }))
            }
            isMulti={false}
            isClearable={false}
            menuPlacement="bottom"
            value={pageSizeValue}
          />
        </div>
      </div>
    </div>
  );
}

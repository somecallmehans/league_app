import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { ColorKey } from "../../../public/images";
import { SimpleSelect } from "../crud/CrudComponents";
import { type DecklistParams } from "./Decklists";

const SORTING = [
  { label: "Points Descending", value: "points_desc" },
  { label: "Points Ascending", value: "points_asc" },
  { label: "Name Descending", value: "name_desc" },
  { label: "Name Ascending", value: "name_asc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

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

const ColorCheckbox = ({
  name,
  checked,
  onChange,
}: {
  name: ColorKey;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, name: ColorKey) => void;
}) => {
  const { background, symbol } = colorStyles[name];
  const classes = `peer h-8 w-8 appearance-none rounded-2xl
        border border-slate-400 ${background}
        accent-black cursor-pointer`;
  return (
    <div className="relative  flex mx-1">
      <input
        type="checkbox"
        name={name}
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

type FiltersProps = {
  params: DecklistParams;
  setParams: Dispatch<SetStateAction<DecklistParams>>;
};

export default function DecklistFilters({ params, setParams }: FiltersProps) {
  const COLORS = Object.keys(colorMap) as ColorKey[];

  const [checkedColors, setCheckedColors] = useState<Record<ColorKey, boolean>>(
    () =>
      Object.fromEntries(COLORS.map((c) => [c, false])) as Record<
        ColorKey,
        boolean
      >,
  );

  const isColorless = !!checkedColors.colorless;

  const nonColorlessMask = COLORS.filter((c) => c !== "colorless").reduce(
    (sum, c) => (checkedColors[c] ? sum + colorMap[c] : sum),
    0,
  );

  const hasAnyNonColorless = COLORS.filter((c) => c !== "colorless").some(
    (c) => checkedColors[c],
  );

  const colorsParam = isColorless
    ? 0
    : hasAnyNonColorless
      ? nonColorlessMask
      : undefined;

  useEffect(() => {
    setParams((prev: DecklistParams) => ({
      ...prev,
      colors: colorsParam,
      page: 1,
    }));
  }, [colorsParam, setParams]);

  const onToggle = (e: React.ChangeEvent<HTMLInputElement>, name: ColorKey) => {
    const isChecked = e.target.checked;

    setCheckedColors((prev) => {
      if (name === "colorless" && isChecked) {
        return Object.fromEntries(
          COLORS.map((k) => [k, k === "colorless"]),
        ) as Record<ColorKey, boolean>;
      }

      if (name !== "colorless" && isChecked) {
        return { ...prev, colorless: false, [name]: true };
      }

      return { ...prev, [name]: isChecked };
    });
  };

  const sortValue = SORTING.find((o) => o.value === params.sort_order) ?? null;
  const pageSize = params.page_size ?? 20;
  const pageSizeValue =
    PAGE_SIZE_OPTIONS.find((o) => o.value === pageSize) ?? PAGE_SIZE_OPTIONS[0];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-6 mb-3">
      <div className="w-full md:flex-1 md:min-w-0">
        <div className="text-xs font-semibold text-slate-600 mb-1">Sorting</div>
        <SimpleSelect
          placeholder="Points, Name, Created Date"
          options={SORTING}
          classes="w-full"
          onChange={(o: { label: string; value: string } | null) =>
            setParams((prev: DecklistParams) => ({
              ...prev,
              sort_order: o?.value ?? null,
              page: 1,
            }))
          }
          isMulti={false}
          isClearable={true}
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
          onChange={(o: { label: string; value: number } | null) =>
            setParams((prev: DecklistParams) => ({
              ...prev,
              page_size: o?.value ?? 20,
              page: 1,
            }))
          }
          isMulti={false}
          isClearable={false}
          menuPlacement="bottom"
          value={pageSizeValue}
        />
      </div>

      <div className="w-full md:flex-1 md:min-w-0">
        <div className="text-xs font-semibold text-slate-600 mb-1">
          Color Filters
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
    </div>
  );
}

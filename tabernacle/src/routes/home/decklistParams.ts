export type ColorMatch = "exact" | "any";

export type DecklistParams = {
  colors?: number | null;
  color_match?: ColorMatch;
  sort_order?: string | null;
  page?: number;
  page_size?: number;
  search?: string;
  submitted_by?: number | null;
};

export const DECKLIST_SORTS = [
  { label: "Points Descending", value: "points_desc" },
  { label: "Points Ascending", value: "points_asc" },
  { label: "Name Descending", value: "name_desc" },
  { label: "Name Ascending", value: "name_asc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Winningest", value: "wins_desc" },
  { label: "Most achievements", value: "achievements_desc" },
] as const;

const PAGE_SIZES = [20, 50, 100] as const;

const COLOR_SYMBOLS: [number, string][] = [
  [1, "W"],
  [2, "U"],
  [4, "B"],
  [8, "R"],
  [16, "G"],
];

export function colorMatch(value: string | null | undefined): ColorMatch {
  return value === "any" ? "any" : "exact";
}

export function decklistParamsFromSearch(
  search: URLSearchParams,
): DecklistParams {
  const colorsRaw = search.get("colors");
  const colors =
    colorsRaw === null || colorsRaw === "" ? undefined : Number(colorsRaw);
  const page = Number(search.get("page") || "1");
  const pageSize = Number(search.get("page_size") || "20");
  const submittedRaw = search.get("submitted_by");
  const submitted = submittedRaw ? Number(submittedRaw) : undefined;

  return {
    colors: Number.isInteger(colors) && (colors as number) >= 0 ? colors : undefined,
    color_match: colorMatch(search.get("color_match")),
    sort_order: search.get("sort_order"),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    page_size: PAGE_SIZES.includes(pageSize as (typeof PAGE_SIZES)[number])
      ? pageSize
      : 20,
    search: search.get("search") ?? "",
    submitted_by:
      submitted !== undefined && Number.isInteger(submitted) ? submitted : undefined,
  };
}

export function decklistSearchParams(
  params: DecklistParams,
  options?: { includeDefaults?: boolean },
): URLSearchParams {
  const search = new URLSearchParams();
  const includeDefaults = options?.includeDefaults ?? false;

  if (params.colors !== undefined && params.colors !== null) {
    search.set("colors", String(params.colors));
    search.set("color_match", colorMatch(params.color_match));
  } else if (colorMatch(params.color_match) === "any") {
    search.set("color_match", "any");
  }

  const term = params.search?.trim();
  if (term) search.set("search", term);

  if (params.submitted_by) {
    search.set("submitted_by", String(params.submitted_by));
  }

  if (params.sort_order && params.sort_order !== "newest") {
    search.set("sort_order", params.sort_order);
  }

  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  if (includeDefaults || page > 1) search.set("page", String(page));
  if (includeDefaults || pageSize !== 20) {
    search.set("page_size", String(pageSize));
  }

  return search;
}

export function decklistQueryString(params: DecklistParams | void): string {
  const query = decklistSearchParams(params ?? {}, { includeDefaults: true });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function activeFilterSummary(
  params: DecklistParams,
  submitterName?: string | null,
): string {
  const parts: string[] = [];

  const match = colorMatch(params.color_match);
  if (params.colors === 0) {
    parts.push(match === "any" ? "Including colorless" : "Exactly colorless");
  } else if (params.colors) {
    const symbols = COLOR_SYMBOLS.filter(([bit]) => (params.colors as number) & bit)
      .map(([, symbol]) => symbol)
      .join("");
    const mode = match === "any" ? "Including" : "Exactly";
    parts.push(`${mode} ${symbols}`);
  }

  if (submitterName) parts.push(submitterName);

  if (params.sort_order && params.sort_order !== "newest") {
    const label = DECKLIST_SORTS.find((sort) => sort.value === params.sort_order)
      ?.label;
    if (label) parts.push(label);
  }

  return parts.join(" · ");
}

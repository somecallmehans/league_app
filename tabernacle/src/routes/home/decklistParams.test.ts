import { describe, expect, it } from "vitest";
import {
  activeFilterSummary,
  decklistParamsFromSearch,
  decklistQueryString,
  decklistSearchParams,
} from "./decklistParams";

describe("decklist catalog query", () => {
  it("round-trips a filtered catalog through the query string", () => {
    const params = {
      colors: 24,
      color_match: "any" as const,
      search: "yarus",
      submitted_by: 902,
      sort_order: "wins_desc",
      page: 2,
      page_size: 50,
    };

    expect(decklistParamsFromSearch(decklistSearchParams(params))).toEqual(params);
  });

  it("keeps any-color mode when no pips are checked", () => {
    const params = decklistParamsFromSearch(
      decklistSearchParams({ color_match: "any", page: 1, page_size: 20 }),
    );

    expect(params.color_match).toBe("any");
    expect(params.colors).toBeUndefined();
  });

  it("omits an unfiltered catalog from the browser query", () => {
    const query = decklistSearchParams({
      color_match: "exact",
      page: 1,
      page_size: 20,
      search: "   ",
    });

    expect(query.toString()).toBe("");
  });

  it("sends page defaults on the decklist request", () => {
    expect(decklistQueryString({ page: 1, page_size: 20 })).toBe(
      "?page=1&page_size=20",
    );
  });

  it("describes the active color match, submitter, and sort", () => {
    expect(
      activeFilterSummary(
        {
          colors: 24,
          color_match: "exact",
          sort_order: "wins_desc",
          submitted_by: 1,
        },
        "Johnny",
      ),
    ).toBe("Exactly RG · Johnny · Winningest");
  });
});

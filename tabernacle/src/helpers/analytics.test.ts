import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_EVENTS,
  getRoutePattern,
  trackPageTime,
  trackPageView,
} from "./analytics";

describe("getRoutePattern", () => {
  it("keeps static paths unchanged", () => {
    expect(getRoutePattern("/")).toBe("/");
    expect(getRoutePattern("/faqs")).toBe("/faqs");
    expect(getRoutePattern("/metrics")).toBe("/metrics");
    expect(getRoutePattern("/pods")).toBe("/pods");
    expect(getRoutePattern("/decklists/gatekeeper")).toBe("/decklists/gatekeeper");
  });

  it("replaces numeric dynamic segments with :id", () => {
    expect(getRoutePattern("/metrics/42")).toBe("/metrics/:id");
    expect(getRoutePattern("/metrics/42/earned")).toBe("/metrics/:id/earned");
    expect(getRoutePattern("/pods/7")).toBe("/pods/:id");
    expect(getRoutePattern("/decklists/edit/9")).toBe("/decklists/edit/:id");
    expect(getRoutePattern("/league-session/3/2")).toBe(
      "/league-session/:id/:id"
    );
  });

  it("ignores query strings when patterning", () => {
    expect(getRoutePattern("/metrics/42?x=1")).toBe("/metrics/:id");
  });
});

describe("trackPageView", () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  it("includes page_path, route_pattern, and store_slug", () => {
    trackPageView({
      path: "/metrics/42",
      title: "Metrics",
      storeSlug: "mimic",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", ANALYTICS_EVENTS.PAGE_VIEW, {
      page_path: "/metrics/42",
      page_location: expect.any(String),
      page_title: "Metrics",
      store_slug: "mimic",
      route_type: "individual",
      route_pattern: "/metrics/:id",
    });
  });
});

describe("trackPageTime", () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  it("emits page_time with duration_ms and route_pattern", () => {
    trackPageTime({
      pagePath: "/pods/3",
      durationMs: 1500.7,
      storeSlug: "mimic",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", ANALYTICS_EVENTS.PAGE_TIME, {
      page_path: "/pods/3",
      duration_ms: 1501,
      route_pattern: "/pods/:id",
      store_slug: "mimic",
    });
  });
});

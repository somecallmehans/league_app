export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-8R4G06KBTN";

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  NAV_CLICK: "nav_click",
  STATS_PAGE_TIME: "stats_page_time",
} as const;

declare global {
  interface Window {
    gtag?: (
      command: string,
      nameOrId: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

type EventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function isGtagAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function cleanParams(params?: EventParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] != null && entry[1] !== ""
    )
  ) as Record<string, string | number | boolean>;
}

export function trackEvent(name: string, params?: EventParams): void {
  if (!isGtagAvailable()) return;
  window.gtag!("event", name, cleanParams(params));
}

export function getStatsPathType(pathname: string): string {
  if (!pathname.startsWith("/metrics")) return "not_stats";
  const rest = pathname.replace(/^\/metrics\/?/, "");
  if (!rest) return "overview";
  if (rest.endsWith("/earned")) return "badges";
  const segments = rest.split("/").filter(Boolean);
  if (segments.length === 1) return "individual";
  return "other";
}

export function getRouteType(pathname: string): string {
  if (pathname.startsWith("/metrics")) {
    return getStatsPathType(pathname);
  }
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment ?? "home";
}

export interface TrackPageViewParams {
  path: string;
  title?: string;
  storeSlug?: string | null;
}

export function trackPageView({
  path,
  title = typeof document !== "undefined" ? document.title : "",
  storeSlug,
}: TrackPageViewParams): void {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : path,
    page_title: title,
    store_slug: storeSlug ?? undefined,
    route_type: getRouteType(path.split("?")[0] ?? path),
  });
}

export function trackNavClick(label: string): void {
  trackEvent(ANALYTICS_EVENTS.NAV_CLICK, { link_text: label });
}

export interface TrackStatsPageTimeParams {
  pagePath: string;
  durationMs: number;
  statsPathType: string;
  storeSlug?: string | null;
}

export function trackStatsPageTime({
  pagePath,
  durationMs,
  statsPathType,
  storeSlug,
}: TrackStatsPageTimeParams): void {
  trackEvent(ANALYTICS_EVENTS.STATS_PAGE_TIME, {
    page_path: pagePath,
    duration_ms: Math.round(durationMs),
    stats_path_type: statsPathType,
    store_slug: storeSlug ?? undefined,
  });
}

export function isMetricsPath(pathname: string): boolean {
  return pathname === "/metrics" || pathname.startsWith("/metrics/");
}

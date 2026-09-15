export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-8R4G06KBTN";

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  NAV_CLICK: "nav_click",
  PAGE_TIME: "page_time",
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

export function getRoutePattern(pathname: string): string {
  const pathOnly = pathname.split("?")[0] || "/";
  if (pathOnly === "/") return "/";
  return pathOnly
    .split("/")
    .map((segment) => (segment && /^\d+$/.test(segment) ? ":id" : segment))
    .join("/");
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
  const pathOnly = path.split("?")[0] ?? path;
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : path,
    page_title: title,
    store_slug: storeSlug ?? undefined,
    route_type: getRouteType(pathOnly),
    route_pattern: getRoutePattern(path),
  });
}

export function trackNavClick(label: string): void {
  trackEvent(ANALYTICS_EVENTS.NAV_CLICK, { link_text: label });
}

export interface TrackPageTimeParams {
  pagePath: string;
  durationMs: number;
  storeSlug?: string | null;
}

export function trackPageTime({
  pagePath,
  durationMs,
  storeSlug,
}: TrackPageTimeParams): void {
  trackEvent(ANALYTICS_EVENTS.PAGE_TIME, {
    page_path: pagePath,
    duration_ms: Math.round(durationMs),
    route_pattern: getRoutePattern(pagePath),
    store_slug: storeSlug ?? undefined,
  });
}

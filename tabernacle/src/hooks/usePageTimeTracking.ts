import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageTime } from "../helpers/analytics";
import { getStoreSlug } from "../helpers/helpers";

const usePageTimeTracking = () => {
  const location = useLocation();
  const startTimeRef = useRef<number | null>(null);
  const pathRef = useRef<string | null>(null);

  const flush = useCallback(() => {
    if (startTimeRef.current === null || pathRef.current === null) return;

    const durationMs = Date.now() - startTimeRef.current;
    const pagePath = pathRef.current;

    trackPageTime({
      pagePath,
      durationMs,
      storeSlug: getStoreSlug(),
    });

    startTimeRef.current = null;
    pathRef.current = null;
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;

    if (pathRef.current !== null && pathRef.current !== path) {
      flush();
    }

    if (pathRef.current !== path) {
      startTimeRef.current = Date.now();
      pathRef.current = path;
    }
  }, [location, flush]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        return;
      }

      const path = location.pathname + location.search;
      startTimeRef.current = Date.now();
      pathRef.current = path;
    };

    const onPageHide = () => flush();

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [location, flush]);
};

export default usePageTimeTracking;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../helpers/analytics";
import { getStoreSlug } from "../helpers/helpers";

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView({
      path,
      title: document.title,
      storeSlug: getStoreSlug(),
    });
  }, [location]);
};

export default usePageTracking;

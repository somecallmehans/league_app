import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useVerifyDecklistSessionQuery } from "../api/apiSlice";
import useCountdown from "./useCountdown";

type Options = {
  redirect?: string;
};

export default function useEditDecklistGate(opts: Options = {}) {
  const navigate = useNavigate();
  const pollingInterval = 15_000;
  const redirectTo = opts.redirect ?? "/decklists/gatekeeper";

  const {
    data: verification,
    isLoading,
    isError,
  } = useVerifyDecklistSessionQuery(undefined, {
    pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const Countdown = useCountdown(verification?.expires_at);

  const initialLoading = isLoading && !verification;

  useEffect(() => {
    if (initialLoading) return;
    if (isError || verification?.active === false) {
      navigate(redirectTo, { replace: true });
    }
  }, [initialLoading, isError, verification?.active, navigate]);

  return {
    verification,
    Countdown,
    initialLoading,
    isActive: verification?.active === true,
  };
}

import React from "react";
import { useScorecardInfo } from "../../hooks";

export const ScorecardInfoContext = React.createContext<ReturnType<
  typeof useScorecardInfo
> | null>(null);

export function useScorecardInfoCtx() {
  const ctx = React.useContext(ScorecardInfoContext);
  if (!ctx)
    throw new Error(
      "useScorecardInfoCtx must be used within ScorecardInfoContext.Provider"
    );
  return ctx;
}

import React from "react";
import { useScorecardInfo, useCommanderOptions } from "../../hooks";

type ScorecardInfoValue = ReturnType<typeof useScorecardInfo> &
  ReturnType<typeof useCommanderOptions>;

export const ScorecardInfoContext =
  React.createContext<ScorecardInfoValue | null>(null);

export function useScorecardInfoCtx() {
  const ctx = React.useContext(ScorecardInfoContext);
  if (!ctx)
    throw new Error(
      "useScorecardInfoCtx must be used within ScorecardInfoContext.Provider"
    );
  return ctx;
}

export type SessionRoundTab = "round1" | "round2";

export function sessionRoundTabFromParam(
  value: string | null,
): SessionRoundTab {
  return value === "2" ? "round2" : "round1";
}

export function sessionLobbyPath(
  sessionId: string | number,
  roundNumber?: number | null,
): string {
  const base = `/league-session/${sessionId}`;
  return roundNumber === 2 ? `${base}?round=2` : base;
}

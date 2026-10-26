import { describe, expect, it } from "vitest";

import {
  sessionLobbyPath,
  sessionRoundTabFromParam,
} from "./sessionRoundTab";

describe("session round tab", () => {
  it("keeps round 2 when the lobby url asks for it", () => {
    expect(sessionRoundTabFromParam("2")).toBe("round2");
  });

  it("opens round 1 unless the url names round 2", () => {
    expect(sessionRoundTabFromParam(null)).toBe("round1");
    expect(sessionRoundTabFromParam("1")).toBe("round1");
  });

  it("builds a lobby path that restores round 2", () => {
    expect(sessionLobbyPath(14, 2)).toBe("/league-session/14?round=2");
    expect(sessionLobbyPath(14, 1)).toBe("/league-session/14");
  });
});

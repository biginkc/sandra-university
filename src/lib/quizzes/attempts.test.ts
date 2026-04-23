import { describe, expect, it } from "vitest";

import { computeQuizEligibility } from "./attempts";

const NOW = new Date("2026-04-23T18:00:00Z");

describe("computeQuizEligibility", () => {
  it("allows the first attempt when no prior attempts exist", () => {
    const e = computeQuizEligibility({
      maxAttempts: null,
      retakeCooldownHours: 0,
      attempts: [],
      now: NOW,
    });
    expect(e.state).toBe("open");
    expect(e.attemptsUsed).toBe(0);
    expect(e.attemptsLeft).toBeNull();
  });

  it("reports passed when any attempt passed", () => {
    const e = computeQuizEligibility({
      maxAttempts: 3,
      retakeCooldownHours: 0,
      attempts: [
        {
          passed: true,
          score: 90,
          completed_at: "2026-04-23T17:30:00Z",
        },
      ],
      now: NOW,
    });
    expect(e.state).toBe("passed");
    expect(e.bestScore).toBe(90);
  });

  it("blocks with max_reached when attempts_used equals max_attempts and no pass", () => {
    const e = computeQuizEligibility({
      maxAttempts: 2,
      retakeCooldownHours: 0,
      attempts: [
        { passed: false, score: 50, completed_at: "2026-04-23T16:00:00Z" },
        { passed: false, score: 60, completed_at: "2026-04-23T17:00:00Z" },
      ],
      now: NOW,
    });
    expect(e.state).toBe("max_reached");
    expect(e.attemptsUsed).toBe(2);
    expect(e.attemptsLeft).toBe(0);
  });

  it("blocks with cooldown when last attempt is within the cooldown window", () => {
    const e = computeQuizEligibility({
      maxAttempts: null,
      retakeCooldownHours: 4,
      attempts: [
        { passed: false, score: 60, completed_at: "2026-04-23T17:30:00Z" },
      ],
      now: NOW,
    });
    expect(e.state).toBe("cooldown");
    if (e.state !== "cooldown") throw new Error("unreachable");
    expect(e.nextAvailableAt).toBe("2026-04-23T21:30:00.000Z");
  });

  it("reopens after the cooldown window expires", () => {
    const e = computeQuizEligibility({
      maxAttempts: null,
      retakeCooldownHours: 2,
      attempts: [
        { passed: false, score: 60, completed_at: "2026-04-23T15:30:00Z" },
      ],
      now: NOW,
    });
    expect(e.state).toBe("open");
    expect(e.attemptsUsed).toBe(1);
  });

  it("ignores in-progress attempts (no completed_at) in attempt counts", () => {
    const e = computeQuizEligibility({
      maxAttempts: 2,
      retakeCooldownHours: 0,
      attempts: [
        { passed: null, score: null, completed_at: null },
        { passed: false, score: 60, completed_at: "2026-04-23T17:00:00Z" },
      ],
      now: NOW,
    });
    expect(e.state).toBe("open");
    expect(e.attemptsUsed).toBe(1);
    expect(e.attemptsLeft).toBe(1);
  });

  it("treats max_reached as winning over cooldown when both apply", () => {
    const e = computeQuizEligibility({
      maxAttempts: 2,
      retakeCooldownHours: 4,
      attempts: [
        { passed: false, score: 50, completed_at: "2026-04-23T16:00:00Z" },
        { passed: false, score: 60, completed_at: "2026-04-23T17:30:00Z" },
      ],
      now: NOW,
    });
    expect(e.state).toBe("max_reached");
  });
});

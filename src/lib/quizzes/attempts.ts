export type AttemptSummary = {
  passed: boolean | null;
  score: number | null;
  completed_at: string | null;
};

export type Eligibility =
  | { state: "open"; attemptsUsed: number; attemptsLeft: number | null; bestScore: number | null }
  | {
      state: "passed";
      attemptsUsed: number;
      attemptsLeft: number | null;
      bestScore: number;
    }
  | {
      state: "max_reached";
      attemptsUsed: number;
      attemptsLeft: 0;
      bestScore: number | null;
    }
  | {
      state: "cooldown";
      attemptsUsed: number;
      attemptsLeft: number | null;
      bestScore: number | null;
      nextAvailableAt: string;
    };

export function computeQuizEligibility({
  maxAttempts,
  retakeCooldownHours,
  attempts,
  now,
}: {
  maxAttempts: number | null;
  retakeCooldownHours: number;
  attempts: AttemptSummary[];
  now: Date;
}): Eligibility {
  const completed = attempts.filter((a) => a.completed_at !== null);
  const attemptsUsed = completed.length;
  const bestScore = completed.reduce<number | null>((best, a) => {
    if (a.score === null) return best;
    return best === null ? a.score : Math.max(best, a.score);
  }, null);
  const hasPass = completed.some((a) => a.passed === true);
  const attemptsLeft =
    maxAttempts === null ? null : Math.max(0, maxAttempts - attemptsUsed);

  // Max reached wins: no attempts left, show the terminal state even if a
  // cooldown is also in effect.
  if (maxAttempts !== null && attemptsUsed >= maxAttempts && !hasPass) {
    return {
      state: "max_reached",
      attemptsUsed,
      attemptsLeft: 0,
      bestScore,
    };
  }

  if (hasPass) {
    return {
      state: "passed",
      attemptsUsed,
      attemptsLeft,
      bestScore: bestScore ?? 0,
    };
  }

  if (retakeCooldownHours > 0 && completed.length > 0) {
    // Find the most recent completed attempt.
    const mostRecent = completed.reduce((latest, a) => {
      if (!a.completed_at) return latest;
      if (!latest || !latest.completed_at) return a;
      return a.completed_at > latest.completed_at ? a : latest;
    }, completed[0]);

    if (mostRecent?.completed_at) {
      const available =
        new Date(mostRecent.completed_at).getTime() +
        retakeCooldownHours * 60 * 60 * 1000;
      if (available > now.getTime()) {
        return {
          state: "cooldown",
          attemptsUsed,
          attemptsLeft,
          bestScore,
          nextAvailableAt: new Date(available).toISOString(),
        };
      }
    }
  }

  return {
    state: "open",
    attemptsUsed,
    attemptsLeft,
    bestScore,
  };
}

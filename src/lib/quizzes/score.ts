export type ScoringQuestion = {
  id: string;
  type: "true_false" | "single_choice" | "multi_select";
  points: number;
  correctOptionIds: string[];
};

export type ScoringResponses = Record<string, string[]>;

export type ScoreResult = {
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
};

/**
 * Scoring rules:
 *   single_choice / true_false — the single selected option must match the
 *   single correct option.
 *   multi_select — the selected set must equal the correct set exactly.
 *   All-or-nothing per question; missing question = 0 points.
 */
export function scoreQuizAttempt(
  questions: ScoringQuestion[],
  responses: ScoringResponses,
  passingScore: number,
): ScoreResult {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  let earnedPoints = 0;
  for (const q of questions) {
    const selected = responses[q.id] ?? [];
    if (isCorrect(q, selected)) {
      earnedPoints += q.points;
    }
  }

  const score =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = totalPoints > 0 && score >= passingScore;

  return { score, passed, earnedPoints, totalPoints };
}

function isCorrect(q: ScoringQuestion, selected: string[]): boolean {
  const correct = q.correctOptionIds;
  if (q.type === "multi_select") {
    if (selected.length !== correct.length) return false;
    const correctSet = new Set(correct);
    return selected.every((id) => correctSet.has(id));
  }
  // single_choice + true_false: exactly one selected and it matches.
  if (selected.length !== 1) return false;
  return correct.includes(selected[0]);
}

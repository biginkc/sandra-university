import { describe, expect, it } from "vitest";

import { scoreQuizAttempt, type ScoringQuestion } from "./score";

describe("scoreQuizAttempt", () => {
  it("returns 0% and not passed when there are no questions", () => {
    const result = scoreQuizAttempt([], {}, 80);
    expect(result).toEqual({
      score: 0,
      passed: false,
      earnedPoints: 0,
      totalPoints: 0,
    });
  });

  it("awards full points when a single_choice answer is correct", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", type: "single_choice", points: 1, correctOptionIds: ["o1"] },
    ];
    const result = scoreQuizAttempt(questions, { q1: ["o1"] }, 80);
    expect(result.earnedPoints).toBe(1);
    expect(result.totalPoints).toBe(1);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("awards 0 when a single_choice answer is wrong", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", type: "single_choice", points: 1, correctOptionIds: ["o1"] },
    ];
    const result = scoreQuizAttempt(questions, { q1: ["o2"] }, 80);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("treats multi_select as all-or-nothing: exact match gets full points", () => {
    const questions: ScoringQuestion[] = [
      {
        id: "q1",
        type: "multi_select",
        points: 2,
        correctOptionIds: ["a", "b", "c"],
      },
    ];
    const result = scoreQuizAttempt(questions, { q1: ["a", "b", "c"] }, 80);
    expect(result.earnedPoints).toBe(2);
    expect(result.score).toBe(100);
  });

  it("treats multi_select with a missing correct option as 0", () => {
    const questions: ScoringQuestion[] = [
      {
        id: "q1",
        type: "multi_select",
        points: 1,
        correctOptionIds: ["a", "b", "c"],
      },
    ];
    const result = scoreQuizAttempt(questions, { q1: ["a", "b"] }, 80);
    expect(result.earnedPoints).toBe(0);
  });

  it("treats multi_select with an extra incorrect option as 0", () => {
    const questions: ScoringQuestion[] = [
      {
        id: "q1",
        type: "multi_select",
        points: 1,
        correctOptionIds: ["a", "b"],
      },
    ];
    const result = scoreQuizAttempt(questions, { q1: ["a", "b", "c"] }, 80);
    expect(result.earnedPoints).toBe(0);
  });

  it("handles true_false the same as single_choice", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", type: "true_false", points: 1, correctOptionIds: ["true"] },
    ];
    expect(scoreQuizAttempt(questions, { q1: ["true"] }, 80).score).toBe(100);
    expect(scoreQuizAttempt(questions, { q1: ["false"] }, 80).score).toBe(0);
  });

  it("sums points across mixed-type questions and applies passing score", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", type: "true_false", points: 1, correctOptionIds: ["t"] },
      { id: "q2", type: "single_choice", points: 2, correctOptionIds: ["a"] },
      {
        id: "q3",
        type: "multi_select",
        points: 2,
        correctOptionIds: ["x", "y"],
      },
    ];
    // q1 right (+1), q2 right (+2), q3 wrong (0). 3/5 = 60%
    const result = scoreQuizAttempt(
      questions,
      { q1: ["t"], q2: ["a"], q3: ["x"] },
      60,
    );
    expect(result.earnedPoints).toBe(3);
    expect(result.totalPoints).toBe(5);
    expect(result.score).toBe(60);
    expect(result.passed).toBe(true);
  });

  it("treats a missing response to a question as incorrect", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", type: "single_choice", points: 1, correctOptionIds: ["o1"] },
    ];
    const result = scoreQuizAttempt(questions, {}, 80);
    expect(result.score).toBe(0);
  });
});

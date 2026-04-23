import { describe, expect, it } from "vitest";

import { shapeCourseResponse } from "./shape";

describe("shapeCourseResponse", () => {
  it("returns null when raw is null or undefined", () => {
    expect(shapeCourseResponse(null)).toBeNull();
    expect(shapeCourseResponse(undefined)).toBeNull();
  });

  it("sorts modules by sort_order and lessons by sort_order within each module", () => {
    const raw = {
      id: "c1",
      title: "Phone Basics",
      description: null,
      is_published: true,
      modules: [
        {
          id: "m2",
          title: "Module Two",
          description: null,
          sort_order: 1,
          lessons: [
            {
              id: "l3",
              title: "L3",
              description: null,
              lesson_type: "content" as const,
              sort_order: 0,
              prerequisite_lesson_id: null,
              quiz_id: null,
              assignment_id: null,
              is_required_for_completion: true,
            },
          ],
        },
        {
          id: "m1",
          title: "Module One",
          description: null,
          sort_order: 0,
          lessons: [
            {
              id: "l2",
              title: "L2",
              description: null,
              lesson_type: "quiz" as const,
              sort_order: 1,
              prerequisite_lesson_id: "l1",
              quiz_id: "q1",
              assignment_id: null,
              is_required_for_completion: true,
            },
            {
              id: "l1",
              title: "L1",
              description: null,
              lesson_type: "content" as const,
              sort_order: 0,
              prerequisite_lesson_id: null,
              quiz_id: null,
              assignment_id: null,
              is_required_for_completion: true,
            },
          ],
        },
      ],
    };

    const shaped = shapeCourseResponse(raw);

    expect(shaped).not.toBeNull();
    expect(shaped!.modules.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(shaped!.modules[0].lessons.map((l) => l.id)).toEqual(["l1", "l2"]);
    expect(shaped!.modules[1].lessons.map((l) => l.id)).toEqual(["l3"]);
  });

  it("handles modules with no lessons", () => {
    const raw = {
      id: "c1",
      title: "Empty",
      description: null,
      is_published: true,
      modules: [
        {
          id: "m1",
          title: "M1",
          description: null,
          sort_order: 0,
          lessons: null,
        },
      ],
    };

    const shaped = shapeCourseResponse(raw);
    expect(shaped!.modules[0].lessons).toEqual([]);
  });

  it("handles courses with no modules", () => {
    const raw = {
      id: "c1",
      title: "Empty",
      description: null,
      is_published: true,
      modules: null,
    };

    const shaped = shapeCourseResponse(raw);
    expect(shaped!.modules).toEqual([]);
  });
});

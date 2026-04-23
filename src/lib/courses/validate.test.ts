import { describe, expect, it } from "vitest";

import { parseCourseInput } from "./validate";

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

describe("parseCourseInput", () => {
  it("parses valid input", () => {
    const result = parseCourseInput(
      fd({
        title: " Phone Basics ",
        description: "Intro",
        is_published: "on",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      title: "Phone Basics",
      description: "Intro",
      is_published: true,
    });
  });

  it("rejects empty title", () => {
    const result = parseCourseInput(fd({ title: "   " }));
    expect(result.ok).toBe(false);
  });

  it("defaults is_published to false", () => {
    const result = parseCourseInput(fd({ title: "Course" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.is_published).toBe(false);
    expect(result.value.description).toBeNull();
  });

  it("rejects titles over 200 chars", () => {
    const result = parseCourseInput(fd({ title: "a".repeat(201) }));
    expect(result.ok).toBe(false);
  });
});

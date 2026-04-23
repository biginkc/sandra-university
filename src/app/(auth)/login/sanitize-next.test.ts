import { describe, expect, it } from "vitest";

import { sanitizeNextUrl } from "./sanitize-next";

describe("sanitizeNextUrl", () => {
  it("returns the default when input is empty or null-ish", () => {
    expect(sanitizeNextUrl("")).toBe("/dashboard");
    expect(sanitizeNextUrl(null)).toBe("/dashboard");
    expect(sanitizeNextUrl(undefined)).toBe("/dashboard");
  });

  it("returns the default for non-relative URLs (open-redirect protection)", () => {
    expect(sanitizeNextUrl("https://evil.example.com")).toBe("/dashboard");
    expect(sanitizeNextUrl("http://other.site/")).toBe("/dashboard");
    expect(sanitizeNextUrl("//evil.example.com")).toBe("/dashboard");
    expect(sanitizeNextUrl("javascript:alert(1)")).toBe("/dashboard");
  });

  it("returns the default for non-root-relative paths", () => {
    expect(sanitizeNextUrl("dashboard")).toBe("/dashboard");
    expect(sanitizeNextUrl("../secret")).toBe("/dashboard");
  });

  it("avoids redirect loops back to /login", () => {
    expect(sanitizeNextUrl("/login")).toBe("/dashboard");
    expect(sanitizeNextUrl("/login?foo=bar")).toBe("/dashboard");
  });

  it("accepts clean relative paths", () => {
    expect(sanitizeNextUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextUrl("/programs/abc")).toBe("/programs/abc");
    expect(sanitizeNextUrl("/lessons/xyz?resume=1")).toBe("/lessons/xyz?resume=1");
  });
});

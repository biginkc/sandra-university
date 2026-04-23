import { describe, expect, it } from "vitest";

import { parseInviteInput } from "./validate";

function fd(values: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (Array.isArray(v)) {
      for (const item of v) f.append(k, item);
    } else {
      f.set(k, v);
    }
  }
  return f;
}

describe("parseInviteInput", () => {
  it("parses a minimal valid invite", () => {
    const r = parseInviteInput(fd({ email: " person@example.com " }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toEqual({
      email: "person@example.com",
      system_role: "learner",
      role_group_ids: [],
    });
  });

  it("collects multiple role_group_ids from a multi-select", () => {
    const r = parseInviteInput(
      fd({
        email: "a@b.com",
        system_role: "admin",
        role_group_ids: ["g1", "g2"],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.role_group_ids).toEqual(["g1", "g2"]);
    expect(r.value.system_role).toBe("admin");
  });

  it("rejects missing email", () => {
    const r = parseInviteInput(fd({}));
    expect(r.ok).toBe(false);
  });

  it("rejects obviously malformed email", () => {
    const r = parseInviteInput(fd({ email: "not-an-email" }));
    expect(r.ok).toBe(false);
  });

  it("lowercases the email", () => {
    const r = parseInviteInput(fd({ email: "MIXED@Example.COM" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.email).toBe("mixed@example.com");
  });

  it("rejects an invalid system_role", () => {
    const r = parseInviteInput(
      fd({ email: "a@b.com", system_role: "superadmin" }),
    );
    expect(r.ok).toBe(false);
  });
});

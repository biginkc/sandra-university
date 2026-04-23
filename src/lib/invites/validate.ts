export type InviteInput = {
  email: string;
  system_role: "owner" | "admin" | "learner";
  role_group_ids: string[];
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string> };

const ALLOWED_ROLES = new Set(["owner", "admin", "learner"]);
// Intentionally loose — Supabase will reject anything it doesn't like
// before we insert. We just catch the obvious typos here.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInviteInput(formData: FormData): ParseResult<InviteInput> {
  const errors: Record<string, string> = {};

  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rawEmail) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(rawEmail)) errors.email = "Enter a valid email.";

  const systemRoleRaw = String(formData.get("system_role") ?? "learner");
  const system_role = ALLOWED_ROLES.has(systemRoleRaw)
    ? (systemRoleRaw as InviteInput["system_role"])
    : null;
  if (!system_role) errors.system_role = "Invalid role.";

  const role_group_ids = formData
    .getAll("role_group_ids")
    .map((v) => String(v))
    .filter(Boolean);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      email: rawEmail,
      system_role: system_role as InviteInput["system_role"],
      role_group_ids,
    },
  };
}

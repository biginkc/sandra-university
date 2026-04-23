/**
 * Open-redirect protection for the ?next= query parameter.
 * Only relative paths that start with a single "/" and don't target
 * /login (to avoid loops) are allowed. Everything else falls back
 * to the default dashboard landing page.
 */
const DEFAULT_LANDING = "/dashboard";

export function sanitizeNextUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_LANDING;
  if (!raw.startsWith("/")) return DEFAULT_LANDING;
  if (raw.startsWith("//")) return DEFAULT_LANDING;
  if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) {
    return DEFAULT_LANDING;
  }
  return raw;
}

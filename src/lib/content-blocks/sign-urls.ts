import { createClient } from "@/lib/supabase/server";
import type { ContentBlock } from "@/components/content-blocks";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * For any block whose content references a `file_path` in the `content`
 * Supabase Storage bucket, generate a time-limited signed URL and merge it
 * back into the content as `signed_url`. Renderers prefer `signed_url`.
 *
 * Runs server-side inside a Server Component; uses the learner's session
 * client so RLS enforces access (learners can read, admins can read/write).
 */
export async function enrichBlocksWithSignedUrls(
  blocks: ContentBlock[],
): Promise<ContentBlock[]> {
  const paths = blocks
    .map((b) => {
      const p = b.content?.file_path;
      return typeof p === "string" && p.length > 0 ? p : null;
    })
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return blocks;

  const supabase = await createClient();
  const signedByPath = new Map<string, string>();

  // createSignedUrls takes an array; bulk-sign to avoid N round-trips.
  const { data, error } = await supabase.storage
    .from("content")
    .createSignedUrls(Array.from(new Set(paths)), SIGNED_URL_TTL_SECONDS);

  if (!error && data) {
    for (const row of data) {
      if (row.path && row.signedUrl) {
        signedByPath.set(row.path, row.signedUrl);
      }
    }
  }

  return blocks.map((b) => {
    const p = b.content?.file_path;
    if (typeof p !== "string" || p.length === 0) return b;
    const signed = signedByPath.get(p);
    if (!signed) return b;
    return {
      ...b,
      content: { ...b.content, signed_url: signed },
    };
  });
}

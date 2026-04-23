import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeNextUrl } from "@/app/(auth)/login/sanitize-next";

/**
 * Supabase invite / magic-link / recovery callback. Exchanges the one-time
 * `code` from the email link for a durable session, then routes onward.
 *
 * Invite flow: the user opens their "You've been invited to Sandra University"
 * email, clicks the link, lands here with `?code=...&type=invite`, we
 * exchange for a session, redirect to `/auth/set-password` to pick a
 * password before anything else.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invite_failed`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=invite_failed`);
  }

  if (type === "invite" || type === "recovery" || type === "signup") {
    return NextResponse.redirect(`${origin}/auth/set-password`);
  }

  return NextResponse.redirect(`${origin}${sanitizeNextUrl(next)}`);
}

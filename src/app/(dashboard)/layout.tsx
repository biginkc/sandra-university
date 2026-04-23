import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-border bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="text-base font-semibold">
          Sandra University
        </Link>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{user.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guard";
import { cn } from "@/lib/utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1">
      <aside className="border-border bg-muted/20 hidden w-56 shrink-0 border-r p-4 md:block">
        <h2 className="text-muted-foreground mb-3 px-2 text-xs font-semibold uppercase tracking-wide">
          Admin
        </h2>
        <nav className="flex flex-col gap-1 text-sm">
          <AdminNavLink href="/admin">Overview</AdminNavLink>
          <AdminNavLink href="/admin/programs">Programs</AdminNavLink>
          <AdminNavLink href="/admin/courses">Courses</AdminNavLink>
        </nav>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground block px-2 text-xs"
          >
            ← Back to learner view
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground/80 hover:bg-muted hover:text-foreground rounded-md px-2 py-1.5",
      )}
    >
      {children}
    </Link>
  );
}

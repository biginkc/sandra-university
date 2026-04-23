import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [programs, courses, profiles, certificates] = await Promise.all([
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("certificates").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="flex-1 p-6 md:p-10">
      <h1 className="mb-6 text-2xl font-semibold">Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Programs"
          count={programs.count ?? 0}
          href="/admin/programs"
        />
        <StatCard
          label="Courses"
          count={courses.count ?? 0}
          href="/admin/courses"
        />
        <StatCard
          label="Profiles"
          count={profiles.count ?? 0}
          href="/admin"
        />
        <StatCard
          label="Certificates issued"
          count={certificates.count ?? 0}
          href="/admin"
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/programs/new"
            className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          >
            New program
          </Link>
          <Link
            href="/admin/courses/new"
            className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          >
            New course
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:bg-muted/30 transition-colors">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {count}
          </CardTitle>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}

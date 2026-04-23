import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { shapeProgramsResponse } from "@/lib/programs/shape";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select(
      `
      id,
      title,
      description,
      course_order_mode,
      is_published,
      sort_order,
      program_courses (
        sort_order,
        courses (
          id,
          title,
          description,
          is_published
        )
      )
    `,
    )
    .eq("is_published", true)
    .order("sort_order");

  const programs = shapeProgramsResponse(data);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Your training</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Programs assigned to you, with the courses you can work through.
        </p>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          We couldn't load your programs. Try refreshing. ({error.message})
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No programs yet</CardTitle>
            <CardDescription>
              Nothing has been assigned to your account. Reach out to an admin to get access.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </main>
  );
}

function ProgramCard({
  program,
}: {
  program: ReturnType<typeof shapeProgramsResponse>[number];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{program.title}</CardTitle>
            {program.description ? (
              <CardDescription className="mt-1">
                {program.description}
              </CardDescription>
            ) : null}
          </div>
          <Badge variant="secondary">
            {program.course_order_mode === "sequential" ? "Sequential" : "Any order"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {program.courses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No courses in this program yet.</p>
        ) : (
          <ol className="divide-border divide-y">
            {program.courses.map((course, idx) => (
              <li key={course.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-6 text-sm tabular-nums">
                    {idx + 1}.
                  </span>
                  <div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {course.title}
                    </Link>
                    {course.description ? (
                      <p className="text-muted-foreground mt-0.5 text-xs">{course.description}</p>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

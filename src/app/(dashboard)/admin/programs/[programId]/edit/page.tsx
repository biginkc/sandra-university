import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateProgram } from "../../actions";
import { ProgramForm } from "../../program-form";
import { CourseAttachments } from "./course-attachments";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const supabase = await createClient();

  const [{ data: program }, { data: programCourses }, { data: allCourses }] =
    await Promise.all([
      supabase
        .from("programs")
        .select(
          "id, title, description, course_order_mode, is_published, sort_order",
        )
        .eq("id", programId)
        .maybeSingle(),
      supabase
        .from("program_courses")
        .select("course_id, sort_order, courses(id, title, is_published)")
        .eq("program_id", programId)
        .order("sort_order"),
      supabase.from("courses").select("id, title, is_published").order("title"),
    ]);

  if (!program) notFound();

  const boundAction = updateProgram.bind(null, programId);

  const attached = (programCourses ?? []).map((row) => ({
    course_id: row.course_id as string,
    sort_order: row.sort_order as number,
    course: firstRow(row.courses) as
      | { id: string; title: string; is_published: boolean }
      | null,
  }));

  const attachedIds = new Set(attached.map((a) => a.course_id));
  const availableCourses = (allCourses ?? []).filter(
    (c) => !attachedIds.has(c.id as string),
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6 md:p-10">
      <Link
        href="/admin/programs"
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← Back to programs
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit program</h1>
      <p className="text-muted-foreground mb-8 mt-1 text-sm">
        Editing &quot;{program.title as string}&quot;.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Title, description, and sequencing behaviour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm
            action={boundAction}
            submitLabel="Save changes"
            defaults={{
              title: program.title as string,
              description: program.description as string | null,
              course_order_mode:
                (program.course_order_mode as "sequential" | "free") ?? "free",
              is_published: program.is_published as boolean,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses in this program</CardTitle>
          <CardDescription>
            Attach existing courses. They appear in the order shown below
            (top to bottom). For sequential programs, the order controls
            unlock timing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseAttachments
            programId={programId}
            attached={attached
              .filter((a) => a.course !== null)
              .map((a) => ({
                courseId: a.course_id,
                title: a.course!.title,
                isPublished: a.course!.is_published,
                sortOrder: a.sort_order,
              }))}
            available={availableCourses.map((c) => ({
              id: c.id as string,
              title: c.title as string,
              isPublished: c.is_published as boolean,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

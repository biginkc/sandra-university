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
import { shapeCourseResponse } from "@/lib/courses/shape";

import { updateCourse } from "../../actions";
import { CourseForm } from "../../course-form";
import { ModulesEditor } from "./modules-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      is_published,
      modules (
        id,
        title,
        description,
        sort_order,
        lessons (
          id,
          title,
          description,
          lesson_type,
          sort_order,
          prerequisite_lesson_id,
          quiz_id,
          assignment_id,
          is_required_for_completion
        )
      )
    `,
    )
    .eq("id", courseId)
    .maybeSingle();

  const shaped = shapeCourseResponse(raw);
  if (!shaped) notFound();

  const boundAction = updateCourse.bind(null, courseId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6 md:p-10">
      <Link
        href="/admin/courses"
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← Back to courses
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit course</h1>
      <p className="text-muted-foreground mb-8 mt-1 text-sm">
        Editing &quot;{shaped.title}&quot;.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Title, description, publish state.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            action={boundAction}
            submitLabel="Save changes"
            defaults={{
              title: shaped.title,
              description: shaped.description,
              is_published: shaped.is_published,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            Containers for lessons. Reorder with the up/down arrows. Each
            module contains its own lessons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModulesEditor courseId={courseId} modules={shaped.modules} />
        </CardContent>
      </Card>
    </main>
  );
}

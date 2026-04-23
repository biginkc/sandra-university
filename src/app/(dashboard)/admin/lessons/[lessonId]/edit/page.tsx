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

import { LessonDetailsForm } from "./lesson-details-form";
import { BlocksEditor, type BlockRow } from "./blocks-editor";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const [{ data: lesson }, { data: blocks }] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        `
        id,
        title,
        description,
        lesson_type,
        is_required_for_completion,
        module_id,
        modules ( id, title, course_id )
      `,
      )
      .eq("id", lessonId)
      .maybeSingle(),
    supabase
      .from("content_blocks")
      .select("id, block_type, content, sort_order, is_required_for_completion")
      .eq("lesson_id", lessonId)
      .order("sort_order"),
  ]);

  if (!lesson) notFound();

  const moduleRow = firstRow(lesson.modules) as
    | { id: string; title: string; course_id: string }
    | null;
  const courseId = moduleRow?.course_id;

  const blockRows = (blocks ?? []) as BlockRow[];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6 md:p-10">
      <Link
        href={courseId ? `/admin/courses/${courseId}/edit` : "/admin/courses"}
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← {moduleRow ? `Back to course (module: ${moduleRow.title})` : "Back to courses"}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit lesson</h1>
      <p className="text-muted-foreground mb-8 mt-1 text-sm">
        Lesson type: {lesson.lesson_type as string}.{" "}
        {lesson.lesson_type !== "content"
          ? "Block editing is only for content lessons."
          : "Arrange content blocks from top to bottom."}
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Title, description, required flag.</CardDescription>
        </CardHeader>
        <CardContent>
          <LessonDetailsForm
            lessonId={lessonId}
            defaultTitle={lesson.title as string}
            defaultDescription={lesson.description as string | null}
            defaultRequired={lesson.is_required_for_completion as boolean}
          />
        </CardContent>
      </Card>

      {lesson.lesson_type === "content" ? (
        <Card>
          <CardHeader>
            <CardTitle>Content blocks</CardTitle>
            <CardDescription>
              Add text, callouts, external links, embeds, or dividers. Video,
              PDF, image, audio, and download blocks land in the upload phase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlocksEditor lessonId={lessonId} initialBlocks={blockRows} />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

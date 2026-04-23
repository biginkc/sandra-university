import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  ContentBlockRenderer,
  type ContentBlock,
} from "@/components/content-blocks";
import { MarkCompleteButton } from "./mark-complete-button";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      `
      id,
      title,
      description,
      lesson_type,
      quiz_id,
      assignment_id,
      module_id,
      modules (
        id,
        title,
        course_id,
        courses (
          id,
          title
        )
      )
    `,
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: unlocked }, { data: completion }] = await Promise.all([
    supabase.rpc("fn_lesson_is_unlocked", {
      p_user_id: user?.id ?? "",
      p_lesson_id: lessonId,
    }),
    supabase
      .from("user_lesson_completions")
      .select("lesson_id")
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);

  const alreadyComplete = Boolean(completion);
  const moduleJoin = firstRow(lesson.modules);
  const courseJoin = firstRow(moduleJoin?.courses);
  const courseId = courseJoin?.id as string | undefined;
  const courseTitle = courseJoin?.title as string | undefined;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6 md:p-10">
      <div className="mb-6">
        {courseId ? (
          <Link
            href={`/courses/${courseId}`}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ← {courseTitle ?? "Back to course"}
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ← Back to dashboard
          </Link>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <LessonTypePill type={lesson.lesson_type as string} />
        </div>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        {lesson.description ? (
          <p className="text-muted-foreground mt-1 text-sm">
            {lesson.description}
          </p>
        ) : null}
      </div>

      {!unlocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Locked</CardTitle>
            <CardDescription>
              You haven&apos;t completed the prerequisite yet. Go back and finish earlier lessons first.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : lesson.lesson_type === "content" ? (
        <ContentLessonBody
          lessonId={lessonId}
          alreadyComplete={alreadyComplete}
        />
      ) : lesson.lesson_type === "quiz" ? (
        <QuizLessonPlaceholder quizId={lesson.quiz_id as string | null} />
      ) : (
        <AssignmentLessonPlaceholder
          assignmentId={lesson.assignment_id as string | null}
        />
      )}
    </main>
  );
}

async function ContentLessonBody({
  lessonId,
  alreadyComplete,
}: {
  lessonId: string;
  alreadyComplete: boolean;
}) {
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("content_blocks")
    .select("id, block_type, content, sort_order, is_required_for_completion")
    .eq("lesson_id", lessonId)
    .order("sort_order");

  const rows = (blocks ?? []) as ContentBlock[];

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empty lesson</CardTitle>
          <CardDescription>No content has been added yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {rows.map((block) => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}
      </div>
      <div className="border-border mt-8 flex items-center justify-end border-t pt-6">
        <MarkCompleteButton
          lessonId={lessonId}
          alreadyComplete={alreadyComplete}
        />
      </div>
    </>
  );
}

function QuizLessonPlaceholder({ quizId }: { quizId: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
        <CardDescription>
          The quiz runner lands in the next build phase. Quiz id: {quizId ?? "(none)"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Questions, randomization, retakes, and scoring will appear here.
      </CardContent>
    </Card>
  );
}

function AssignmentLessonPlaceholder({
  assignmentId,
}: {
  assignmentId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment</CardTitle>
        <CardDescription>
          Submission form lands in the next build phase. Assignment id: {assignmentId ?? "(none)"}.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function LessonTypePill({ type }: { type: string }) {
  if (type === "quiz") return <Badge variant="outline">Quiz</Badge>;
  if (type === "assignment") return <Badge variant="outline">Assignment</Badge>;
  return <Badge variant="secondary">Lesson</Badge>;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

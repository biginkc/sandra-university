import Link from "next/link";

import { CourseForm } from "../course-form";
import { createCourse } from "../actions";

export default function NewCoursePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6 md:p-10">
      <Link
        href="/admin/courses"
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← Back to courses
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New course</h1>
      <p className="text-muted-foreground mb-6 mt-1 text-sm">
        After creating, you can add modules and lessons.
      </p>
      <CourseForm action={createCourse} submitLabel="Create course" />
    </main>
  );
}

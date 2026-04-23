"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  attachCourseToProgram,
  detachCourseFromProgram,
} from "../../actions";

type AttachedCourse = {
  courseId: string;
  title: string;
  isPublished: boolean;
  sortOrder: number;
};

type AvailableCourse = {
  id: string;
  title: string;
  isPublished: boolean;
};

export function CourseAttachments({
  programId,
  attached,
  available,
}: {
  programId: string;
  attached: AttachedCourse[];
  available: AvailableCourse[];
}) {
  const [selected, setSelected] = useState<string>(available[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function onAttach() {
    if (!selected) {
      toast.error("Pick a course to attach.");
      return;
    }
    startTransition(async () => {
      const result = await attachCourseToProgram({
        programId,
        courseId: selected,
      });
      if (result && !result.ok) toast.error(result.error);
      else toast.success("Course attached.");
    });
  }

  function onDetach(courseId: string) {
    startTransition(async () => {
      const result = await detachCourseFromProgram({ programId, courseId });
      if (result && !result.ok) toast.error(result.error);
      else toast.success("Course removed from program.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {attached.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No courses attached yet.
        </p>
      ) : (
        <ol className="divide-border divide-y">
          {attached.map((c, idx) => (
            <li
              key={c.courseId}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-6 text-sm tabular-nums">
                  {idx + 1}.
                </span>
                <div>
                  <div className="text-sm font-medium">{c.title}</div>
                  <Badge
                    variant={c.isPublished ? "default" : "outline"}
                    className="mt-1"
                  >
                    {c.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => onDetach(c.courseId)}
                disabled={pending}
              >
                Remove
              </Button>
            </li>
          ))}
        </ol>
      )}

      {available.length > 0 ? (
        <div className="border-border flex items-end gap-3 border-t pt-4">
          <div className="flex-1">
            <label
              htmlFor="attach-course"
              className="text-muted-foreground mb-1 block text-xs"
            >
              Attach a course
            </label>
            <select
              id="attach-course"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.isPublished ? "" : "(draft)"}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={onAttach} disabled={pending}>
            {pending ? "Saving..." : "Attach"}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          All courses are already attached (or none exist yet).
        </p>
      )}
    </div>
  );
}

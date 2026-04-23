"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { markLessonComplete } from "./actions";

export function MarkCompleteButton({
  lessonId,
  alreadyComplete,
}: {
  lessonId: string;
  alreadyComplete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (alreadyComplete) {
    return (
      <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <CheckCircle2 className="text-primary size-4" />
        Lesson complete
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const result = await markLessonComplete(lessonId);
          if (result.ok) {
            toast.success(
              result.blocksMarked === 0
                ? "Lesson already recorded."
                : "Lesson marked complete.",
            );
          } else {
            toast.error(result.error);
          }
        });
      }}
      disabled={pending}
    >
      {pending ? "Marking..." : "Mark lesson complete"}
    </Button>
  );
}

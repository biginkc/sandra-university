"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLessonDetails } from "./actions";

export function LessonDetailsForm({
  lessonId,
  defaultTitle,
  defaultDescription,
  defaultRequired,
}: {
  lessonId: string;
  defaultTitle: string;
  defaultDescription: string | null;
  defaultRequired: boolean;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [required, setRequired] = useState(defaultRequired);
  const [pending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateLessonDetails({
        lessonId,
        title,
        description: description.trim() === "" ? null : description.trim(),
        is_required_for_completion: required,
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Saved.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_required"
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          className="size-4"
        />
        <Label htmlFor="is_required">
          Required for course completion
        </Label>
      </div>

      <div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

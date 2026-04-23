"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "./actions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

type Defaults = {
  title?: string | null;
  description?: string | null;
  course_order_mode?: "sequential" | "free" | null;
  is_published?: boolean | null;
};

export function ProgramForm({
  action,
  submitLabel,
  defaults,
}: {
  action: Action;
  submitLabel: string;
  defaults?: Defaults;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    null,
  );
  const fieldError = (name: string): string | undefined =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Title" htmlFor="title" error={fieldError("title")}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          maxLength={200}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        error={fieldError("description")}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>

      <Field
        label="Course order"
        htmlFor="course_order_mode"
        error={fieldError("course_order_mode")}
      >
        <select
          id="course_order_mode"
          name="course_order_mode"
          defaultValue={defaults?.course_order_mode ?? "free"}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="free">Free — learner picks order</option>
          <option value="sequential">Sequential — unlock one at a time</option>
        </select>
      </Field>

      <div className="flex items-center gap-2">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={defaults?.is_published ?? false}
          className="size-4"
        />
        <Label htmlFor="is_published">Published (visible to learners)</Label>
      </div>

      {state && !state.ok ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {state.error}
        </div>
      ) : null}
      {state && state.ok ? (
        <div className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 rounded-md border px-3 py-2 text-sm">
          Saved.
        </div>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : null}
    </div>
  );
}

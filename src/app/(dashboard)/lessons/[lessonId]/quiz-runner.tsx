"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { submitQuizAttempt, type QuizSubmitResult } from "./quiz-actions";

export type QuizQuestion = {
  id: string;
  question_text: string;
  question_type: "true_false" | "single_choice" | "multi_select";
  options: { id: string; option_text: string }[];
};

export function QuizRunner({
  quizId,
  lessonId,
  passingScore,
  questions,
  backHref,
}: {
  quizId: string;
  lessonId: string;
  passingScore: number;
  questions: QuizQuestion[];
  backHref: string;
}) {
  const [responses, setResponses] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No questions yet</CardTitle>
          <CardDescription>
            This quiz doesn&apos;t have any questions. An admin needs to add some.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (result && result.ok) {
    return <QuizResultCard result={result} backHref={backHref} onRetake={() => {
      setResult(null);
      setResponses({});
    }} />;
  }

  function onToggle(question: QuizQuestion, optionId: string) {
    setResponses((prev) => {
      const current = prev[question.id] ?? [];
      if (question.question_type === "multi_select") {
        return {
          ...prev,
          [question.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  }

  function onSubmit() {
    const answered = questions.every(
      (q) => (responses[q.id] ?? []).length > 0,
    );
    if (!answered) {
      toast.error("Answer every question before submitting.");
      return;
    }
    startTransition(async () => {
      const res = await submitQuizAttempt({ quizId, lessonId, responses });
      setResult(res);
      if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiz</CardTitle>
          <CardDescription>
            Passing score: {passingScore}%. You can retake if you don&apos;t pass.
          </CardDescription>
        </CardHeader>
      </Card>

      {questions.map((question, idx) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-base">
              <span className="text-muted-foreground mr-2 tabular-nums">
                {idx + 1}.
              </span>
              {question.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {question.options.map((option) => {
                const selected = (responses[question.id] ?? []).includes(
                  option.id,
                );
                const inputId = `${question.id}-${option.id}`;
                return (
                  <Label
                    key={option.id}
                    htmlFor={inputId}
                    className={cn(
                      "border-border flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm",
                      selected && "border-primary bg-primary/5",
                    )}
                  >
                    <input
                      id={inputId}
                      type={
                        question.question_type === "multi_select"
                          ? "checkbox"
                          : "radio"
                      }
                      name={question.id}
                      checked={selected}
                      onChange={() => onToggle(question, option.id)}
                      className="size-4"
                    />
                    <span>{option.option_text}</span>
                  </Label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-3">
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button onClick={onSubmit} disabled={pending}>
          {pending ? "Scoring..." : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}

function QuizResultCard({
  result,
  backHref,
  onRetake,
}: {
  result: Extract<QuizSubmitResult, { ok: true }>;
  backHref: string;
  onRetake: () => void;
}) {
  const Icon = result.passed ? CheckCircle2 : XCircle;
  const statusText = result.passed ? "Passed" : "Didn't pass";
  const statusColor = result.passed ? "text-emerald-600" : "text-destructive";

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <Icon className={cn("size-10", statusColor)} />
        <CardTitle className={cn("mt-2", statusColor)}>{statusText}</CardTitle>
        <CardDescription>
          Score: {result.score}% ({result.earnedPoints} / {result.totalPoints} points)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-3">
        {result.passed ? (
          <Link href={backHref} className={buttonVariants()}>
            Back to course
          </Link>
        ) : (
          <>
            <Link
              href={backHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to course
            </Link>
            <Button onClick={onRetake}>Retake quiz</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

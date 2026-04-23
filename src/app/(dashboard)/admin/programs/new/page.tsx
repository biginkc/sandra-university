import Link from "next/link";

import { ProgramForm } from "../program-form";
import { createProgram } from "../actions";

export default function NewProgramPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6 md:p-10">
      <Link
        href="/admin/programs"
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← Back to programs
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New program</h1>
      <p className="text-muted-foreground mb-6 mt-1 text-sm">
        A program is the named container VAs will see on their dashboard.
      </p>
      <ProgramForm action={createProgram} submitLabel="Create program" />
    </main>
  );
}

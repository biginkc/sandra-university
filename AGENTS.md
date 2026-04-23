<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sandra University — agent notes

Sandra University is BMH Group's internal training platform. It mirrors Sandra CRM's stack and conventions but runs as an independent Next.js app against its own Supabase project (`sandra-university`). Schema, UI, and auth are independent of the CRM; visual language and technical patterns are intentionally shared.

## Development workflow

**TDD is the standard.** For every feature and bug fix: failing test first, minimum code to pass, refactor. Don't mark work done without a covering test.

- `npm run dev` — next dev on port 3100
- `npm run test` — vitest unit suite
- `npm run test:integration` — vitest against a real Supabase (populate `.env.test.local`)
- `npm run test:e2e` — playwright
- `npm run verify` — typecheck + unit tests; gates the husky pre-commit hook

## Supabase

- Production project: `sandra-university` (ref `dhvfsyteqsxagokoerrx`)
- Migrations: `supabase/migrations/NNN_name.sql` applied in order
- RLS enabled on every table; learner reads scoped by role groups and program/course access
- Seeds are dev-only; promote your profile to `system_role = 'owner'` manually after first sign-in

## Writing style

- No em dashes.
- Minimal commas, dashes, hyphens.
- No bold headers or Roman numeral headers in docs.
- Company name is "BMH Group" (never "BMH Group KC").
- Quiz answer options: no lettering, randomized per attempt.

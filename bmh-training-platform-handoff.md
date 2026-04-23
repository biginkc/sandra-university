# BMH Training Platform - Handoff to Claude Code

Context document for continuing this build in a terminal coding session. Captures the plan, decisions made so far, open questions, and the research phase that precedes final schema design.

## Project Summary

Replace Thinkific with a custom internal training platform for BMH Group VAs. Cheaper, more flexible, and deliberately designed around evidence-based learning science rather than generic LMS patterns.

## Decisions Locked In

Stack:
Supabase (auth, Postgres, RLS, storage, edge functions)
React + Vite + TypeScript + Tailwind + shadcn/ui
TanStack Query for data fetching
React Router for routing
Vimeo or YouTube for video embeds (plus broader content types, see below)
Vercel free tier for hosting
Target total cost $0 to $20/mo replacing Thinkific

Core features agreed on:
Auth with team member invites
Role-based course access via custom role groups (e.g. Appointment Setters, Lead Managers)
Three system roles: owner, admin, learner
Quizzes with true/false, single choice, multi select
Question and answer randomization
Question pool support (pull N random from bank)
Pass thresholds with configurable max attempts and retake cooldown
Prerequisites at lesson level, including quiz-score-based unlocks
Resume where you left off
Admin dashboard with team progress heatmap
Completion certificates as PDFs with templates
Assignment submissions with reviewer workflow
Audit log for activity tracking

## Pivot: Content Block Model (not yet written into spec)

Original spec had lessons with a single lesson_type (video, quiz, or assignment). We discussed restructuring so lessons are containers holding ordered content blocks. Each block has a block_type and jsonb content payload.

Block types to support:
video, audio, pdf, rich_text, embed (iframe), file_download, image, image_gallery, external_link, quiz, assignment, flashcard_deck, scenario, live_session, divider, callout

This needs to be baked into the schema before Phase 1 starts. Don't build the old single-type lesson model first.

## Schema Draft Status

A full first-pass schema exists in bmh-training-platform-spec.md (created in the chat session that preceded this handoff). It's 90% right but needs these updates before use:

1. Replace single-type lessons with lessons + content_blocks tables
2. Expand user_lesson_progress to handle block-level completion tracking (user_block_progress) so completion can require specific blocks
3. Add tables for spaced repetition if the research confirms it's worth building: flashcards, flashcard_decks, flashcard_reviews
4. Add tables for scenarios if research confirms branching scenario value: scenarios, scenario_nodes, scenario_paths, user_scenario_attempts

## The Research Phase (do this before finalizing schema)

Before writing the final migrations, run a deep research piece on the science of learning and map findings to specific features. This prevents building a pretty LMS that doesn't actually change VA behavior.

Anchor question:
What does the science of learning say about designing training that produces durable skill transfer in adult professional learners, and how can those principles be implemented as software features in a custom LMS?

Frameworks to cover:
Make It Stick (retrieval practice, spaced repetition, interleaving)
Ebbinghaus forgetting curve and SRS algorithms (SM-2, FSRS, Leitner)
Bloom's taxonomy revised (remember, understand, apply, analyze, evaluate, create)
4C/ID model for complex skill training (learning tasks, supportive info, procedural info, part-task practice)
Cognitive Load Theory (intrinsic, extraneous, germane; chunking; worked examples; expertise reversal; Mayer's multimedia principles)
Deliberate practice (Ericsson)
Testing effect and feedback timing
Desirable difficulties (Bjork)
Andragogy and adult self-directed learning (Knowles)
Self-Determination Theory (autonomy, competence, relatedness) and mastery vs performance orientation
Transfer of training research (Baldwin and Ford)
Microlearning evidence (separate hype from signal)

Output format wanted:
- Per-framework brief with key evidence and mapped software features
- Prioritized roadmap combining all findings, flagged high/low impact and high/low effort
- Critique section on where common LMS features contradict evidence

## Open Questions I Need You to Answer Before Research Runs

These shape the research scope and the features that come out of it:

1. Primary learning outcome
Knowledge recall, skill transfer, or behavior change? Each needs different design. My guess: behavior change is the real goal (VAs actually follow the playbook on live calls over months), knowledge recall is the proxy we can test.

2. Research scope
Narrow on real estate sales VA training, or broad adult professional training literature applied to your context? I recommend broad with applied section.

3. Evidence depth
Peer reviewed and meta-analyses only, or include practitioner sources (Trainual, Sales Impact Academy, CIPD)? I recommend primarily academic, practitioner for implementation flavor.

4. Hard constraints
Confirm or add to these:
- VAs work async across time zones (Philippines mostly)
- English often second language
- Sessions 15 to 30 min not hours
- Mobile usage matters
- Cost per learner near zero
- Limited live instructor time from you

5. Competitive scan
Include how Thinkific, Teachable, Docebo, TalentLMS, Lessonly, MindTickle implement (or fail to implement) these principles? Useful for knowing what to copy and skip.

## Recommended Execution Order in Claude Code

Step 1: Answer the 5 questions above (do this first, takes 10 minutes)

Step 2: Run the research piece. Ask Claude Code to produce the research brief as a markdown file (research-brief.md). Use web search aggressively. This should take a real chunk of work and produce something meaty.

Step 3: Review the brief and decide which evidence-based features make it into v1 vs v2. Prioritize ruthlessly. A small platform with 3 well-implemented evidence-based features beats a bloated one with 15 half-built ones.

Step 4: Update the schema spec. Rewrite bmh-training-platform-spec.md with the final schema including content blocks and any learning-science-driven tables (flashcards, scenarios, review queues, etc). Generate actual SQL migration files ready to run in Supabase.

Step 5: Build Phase 1 (foundation)
- Initialize Vite project with the stack
- Apply Supabase migrations
- Auth flows (login, invite acceptance, forgot password)
- Protected routes with role checks

Step 6: Build Phase 2 (content model and learner experience)
- Admin: course/module/lesson CRUD with content blocks
- Learner: dashboard, course page, lesson page rendering all block types
- Video + rich text + PDF blocks working end to end
- Progress tracking at block and lesson level
- Resume where you left off

Step 7: Build Phase 3 (quizzes and assessments)
- Quiz block type with full randomization
- Pass thresholds, retake logic, prerequisite unlocks
- Flashcard block type with SRS if research supports it
- Scenario block type if research supports it

Step 8: Build Phase 4 (roles and access)
- role_groups CRUD and course_access
- RLS policies locked down
- Invite flow end to end

Step 9: Build Phase 5 (certificates and admin reporting)
- Certificate templates and PDF generation edge function
- Admin progress dashboard
- Per-user, per-course, per-quiz reports
- Audit log feed

Step 10: Build Phase 6 (assignments, optional)
- Assignment block type
- Submission UI and file upload
- Reviewer workflow

## Pricing Sanity Check (confirmed earlier)

Supabase free tier handles this until you hit real scale
Vercel free tier for hosting
Vimeo Standard $12/mo or YouTube unlisted $0 for video
Resend or Postmark for invite emails, free tier works
Total: $0 to $20/mo vs whatever Thinkific is currently charging

## Jarrad's Preferences to Carry Into Code and Copy

No em dashes anywhere
Minimal commas, dashes, hyphens in writing
No bold headers or Roman numeral headers in docs
Company name is BMH Group (not BMH Group KC)
Use Jarrad's name directly in drafted content, not placeholders
Contract documents default to PDF
Quiz answer options: no lettering, randomized positions
Illustration style (if any): thick dark red outlines on white, no fill

## Files Created in the Chat Session

bmh-training-platform-spec.md - first draft schema and feature spec, needs the content block rewrite

## What to Do First in the Terminal

Start with: "Claude, I'm continuing the BMH training platform build from a previous chat session. Read the handoff doc at [path to this file], then ask me the 5 open questions listed in the Open Questions section. After I answer, run the deep research piece and produce research-brief.md."

That kicks off the whole sequence cleanly.

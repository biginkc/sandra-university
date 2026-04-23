-- BMH Training Platform — Initial Schema
-- Creates all tables. RLS, functions, triggers, and indexes are in later migrations.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  system_role text not null default 'learner' check (system_role in ('owner', 'admin', 'learner')),
  status text not null default 'invited' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.role_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger role_groups_set_updated_at before update on public.role_groups
  for each row execute function public.set_updated_at();

create table public.user_role_groups (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_group_id uuid not null references public.role_groups(id) on delete cascade,
  primary key (user_id, role_group_id)
);

create table public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null default 'course' check (scope in ('course', 'program')),
  background_image_path text,
  body_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger certificate_templates_set_updated_at before update on public.certificate_templates
  for each row execute function public.set_updated_at();

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  is_published boolean not null default false,
  course_order_mode text not null default 'free' check (course_order_mode in ('sequential', 'free')),
  certificate_enabled boolean not null default true,
  certificate_template_id uuid references public.certificate_templates(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  is_published boolean not null default false,
  certificate_enabled boolean not null default true,
  certificate_template_id uuid references public.certificate_templates(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.program_courses (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  sort_order integer not null default 0,
  unique (program_id, course_id)
);

create table public.program_access (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  role_group_id uuid not null references public.role_groups(id) on delete cascade,
  unique (program_id, role_group_id)
);

create table public.course_access (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  role_group_id uuid not null references public.role_groups(id) on delete cascade,
  unique (course_id, role_group_id)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger modules_set_updated_at before update on public.modules
  for each row execute function public.set_updated_at();

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  randomize_questions boolean not null default true,
  randomize_answers boolean not null default true,
  questions_per_attempt integer check (questions_per_attempt is null or questions_per_attempt > 0),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  retake_cooldown_hours integer not null default 0 check (retake_cooldown_hours >= 0),
  show_correct_answers_after text not null default 'after_pass' check (show_correct_answers_after in ('never', 'after_pass', 'always')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quizzes_set_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('true_false', 'single_choice', 'multi_select')),
  explanation text,
  points integer not null default 1 check (points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null,
  submission_type text not null check (submission_type in ('file_upload', 'text', 'url')),
  requires_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger assignments_set_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  lesson_type text not null check (lesson_type in ('content', 'quiz', 'assignment')),
  quiz_id uuid references public.quizzes(id) on delete restrict,
  assignment_id uuid references public.assignments(id) on delete restrict,
  prerequisite_lesson_id uuid references public.lessons(id) on delete set null,
  prerequisite_quiz_min_score integer check (prerequisite_quiz_min_score is null or prerequisite_quiz_min_score between 0 and 100),
  is_required_for_completion boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_type_matches_fk check (
    (lesson_type = 'quiz' and quiz_id is not null and assignment_id is null)
    or (lesson_type = 'assignment' and assignment_id is not null and quiz_id is null)
    or (lesson_type = 'content' and quiz_id is null and assignment_id is null)
  )
);
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type text not null check (block_type in (
    'video','text','pdf','image','audio','download','external_link','embed','divider','callout'
  )),
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_required_for_completion boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger content_blocks_set_updated_at before update on public.content_blocks
  for each row execute function public.set_updated_at();

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  submission_file_path text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'needs_revision')),
  reviewer_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

create table public.user_block_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  block_id uuid not null references public.content_blocks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, block_id)
);

create table public.user_lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score integer check (score is null or score between 0 and 100),
  passed boolean,
  question_order jsonb not null default '[]'::jsonb,
  answer_orders jsonb not null default '{}'::jsonb,
  responses jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.user_course_resume (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  last_lesson_id uuid references public.lessons(id) on delete set null,
  last_block_id uuid references public.content_blocks(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  pdf_path text not null default 'pending',
  certificate_number text not null unique,
  unique (user_id, course_id)
);

create table public.program_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  issued_at timestamptz not null default now(),
  pdf_path text not null default 'pending',
  certificate_number text not null unique,
  unique (user_id, program_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role_group_ids uuid[] not null default '{}'::uuid[],
  system_role text not null default 'learner' check (system_role in ('owner', 'admin', 'learner')),
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

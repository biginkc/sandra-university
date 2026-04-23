-- BMH Training Platform — Row Level Security Policies
-- is_admin() is defined in the functions migration and must exist before this runs.

alter table public.profiles enable row level security;
alter table public.role_groups enable row level security;
alter table public.user_role_groups enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.programs enable row level security;
alter table public.courses enable row level security;
alter table public.program_courses enable row level security;
alter table public.program_access enable row level security;
alter table public.course_access enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.content_blocks enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.answer_options enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.user_block_progress enable row level security;
alter table public.user_lesson_completions enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.user_course_resume enable row level security;
alter table public.certificates enable row level security;
alter table public.program_certificates enable row level security;
alter table public.invites enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);
create policy profiles_shared_group_read on public.profiles
  for select using (
    exists (
      select 1 from public.user_role_groups a
      join public.user_role_groups b on a.role_group_id = b.role_group_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- role_groups
create policy role_groups_self_read on public.role_groups
  for select using (
    exists (select 1 from public.user_role_groups where user_id = auth.uid() and role_group_id = role_groups.id)
  );
create policy role_groups_admin_all on public.role_groups
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- user_role_groups
create policy user_role_groups_self_read on public.user_role_groups
  for select using (user_id = auth.uid());
create policy user_role_groups_admin_all on public.user_role_groups
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- certificate_templates (admin only)
create policy certificate_templates_admin_all on public.certificate_templates
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- programs
create policy programs_learner_read on public.programs
  for select using (is_published and public.fn_user_has_program_access(auth.uid(), id));
create policy programs_admin_all on public.programs
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- courses
create policy courses_learner_read on public.courses
  for select using (is_published and public.fn_user_has_course_access(auth.uid(), id));
create policy courses_admin_all on public.courses
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- program_courses
create policy program_courses_learner_read on public.program_courses
  for select using (public.fn_user_has_program_access(auth.uid(), program_id));
create policy program_courses_admin_all on public.program_courses
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- program_access (admin only)
create policy program_access_admin_all on public.program_access
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- course_access (admin only)
create policy course_access_admin_all on public.course_access
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- modules
create policy modules_learner_read on public.modules
  for select using (public.fn_user_has_course_access(auth.uid(), course_id));
create policy modules_admin_all on public.modules
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- lessons
create policy lessons_learner_read on public.lessons
  for select using (
    exists (
      select 1 from public.modules m
      where m.id = lessons.module_id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy lessons_admin_all on public.lessons
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- content_blocks
create policy content_blocks_learner_read on public.content_blocks
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = content_blocks.lesson_id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy content_blocks_admin_all on public.content_blocks
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- quizzes
create policy quizzes_learner_read on public.quizzes
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.quiz_id = quizzes.id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy quizzes_admin_all on public.quizzes
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- questions
create policy questions_learner_read on public.questions
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.quiz_id = questions.quiz_id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy questions_admin_all on public.questions
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- answer_options
-- Learners can read options (required to render choices). The is_correct flag should be
-- stripped at the API layer or via a view before exposure. Scoring runs server-side.
create policy answer_options_learner_read on public.answer_options
  for select using (
    exists (
      select 1 from public.questions q
      join public.lessons l on l.quiz_id = q.quiz_id
      join public.modules m on m.id = l.module_id
      where q.id = answer_options.question_id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy answer_options_admin_all on public.answer_options
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- assignments
create policy assignments_learner_read on public.assignments
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.assignment_id = assignments.id
        and public.fn_user_has_course_access(auth.uid(), m.course_id)
    )
  );
create policy assignments_admin_all on public.assignments
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- assignment_submissions
create policy assignment_submissions_self_read on public.assignment_submissions
  for select using (user_id = auth.uid());
create policy assignment_submissions_self_insert on public.assignment_submissions
  for insert with check (user_id = auth.uid());
create policy assignment_submissions_admin_read on public.assignment_submissions
  for select using (public.is_admin(auth.uid()));
create policy assignment_submissions_admin_update on public.assignment_submissions
  for update using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- user_block_progress
create policy user_block_progress_self_insert on public.user_block_progress
  for insert with check (user_id = auth.uid());
create policy user_block_progress_self_read on public.user_block_progress
  for select using (user_id = auth.uid());
create policy user_block_progress_admin_read on public.user_block_progress
  for select using (public.is_admin(auth.uid()));

-- user_lesson_completions (inserts come from security definer triggers)
create policy user_lesson_completions_self_read on public.user_lesson_completions
  for select using (user_id = auth.uid());
create policy user_lesson_completions_admin_read on public.user_lesson_completions
  for select using (public.is_admin(auth.uid()));

-- user_quiz_attempts
create policy user_quiz_attempts_self_insert on public.user_quiz_attempts
  for insert with check (user_id = auth.uid());
create policy user_quiz_attempts_self_update on public.user_quiz_attempts
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_quiz_attempts_self_read on public.user_quiz_attempts
  for select using (user_id = auth.uid());
create policy user_quiz_attempts_admin_read on public.user_quiz_attempts
  for select using (public.is_admin(auth.uid()));

-- user_course_resume
create policy user_course_resume_self_all on public.user_course_resume
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_course_resume_admin_read on public.user_course_resume
  for select using (public.is_admin(auth.uid()));

-- certificates
create policy certificates_self_read on public.certificates
  for select using (user_id = auth.uid());
create policy certificates_admin_all on public.certificates
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- program_certificates
create policy program_certificates_self_read on public.program_certificates
  for select using (user_id = auth.uid());
create policy program_certificates_admin_all on public.program_certificates
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- invites (admin only; public acceptance uses a SECURITY DEFINER RPC, not direct table read)
create policy invites_admin_all on public.invites
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- audit_log (admin read; inserts come from triggers)
create policy audit_log_admin_read on public.audit_log
  for select using (public.is_admin(auth.uid()));

-- BMH Training Platform — Performance Indexes

create index idx_user_role_groups_user on public.user_role_groups (user_id);
create index idx_user_role_groups_group on public.user_role_groups (role_group_id);

create index idx_program_courses_program on public.program_courses (program_id, sort_order);
create index idx_program_courses_course on public.program_courses (course_id);

create index idx_program_access_program on public.program_access (program_id);
create index idx_program_access_group on public.program_access (role_group_id);
create index idx_course_access_course on public.course_access (course_id);
create index idx_course_access_group on public.course_access (role_group_id);

create index idx_modules_course on public.modules (course_id, sort_order);

create index idx_lessons_module on public.lessons (module_id, sort_order);
create index idx_lessons_quiz on public.lessons (quiz_id) where quiz_id is not null;
create index idx_lessons_assignment on public.lessons (assignment_id) where assignment_id is not null;
create index idx_lessons_prereq on public.lessons (prerequisite_lesson_id) where prerequisite_lesson_id is not null;

create index idx_content_blocks_lesson on public.content_blocks (lesson_id, sort_order);

create index idx_questions_quiz on public.questions (quiz_id, sort_order);
create index idx_answer_options_question on public.answer_options (question_id, sort_order);

create index idx_assignment_submissions_user on public.assignment_submissions (user_id);
create index idx_assignment_submissions_lesson on public.assignment_submissions (lesson_id);
create index idx_assignment_submissions_pending on public.assignment_submissions (status)
  where status <> 'approved';

create index idx_user_block_progress_user on public.user_block_progress (user_id);
create index idx_user_block_progress_block on public.user_block_progress (block_id);

create index idx_user_lesson_completions_user on public.user_lesson_completions (user_id);
create index idx_user_lesson_completions_lesson on public.user_lesson_completions (lesson_id);

create index idx_user_quiz_attempts_user on public.user_quiz_attempts (user_id);
create index idx_user_quiz_attempts_quiz on public.user_quiz_attempts (quiz_id);
create index idx_user_quiz_attempts_lesson on public.user_quiz_attempts (lesson_id);
create index idx_user_quiz_attempts_user_lesson_best on public.user_quiz_attempts (user_id, lesson_id, score desc)
  where passed = true;

create index idx_user_course_resume_user on public.user_course_resume (user_id);

create index idx_certificates_user on public.certificates (user_id);
create index idx_program_certificates_user on public.program_certificates (user_id);

create index idx_invites_token on public.invites (token);
create index idx_invites_pending_email on public.invites (email) where accepted_at is null;

create index idx_audit_log_user on public.audit_log (user_id, created_at desc);
create index idx_audit_log_entity on public.audit_log (entity_type, entity_id, created_at desc);
create index idx_audit_log_created on public.audit_log (created_at desc);

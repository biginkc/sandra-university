-- BMH Training Platform — Development Seed Data
-- Run this ONLY in development. After sign-up, an admin must manually set
-- the owner profile's system_role to 'owner' (it defaults to 'learner').

insert into public.role_groups (name, description) values
  ('Appointment Setters', 'Agents who book appointments with sellers and buyers'),
  ('Lead Managers', 'Agents responsible for managing lead flow and qualification'),
  ('Acquisitions', 'Agents focused on acquiring new listings and clients')
on conflict (name) do nothing;

insert into public.certificate_templates (name, scope, body_html) values
  (
    'Default Course Certificate',
    'course',
    '<div style="text-align:center;padding:48px;font-family:Georgia,serif">'
    '<h1 style="font-size:36px;margin-bottom:8px">Certificate of Completion</h1>'
    '<p style="font-size:18px">This certifies that</p>'
    '<h2 style="font-size:28px;margin:16px 0">{{full_name}}</h2>'
    '<p style="font-size:18px">has completed the course</p>'
    '<h3 style="font-size:22px;margin:16px 0">{{title}}</h3>'
    '<p style="font-size:16px">on {{completion_date}}</p>'
    '<p style="font-size:14px;margin-top:32px;color:#666">Certificate number: {{certificate_number}}</p>'
    '<p style="font-size:14px;color:#666">Issued by BMH Group</p>'
    '</div>'
  ),
  (
    'Default Program Certificate',
    'program',
    '<div style="text-align:center;padding:48px;font-family:Georgia,serif">'
    '<h1 style="font-size:36px;margin-bottom:8px">Program Completion Certificate</h1>'
    '<p style="font-size:18px">This certifies that</p>'
    '<h2 style="font-size:28px;margin:16px 0">{{full_name}}</h2>'
    '<p style="font-size:18px">has completed the program</p>'
    '<h3 style="font-size:22px;margin:16px 0">{{title}}</h3>'
    '<p style="font-size:16px">on {{completion_date}}</p>'
    '<p style="font-size:14px;margin-top:32px;color:#666">Certificate number: {{certificate_number}}</p>'
    '<p style="font-size:14px;color:#666">Issued by BMH Group</p>'
    '</div>'
  );

-- Sample content is best created through the admin UI after auth is wired up.
-- Uncomment and adapt below if you want scaffold content immediately for testing.

-- do $$
-- declare
--   v_prog_id uuid;
--   v_course_id uuid;
--   v_module_id uuid;
--   v_lesson_id uuid;
--   v_quiz_id uuid;
--   v_question_id uuid;
-- begin
--   insert into public.programs (title, description, is_published, course_order_mode)
--   values ('Appointment Setter Onboarding', 'Core onboarding program for appointment setters', true, 'sequential')
--   returning id into v_prog_id;
--
--   insert into public.courses (title, description, is_published)
--   values ('Phone Basics', 'Fundamentals of phone calls with sellers', true)
--   returning id into v_course_id;
--
--   insert into public.program_courses (program_id, course_id, sort_order)
--   values (v_prog_id, v_course_id, 0);
--
--   insert into public.modules (course_id, title, sort_order)
--   values (v_course_id, 'Getting Started', 0)
--   returning id into v_module_id;
--
--   insert into public.lessons (module_id, title, lesson_type, sort_order)
--   values (v_module_id, 'Welcome', 'content', 0)
--   returning id into v_lesson_id;
--
--   insert into public.content_blocks (lesson_id, block_type, content, sort_order) values
--     (v_lesson_id, 'text',
--      jsonb_build_object('html', '<p>Welcome to the program.</p>'),
--      0);
--
--   insert into public.quizzes (title, passing_score) values ('Phone Basics Quiz', 80)
--   returning id into v_quiz_id;
--
--   insert into public.questions (quiz_id, question_text, question_type, sort_order)
--   values (v_quiz_id, 'Sample true/false question.', 'true_false', 0)
--   returning id into v_question_id;
--
--   insert into public.answer_options (question_id, option_text, is_correct, sort_order) values
--     (v_question_id, 'True', true, 0),
--     (v_question_id, 'False', false, 1);
--
--   insert into public.lessons (module_id, title, lesson_type, quiz_id, sort_order)
--   values (v_module_id, 'Phone Basics Quiz', 'quiz', v_quiz_id, 1);
--
--   insert into public.program_access (program_id, role_group_id)
--   select v_prog_id, id from public.role_groups where name = 'Appointment Setters';
-- end $$;

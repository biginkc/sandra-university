-- BMH Training Platform — Business Logic Functions and Triggers

-- On auth.users insert, create matching profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin helper (used by RLS and functions below)
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and system_role in ('owner', 'admin')
  );
$$;

create or replace function public.fn_user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(p_user_id)
  or exists (
    select 1
    from public.user_role_groups urg
    join public.program_access pa on pa.role_group_id = urg.role_group_id
    where urg.user_id = p_user_id and pa.program_id = p_program_id
  );
$$;

create or replace function public.fn_user_has_course_access(p_user_id uuid, p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(p_user_id)
  or exists (
    select 1
    from public.user_role_groups urg
    join public.course_access ca on ca.role_group_id = urg.role_group_id
    where urg.user_id = p_user_id and ca.course_id = p_course_id
  )
  or exists (
    select 1
    from public.user_role_groups urg
    join public.program_access pa on pa.role_group_id = urg.role_group_id
    join public.program_courses pc on pc.program_id = pa.program_id
    where urg.user_id = p_user_id and pc.course_id = p_course_id
  );
$$;

create or replace function public.fn_lesson_is_complete(p_user_id uuid, p_lesson_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  select lesson_type into v_type from public.lessons where id = p_lesson_id;
  if v_type is null then
    return false;
  end if;

  if v_type = 'content' then
    return not exists (
      select 1 from public.content_blocks cb
      where cb.lesson_id = p_lesson_id
        and cb.is_required_for_completion = true
        and not exists (
          select 1 from public.user_block_progress ubp
          where ubp.user_id = p_user_id and ubp.block_id = cb.id
        )
    );
  elsif v_type = 'quiz' then
    return exists (
      select 1 from public.user_quiz_attempts uqa
      where uqa.user_id = p_user_id and uqa.lesson_id = p_lesson_id and uqa.passed = true
    );
  elsif v_type = 'assignment' then
    return exists (
      select 1 from public.assignment_submissions s
      where s.user_id = p_user_id and s.lesson_id = p_lesson_id and s.status = 'approved'
    );
  end if;
  return false;
end;
$$;

create or replace function public.fn_course_is_complete(p_user_id uuid, p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.modules m
    join public.lessons l on l.module_id = m.id
    where m.course_id = p_course_id
      and l.is_required_for_completion = true
      and not exists (
        select 1 from public.user_lesson_completions ulc
        where ulc.user_id = p_user_id and ulc.lesson_id = l.id
      )
  );
$$;

create or replace function public.fn_course_completion_percent(p_user_id uuid, p_course_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with req as (
    select l.id
    from public.modules m
    join public.lessons l on l.module_id = m.id
    where m.course_id = p_course_id and l.is_required_for_completion = true
  ),
  total as (select count(*)::numeric n from req),
  done as (
    select count(*)::numeric n
    from req
    join public.user_lesson_completions ulc on ulc.lesson_id = req.id and ulc.user_id = p_user_id
  )
  select case
    when (select n from total) = 0 then 0
    else round(((select n from done) / (select n from total)) * 100)::integer
  end;
$$;

create or replace function public.fn_program_completion_percent(p_user_id uuid, p_program_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with cip as (
    select pc.course_id from public.program_courses pc where pc.program_id = p_program_id
  ),
  total as (select count(*)::numeric n from cip),
  done as (
    select count(*)::numeric n
    from cip
    where public.fn_course_is_complete(p_user_id, cip.course_id)
  )
  select case
    when (select n from total) = 0 then 0
    else round(((select n from done) / (select n from total)) * 100)::integer
  end;
$$;

create or replace function public.fn_lesson_is_unlocked(p_user_id uuid, p_lesson_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prereq_id uuid;
  v_min_score integer;
  v_prereq_type text;
  v_course_id uuid;
  v_best_score integer;
begin
  select l.prerequisite_lesson_id, l.prerequisite_quiz_min_score, m.course_id
    into v_prereq_id, v_min_score, v_course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id;

  if public.is_admin(p_user_id) then
    return true;
  end if;

  -- Sequential program gating: every sequential program containing this course
  -- requires all prior courses in that program to be complete.
  if exists (
    select 1
    from public.programs p
    join public.program_courses pc_current on pc_current.program_id = p.id and pc_current.course_id = v_course_id
    join public.program_courses pc_prior on pc_prior.program_id = p.id and pc_prior.sort_order < pc_current.sort_order
    where p.course_order_mode = 'sequential'
      and not public.fn_course_is_complete(p_user_id, pc_prior.course_id)
  ) then
    return false;
  end if;

  if v_prereq_id is null then
    return true;
  end if;

  if not exists (
    select 1 from public.user_lesson_completions
    where user_id = p_user_id and lesson_id = v_prereq_id
  ) then
    return false;
  end if;

  if v_min_score is not null then
    select lesson_type into v_prereq_type from public.lessons where id = v_prereq_id;
    if v_prereq_type = 'quiz' then
      select max(score) into v_best_score
      from public.user_quiz_attempts
      where user_id = p_user_id and lesson_id = v_prereq_id and passed = true;
      if v_best_score is null or v_best_score < v_min_score then
        return false;
      end if;
    end if;
  end if;

  return true;
end;
$$;

create or replace function public.fn_next_certificate_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from now());
  v_next integer;
begin
  select coalesce(
    max(
      case when certificate_number ~ ('^' || p_prefix || '-' || v_year || '-\d+$')
        then (regexp_replace(certificate_number, '^' || p_prefix || '-' || v_year || '-', ''))::integer
        else 0
      end
    ),
    0
  ) + 1
  into v_next
  from (
    select certificate_number from public.certificates
    union all
    select certificate_number from public.program_certificates
  ) all_certs;
  return p_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

create or replace function public.fn_issue_course_certificate_if_eligible(p_user_id uuid, p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_number text;
begin
  if exists (select 1 from public.certificates where user_id = p_user_id and course_id = p_course_id) then
    return;
  end if;

  select certificate_enabled into v_enabled from public.courses where id = p_course_id;
  if coalesce(v_enabled, false) = false then
    return;
  end if;

  if not public.fn_course_is_complete(p_user_id, p_course_id) then
    return;
  end if;

  v_number := public.fn_next_certificate_number('BMH-C');
  insert into public.certificates (user_id, course_id, certificate_number)
  values (p_user_id, p_course_id, v_number);

  insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'course_certificate_issued', 'course', p_course_id,
          jsonb_build_object('certificate_number', v_number));
end;
$$;

create or replace function public.fn_issue_program_certificate_if_eligible(p_user_id uuid, p_program_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_number text;
  v_all_complete boolean;
begin
  if exists (select 1 from public.program_certificates where user_id = p_user_id and program_id = p_program_id) then
    return;
  end if;

  select certificate_enabled into v_enabled from public.programs where id = p_program_id;
  if coalesce(v_enabled, false) = false then
    return;
  end if;

  select not exists (
    select 1 from public.program_courses pc
    where pc.program_id = p_program_id
      and not public.fn_course_is_complete(p_user_id, pc.course_id)
  ) into v_all_complete;
  if not v_all_complete then
    return;
  end if;

  v_number := public.fn_next_certificate_number('BMH-P');
  insert into public.program_certificates (user_id, program_id, certificate_number)
  values (p_user_id, p_program_id, v_number);

  insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'program_certificate_issued', 'program', p_program_id,
          jsonb_build_object('certificate_number', v_number));
end;
$$;

-- Trigger: after insert on user_block_progress — maybe complete lesson, update resume, fire cert checks
create or replace function public.trg_after_block_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson_id uuid;
  v_course_id uuid;
  v_program_rec record;
begin
  select l.id, m.course_id into v_lesson_id, v_course_id
  from public.content_blocks cb
  join public.lessons l on l.id = cb.lesson_id
  join public.modules m on m.id = l.module_id
  where cb.id = new.block_id;

  insert into public.user_course_resume (user_id, course_id, last_lesson_id, last_block_id, updated_at)
  values (new.user_id, v_course_id, v_lesson_id, new.block_id, now())
  on conflict (user_id, course_id) do update
    set last_lesson_id = excluded.last_lesson_id,
        last_block_id = excluded.last_block_id,
        updated_at = excluded.updated_at;

  if public.fn_lesson_is_complete(new.user_id, v_lesson_id) then
    insert into public.user_lesson_completions (user_id, lesson_id)
    values (new.user_id, v_lesson_id)
    on conflict (user_id, lesson_id) do nothing;

    insert into public.audit_log (user_id, action, entity_type, entity_id)
    values (new.user_id, 'lesson_completed', 'lesson', v_lesson_id);

    perform public.fn_issue_course_certificate_if_eligible(new.user_id, v_course_id);
    for v_program_rec in
      select program_id from public.program_courses where course_id = v_course_id
    loop
      perform public.fn_issue_program_certificate_if_eligible(new.user_id, v_program_rec.program_id);
    end loop;
  end if;

  return new;
end;
$$;
create trigger trg_user_block_progress_after_insert
  after insert on public.user_block_progress
  for each row execute function public.trg_after_block_progress();

-- Trigger: after insert/update on user_quiz_attempts when passed = true
create or replace function public.trg_after_quiz_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_program_rec record;
begin
  if new.passed is not true then
    return new;
  end if;

  select m.course_id into v_course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = new.lesson_id;

  insert into public.user_course_resume (user_id, course_id, last_lesson_id, updated_at)
  values (new.user_id, v_course_id, new.lesson_id, now())
  on conflict (user_id, course_id) do update
    set last_lesson_id = excluded.last_lesson_id,
        updated_at = excluded.updated_at;

  if public.fn_lesson_is_complete(new.user_id, new.lesson_id) then
    insert into public.user_lesson_completions (user_id, lesson_id)
    values (new.user_id, new.lesson_id)
    on conflict (user_id, lesson_id) do nothing;

    insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
    values (new.user_id, 'quiz_passed', 'lesson', new.lesson_id,
            jsonb_build_object('score', new.score));

    perform public.fn_issue_course_certificate_if_eligible(new.user_id, v_course_id);
    for v_program_rec in
      select program_id from public.program_courses where course_id = v_course_id
    loop
      perform public.fn_issue_program_certificate_if_eligible(new.user_id, v_program_rec.program_id);
    end loop;
  end if;

  return new;
end;
$$;
create trigger trg_user_quiz_attempts_after_change
  after insert or update of passed on public.user_quiz_attempts
  for each row execute function public.trg_after_quiz_attempt();

-- Trigger: after insert/update on assignment_submissions when status = 'approved'
create or replace function public.trg_after_assignment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_program_rec record;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select m.course_id into v_course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = new.lesson_id;

  insert into public.user_course_resume (user_id, course_id, last_lesson_id, updated_at)
  values (new.user_id, v_course_id, new.lesson_id, now())
  on conflict (user_id, course_id) do update
    set last_lesson_id = excluded.last_lesson_id,
        updated_at = excluded.updated_at;

  if public.fn_lesson_is_complete(new.user_id, new.lesson_id) then
    insert into public.user_lesson_completions (user_id, lesson_id)
    values (new.user_id, new.lesson_id)
    on conflict (user_id, lesson_id) do nothing;

    insert into public.audit_log (user_id, action, entity_type, entity_id)
    values (new.user_id, 'assignment_approved', 'lesson', new.lesson_id);

    perform public.fn_issue_course_certificate_if_eligible(new.user_id, v_course_id);
    for v_program_rec in
      select program_id from public.program_courses where course_id = v_course_id
    loop
      perform public.fn_issue_program_certificate_if_eligible(new.user_id, v_program_rec.program_id);
    end loop;
  end if;

  return new;
end;
$$;
create trigger trg_assignment_submissions_after_approval
  after insert or update of status on public.assignment_submissions
  for each row execute function public.trg_after_assignment_approved();

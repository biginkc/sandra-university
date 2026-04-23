-- BMH Training Platform — Storage bucket for content uploads
-- Private bucket; admin-only writes; any authenticated learner can read.
-- File-size ceiling matches Thinkific's 2 GB per video.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content',
  'content',
  false,
  (2::bigint * 1024 * 1024 * 1024),
  array[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-m4a',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/zip',
    'application/octet-stream',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins (owner/admin system_role) can manage every object.
create policy "content_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'content' and public.is_admin(auth.uid()))
  with check (bucket_id = 'content' and public.is_admin(auth.uid()));

-- Any authenticated user (learner) can read content. Course/lesson-level
-- access gates what content they actually reach via the app; the bucket
-- is broader but only useful paired with the lesson that references it.
create policy "content_authenticated_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'content');

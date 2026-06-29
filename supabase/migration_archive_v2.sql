-- =============================================================
-- The Archive of Human Goodness — Phase 2: Storage Bucket
-- Run in Supabase SQL Editor
-- =============================================================

-- Create the archive-images storage bucket (public, 5MB per file limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'archive-images',
  'archive-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Allow anyone to upload
create policy "Public can upload archive images"
  on storage.objects for insert
  with check (bucket_id = 'archive-images');

-- Allow anyone to read (bucket is public anyway)
create policy "Public can read archive images"
  on storage.objects for select
  using (bucket_id = 'archive-images');

-- Service role can delete (for admin cleanup later)
create policy "Service role can delete archive images"
  on storage.objects for delete
  using (bucket_id = 'archive-images');

-- Add approved_at timestamp and is_featured flag
alter table stories
  add column if not exists approved_at timestamptz,
  add column if not exists is_featured boolean not null default false;

-- Update status constraint to include skipped and published
alter table stories drop constraint if exists stories_status_check;
alter table stories add constraint stories_status_check
  check (status in ('pending', 'approved', 'skipped', 'published', 'rejected'));

-- Only one story can be featured at a time
create unique index if not exists stories_one_featured
  on stories (is_featured) where is_featured = true;

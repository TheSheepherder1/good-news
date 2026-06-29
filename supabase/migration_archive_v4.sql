-- Admin can hand-pick which live archive story appears on the home page hero
alter table archive_stories
  add column if not exists is_home_featured boolean not null default false;

-- Partial index — only one row ever has this true, so the scan is instant
create index if not exists archive_stories_home_featured_idx
  on archive_stories(is_home_featured)
  where is_home_featured = true;

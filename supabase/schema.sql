-- Good News: stories table
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  url text not null unique,
  source text not null,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ai_score integer,        -- 1-10 positivity score from LLM
  ai_reason text,          -- LLM's one-line reason for score/rejection
  image_url text,
  category text
);

-- Index for fast admin queue queries
create index if not exists stories_status_fetched on stories (status, fetched_at desc);
-- Index for public feed (approved, by date)
create index if not exists stories_approved_published on stories (status, published_at desc) where status = 'approved';

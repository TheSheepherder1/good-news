-- Reader submissions: "Public Created" admin tab
-- Combines reader-written articles and reader URL recommendations
create table if not exists reader_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('article', 'url')),
  status text not null default 'new' check (status in ('new', 'approved', 'dismissed')),
  submitter_name text not null,
  submitter_email text,
  title text,
  summary text,
  content text,
  image_url text,
  attested boolean not null default false,
  url text,
  reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table reader_submissions enable row level security;
-- No policies created — table is fully locked to anon/authenticated roles.
-- All access (insert from public form, read/update from admin) goes through
-- supabaseAdmin (service role key), same pattern as `stories`.

create index if not exists reader_submissions_status on reader_submissions (status, created_at);

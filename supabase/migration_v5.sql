-- Attestation log: proof that a reader agreed to the Share-a-Story
-- submission terms when writing an article (date, story title, name,
-- email). Retained for 7 years, then purged by /api/cleanup.
create table if not exists submission_attestations (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  story_title text not null,
  submitter_name text not null,
  submitter_email text
);

alter table submission_attestations enable row level security;
-- No policies — fully locked to anon/authenticated roles, all access via
-- supabaseAdmin (service role key), same pattern as reader_submissions.

-- Add archive_story_id to submission_attestations so archive story agreements
-- are recorded in the same table as reader_submission agreements.
-- submission_id is null for archive entries; archive_story_id is null for
-- reader_submission entries. Both are retained for 7 years (purged by /api/cleanup).

alter table submission_attestations
  add column if not exists archive_story_id uuid;

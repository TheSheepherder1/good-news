-- story_title is redundant now that submission_attestations.submission_id
-- links back to reader_submissions (which has the title).
alter table submission_attestations drop column if exists story_title;

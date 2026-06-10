-- Link each attestation record back to its reader_submissions row, so an
-- attestation can be looked up by its submission's UUID. No foreign key —
-- attestations are kept independent of reader_submissions/stories rows.
alter table submission_attestations add column if not exists submission_id uuid;

create index if not exists submission_attestations_submission_id on submission_attestations (submission_id);

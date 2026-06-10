-- Rich text formatting for reader-submitted articles
-- 'rich' marks stories whose `summary` uses the extended markdown subset
-- (**bold**, *italic*, __underline__, - bullets) and whose `content` is
-- sanitized HTML (bold/italic/underline/bullets/font-size).
alter table stories add column if not exists content_format text not null default 'text' check (content_format in ('text', 'rich'));

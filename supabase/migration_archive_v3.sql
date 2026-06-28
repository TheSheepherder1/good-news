-- Enable trigram similarity extension (usually already available in Supabase)
create extension if not exists pg_trgm;

-- Fuzzy author name search for the archive
-- Returns non-anonymous authors matching the query by exact substring OR trigram similarity
create or replace function search_archive_authors(query text)
returns table(name text, story_count bigint)
language sql
security definer
as $$
  select
    author_name as name,
    count(*)::bigint as story_count
  from archive_stories
  where
    status = 'live'
    and is_anonymous = false
    and (
      author_name ilike '%' || query || '%'
      or similarity(author_name, query) > 0.25
    )
  group by author_name
  order by
    -- exact/partial matches first, then fuzzy
    case when author_name ilike '%' || query || '%' then 0 else 1 end,
    similarity(author_name, query) desc
  limit 8;
$$;

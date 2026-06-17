-- Add likes counter to stories
alter table stories add column if not exists likes integer not null default 0;

-- Atomic increment function (prevents race conditions when two people like at once)
create or replace function increment_story_likes(story_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_likes integer;
begin
  update stories set likes = likes + 1 where id = story_id returning likes into new_likes;
  return new_likes;
end;
$$;

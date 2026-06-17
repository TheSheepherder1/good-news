-- Atomic decrement for unlike (floors at 0)
create or replace function decrement_story_likes(story_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_likes integer;
begin
  update stories set likes = greatest(0, likes - 1) where id = story_id returning likes into new_likes;
  return new_likes;
end;
$$;

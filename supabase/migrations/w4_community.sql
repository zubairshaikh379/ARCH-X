-- ─────────────────────────────────────────────────────────────────────────────
-- ARCH-X  W4 — Community board wiring
-- Run in the Supabase SQL Editor after the ULTIMATE MIGRATION schema.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Category column (UI filters ideas by category; not in base schema).
alter table public.community_ideas add column if not exists category text default 'Feature';

-- 2. Atomic upvote toggle.
-- community_votes RLS is "own rows only", so vote COUNTS can't be tallied
-- client-side (a voter can't read others' vote rows). This SECURITY DEFINER
-- function toggles the caller's vote and maintains community_ideas.votes as the
-- authoritative public count, returning the new total.
create or replace function public.toggle_vote(p_idea uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  already boolean;
  newcount integer;
begin
  select exists(
    select 1 from community_votes
    where user_id = auth.uid() and idea_id = p_idea
  ) into already;

  if already then
    delete from community_votes where user_id = auth.uid() and idea_id = p_idea;
    update community_ideas set votes = greatest(0, votes - 1)
      where id = p_idea returning votes into newcount;
  else
    insert into community_votes (user_id, idea_id) values (auth.uid(), p_idea);
    update community_ideas set votes = votes + 1
      where id = p_idea returning votes into newcount;
  end if;

  return coalesce(newcount, 0);
end;
$$;

grant execute on function public.toggle_vote(uuid) to authenticated;

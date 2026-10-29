-- Pinpoint ranked leaderboard migration, deployed 2026-10-30.
-- Each entry represents one REAL player and their highest authenticated run.
-- A ghost uses a recorded `taps` timeline; it never becomes its own score row.
-- SECURITY INVOKER ensures the existing scores table RLS still applies.
-- Keep original rows for player history and self/opponent replay recordings.

create or replace view public.pinpoint_daily_bests
with (security_invoker = true)
as
select distinct on (day_key, player_id)
  id, day_key, player_id, name, score, taps, created_at
from public.scores
where verified = true
order by day_key, player_id, score desc, created_at asc, id asc;

create or replace view public.pinpoint_alltime_bests
with (security_invoker = true)
as
select distinct on (player_id)
  id, day_key, player_id, name, score, taps, created_at
from public.scores
where verified = true
order by player_id, score desc, created_at asc, id asc;

revoke all on public.pinpoint_daily_bests from public;
revoke all on public.pinpoint_alltime_bests from public;
grant select on public.pinpoint_daily_bests to anon, authenticated;
grant select on public.pinpoint_alltime_bests to anon, authenticated;

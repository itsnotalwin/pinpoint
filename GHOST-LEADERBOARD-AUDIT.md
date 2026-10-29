# Pinpoint — Leaderboards and Replay Ghosts
Status: **unique-player leaderboard and ghost toggle implemented**; replay fidelity audit ongoing.
Verified: 2026-10-30.

## What was wrong
The old TODAY and ALL-TIME tables queried `public.scores` ordered by run score. That meant one person could appear once **per run**, creating the false impression of extra players or ghosts on the board. Verified database sample showed **7 authenticated runs by 2 real players** on the same challenge day, with 5 duplicate lines.

Ghosts are client-side playback representations of recordings in `scores.taps`. The ghost simulation **does not call the score submission function**. Ghosts are not separate Supabase accounts. The leaderboard duplicates were from repeated genuine submissions by the same player, not ghost score inserts.

## Changes applied
- Supabase migration `pinpoint_unique_player_leaderboards` creates `public.pinpoint_daily_bests` and `public.pinpoint_alltime_bests` as `security_invoker=true` views. Each selects the highest verified run for each real player (per day or all time); ties use first achievement timestamp and stable row ID.
- Server data is preserved: no score deletion, and saved tap timelines remain available on the player's best ranked run. View SELECT privileges granted to `anon,authenticated`, with original `public.scores` RLS still governing rows.
- `index.html` now reads these views for ranked rows and nearest-rival selection; the label clarifies `ONE BEST SCORE PER PLAYER · GHOST REPLAYS DO NOT RANK`.
- User-controlled `GHOSTS · ON/OFF` toggle is available on the menu and leaderboard, stores `pp_ghosts_enabled` in browser local storage, and suppresses replay rendering and rival callouts when OFF. Switching back ON restores opponent/personal-best replay when available.
- Archived `pp_rival` entries without a real, non-self `player_id` are ignored, to prevent an old same-person run masquerading as a challenger.

## Evidence / caveats
Supabase SQL after migration: 7 real verified runs -> **2 daily and 2 all-time leaderboard entries**, with 2 daily best runs containing saved tap recordings. Both views were confirmed `security_invoker=true`, and SELECT grants were verified. Security Advisor retained preexisting warnings on the name-claim RPC / anonymous RLS / leaked password protection; no new view-specific warning was reported.

**Important:** Current ghost physics are only an approximate visual tap-timeline overlay, not a fully independent replay engine. In `ghostLand()`, collision uses the active player's `disc.theta`, not a separate replay wheel. `stageConf()` uses day-key seed, but initial wheel orientation is influenced by live menu rotation. Do not call this a fully accurate replay until the engine state can be reproduced independently and replay checks pass.

**Known follow-ups:** current score submission authenticity is not server-replay-validated (authenticated ownership only). Date/day keys currently use browser local dates; unify daily seed/time to UTC when implementing streak and crown rewards. Ranks for players outside the first 50 entries show unranked instead of exact placement. A real deployed iPhone+desktop interactive smoke test remains required; static JS validation and SQL view checks alone cannot prove a perfect rendering.

## Non-destructive QA checklist
- Confirm leaderboard shows two distinct real players even after one player runs repeatedly.
- Toggle ghosts OFF, start and finish a run, see no ghost pins or rival score callouts. Leaderboards still show real player bests.
- Toggle ON, play again, confirm saved rival/own best appears only as an on-wheel challenge.
- Reboot PWA and confirm ON/OFF state persisted.
- Test no opponent, late-arriving opponent, equal score tie, scrolling leaderboard on small phones, network outage, queued sync, and recovery identity.
- Verify the scoreboard never includes fake ghost-only entries, no lost runs, and no corrupted `pp_best` or local `pp_selfghost`.

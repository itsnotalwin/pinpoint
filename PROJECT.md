# Pinpoint — project context

## Purpose
A mobile-friendly one-tap timing game and installable, offline-capable PWA, with optional asynchronous multiplayer via daily/all-time scoreboards and rival replay ghosts.

## Architecture
- `index.html`: self-contained UI, deterministic game loop, player identity, score REST calls, ghost replay.
- `config.js`: public Supabase project URL + publishable API key (**configured** with dedicated Pinpoint Supabase public URL and publishable key).
- `supabase-setup.sql`: leaderboard table, indexes, RLS and anonymous read/insert grants.
- `sw.js`: cache-first app shell; increase cache version when app files change.
- `manifest.json`, icon files: PWA installation.
- `SETUP.md`: authoritative multiplayer and deployment instructions.

Multiplayer is **asynchronous**, not real-time shared sessions; ghosts use saved tap timelines. No server credentials belong in this public repository.

## Run, verify, deploy
Open via HTTPS on a static web host (GitHub Pages branch `main`, root; see `README.md`). For offline verification, install as a PWA and retest after a cache bump. For online verification, create a **dedicated** Supabase project, run `supabase-setup.sql`, and populate `config.js` with only a publishable key. Check a completed run inserts one score, test today/all-time list, test with a second browser/device, and test offline retry and a ghost replay.

## Current verified state
- Source on `main` inspected 2026-10-29. The multiplayer client, setup guide, and SQL schema exist.
- Commit `77427b971f9ce262e984bc67a2c801f677a51f09` finalized publishable-key header compatibility, explicit anon grants, setup documentation, and PWA cache `pinpoint-v1.2.3`. Changes were verified by remote file reads.
- Dedicated Supabase project `sffpyvxbgmhepftxoesy` was created in `itsnotalwin's Org` on 2026-10-29 (eu-west-1; quoted $0/month). Scores schema migration succeeded, RLS/read/insert/sequence permissions verified, and security advisors returned no findings. `config.js` is connected and `sw.js` is `pinpoint-v1.2.4`. **Live browser, score submission, and two-player ghost testing remain unverified.**
- GitHub Pages/browser deployment has not been verified in this setup session.

## Next action
Verify GitHub Pages publishes `main`, then complete real browser score submission, two-player leaderboard/ghost checks, offline retry and daily reset behavior.

## Future hardening
Public, unauthenticated submissions are vulnerable to fake scores despite numeric sanity limits. Consider server-side replay validation and rate limits before competitive/public launch. Displayed rank calculation should also be audited for players outside the top results.

## Player identities milestone (2026-10-29)
- Deployed code commit `72e0972ec3223efeb10229b5805c1b59fcab9501`: Supabase anonymous sign-in, unique username claim/30-day rename flow, protected score submission and email-link/recovery UI.
- Database migration `pinpoint_authenticated_player_identities` succeeded: `pinpoint_profiles`, unique uppercase-name index, rename RPC, verified-only score RLS and authenticated score ownership trigger.
- Three existing unauthenticated scores preserved as unverified, not assigned to anyone and hidden from new ranked boards; existing local bests, skins and self-ghosts untouched.
- New cache `pinpoint-v1.2.5`. JS syntax parse passed. SQL permissions verified including column-level INSERT grants and no permission to set `verified`.
- **User-confirmed 2026-10-29:** Anonymous Sign-Ins enabled and GitHub Pages Site URL/redirect added in Supabase dashboard; dashboard configuration not independently readable using this connector. **Verified database:** active and healthy, 0 auth users/0 claimed names/0 verified scores, with 3 historical scores safely preserved; anon INSERT blocked, authenticated score INSERT permitted via column grants. **Outstanding:** first live account creation/name claim, Pages delivery, two-browser score/ghost flow, and email recovery.  No browser end-to-end verification yet. Supabase Security Advisor warns about intentional authenticated-executable SECURITY DEFINER username RPC; audit regularly. Arbitrary fake scores remain possible without server-side replay validation.
- Full guide: [SETUP.md](./SETUP.md).


## Username field hotfix — 2026-10-30
- **Cause confirmed in source:** common `.screen { pointer-events:none }` allowed only `.screen button { pointer-events:auto }`, making leaderboard username input and recovery details untappable on touch devices. The `change` event also invoked the name-claim RPC on blur without explicit confirmation.
- **Fix committed:** `index.html` at `cd658d08fbedb0bdd492a9c7ac80b55f8d0979f4`, PWA cache `pinpoint-v1.2.6` at `98d0a8da2d5d723a65a27bdab78fca9a63ce941d`. Enable pointer events for leaderboard/input/details, restore selection and touch/keyboard entry, make board scrollable on small phones, and submit names only on button or Enter.
- **Verification:** inspected remote post-write files, JS syntax parsed successfully. Local Chromium touchscreen reproduction: original input was unfocusable; fixed input focuses, accepts `ALWIN`, claim action receives value, recovery details expand, and board scrolls. This was a minimal isolated UI test, **not** a live deployed-game test. Existing Supabase schema/data untouched.
- **Next:** open the published PWA, refresh after cache update, tap the username input and claim a name. Check Supabase for a newly created anonymous user/profile and test leaderboard submission. If auth still fails, inspect the on-screen `identityStatus` and network response.


## Auth signup failure found in live logs (2026-10-30 SAST)
- **Verified Supabase Auth logs:** repeated `POST /signup` responses `422 anonymous_provider_disabled` ending 2026-10-29 22:22:43 UTC. Dashboard may have been set in another project, toggled incorrectly, or not saved; the effective server state **rejects anonymous signup**. Do not assert that the toggle is enabled until successful signup evidence exists.
- User's screenshot displayed `WAIT FOR AUTHENTICATION OR RETRY ONLINE` while trying to claim `KABALSAK`: the frontend had obscured the original server error with a generic pre-auth guard message. Username validity/cooldown were not the cause.
- **Fix:** `index.html` commit `7349cf77e32c04fd05122dc06112760c1a91e0cb` presents the actual disabled-provider error and reattempts authentication when the claim button is pressed; `sw.js` cache bumped to `pinpoint-v1.2.7` in `70d2c64b88348c8695f0d19af4130cfd3ba9f4df`.
- **Verified:** remote GitHub files, inline JS syntax parse, three preserved unverified scores and zero authenticated players/profiles. **Pending:** owner enables Anonymous Sign-Ins in **Pinpoint** project at `https://supabase.com/dashboard/project/sffpyvxbgmhepftxoesy/auth/providers`, then retries login/claim and confirms first user/profile. Do not clear local app storage or fabricate usernames.


## Production responsive UI pass (2026-10-30)
- **Reason:** User's authentic iPhone screenshot showed poor spacing and apparent overlap between the day label and best-score text. Goal is cohesive mobile, tablet and desktop UI without gameplay/auth changes.
- **GitHub changes verified on `main`:** `index.html` commits `cc3f3bac94880db5a22a11b9d9166622784a796c` and `aead9102962f5ca25ed0cf4a4ec5ee48917e842c`; PWA service-worker cache `pinpoint-v1.2.8` commit `bf88487a6a0decce63e7aed84407e459702af429`. Menu now has separate hero/wheel/control zones, DOM-measured menu-only canvas geometry, desktop split, compact short-view layouts, opaque and scrollable leaderboard, focus and reduced-motion improvements. `startRun` calls `resize()` to restore original gameplay geometry.
- **Verification:** inline JavaScript syntax passed after refactor. Isolated browser DOM layout geometry passed 320×568, 375×667, 390×844, 430×932, 768×800, 1366×768 and 1920×1080. These are **isolated component checks**, not a verified published full-game screenshot. Genuine post-release screenshot and live navigation/gameplay visual verification remain **pending**; see [DESIGN.md](./DESIGN.md).
- **Backend (read-only verified):** 2 authenticated user accounts, 2 claimed usernames, 6 verified scores present in dedicated Pinpoint Supabase project at check time. No DB mutation or resets during this pass.
- **Next:** refresh the installed PWA, inspect actual phone screen and 1366×768 desktop, complete a real tap-to-start/game-over/leaderboard UI smoke test, and capture genuine screenshots before declaring the visual pass production-complete.


## Ranked player leaderboard and replay control (2026-10-30)
- **Implemented / committed on `main`:** menu + leaderboard `GHOSTS · ON/OFF` controls, locally persisted with `pp_ghosts_enabled`. Ghost playback/callouts suppressed while OFF, preserving human score submissions. `index.html` commits `d72080a23dec6c9cf9779ec5be0bf5a27fba2bb7` and `799a2de45689248689c797538b3a810a4c1e8c7d`. Service-worker cache bumped to `pinpoint-v1.2.9` in commit `5c7b3c2b5f1695392f8b92307de77ef03fff9973`.
- **Verified Supabase migration:** `pinpoint_unique_player_leaderboards` provides two `security_invoker=true` views, `pinpoint_daily_bests` and `pinpoint_alltime_bests`, with permissions confirmed. At check time 7 real verified runs from 2 accounts yielded precisely **2** ranked entries, not 7. Historical run rows and valid tap timelines preserved. A ghost is a replay of a person's run; no separate ghost submissions exist.
- **Tests:** remote JS source syntax parsed, view counts/permissions and cached version verified. Live phone/desktop toggle interaction and exact ghost replay accuracy still **unverified**. Ghost collision currently uses live disc rotation, not an independently reproduced deterministic simulation; do not market as exact replay until corrected.
- **Design only, not deployed:** [SKIN-PROGRESSION.md](./SKIN-PROGRESSION.md) proposes 11 score, 4 played-day streak and 3 contested #1 tenure themes (18 total); requires replay validation and server-owned unlock tracking first. [GHOST-LEADERBOARD-AUDIT.md](./GHOST-LEADERBOARD-AUDIT.md) contains findings and QA. SQL source: [pinpoint-leaderboards.sql](./pinpoint-leaderboards.sql).
- **Next:** live PWA smoke-test real leaderboard with 2 devices and ghost toggle both states; then implement server-validated skin progression and true independent ghost replay with genuine screenshot evidence.

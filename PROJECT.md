# Pinpoint — project context

## Purpose
A mobile-friendly one-tap timing game and installable, offline-capable PWA, with optional asynchronous multiplayer via daily/all-time scoreboards and rival replay ghosts.

## Architecture
- `index.html`: self-contained UI, deterministic game loop, player identity, score REST calls, ghost replay.
- `config.js`: public Supabase project URL + publishable API key (currently **not configured**).
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
- No dedicated Pinpoint Supabase project was found in the connected account as of 2026-10-29. `config.js` remains blank. **Online multiplayer is not configured or end-to-end tested.**
- GitHub Pages/browser deployment has not been verified in this setup session.

## Next action
Select/confirm the Supabase organization for a new dedicated Pinpoint project, create it if approved, initialize SQL, configure its public URL/publishable key, bump the PWA cache, then complete two-player and offline-retry checks.

## Future hardening
Public, unauthenticated submissions are vulnerable to fake scores despite numeric sanity limits. Consider server-side replay validation and rate limits before competitive/public launch. Displayed rank calculation should also be audited for players outside the top results.

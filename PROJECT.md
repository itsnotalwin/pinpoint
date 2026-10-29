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
- **Outstanding:** Dashboard must enable Anonymous Sign-Ins and set allowed Auth redirect URL to the GitHub Pages URL; user must test two-browser account/score flow and email recovery. No browser end-to-end verification yet. Supabase Security Advisor warns about intentional authenticated-executable SECURITY DEFINER username RPC; audit regularly. Arbitrary fake scores remain possible without server-side replay validation.
- Full guide: [SETUP.md](./SETUP.md).

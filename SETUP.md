# Pinpoint — Setup & Multiplayer Guide

How to enable the **daily + all-time leaderboards** and the **rival ghost system**, and how they work under the hood.

---

## Part 1 — Supabase setup (5 minutes)

The game is a static PWA on GitHub Pages, so scores need a tiny backend. We use Supabase's free tier — no server to run, no SDK in the game (it talks plain REST).

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is enough for thousands of players).
2. Open **SQL Editor** in the Supabase dashboard, paste the full contents of [`supabase-setup.sql`](./supabase-setup.sql) from this repo, and **Run**. It creates:
   - a `scores` table (`player_id`, `name`, `score`, `day_key`, `duration_ms`, `taps`, `created_at`) with sanity constraints,
   - indexes for the leaderboard queries,
   - Row Level Security policies: **anonymous clients can read and insert** (no update or delete privileges); public scores and tap timelines are visible to anyone with the public key.
   - Explicit `anon` Data API grants, so it works on projects that do not grant table access automatically.
3. In the project's **Connect** dialog or **Project Settings → API Keys**, copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Publishable key** (`sb_publishable_...`, safe to use in a browser). A legacy `anon` JWT key also works if you already have one. **Never use a `secret` or `service_role` key in this public repository.**
4. Open [`config.js`](./config.js) in this repo and paste them:
   ```js
   window.PINPOINT_BACKEND = {
     url: 'https://xxxx.supabase.co',
     key: 'sb_publishable_...'
   };
   ```
5. **Bump the cache version** in `sw.js` when configuring your own project (for example, change `pinpoint-v1.2.3` to `pinpoint-v1.2.4`) and commit both files. The service worker caches `config.js`, so installed players need a new cache version to receive changed settings.

**Verify it works:** play one run and die. Your score should appear in the Supabase dashboard (Table Editor → `scores`), and the LEADERBOARD button appears on the menu and game-over screen.

**Troubleshooting**
- **No LEADERBOARD button anywhere** → `config.js` is empty or wasn't deployed (check the deployed file at `https://USERNAME.github.io/REPO-NAME/config.js`).
- **Board says OFFLINE** → check the URL/key, confirm the SQL ran and the Data API is enabled, and verify table grants + RLS policies. Use the browser Network tab for the actual HTTP status.
- **Board stuck on old data** → you forgot to bump the `sw.js` cache version after changing something.

---

## Part 2 — How the multiplayer system works

Pinpoint has no real-time netcode. Instead it exploits the fact that the game is **fully deterministic**: a run is completely defined by *(the day's wheel seed + the millisecond offsets of your taps)*. That turns "multiplayer" into data small enough to fit in a URL, and makes fair play provable.

### The daily wheel
Every stage configuration (patterns, speeds, direction, oscillation) is generated from
`mulberry32(dayKey × 7919 + stage × 104729)`, where `dayKey` is the local date as `YYYYMMDD`.
Every player on Earth gets the **same wheel sequence** for that day — the shared course is the multiplayer foundation, and it resets at midnight automatically.

### Score submission
When you die, the client submits one row:

| field | meaning |
|---|---|
| `player_id` | random UUID generated on first visit (no login) |
| `name` | your display name (auto-generated like `RUNE-750`, editable in the leaderboard screen, `A-Z0-9-_` max 12) |
| `score` | your final score |
| `day_key` | `YYYYMMDD` of the run |
| `duration_ms` | run length |
| `taps` | **your tap timeline** — comma-separated millisecond offsets, e.g. `312,445,521,...` (a few hundred bytes) |

Submissions go through a local **offline queue**: if the network is down the row is stored and retried on the next death / when connectivity returns. The game itself never needs the network.

### The two leaderboards
- **TODAY** — top scores where `day_key = today`, resets at midnight.
- **ALL-TIME** — top scores ever.
Your rank is computed with a count query (how many scores are higher, +1). The game-over panel shows `TODAY #n · ALL #n`, and the LEADERBOARD screen shows the top 10 for both.

### Rival ghosts (the multiplayer part)
After you die, the game picks your **rival**: the player directly above you on today's board (or your own best run — see below). Their stored tap timeline is replayed on your wheel as a **translucent gold ghost thrower**: their needles land in real time alongside yours, they die exactly where their run died (`RIVAL OUT`), and if you survive past that moment you've beaten them.

Two deliberate design rules:
- **Ghost needles never block you** — they're a race, not an obstacle. (Blocking would make your run depend on their connection and break fairness.)
- **Same wheel + same tap timeline = same run.** The simulation runs at a fixed 120 steps/second and contains no randomness in its logic, so a replay reproduces the original run exactly. That's what makes ghost races fair.

### Self-ghost (works with zero backend)
Even with Supabase disabled, your personal best run's timeline is saved locally and replayed as your ghost, with `PAST YOUR BEST!` when you outlive it. Server rivals take priority once configured.

### Local data (localStorage)
`pp_best` (all-time best) · `pp_daily {d,b}` (daily best) · `pp_streak {last,count}` (consecutive days played) · `pp_player {id,name}` · `pp_skin` (selected skin) · `pp_selfghost` (best-run timeline) · `pp_rival` (today's rival + timeline) · `pp_queue` (unsent submissions) · `pp_mute`.

Skins unlock at all-time bests of 10 / 25 / 50 / 75 / 150, plus **BLOODMOON** at a 7-day play streak.

### Anti-cheat — honest status
The database enforces sanity ranges (score ≤ 99999, duration 1s–1h) and the publishable key is public by design, so a determined cheater with devtools can post fake rows. Practical hardening, in order of effort:
1. (shipped) constraint checks + client-side retry queue shapes traffic.
2. per-UUID/IP rate limits in Supabase or a proxy.
3. the strong one: **server-side re-simulation** — replay a submitted tap timeline and reject rows whose re-simulated score doesn't match. Cheap to add later (e.g. a Cloudflare Worker) because the sim is deterministic.

### Known limitations
- `day_key` uses the **player's local midnight** — players in different timezones near midnight land in adjacent day buckets. Fix if it ever matters: compute the day bucket server-side from `created_at`.
- Real-time same-wheel versus (two live players, WebRTC) is intentionally **not** built — the async ghost duels deliver the competitive loop without latency or matchmaking complexity.

---

## Dev notes
- `?test` URL flag = automation hook (manual game-loop stepping, no rAF). Never appears for normal players.
- After ANY change to `index.html`, `config.js`, or assets: bump the `CACHE` version in `sw.js`, otherwise installed players keep the old files.

---

## Player identities (v1.2.5)

The game now supports anonymous Supabase Auth identities. Players claim case-insensitive unique names (3–12 characters, `A-Z`, digits, `_`, `-`). Server-side `claim_pinpoint_name` enforces a 30-day rename cooldown and rewrites the player's verified leaderboard names when renamed. A database unique index prevents duplicate claims even under concurrent requests.

**Required dashboard switch:** Open [Supabase Auth providers](https://supabase.com/dashboard/project/sffpyvxbgmhepftxoesy/auth/providers), enable **Anonymous Sign-Ins** if it is off. This is distinct from the anonymous publishable API key and is required for players to create accounts. Configure the project [Auth URL configuration](https://supabase.com/dashboard/project/sffpyvxbgmhepftxoesy/auth/url-configuration) with Site URL `https://itsnotalwin.github.io/pinpoint/` and the same URL as an allowed redirect for recovery.

**Migration:** Existing unauthenticated scores are preserved with `verified=false`, cannot be attributed to a newly claimed identity, and are hidden from authenticated leaderboards. Existing local bests, skins and self ghosts remain available on the device. Legacy queued submissions are dropped instead of forging ownership.

**Security:** The public `scores` table now grants read access to verified rows only. Anonymous API-key clients can no longer insert. Authenticated score submissions are associated with their Supabase `auth.uid()`, and a server-side trigger supplies the canonical claimed name. `pinpoint_profiles` cannot be inserted/updated directly from the client. The claim RPC is deliberately SECURITY DEFINER and explicitly checks the authenticated caller's identity; this produces a Supabase Security Advisor warning, which requires periodic review. A valid authenticated player can still submit **fabricated scores**, so server-side replay verification and rate limiting are future work.

**Optional recovery:** The leaderboard's recovery section links a verified email using `updateUser`, then allows returning users to recover via email OTP or magic link. Users should link and confirm an email before clearing browser data. Unlinked anonymous sessions cannot be recovered after storage is lost. Linking email requires Supabase email delivery to be configured and deliverable. No physical device identifiers are collected.

**Testing:** Open the game in two independent browsers. Claim distinct names, attempt duplicate claim, submit scores, verify each player can see both names, attempt an immediate rename (must be rejected), verify older unauthenticated scores remain excluded, and verify email recovery on a new browser. Also confirm offline local gameplay and retry when connectivity returns. The source JS parser and database permissions were verified on 2026-10-29, but a real public two-browser runtime test remains pending.

# Pinpoint — Setup & Multiplayer Guide

How to enable the **daily + all-time leaderboards** and the **rival ghost system**, and how they work under the hood.

---

## Part 1 — Supabase setup (5 minutes)

The game is a static PWA on GitHub Pages, so scores need a tiny backend. We use Supabase's free tier — no server to run, no SDK in the game (it talks plain REST).

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is enough for thousands of players).
2. Open **SQL Editor** in the Supabase dashboard, paste the full contents of [`supabase-setup.sql`](./supabase-setup.sql) from this repo, and **Run**. It creates:
   - a `scores` table (`player_id`, `name`, `score`, `day_key`, `duration_ms`, `taps`, `created_at`) with sanity constraints,
   - indexes for the leaderboard queries,
   - Row Level Security policies: **everyone can read, everyone can insert**.
3. Go to **Settings → API** and copy two strings:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (safe to ship in a client — it's not a secret)
4. Open [`config.js`](./config.js) in this repo and paste them:
   ```js
   window.PINPOINT_BACKEND = {
     url: 'https://xxxx.supabase.co',
     key: 'eyJ...your-anon-key...'
   };
   ```
5. **Bump the cache version** in `sw.js` (change `pinpoint-v1.2.2` to `v1.2.3`), commit both files, and push. This is required — the service worker caches `config.js`, so installed players only see a new config after the cache version changes.

**Verify it works:** play one run and die. Your score should appear in the Supabase dashboard (Table Editor → `scores`), and the LEADERBOARD button appears on the menu and game-over screen.

**Troubleshooting**
- **No LEADERBOARD button anywhere** → `config.js` is empty or wasn't deployed (check the deployed file at `https://USERNAME.github.io/REPO-NAME/config.js`).
- **Board says OFFLINE** → wrong URL/key, or the SQL wasn't run (RLS blocks everything if the table doesn't exist).
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
The server enforces sanity ranges (score ≤ 99999, duration 1s–1h) and the anon key is public by design, so a determined cheater with devtools can post fake rows. Practical hardening, in order of effort:
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

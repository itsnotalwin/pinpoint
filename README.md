# Pinpoint — one-tap timing game (PWA)

1. Push these files to a GitHub repo (index.html at the repo root).
2. Open your repo on github.com → Settings → Pages.
3. Set Source: "Deploy from a branch" → Branch: `main` → folder `/ (root)` → Save.
4. Wait ~1 minute, then open `https://USERNAME.github.io/REPO-NAME/` on your phone.
5. Install it ("Add to Home Screen" on iOS / install prompt on Android) to play full-screen, even offline.

## Leaderboards + daily rivals (optional)

Full setup guide + how the multiplayer/ghost system works: **[SETUP.md](./SETUP.md)**.

Quick version:
1. Create a free project at https://supabase.com.
2. SQL Editor → paste `supabase-setup.sql` → Run.
3. Settings → API → copy the Project URL and the anon public key into `config.js`.
4. Bump the `CACHE` version string in `sw.js` (e.g. `pinpoint-v1.2.2`) and push — installed players get the update automatically on their next menu/game-over tap.

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
3. Copy the Project URL and **publishable** (`sb_publishable_...`) key from Supabase's Connect dialog into `config.js`. Never commit a secret/service_role key.
4. Bump the `CACHE` version string in `sw.js` (e.g. `pinpoint-v1.2.4`) and push so installed players receive the new config.

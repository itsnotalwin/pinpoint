# AGENTS.md — Pinpoint project guidance

This repository follows the source-building conventions documented in the private BRAIN Obsidian vault `itsnotalwin/obsidian-vault`, especially `99_System/BUILD-STANDARDS.md`.

Before changing code, read `PROJECT.md` and the task-relevant files. Do not invent build/deployment verification. This is a static GitHub Pages PWA: when changing `index.html`, `config.js`, or assets, bump the `CACHE` version in `sw.js` to update installed clients.

Keep credentials safe. `config.js` may contain a Supabase **publishable** key only; never commit a Supabase `secret`, `service_role` key, database password, or other privileged credential. Public leaderboard scores and ghost timelines should be treated as public data.

Every new human-maintained source subfolder needs `CONTEXT.md`. New UI/CSS folders also need `DESIGN.md` and a genuine current screenshot of the running interface (never a fabricated image). Update affected notes and verify behavior after changes. Use version-checked GitHub writes and preserve other agents' work.

Project-specific setup and testing details: [PROJECT.md](./PROJECT.md) and [SETUP.md](./SETUP.md).

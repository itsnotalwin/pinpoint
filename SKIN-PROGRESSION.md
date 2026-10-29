# Pinpoint Skin Progression — build-ready design
Status: **planned, not implemented**. Last reviewed: 2026-10-30.

## Goal
Make new wheel colors worth earning while preserving fair, readable one-tap gameplay. Three complementary tracks: **personal-best score**, **played-day streaks**, and **contested time in daily #1 position**. Unlocks are permanent, cosmetic only, and saved to an authenticated player profile so recovery restores them.

Do not alter game physics, collision timing, speed, obstacle visibility, seeded patterns, or score values between themes. Accessibility: maintain strong needle/obstacle contrast on all wheels; avoid flashing effects and respect reduced-motion settings.

## Skin catalog: 18 themed wheels

### Score ladder (11 including starter)
One wheel every 100 points. The threshold means a **validated server-recorded personal best**, not a number typed or submitted by an untrusted client.

| ID / name | Required best | Wheel disc | Rim | Distinctive effect |
|---|---:|---|---|---|
| ivory / IVORY | 0 | #F4EEE1 | #C9BFAF | Classic ivory starter |
| ember / EMBER | 100 | #FFAE6B | #C65C39 | Warm ember pins |
| crimson / CRIMSON | 200 | #E84B69 | #742D50 | Deep ruby glow |
| glacier / GLACIER | 300 | #DDF6FC | #5CA9C9 | Frosted blue accents |
| mint / MINT | 400 | #91E5C2 | #207D75 | Clean turquoise rim |
| royal / ROYAL | 500 | #AB91EE | #5944A4 | Satin purple outer halo |
| solar / SOLAR | 600 | #FFE08B | #DE9A36 | Golden double ring |
| eclipse / ECLIPSE | 700 | #433752 | #A4A0D1 | Dim lunar sheen |
| nebula / NEBULA | 800 | #6090CF | #BE80D7 | Blue-violet atmospheric aura |
| obsidian / OBSIDIAN | 900 | #282C3D | #9BB4C2 | Cold metal accent |
| phantom_gold / PHANTOM GOLD | 1000 | #F7E1AD | #D8A434 | Distinct white-gold prestige finish |

### Played-day streaks (4)
- **DAYBREAK**: 3 consecutive qualifying days, peach/sunrise finish.
- **BLOODMOON**: 7 consecutive qualifying days, maroon wheel with a fine red ring.
- **POLARIS**: 14 consecutive qualifying days, midnight-blue wheel with restrained cyan specks.
- **ETERNAL**: 30 consecutive qualifying days, pearl-black finish and subtle golden inner ring.

A day counts **only after a completed qualifying run**, using a consistent **UTC challenge day**. Multiple runs that day count once. Streak resets after a missed UTC day, but skins already earned never relock. Preserve the maximum lifetime streak separately.

**Fix needed:** Existing `pp_streak` grows on app **open**, and existing `skinUnlocked` uses a faulty OR on a `need:-1` streak skin; neither can be authoritative for serious rewards. Use server-earned streaks. Provide a documented offline sync grace period without trusting the device clock.

### Contested King-of-the-Wheel tenure (3)
- **CROWN SPARK**: cumulative 1 hour holding contested daily #1.
- **REGENT**: cumulative 12 hours holding contested daily #1.
- **SOVEREIGN**: cumulative 72 hours holding contested daily #1.

Define ranking as one daily best per real player. An interval earns time **only when 2+ distinct eligible players** have completed that day's challenge. Start counting from the first qualifying head-to-head moment, with no backdating of uncontested solo time. Close the interval when another real player takes the lead, at UTC day end, or if the top result is invalidated. Tie resolution: earlier achievement of that best score wins the tie. Server timestamps only, never client-reported leader seconds. Use transactionally recorded start/stop leaderboard events plus recovery/reconciliation to avoid double credit on retries/outages.

## Cosmetic tiers
Score wheels 100–400 receive distinct disc + rim colors, 500–700 get a tasteful extra rim accent, 800–1000 get subtle ambient aura or light texture. Streak/crown wheels are more restrained, exclusive and instantly recognizable. Every skin defines disc, rim, inner face, needle, pin cap, ambient aura, completion particles and dark/light contrast configuration. Effects must be optional under reduced-motion and should never obscure obstacles.

## Wheel collection UI
Add **WHEELS** to game-over/menu, without forcing a new modal onto the live gameplay area. Responsive 3-tab collection: **SCORE**, **STREAK**, **CROWN**, with an accessible preview tile for each wheel:
- Exact threshold, progress numerators/denominators, and earned date.
- `PREVIEW` shows menu-only appearance. Locked previews never silently equip.
- `EQUIP` available only for earned wheels and persists across devices.
- One-time unlock reveal after a server-accepted achievement, with no long unskippable effects.
- Offline state says `PROGRESS PENDING SYNC`, never falsely claims a server unlock.
- Showing `6/18 WHEELS`, current best, longest streak, contested crown hours makes the effort tangible.

## Data model and implementation design
Start with stable string IDs. **Never** key unlock ownership by the current `SKINS` array index because reordering the catalog would break saved equipment.

Suggested migration, with RLS and server-owned mutations:
- `player_progress`: user_id, validated_best, current_streak, longest_streak, last_qualified_utc_day, valid_runs, contested_top_seconds.
- `player_skin_unlocks`: user_id, skin_id, earned_at, source_event_id, unique(user_id,skin_id).
- `player_equipment`: user_id, equipped_skin_id; enforce earned ownership before change.
- `leaderboard_bests`: utc_day, user_id, best_run_id, best_score, achieved_at.
- `leader_tenure_intervals`: utc_day, user_id, start/end timestamps, server-computed credited seconds.
- `event_receipts`: idempotency key to avoid duplicate rewards from retried offline submissions.

Server is authoritative for unlocked skins, valid completed days and crown time. Keep existing `pp_best`, `pp_skin`, `pp_streak`, and self-ghost data through migration. Existing legacy wheels (including BUBBLE and GILDED) should remain selectable by their rightful owners as **legacy cosmetic** variants; do not erase selections or automatically grant crown rewards based on unauthenticated historical data.

## Fairness before live rewards
Today `scores.verified=true` means **authenticated owner**, not proof that a score happened honestly. Implement deterministic **server-side replay validation** before prestige reward issuance: version the game rules/challenge seed, validate tap timeline, duration, score, and terminal condition, rate-limit submissions, and reject impossible event streams. Current ghost replay also uses the local live wheel's rotation, so a true physically faithful replay requires an independent deterministic replay simulation. Do not treat stored tap times as an exact identical run without that upgrade.

## Build sequence
1. **Done 2026-10-30:** separate one-best-per-real-player leaderboard views from optional ghost replay UX. Audit replay fidelity.
2. Implement versioned replay validation and UTC challenge/day resolution, tests for honest score and offline retry handling.
3. Implement 11 score wheels and cosmetic collection UI, with idempotent server unlock receipts.
4. Implement authentic played-day streaks and 4 streak wheels, replacing misleading app-open streak counting.
5. Implement contested #1 tenure server records and 3 high-prestige crown wheels.
6. Migrate legacy collections safely, support account recovery, test device parity and authentic mobile/desktop screenshots.

## Acceptance tests
- Same player making six runs on the same day occupies one daily rank, with highest score; rival replay does not post another score.
- Ghost toggle persists across restarts, prevents ghost render when off, and does not change human score submissions.
- Exactly one unlock for best-score thresholds 100, 200, ... 1000, even after retrying upload.
- Seven **actual played** UTC days for Bloodmoon, not seven menu openings; missing a day resets current streak but not earned skins.
- King-of-the-Wheel time requires at least two players; server correctly transfers leader tenure and closes daily intervals.
- Cross-device email-linked identity restores progress and equipped theme.
- No impossible/unvalidated run grants premium skins; all existing local best, legacy selection, and self-ghost survive migration.
- Responsive UI, keyboard, screen reader, lower motion, light/dark needle contrast, no performance regressions.

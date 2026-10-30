# Pinpoint visual design and production QA

## Direction
A focused one-tap arcade game: dark aubergine canvas (`#191322`), cream concentric disc, coral impact accents (`#FF4E6A`), and gold (`#FFC24B`) for competitive status. Keep type bold, geometric, and restrained. The wheel should remain the hero, with controls secondary.

## Responsive layout
- **Phone (320–430px):** stable title/tagline/day identifier at the top, spinning wheel in the measured space between header and controls, score cards and leaderboards at the bottom. All touch targets at least ~43–48px.
- **Tablet/compact windows:** same vertically composed layout; game wheel scales to available real space, not arbitrary viewport offsets.
- **Desktop (900px+, sufficient height):** editorial left-side information and actions, large wheel on the right. The playable canvas recentres for gameplay.
- **Small-height mobile:** compact header/footer, resilient game-over spacing and scrollable leaderboard.
- **Leaderboard:** opaque surface, accessible username input and optional recovery disclosure, sticky close control, readable rankings and visible keyboard focus.

## Interaction and state
The menu, gameplay, game-over, and leaderboard overlays must never visually collide. Save the offline game loop, personal scores, skins, and anonymous-auth identity lifecycle unchanged during layout work. Keep iOS safe-area handling and keyboard focus available. Prefer `prefers-reduced-motion` when requested.

## Verification / visual evidence
- **2026-10-30 source review:** user-supplied authentic screenshot of the *earlier* menu revealed day identifier/score competition near the top and a visually uneven header-to-footer rhythm.
- **2026-10-30 production pass:** responsive refactor in `index.html` commits `cc3f3bac94880db5a22a11b9d9166622784a796c` and `aead9102962f5ca25ed0cf4a4ec5ee48917e842c`; cache `pinpoint-v1.2.8`.
- **Isolated DOM geometry smoke checks** (not the full game): 320×568, 375×667, 390×844, 430×932, 768×800, 1366×768 and 1920×1080. Header/footer have measurable wheel clearance; full production render and user-device screenshot **not yet verified**.
- **Screenshot status:** no genuinely captured post-change full-game screenshot is available. Do not substitute a generated mockup or test harness screenshot as actual deployed visual evidence. Capture the deployed app at 390×844 and desktop 1366×768 after release and attach authentic `SCREENSHOT.png` (and optional mobile variant) only after verification.


## v1.2.9 replay controls and collection planning
The menu day identifier now shares a compact row with a clearly labeled `GHOSTS · ON/OFF` button. The leaderboard has a second synchronized switch in a small `GHOST CHALLENGES` settings row and text clarifying that only one real personal-best score per player ranks. Both switches are keyboard-operable, use `aria-pressed`, and preserve the selected state via browser storage. The wheel collection described in [SKIN-PROGRESSION.md](./SKIN-PROGRESSION.md) is a **future design**, not currently rendered or deployed. A current authentic on-device screenshot of both toggle positions is still pending after v1.2.9 deployment.


## Gameplay viewport contract (v1.2.10)
The real iPhone game screenshot supplied 2026-10-30 showed an oversized vertical gap and gameplay score/launcher drifting into the system status/home-indicator zones. Use ONE_MORE's proven principle: size the fixed game stage to `100dvh` and measure canvas from `stage.clientWidth/clientHeight`, not `window.innerHeight`. For narrow portrait gameplay, a pure `portraitGameplayLayout` computes protected HUD top (including safe-area fallback), balanced wheel center/radius, and raised launcher bottom. The existing desktop/landscape and menu layouts continue to use their own geometry. Rendered score/level/combo positions now use protected HUD anchors instead of raw `safeT + 56*K`.

**Preliminary tests:** JavaScript syntax passed; mathematical safe-area/element clearance verified at seven mobile viewport sizes in model-run checks. A headless regression file `layout.test.cjs` documents the assertions. **Authentic post-fix screenshots are still required**, especially the iPhone status bar, wheel BEST label, launcher and home-indicator edge during real play. Keep game physics, collision radius calculations, and game over flow unchanged.

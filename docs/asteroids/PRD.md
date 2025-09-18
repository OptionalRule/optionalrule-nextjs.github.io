# Asteroids Game — Product Requirements Document (PRD)

## 1. Overview

Interactive, desktop-only Asteroids clone integrated into the site at `/games/asteroids/`. Built with TypeScript + React and rendered via HTML5 Canvas. The game is dynamically imported client-side only (no SSR) to comply with static export constraints.

- Route: `src/app/(interactive)/games/asteroids/page.tsx`
- Feature code: `src/features/games/asteroids/`
- Public assets (audio): `public/games/asteroids/sounds/`
- Summary reference: `documentation/PRD.md` (section 6.6)

## 2. Goals & Non‑Goals

Goals
- Deliver a faithful, responsive desktop experience of Asteroids with modern visuals and sound.
- Demonstrate interactive, client-only features under the site’s static export model.
- Provide a clean, modular engine with entities, systems, hooks, and sensible configuration.

Non‑Goals
- Mobile/touch controls (explicitly unsupported for MVP).
- Multiplayer, leaderboards, cloud saves, or social features.
- Server-side rendering or runtime APIs.

## 3. Target Users & Use Cases

- Visitors who want to try an interactive feature on desktop.
- Stakeholders evaluating interactive capability and performance within a static site.
- Developers using the feature as a reference for future interactive apps.

## 4. Core Gameplay Requirements

Controls (keyboard)
- `ArrowLeft`/`ArrowRight`: rotate ship
- `ArrowUp`: thrust
- `Space`: fire
- `Esc`: pause/resume
- `Enter`: restart (when game over)
- Start: click on the canvas (menu) or press any key

Game loop & entities
- Entities: Ship, Asteroid, Bullet, Saucer, Explosion.
- Systems: RenderSystem (Canvas 2D), CollisionSystem (circle bounds), SoundSystem (HTMLAudio with categories/variants).
- Hooks/UI: `useAsteroids` plus UI panels for score, controls, and status.

Ship
- Lives: 3; respawn delay: 2000 ms; invulnerable for 2000 ms after respawn.
- Acceleration: 300 px/s²; max speed: 400 px/s; rotation speed: 3 rad/s; friction: 0.99/tick.
- Wraps at screen edges with small padding; thrust flame visual when accelerating.
- Collision radius: 8.

Bullets
- Speed: 500 px/s; lifetime: 2000 ms; max concurrent: 10; cooldown: 250 ms.
- Spawn from ship nose with offset 15 px; do not wrap; fade and despawn off-screen.
- Collision radius: 2.

Asteroids
- Base field: 4 large at level 1; +1 per level up to 12.
- Sizes: Large→Medium (splits into 2), Medium→Small (splits into 3), Small: no split.
- Speed: 20–80 px/s (randomized); irregular polygon shape; gentle rotation.
- Points: Large 20, Medium 50, Small 100.
- Colliding with ship destroys ship; asteroid persists (classic behavior).
- Collision radii: Large 40, Medium 25, Small 12.

Saucer (spawns from level ≥ 2)
- First spawn: ~15s ± 5s after level start (min 5s); then ~30s ± 5s (min 10s) between spawns; only one active saucer at a time.
- Size by level weighting: early favors Large; late favors Small. Speeds: Large 80 px/s, Small 120 px/s.
- Fires every 2000 ms with accuracy variance (Large ±0.3 rad, Small ±0.15 rad).
- Movement generally left↔right with vertical drift and y-bounds margin.
- Points: Large 200, Small 1000. Award points only when destroyed by player bullets.
- Looping arrival sound while active; stop sound when destroyed or it exits.

Scoring, levels, and extra life
- Level complete: when all asteroids destroyed.
- Level bonus: `level × 100`, granted before incrementing level.
- Level transition: 2000 ms loading overlay; saucer spawn schedule resets.
- Extra life threshold: every 10,000 points. Crossing a threshold sets a “pending” award that is granted on the next level completion (with UI notification).
- High score persisted in `localStorage` under `asteroids_highscore`.

States & overlays
- Menu (instructions; click/any key to start), Playing (HUD), Paused (overlay + hint), Loading (level X + bonus + extra life), Game Over (final + high score; Enter to restart).
- Auto-pause on `window.blur`/tab hidden.

## 5. Visuals & Audio

Canvas & HUD
- Canvas: 800×600; starfield background with subtle twinkle.
- HUD: top-left score, top-right lives, top-center level; debug toggles exist but disabled in prod.

Audio behavior
- User gesture required to unlock audio context; categories: effects, ui, ambient, music (music off by default).
- Sound variants for repeated actions (e.g., bullet fire, asteroid hits) to reduce repetition.
- Key events mapped: game start/over, pause/unpause, thrust loop, fire, asteroid split/destruction, saucer arrival/fire/destruction, ship destruction/respawn, level completion.

## 6. Accessibility

- Canvas `role="application"` + `aria-label` and keyboard focus on ready.
- Keyboard-only play; visible overlays for status; pause on blur/visibilitychange.
- Mobile: show “not available on Mobile” overlay.

## 7. Technical Architecture & Integration

- Client-only page: `src/app/(interactive)/games/asteroids/page.tsx` uses dynamic import with `ssr: false`.
- Feature code: `src/features/games/asteroids` organized by `engine/`, `components/`, `hooks/`, `config/`, `assets/`.
- Audio assets served from `public/games/asteroids/sounds/` via absolute paths.
- Static export compatible; no server APIs or SSR. Route ends with trailing slash.

## 8. Performance

- Target ~60 FPS on typical desktop; requestAnimationFrame + minimal allocations.
- Canvas fixed-size rendering; image smoothing disabled; simple vector shapes.
- Auto-pause when inactive; avoid heavy logs and expensive per-frame operations.

## 9. Acceptance Criteria

- Game states: start, pause/resume, level transition, game over, restart.
- Controls work as specified; bullets respect cooldown/max; ship wraps; friction applies.
- Asteroids split and award correct points; saucers spawn and behave per level; bullets expire.
- Extra life awarded on level completion after crossing threshold; high score persists.
- Audio: gesture unlock; thrust loop while accelerating; arrival loop for saucer; correct event sounds.
- Mobile shows not-supported overlay; desktop plays normally.

## 10. Risks & Constraints

- Static export (GitHub Pages): no SSR or server APIs; ensure absolute asset paths under `public/`.
- Browser audio policies: handle gesture unlock; gracefully degrade if audio fails.
- Mobile UX intentionally excluded for MVP; consider future touch/gamepad support.

## 11. Future Enhancements (Post‑MVP)

- Touch/gamepad input; settings menu (audio toggles, difficulty, debug).
- Power-ups, hyperspace, varied asteroid fields, or enemy behaviors.
- Leaderboards (static or third-party), achievements, analytics eventing.

## 12. Cross‑Links

- Summary in main PRD: `documentation/PRD.md` (see section 6.6)
- Implementation entry point: `src/app/(interactive)/games/asteroids/page.tsx`
- Feature README: `src/features/games/asteroids/README.md`


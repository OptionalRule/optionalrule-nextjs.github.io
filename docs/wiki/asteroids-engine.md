# Asteroids engine (#6, #7)

Facts as of `b18e4aa` (2026-11-21, explorer report). Paths are under `src/features/games/asteroids/`.

- The collision pairs are ship↔{asteroid, saucer, saucer bullet} and bullet↔{asteroid, saucer} (CollisionSystem.ts:82-87). `resolveCollision` mutates health/active. `AsteroidsEngine.handleCollisionEffects` (:286-335) then re-derives the outcome: explosions, score (only for bullets whose sourceId is the ship), split, sounds, ship death.
- The game has no seeded RNG; everything uses `Math.random`, including `Asteroid.split`, explosions, saucer AI, spawn and entity ids.
- Browser effects in the engine: key listeners, RAF, `setTimeout` (respawn :385 is stored; the level transition at :538 is never stored — a bug), `performance.now` (in 7 places; `levelStartTime` is written but never read), localStorage, SoundSystem, RenderSystem. Renderers also read the clock.
- Pause logic is duplicated at three sites (togglePause, pause, resume). Saucer spawn timing and the respawn/level timeouts all keep counting while paused.
- `useAsteroids.ts` keeps a hand-copied `GameState` that it patches through per-field callbacks. `index.tsx` is its only consumer.
- Tests: `asteroidScoring.test.ts` casts to `EngineInternals` and uses Proxy mocks. No test covers saucer, ship death, or `update`.

See [architecture-strong-items](architecture-strong-items.md).

## 2026-11-21 Lane B progress
- #6 landed on `develop` (`20d2f1c`..`fd147dc`): `collide(entities, playerShipId): CollisionOutcome[]` in `engine/systems/collisions.ts` is pure, and the engine applies the outcomes. `CollisionSystem` is deleted. `collisions.test.ts` (21 cases) replaces the cast/Proxy tests.
- #7 is done on branch `worktree-agent-a1428180dc2f60369` (`ff6a0a4`..`10d5405`) and NOT merged. It adds `AsteroidsCore` (update(dt, controls), snapshot/subscribe), the engine becomes the browser adapter, and the hook uses `useSyncExternalStore`. The shot cooldown stays on wall-clock time through an injected `clock`. It waits on two user questions: live High Score updates, and timers pausing while the tab is hidden.
- Environment: the worktree was created on an old `main` merge rather than `develop`, and the agent reset it. Future lane briefs must say "verify base == origin/develop".

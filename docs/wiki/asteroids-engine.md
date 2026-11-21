# Asteroids engine (#6, #7)

Facts as of `b18e4aa` (2026-11-21, explorer report). Paths are under `src/features/games/asteroids/`.

- The collision pairs are ship↔{asteroid, saucer, saucer bullet} and bullet↔{asteroid, saucer} (CollisionSystem.ts:82-87). `resolveCollision` mutates health/active. `AsteroidsEngine.handleCollisionEffects` (:286-335) then re-derives the outcome: explosions, score (only for bullets whose sourceId is the ship), split, sounds, ship death.
- The game has no seeded RNG; everything uses `Math.random`, including `Asteroid.split`, explosions, saucer AI, spawn and entity ids.
- Browser effects in the engine: key listeners, RAF, `setTimeout` (respawn :385 is stored; the level transition at :538 is never stored — a bug), `performance.now` (in 7 places; `levelStartTime` is written but never read), localStorage, SoundSystem, RenderSystem. Renderers also read the clock.
- Pause logic is duplicated at three sites (togglePause, pause, resume). Saucer spawn timing and the respawn/level timeouts all keep counting while paused.
- `useAsteroids.ts` keeps a hand-copied `GameState` that it patches through per-field callbacks. `index.tsx` is its only consumer.
- Tests: `asteroidScoring.test.ts` casts to `EngineInternals` and uses Proxy mocks. No test covers saucer, ship death, or `update`.

See [architecture-strong-items](architecture-strong-items.md).

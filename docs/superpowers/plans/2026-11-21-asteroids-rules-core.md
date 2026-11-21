# Asteroids Game Rules Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Split `engine/AsteroidsEngine.ts` into a Game rules core stepped by `update(dt, controls)` on Simulated Time, and a browser adapter that owns RAF, key listeners, audio, `localStorage` and rendering. The hook subscribes to core snapshots instead of hand-copying `GameState`. Architecture item #7 in `docs/wiki/architecture-strong-items.md`; runs after #6 (`2026-11-21-asteroids-collision-outcomes.md`).

**Tech Stack:** TypeScript strict, React 19 `useSyncExternalStore`, Vitest (happy-dom).

## Binding constraints

- **Q15:** Saucer spawn, Respawn and Level Transition timers run on Simulated Time and freeze while paused. Accepted gameplay change. No other user-visible change.
- **Q4:** verified dead code is deleted, one commit per deletion. **Q6:** new terms into `GLOSSARY.md`. **Q7:** reviewer before merge. **Q14:** no seeded RNG; `Math.random` stays.
- CLAUDE.md: no `any`, `_` unused params, no code comments, Conventional Commits, `npm run graph:update` after src edits.

## Problems (as of `712ffab` plus #6)

1. Level Transition `setTimeout` is never stored, so `restart()`/`destroy()` cannot cancel it (verified bug). A restart during a Level Transition followed by a quick level clear lets the stale timer end the new transition early; after `destroy()` it still mutates state and calls back into React.
2. Pause is implemented three times (`togglePause`, `pause`, `resume`).
3. Saucer spawn uses `performance.now()`; Respawn and Level Transition use `setTimeout`. All keep counting while paused, unlike the simulation, which steps by clamped `dt`. (The shot cooldown also uses `performance.now()`; Q15 does not cover it, so it stays on wall-clock time — see "Clock" below.)
4. `useAsteroids` keeps a second `GameState` patched by six per-field callbacks; `onScoreChange`'s `ScoreEvent` and `onExtraLife`'s notification state are consumed by nobody (`index.tsx` ignores `extraLifeNotification`).
5. Rules are untestable without mocking `RenderSystem`/`SoundSystem` and `document`.

## Design it twice

**Design A — effects queue.** Core is pure: `update(dt, controls)` and commands append `GameEffect`s (`{ type: 'sound', key }`, `{ type: 'highScore', value }`, ...) that the adapter drains each frame.
- Core has zero dependencies; tests assert on drained effects.
- Adds an ordering protocol (drain after every call, including commands issued from React between frames) and a second vocabulary mirroring `SoundSystem` one-to-one. Easy to forget a drain → lost sounds.

**Design B — core with an audio port; storage via snapshots (chosen).**
- Audio is the only side effect the rules must trigger mid-step, so the core takes a `GameAudio` port: `Pick<SoundSystem, 'playSound' | 'stopSound' | 'pauseCategory' | 'resumeCategory' | 'stopAllSounds'>`. Production adapter: `SoundSystem` (satisfies it structurally). Test adapter: a recording fake. Two adapters → a real seam.
- High Score persistence is not a rule: the core takes the stored High Score at construction and exposes it in the snapshot; the browser adapter saves whenever the snapshot's `highScore` changes. No storage port.
- Notifications are a single `subscribe(listener)` + `getSnapshot(): GameState`. The snapshot is a frozen object whose identity changes only when some field changed, so it plugs straight into `useSyncExternalStore`.

B is chosen: smaller interface (no drain protocol), and the seam sits where something actually varies (real vs fake audio).

### Core interface (`engine/AsteroidsCore.ts`)

```ts
export interface ShipControls { rotateLeft: boolean; rotateRight: boolean; thrust: boolean; fire: boolean }
export type GameAudio = Pick<SoundSystem, 'playSound' | 'stopSound' | 'pauseCategory' | 'resumeCategory' | 'stopAllSounds'>

export class AsteroidsCore {
  constructor(options: { audio: GameAudio; highScore: number; clock: () => number })
  update(dt: number, controls: ShipControls): void
  start(): void
  pause(): void
  resume(): void
  togglePause(): void
  restart(): void
  clearHighScore(): void
  getSnapshot(): GameState
  subscribe(listener: () => void): () => void
  getEntities(): readonly Entity[]
}
```

Invariants:
- `update` advances Simulated Time by `dt` only while `playing` or `loading` (Level Transition). Entities, input, collisions and Saucer spawning only run while `playing` (unchanged). Pending Respawn and Level Transition count down in both. Nothing advances in `menu`, `paused`, `gameOver`. The core does not clamp `dt`; the adapter clamps to `GAMEPLAY.maxFrameDelta` as today.
- Q15 timers are plain fields (`respawnRemaining`, `levelTransitionRemaining`, `nextSaucerSpawnAt`) on Simulated Time; `restart()` resets all of them, which fixes problem 1 by construction (no timer exists outside the core's own state, so neither `restart()` nor dropping the core on unmount can leave one behind).
- **Clock:** the shot cooldown is not a Q15 timer and must not change, so it stays on wall-clock time through the injected `clock` (production: `performance.now`; tests: a controllable number). It keeps today's `lastShotTime = 0` semantics. This is the only use of `clock`.
- Saucer first spawn stays lazy: `nextSaucerSpawnAt` is computed on the first `playing` update of a Level ≥ 2 (as today, `AsteroidsEngine.ts` `updateSaucerSpawning`), never at Level start, so Level Transition time is not counted towards it.
- `completeLevel` only runs while `playing`, so the transition's `previousState` restore is always `playing`; the core sets `playing` directly.
- **Hidden tab (within Q15):** Simulated Time advances only with RAF frames, so a Level Transition or pending Respawn also waits while the tab is hidden (today the `setTimeout`s complete in the background). This is a direct consequence of putting these timers on Simulated Time, which Q15 accepted; it is reported to the user in the lane report.
- One private `setPaused(paused)` backs `pause`, `resume`, `togglePause` (problem 2).
- `start()` only acts in `menu`. `restart()` acts in any status and starts a fresh Game at `playing`.
- Snapshots: every public method ends by publishing; publish compares to the previous snapshot field-by-field and notifies only on change.
- The core never touches `document`, `window`, `localStorage`, `performance`, `requestAnimationFrame` or `setTimeout`.

### Browser adapter (`engine/AsteroidsEngine.ts`, kept as the adapter's name to limit churn)

- Owns `RenderSystem`, `SoundSystem`, key `Set`, `keydown`/`keyup` listeners, RAF loop and High Score storage.
- Constructor: load High Score from `localStorage`, create the core, subscribe (save High Score whenever the snapshot's `highScore` changes to a non-zero value, so a Score after a clear is saved as today), render once.
- Keys: menu + non-modifier key → `start()`; `Enter` in `gameOver` → `restart()`; `Escape` → `togglePause()`; `PREVENTED_KEYS` unchanged. Held keys map to `ShipControls` each frame.
- Loop: runs from `start()`/`restart()` until the snapshot is `gameOver` (as today); each frame `dt = min(now - last, maxFrameDelta)`, `core.update(dt, controls)`, render. `resume()` resets `last` as today. `restart()` clears held keys as today.
- `destroy()` stops RAF, removes listeners, destroys `SoundSystem`. Exposes `getSnapshot`, `subscribe`, `start`, `pause`, `resume`, `restart`, `clearHighScore`, `destroy`.
- `clearHighScore()` calls `core.clearHighScore()` then removes the storage key (as today; `0` is never written).
- After `destroy()`, every command is a no-op and no RAF is ever requested again.

### Hook (`hooks/useAsteroids.ts`)

- Holds the adapter in state; `gameState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. `subscribe`/`getSnapshot` are memoized on the adapter (`useCallback` keyed on it); without an adapter they use a module-level constant initial `GameState`, which is also the server snapshot.
- Keeps today's lifecycle: the 100 ms mount timer, `isEngineReady`, the mobile path (no engine), and cleanup that clears the timer, calls `destroy()` and drops the adapter (StrictMode double effects create and destroy one adapter cleanly).
- Commands forward to the adapter; the core's own status guards replace the hook's duplicate ones.
- Blur/visibility auto-pause calls `adapter.pause()` (a no-op unless `playing`).
- Return type drops `extraLifeNotification`/`dismissExtraLifeNotification` (unused; see Task 1).

## Tasks

### Task 1: Dead code (Q4, one commit each)

- [ ] `useAsteroids` `extraLifeNotification` / `dismissExtraLifeNotification` and the engine's `onExtraLife` event: no consumer (`grep -rn extraLifeNotification src/`). Commit `refactor(asteroids): remove unused extra life notification`.
- [ ] `ScoreEvent` payload of `onScoreChange` (only consumer is a TODO no-op in the hook), and the `ScoreEvent` type, which then has no users. Commit `refactor(asteroids): remove unused score event payload`.
- [ ] `levelStartTime` (write-only). Commit `refactor(asteroids): remove write-only levelStartTime`.
- [ ] `getRenderSystem` / `getSoundSystem` debug accessors (no callers). Commit `refactor(asteroids): remove unused engine debug accessors`.
- Each: asteroids vitest + lint green before commit; `npm run graph:update` after the task.

### Task 2: Core, test-first

**Files:** create `engine/AsteroidsCore.ts`, `__tests__/asteroidsCore.test.ts` (recording fake `GameAudio`, numeric fake clock starting at `bullets.cooldown` so the first shot is not blocked by `lastShotTime = 0`; no `vi.mock`, no casts to internals). Helpers in the test: `step(core, ms, controls?)` loops `update(16, ...)`; `clearField(core)` calls `destroy()` on every Asteroid from `getEntities()`; `crashShip(core)` moves an Asteroid onto the Ship; `parkAsteroids(core)` moves every Asteroid to a far corner with zero velocity (public `setPosition`/`setVelocity`) so long runs cannot kill the Ship by chance.

- [ ] Write failing tests:
  - starts in `menu`; `update` in `menu` changes nothing; `start()` → `playing`, Level 1, four Large Asteroids, `gameStart` sound.
  - clearing the field → `loading`, Level 2, Level Bonus 100 added to Score; after `levelTransitionDelay` of updates → `playing` with five Asteroids.
  - **bug regression:** `restart()` during a Level Transition, clear the field again shortly after; the new transition still lasts the full `levelTransitionDelay`.
  - Ship hit → Lives 2, Ship inactive; Respawn after `respawnDelay`; **paused** for 10 s in between → Ship still inactive at resume, respawns `respawnDelay` of play later (Q15).
  - Last Life lost → `gameOver`; `update` afterwards changes nothing.
  - Saucer (asteroids parked every step): at Level 2 no Saucer before `max(5000, firstSpawnDelay − spawnDelayVariance)` of play after the Level Transition, one appears by `firstSpawnDelay + spawnDelayVariance`; time spent paused does not count.
  - pause/resume/togglePause: only `playing`↔`paused`; pause plays `pause` and pauses `effects`/`ambient`; resume mirrors; repeated pause is a no-op.
  - fire: holding `fire` spawns a Player Bullet, then no more than one per `bullets.cooldown` of the injected clock.
  - Collision application (promised by the #6 plan): a fired Player Bullet reaching an Asteroid parked in its path adds its points and Splits a Large Asteroid into two Medium. (Saucer-Bullet outcomes stay covered at the `collide` interface; the core offers no way to place a Saucer Bullet.)
  - Score ≥ 10,000 sets Pending Extra Life; granted (Lives +1) at the next Level clear.
  - High Score: initial value from options; beaten Score raises it; `clearHighScore()` → 0.
  - snapshot: identity stable across updates that change nothing; `subscribe` listener fires on change only; unsubscribe works.
- [ ] Implement `AsteroidsCore` by moving rules from `AsteroidsEngine` (collisions via #6's `collide`).
- [ ] Green. Commit `refactor(asteroids): extract game rules core on simulated time`.

### Task 3: Browser adapter and hook

- [ ] Rewrite `AsteroidsEngine` as the adapter around `AsteroidsCore`; drop `AsteroidsEngineEvents`.
- [ ] Rewrite `useAsteroids` on `useSyncExternalStore`; `index.tsx` untouched except as types require.
- [ ] `__tests__/asteroidsEngine.test.ts` (happy-dom has no 2D context, so this test alone stubs `getContext` with a no-op context and `Audio` as `soundSystem.test.ts` does; the browser is the true-external dependency; `requestAnimationFrame` is stubbed with a manual frame queue so frames are driven deterministically): menu key starts, `Escape` toggles pause, `Enter` restarts only from `gameOver`, held keys drive the Ship, High Score saved to `localStorage` when beaten, removed on clear, and a lower Score after a clear saved again, `destroy()` removes listeners and stops further frames.
- [ ] `npx tsc --noEmit`, `npm run lint`, asteroids vitest, `npm run graph:update`.
- [ ] Commit `refactor(asteroids): drive the core from a browser adapter and snapshot hook`.

### Task 4: Glossary (Q6)

- [ ] Add **Simulated Time** ("Game time that advances only while a Level is played or in a Level Transition; frozen while paused") and **Pause** (only from a Level being played) to `GLOSSARY.md`. Commit `docs(asteroids): define simulated time and pause`.

### Task 5: Review and land

- [ ] Fresh reviewer subagent against CLAUDE.md and this plan (Q7); fix findings.
- [ ] Rebase onto `origin/develop`, retest, fast-forward push to `develop`.

## Out of scope

- Renderer `Date.now()` animation clocks (cosmetic twinkle/flash).
- Seeded RNG (Q14).
- `npm run build` / browser verification: not run (no browser in this lane); `tsc`, core and adapter tests cover the wiring.

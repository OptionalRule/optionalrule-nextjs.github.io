# Asteroids Collision Outcomes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Decide every collision consequence (who is destroyed, who scores, how many points) in one rules module that returns domain outcomes; the engine only applies them (explosions, score, Split, sounds, ship death). Architecture item #6 in `docs/wiki/architecture-strong-items.md`.

**Architecture:** Replace `CollisionSystem` (detects pairs, then mutates entities) plus `AsteroidsEngine.handleCollisionEffects` (re-derives the outcome with `instanceof` and `!getActive()`) with one pure-ish module `engine/systems/collisions.ts` exposing `collide(entities, playerShipId): CollisionOutcome[]`. It reads entity state but never mutates it. The engine applies each outcome in order.

**Tech Stack:** TypeScript strict, Vitest (`vitest.unit.config.ts`, happy-dom).

## Binding constraints

- Decisions (docs/wiki/decision-log.md): **Q4** dead code deleted in its own commit; **Q6** new module names go into `src/features/games/asteroids/GLOSSARY.md`; **Q7** reviewer before merge; **Q14** rules return domain outcomes, Split and its RNG stay in the engine, no seeded RNG.
- CLAUDE.md: no `any`, `_`-prefixed unused params, no code comments, Conventional Commits `refactor(asteroids): ...`, `npm run graph:update` after src edits, commit and push to `develop` per step.
- **No gameplay change.** Every behaviour listed under "Current behaviour" must survive unchanged.

## Current behaviour (as of `712ffab`)

Pairs that can collide: Ship↔Asteroid, Ship↔Saucer, Ship↔Bullet, Bullet↔Asteroid, Bullet↔Saucer (`CollisionSystem.shouldCollide`). Pairs are visited in entity-index order; a pair is skipped if either entity is already inactive (fix `a27fe7b`: two Bullets reaching one Asteroid in one frame must not double-score or double-Split).

| Pair | Rule | Engine effect |
|---|---|---|
| Ship↔Asteroid | Ship destroyed unless Invulnerable; Asteroid untouched | ship death |
| Ship↔Saucer | Ship destroyed unless Invulnerable; Saucer untouched | ship death |
| Ship↔Bullet | ignored if the Bullet is the Ship's own; ignored if Invulnerable; else Bullet and Ship destroyed | ship death |
| Bullet↔Asteroid | Bullet and Asteroid destroyed (any Bullet) | `asteroid` explosion; points only for a Player Bullet (fix `9d6eca1`); Split → `asteroidSplit` sound, else `asteroidDestruction` |
| Bullet↔Saucer | ignored if the Bullet is that Saucer's own; else Bullet and Saucer destroyed | only for a Player Bullet: `saucer` explosion, points, `saucerDestroyed` sound, stop `saucerArrival` |

Ship death (`handleShipDestroyed`) is already guarded by `isProcessingShipDeath`; it is unchanged by this item.

## Design it twice

**Design A — per-pair rule function.** `collisionOutcome(a: Entity, b: Entity, playerShipId): CollisionOutcome | null`; the engine keeps detection (`CollisionSystem.checkCollisions`), loops pairs, applies each outcome and skips pairs whose entities it already deactivated.
- Small interface, pure.
- But the frame invariant "an entity is consumed at most once per frame" stays in the engine, which is exactly the split the two prior fixes (`a27fe7b`, `9d6eca1`) landed on. Detection and rules remain two modules a caller must sequence. Low locality.

**Design B — frame-level collide (chosen).** `collide(entities: readonly Entity[], playerShipId: string): CollisionOutcome[]`. One entry point does pair detection, the collision matrix, ownership/Invulnerability rules, scoring and the consumed-once invariant, and returns ordered outcomes. It never mutates entities; the engine deactivates the entities named in each outcome and runs effects.
- Deeper: callers learn one function and one union type. Tests build plain entities and assert on returned outcomes — no `EngineInternals` casts, no Proxy mocks of render/sound.
- The consumed-once invariant lives next to the rules that consume entities.
- Cost: the engine must deactivate entities the outcome names (one small `apply` switch). Accepted: that is the engine's "apply" role per Q14.

### Interface (Design B)

```ts
export type Shooter = 'player' | 'saucer'

export type CollisionOutcome =
  | { kind: 'asteroidShot'; asteroid: Asteroid; bullet: Bullet; shooter: Shooter; points: number }
  | { kind: 'saucerShot'; saucer: Saucer; bullet: Bullet; shooter: Shooter; points: number }
  | { kind: 'shipDestroyed'; ship: Ship; bullet?: Bullet }

export function collide(entities: readonly Entity[], playerShipId: string): CollisionOutcome[]
```

Invariants:
- Outcomes are in pair-visit order (i < j over `entities`), so score is added in the same order as today (Extra Life threshold behaviour unchanged).
- Each entity appears as a destroyed party in at most one outcome per call. An Asteroid or Saucer that a Ship touches is not consumed.
- `points` is `asteroid.getPoints()` / `saucer.getPoints()` when `shooter === 'player'`, else `0`.
- `shooter` is `'player'` iff `bullet.getSourceId() === playerShipId`.
- `shipDestroyed.bullet` is set when a Saucer Bullet killed the Ship; that Bullet is consumed.
- Inactive entities never take part. Type narrowing uses `instanceof` (no `as` casts).

Engine application (`AsteroidsEngine.applyCollisionOutcome`):
- `asteroidShot`: `bullet.destroy()`, `asteroid.destroy()`, explosion, `addScore(points)` when `shooter === 'player'`, `asteroid.split()` and sounds as today.
- `saucerShot`: `bullet.destroy()`, `saucer.destroy()`; when `shooter === 'player'` run today's `handleSaucerDestroyed`.
- `shipDestroyed`: `bullet?.destroy()`, `ship.destroy()`, `handleShipDestroyed()`.

Today the engine calls `handleShipDestroyed` after *every* pair once the Ship is inactive; that only re-enters while a death is already being processed, where `isProcessingShipDeath` makes it a no-op, so calling it only on `shipDestroyed` is equivalent.

Engine-side application loses its direct test when `asteroidScoring.test.ts` is deleted. Accepted for this item: #7 (`2026-11-21-asteroids-rules-core.md`) moves the rules into a core whose tests drive real collisions through `update` and assert Score, which covers the application without casts or mocks.

Because `collide` does not mutate, the engine applies all outcomes after the call; the consumed-once invariant inside `collide` gives the same result as today's resolve-then-skip loop.

`Asteroid.takeDamage` (health is always 1) and `Ship.takeDamage` stop being called by collisions. Their removal is out of scope unless they become unused; if unused, delete each in its own commit (Q4).

## Tasks

### Task 1: Delete dead collision events (Q4, own commit)

**Files:** `engine/systems/CollisionSystem.ts`, `types.ts`

- [ ] Confirm no callers: `grep -rn "getGameEvents\|clearEvents\|GameEvent\|CollisionEvent" src/`.
- [ ] Remove `getGameEvents`, `clearEvents`, the write-only `gameEvents` field and its push; remove `GameEvent` and `CollisionEvent` from `types.ts` if now unreferenced.
- [ ] `npx vitest run --config vitest.unit.config.ts src/features/games/asteroids` and `npm run lint` pass.
- [ ] Commit `refactor(asteroids): remove unused collision game events`.

### Task 2: Collision rules module, test-first

**Files:** create `engine/systems/collisions.ts`, create `__tests__/collisions.test.ts`.

- [ ] Write failing tests (entities built at the same point so they overlap; Ship made vulnerable/invulnerable via `respawn` + `update` past `invulnerabilityTime`, or constructed fresh, which is vulnerable):
  - Player Bullet on Large Asteroid → one `asteroidShot`, `shooter: 'player'`, `points` = large points.
  - Saucer Bullet on Asteroid → `asteroidShot`, `shooter: 'saucer'`, `points: 0`.
  - Two Player Bullets on one Asteroid → exactly one outcome (consumed-once).
  - Player Bullet on Saucer → `saucerShot` with Saucer points; the Saucer's own Bullet on it → no outcome.
  - Vulnerable Ship touching Asteroid → `shipDestroyed` without bullet; Invulnerable Ship → none.
  - Ship touching Saucer → `shipDestroyed`.
  - Saucer Bullet on vulnerable Ship → `shipDestroyed` with that bullet; Player Bullet on own Ship → none.
  - Asteroid↔Saucer, Bullet↔Bullet, distant entities, inactive entities → none.
  - `collide` does not change any entity's `getActive()`.
  - Not consumed: an Invulnerable Ship hit by a Saucer Bullet leaves that Bullet free to shoot an Asteroid in the same call; an Asteroid touched by a Ship can still be shot in the same call.
  - Consumed across kinds: a Bullet that shoots an Asteroid cannot also destroy the Ship or a Saucer; a Ship already destroyed by an Asteroid yields one `shipDestroyed` even when a Saucer Bullet also overlaps it.
  - Two outcomes come back in entity order.
  - An Explosion overlapping anything yields nothing.
- [ ] Run, see them fail (module missing).
- [ ] Implement `collide` (circle test via `GameMath.circleCollision`, matrix, rules, consumed set).
- [ ] Tests pass. `npm run graph:update`. Commit `refactor(asteroids): decide collision outcomes in a rules module`.

### Task 3: Engine applies outcomes; delete CollisionSystem

**Files:** `engine/AsteroidsEngine.ts`, delete `engine/systems/CollisionSystem.ts`, delete `__tests__/collisionSystem.test.ts` and `__tests__/asteroidScoring.test.ts` (their behaviours are now covered at the `collide` interface — replace, don't layer).

- [ ] `checkCollisions()` becomes `for (const outcome of collide(this.entities, this.ship.getId())) this.applyCollisionOutcome(outcome)`.
- [ ] Remove `handleCollisionEffects`, `collisionSystem` field and import.
- [ ] `Asteroid.takeDamage` and `Ship.takeDamage` become unused: delete them in their own commit (Q4) `refactor(asteroids): remove unused takeDamage`. `getEntityType` stays (RenderSystem uses it). `Asteroid.health` stays (reported by `getAsteroidState`).
- [ ] Asteroids vitest + `npm run lint` + `npx tsc --noEmit` pass. `npm run graph:update`.
- [ ] Commit `refactor(asteroids): apply collision outcomes in the engine`.

### Task 4: Glossary (Q6)

- [ ] Add **Collision Outcome** and **Shooter** (defined via the existing Player Bullet / Saucer Bullet terms) to `GLOSSARY.md` via domain-modeling conventions.
- [ ] Commit `docs(asteroids): define collision outcome terms`.

### Task 5: Review and land

- [ ] Fresh reviewer subagent reviews the diff against CLAUDE.md and this plan (Q7); fix findings.
- [ ] `git fetch && git rebase origin/develop`, retest, `git push origin HEAD:develop` (fast-forward only).

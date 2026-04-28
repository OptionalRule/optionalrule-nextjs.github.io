# Star System Generator Orbit Refinement Plan

## Context

Manual review showed many generated orbital profiles feeling too compact. The largest orbit seen during review was around 3.9 AU, which is tight for a full Sun-like planetary profile even if it can be reasonable around dim M dwarfs.

The current generator uses a single geometric orbit ladder for every architecture:

```ts
start = sqrt(luminosity) * random(0.16, 0.34)
spacing = random(1.55, 2.05)
orbit[n] = start * spacing^n
```

That gives physically scaled compact exoplanet-style systems, but it does not express architecture intent strongly enough. Belts, giant planets, dwarf bodies, debris fields, and distant rogue captures are placed by slot order rather than by orbital role.

## Sample Findings

A 4,800-system sample found:

- Overall median outermost orbit: 2.2 AU.
- 63.3% of systems had their outermost generated body at or inside 3.9 AU.
- M dwarfs: 77.6% outermost at or inside 3.9 AU.
- K stars: 48.2% outermost at or inside 3.9 AU.
- G stars: 30.5% outermost at or inside 3.9 AU.
- Solar-ish mixed systems median outermost orbit: 16.3 AU.
- Sparse rocky systems median outermost orbit: 0.4 AU.

This means the generator is not uniformly broken. It can produce wide systems, especially around high-luminosity stars and giant-rich/solar-ish architectures. The problem is that many architecture types collapse into tight absolute AU profiles, and the UI does not provide enough context to distinguish a compact M-dwarf system from an implausibly compressed Sun-like system.

## Root Causes

1. Orbit placement is not architecture-aware.
2. Slot type does not carry orbital intent.
3. Belts, dwarfs, outer debris, and rogue captures do not strongly anchor beyond the snow line.
4. A single spacing ratio controls the whole system, which compresses all slots if the starting orbit is small.
5. Brown dwarf and tiny-luminosity stars can round generated luminosity to 0, which breaks displayed HZ and snow-line context.
6. The UI shows AU but not relation to HZ center or snow line, making compact low-luminosity systems look suspect.

## Design Direction

Do not globally stretch every orbit. Compact inner systems and peas-in-a-pod chains should remain compact. Instead, make orbit generation architecture-aware and band-based.

Add orbit bands:

- `inner`: close-in planets inside or near the inner habitable zone.
- `habitable`: around the habitable zone.
- `snowline`: near the snow line, useful for belts and giant formation.
- `outer`: beyond the snow line.
- `deepOuter`: dwarf, Kuiper-like, debris, and distant remnant territory.
- `extremeOuter`: rare distant rogue captures or unusual debris remnants.

Use existing stellar landmarks:

- HZ center: `sqrt(luminosity)`.
- HZ inner/outer from `calculateHabitableZone`.
- Snow line: `2.7 * sqrt(luminosity)`.

Initial band ranges:

```ts
inner: 0.08-0.7 * hzCenter
habitable: 0.75-1.8 * hzCenter
snowline: 0.7-1.8 * snowLine
outer: 1.8-6 * snowLine
deepOuter: 6-30 * snowLine
extremeOuter: 30-200 * snowLine
```

Apply sensible absolute floors so low-luminosity stars can still produce meaningful outer-system objects.

## Phase 1: Add Orbit Intent Metadata

Extend `ArchitectureSlot` with optional orbital intent:

```ts
orbitBand?: OrbitBand
```

Define `OrbitBand` in the generator domain or architecture module. Keep the model small and stable.

Update slot construction helpers so orbit intent can be attached without disrupting existing architecture count requirements.

## Phase 2: Assign Bands By Architecture

Update architecture slot creation:

- `Compact inner system`: mostly `inner` and `habitable`, with rare `snowline`.
- `Peas-in-a-pod chain`: mostly `inner` and `habitable`, constrained spread.
- `Sparse rocky`: inner survivors plus optional `outer` debris/dwarf.
- `Solar-ish mixed`: rocky bodies `inner`/`habitable`, belts `snowline`, giants `snowline`/`outer`, minor bodies `outer`/`deepOuter`.
- `Giant-rich or chaotic`: giants and debris biased `snowline`/`outer`/`deepOuter`.
- `Debris-dominated`: debris mostly `outer`/`deepOuter`, with possible inner survivors.
- `Failed system`: remnants and debris should often reach `outer`/`deepOuter`.
- `Migrated giant`: migrated giant can be inner, but outer remnants should use `outer`/`deepOuter`.

## Phase 3: Replace Single Orbit Series With Band-Aware Placement

Replace or wrap `generateOrbitSeries`.

New flow:

1. Build architecture slots.
2. Generate an orbit candidate for each slot from its band.
3. Sort candidates by AU.
4. Enforce minimum separation.
5. If a collision occurs, push the outer candidate within its band.
6. If the band cannot fit, escalate to the next wider band.
7. Preserve locked known-body orbits.

The source for each generated orbit should mention architecture-aware orbital placement, not just generic spacing.

## Phase 4: Preserve Known Body Imports

Current known-body handling reserves the nearest generated slot. Keep that behavior, but do not mutate locked imported AU values.

For known bodies:

- Locked `orbitAu` always wins.
- Unknown generated slots should be placed around locked bodies without collision.
- If a known body sits outside the normal band, record a filter note rather than forcing it inward.

## Phase 5: Fix Tiny Luminosity Precision

The generator currently rounds stellar luminosity to 4 decimals. Very small positive luminosities can become 0.

Fix:

- Preserve positive luminosity values below `0.0001`.
- Use adaptive precision or scientific-floor rounding.
- Ensure generated positive luminosity never displays as `0`.

This is required for brown dwarfs, white dwarfs, and very dim remnant systems.

## Phase 6: Add Orbit Audit Metrics

Extend `scripts/audit-star-system-generator.ts` with:

- outermost AU percentiles
- outermost / HZ center percentiles
- outermost / snow-line percentiles
- per-star-type outermost distribution
- per-architecture outermost distribution
- suspiciously compact counts by architecture

Audit checks should account for star type and architecture. A compact M-dwarf chain can be close in absolute AU. A Solar-ish G-star profile with everything inside 3.9 AU should be suspicious.

## Phase 7: Add UI Context

Update orbital display to make manual review easier:

- Keep AU.
- Show thermal zone.
- Show relation to HZ center and/or snow line.
- Example: `3.9 AU · 1.4x snow line`.

This prevents low-luminosity systems from looking wrong solely because their absolute AU scale is small.

## Phase 8: Tests

Add regression tests for:

- Solar-ish systems place belts and giants around or beyond the snow line.
- Giant-rich systems usually extend beyond the snow line.
- Compact and peas-in-a-pod systems remain compact.
- Sparse, debris-dominated, and failed systems can produce outer/deep-outer bodies.
- Brown dwarf luminosity never rounds positive generated values to 0.
- Known imported body orbits remain locked.
- Orbit lists remain sorted and separated.

## Acceptance Criteria

The change is complete when:

- `npm run test:star-system-generator` passes.
- `npm run audit:star-system-generator:deep` passes with 0 findings.
- Deep audit reports orbit distribution by architecture and star type.
- Solar-ish and giant-rich architectures generally reach beyond the snow line.
- Compact and peas-in-a-pod architectures remain intentionally tight.
- G-star systems no longer commonly look like full profiles capped inside a few AU.
- M-dwarf systems may remain close in absolute AU, but their snow-line/HZ ratios make sense.
- Brown dwarf and tiny-luminosity systems no longer show 0 luminosity for positive generated stars.

## Risks

- Over-widening all systems would erase compact exoplanet flavor.
- Too many distant bodies could make every system feel Solar-System-like.
- Architecture replacement slots must use the same orbit rules or they may reintroduce compression.
- UI context should clarify generated scale without cluttering the orbital table.

## Preferred Implementation Strategy

Implement in small commits:

1. Orbit band types and slot metadata.
2. Architecture band assignment.
3. Band-aware orbit generation and known-body preservation.
4. Luminosity precision fix.
5. Audit metrics and tests.
6. UI context.

Run the star-system harness after each behavior commit and the deep audit after the full orbit placement change.

# Binary System Orbital Stability Plan

## Purpose

Generated multi-star systems produce too many orbits that intersect the companion star or sit deep inside the companion's destabilizing zone. The companion stars feature shipped the four-mode classification and gave circumbinary systems an inner keep-out, but orbital-sibling mode places bodies around each star with no outer cutoff, and the circumbinary inner keep-out is below the canonical Holman-Wiegert threshold. The result is physically implausible layouts in moderate-binary systems and (less often) circumbinary systems.

This plan applies Holman-Wiegert stability criteria, rebalances the companion separation AU table toward realistic ranges, and threads the resulting orbit bounds through both primary-star and companion sub-system body generation.

## Findings

- **Circumbinary inner keep-out is 2 × separation** (`generateSystem` line ~4248). Holman-Wiegert (1999) gives ~2.5-3.5× depending on mass ratio and eccentricity; 2× allows planets in the unstable band.
- **Orbital-sibling has no outer cutoff** on either the primary's bodies or the companion sub-system's bodies (`generateBodies` is called with `minOrbitAu` only). A "Moderate binary" at 8 AU still happily places giants at 5-10 AU around each star, which crosses into the companion's well.
- **`COMPANION_AU` bucket values skew tight.** "Moderate binary" at 8 AU is below the real-world moderate-binary range (~10-50 AU); "Wide binary" at 40 AU is on the low end of typical wide pairs (~100-1000 AU). Bucket tightness amplifies the stability problem because the forbidden zone scales with separation.
- **Mass ratio (μ) is available** via the generated `Star.massSolar` on both primary and companion; eccentricity is not modeled. The HW criteria can be applied with computed μ and a fixed conservative `e = 0.3`.
- **`generateBodies` already accepts `minOrbitAu`** (used by circumbinary). Adding a parallel `maxOrbitAu` parameter is the natural integration point; slots whose orbit band lies outside the allowed range get clamped or dropped during slot placement, not trimmed after the fact.

## Stability Math

A new module `lib/generator/companionStability.ts` exposes two pure functions backed by Holman-Wiegert (1999):

```ts
// S-type: planet around one star of a binary
// Outer stability limit as fraction of binary separation
siblingOuterAuLimit(separationAu, primaryMassSolar, companionMassSolar, e?): number

// P-type: circumbinary
// Inner stability limit as fraction of binary separation
circumbinaryInnerAuLimit(separationAu, primaryMassSolar, companionMassSolar, e?): number
```

Both use `μ = m_companion / (m_primary + m_companion)` from the generated stars and default `e = 0.3`. Expected typical outputs:

- S-type: `a_crit ≈ 0.20 × a_bin` (range 0.15-0.30)
- P-type: `a_crit ≈ 3.0 × a_bin` (range 2.5-3.5)

## Implementation Plan

### Phase 1 — Stability Module

Create `lib/generator/companionStability.ts` with the two HW functions and a `companionStability.test.ts` covering:

- equal-mass close binary inputs match HW table values within 5%
- mass-ratio extremes (μ→0, μ→0.5) produce defensible outputs
- functions are pure (no RNG, no side effects)
- input validation: zero or negative separation returns 0

No callers yet — this phase is the math substrate.

### Phase 2 — Circumbinary Inner Limit

Replace the hand-coded `keepOutAu = 2 * separationToBucketAu(...)` in `generateSystem` with `circumbinaryInnerAuLimit(...)` using the primary + companion masses. Update the surrounding zone math:

- `hz.inner = max(baseHz.inner, keepOutAu)` — unchanged shape
- `snowLine = max(snowLine, keepOutAu * 1.5)` — unchanged shape, new keepOutAu value

Update the snapshot tests that hit circumbinary configurations. Run `npm run audit:star-system-generator:quick` and confirm no system shows a body inside the new keep-out radius. Expect roughly 1.5× wider inner exclusion in circumbinary systems.

### Phase 3 — Orbital-Sibling Outer Cutoff

Add `maxOrbitAu` parameter to `generateBodies(...)` symmetrical to existing `minOrbitAu`. Apply at slot-selection time inside `buildArchitectureSlots` / `generateOrbitAssignments`:

- Slot `orbitBand.max > maxOrbitAu` → clamp slot max to `maxOrbitAu`
- Slot `orbitBand.min > maxOrbitAu` → drop slot (architecture must accept a smaller footprint)
- Slots flagged as known/imported with locked orbits past the limit → keep, mark `outOfBandKnown`

Call site changes in `generateSystem`:

- For each `orbital-sibling` companion, compute `siblingMax = siblingOuterAuLimit(sep, m_primary, m_companion)`
- Primary's `generateBodies(...)` call: pass the **minimum** sibling-max across all orbital-sibling companions as `maxOrbitAu`
- Each companion sub-system's `generateBodies(...)` call: pass that companion's `siblingMax` as `maxOrbitAu`

Architecture replacement (`replacementSlotsForUnsatisfiedRequirements`) also needs to respect the max — replacement slots beyond `maxOrbitAu` are dropped, and the architecture-satisfaction evaluator records this as a "trimmed by binary stability" reason rather than an error.

### Phase 4 — Bucket AU Rebalance

Adjust `COMPANION_AU` in `lib/generator/companionGeometry.ts` toward realistic mid-range values:

| Bucket | Current | Proposed | Justification |
|---|---|---|---|
| `close` | 0.5 | 0.5 | Already typical close-binary value |
| `tight` | 1.0 | 1.5 | Tight binaries span ~0.5-3 AU |
| `near` | 2 | 0.05 | "Contact / near-contact" is sub-AU, currently mismatched with volatile mode intent |
| `moderate` | 8 | 20 | Moderate binaries are ~10-50 AU |
| `wide` | 40 | 150 | Wide binaries are ~100-1000 AU |
| `distant` | 80 | 1500 | Very wide / common-proper-motion pairs are 1000-10000 AU |
| `triple` | 1.0 | 1.5 | Inner pair of hierarchical triple, matches `tight` |

Phase 2 + 3 cutoffs scale with these values, so this phase must land **with** the cutoff phases or downstream tests will flip twice. Update `companionGeometry.test.ts` to assert the new bucket values and to keep the `separationToBucketAu` keyword lookup stable.

Run the full focused test suite and snapshot generator. Expect:

- moderate-binary systems retain bodies inside ~4 AU around each star (previously failed at ~1.6 AU)
- wide-binary systems retain bodies inside ~30 AU around each star
- circumbinary systems push their inner bodies out by ~50%

### Phase 5 — Validation & Audit Coverage

Extend `validation.ts` with a `BINARY_STABILITY_CONFLICT` finding emitted when:

- a generated (non-locked) body sits inside a circumbinary keep-out radius
- a generated (non-locked) body around a sibling-mode primary or companion sits outside its outer stability limit
- a locked imported body violates either rule (recorded as `LOCKED_FACT_CONFLICT` with `policyCode: 'BINARY_STABILITY'`, matching the existing locked-fact pattern)

Add audit metrics to `scripts/audit-star-system-generator.ts`:

- count of binary-stability findings across the corpus (hard fail if any generated body violates)
- distribution of trimmed-slot counts per companion mode (warning if average > 3 — indicates buckets still too tight or HW too aggressive)

Run `npm run audit:star-system-generator:deep`. Expect zero generated violations and warnings only if the corpus surfaces an edge case worth tuning.

### Phase 6 — Snapshot Refresh & Verification

Snapshots and prose that depend on companion-mode body counts will shift. Refresh deliberately, not in bulk:

- `spineFullAxisMatrix.test.ts` snapshot — review each shifted cell, confirm the new body[0] still reads coherently
- `generator-determinism.test.ts` — confirm determinism per seed is preserved end-to-end
- companion-specific tests in `__tests__/companion-*.test.ts` — review per-mode expectations
- viewer3d snapshot tests for sub-system rendering — should still match scene-graph shape; only AU values shift

Manual smoke (per the companion stars Phase 5 pattern):

- Generate at least one seed per mode (volatile, circumbinary, orbital-sibling, linked-independent, hierarchical triple)
- Open in the 3D viewer; verify no primary body crosses the companion-star marker or the circumbinary keep-out ring
- Verify the sub-system viewer for orbital-sibling stays inside the companion's allowed band

## Non-Goals

- Modeling binary eccentricity as a generator-level fact (use fixed `e = 0.3` for HW)
- Re-running architecture selection when stability trims invalidate an architecture's required slots — accept "compact rocky chain in moderate binary" generates a shorter chain rather than rejecting the architecture
- Visualizing the stability boundary in the 3D viewer as a discrete ring (the circumbinary inner ring already conveys this; orbital-sibling outer cutoff is implicit in body absence)
- Retroactively adjusting bucket labels in the source-table writeup; the writeup is reference, the generator is authoritative for stability
- Touching `linked-independent` or `volatile` modes — both are already physically safe by construction

## Verification

After all phases:

- `npm run test` — full suite green
- `npm run audit:star-system-generator:deep` — zero `BINARY_STABILITY_CONFLICT` findings on generated bodies
- `npx tsc --noEmit`
- `npm run lint`
- Manual smoke across all five mode combinations as above

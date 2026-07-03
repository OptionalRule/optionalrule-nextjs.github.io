# Generator Audit Baseline Burn-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive `scripts/audit-star-system-generator.ts` from 768 baseline errors to 0 on the default profile so it becomes a real quality gate instead of "exits 1, ignore it".

**Architecture:** Root-cause fixes on both sides of the contract. Validator side: delete the audit script's legacy duplicate checks (they double-emit and use stale plausibility sets) and teach the shared validator about debris-anchored settlements. Generator side: remove one implausible pool value, add a final body-detail reconciliation pass against the shared compatibility sets, run architecture-minimum replacement AFTER the binary-stability survivor filter with window-clamped orbits, clamp debris-field extents to the circumbinary keep-out, and fix the spine-summary bridge join. Finish by flipping the audit to a gate.

**Tech Stack:** TypeScript (strict, no `any`), Vitest unit config, tsx-run audit script.

## Global Constraints

- Root: `src/features/tools/star_system_generator/` — paths relative to it unless starting with `scripts/` or `docs/`.
- **Run all tests on Node 20**: `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npm run test`.
- Never use `any`; use `unknown` or precise types. Prefix unused params with `_`. No code comments unless stating a non-obvious constraint.
- Determinism: every random draw comes from a `SeededRng`; any NEW draw site uses a dedicated fork (`rng.fork('<label>')`) so existing streams don't shift more than the task's own change implies. Old-seed output WILL change on generator-side tasks (approved); regenerate snapshots with `vitest -u` on Node 20 in the same commit.
- Audit iteration loop (fast): `STAR_SYSTEM_AUDIT_PROFILE=quick STAR_SYSTEM_AUDIT_FINDING_LIMIT=100000 PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx tsx scripts/audit-star-system-generator.ts` (288 systems). Task acceptance always re-measured on the DEFAULT profile (960 systems, drop the PROFILE var).
- Census command (used in every task's acceptance):
  ```bash
  STAR_SYSTEM_AUDIT_FINDING_LIMIT=100000 PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx tsx scripts/audit-star-system-generator.ts 2>&1 \
    | grep '^\[error\]' \
    | sed -E 's/^\[error\] \S+ //; s/"[^"]*"/"X"/g; s/[0-9]+(\.[0-9]+)?/N/g' | sort | uniq -c | sort -rn
  ```
- Baseline census (default profile, 2026-07-03, 768 errors total): hot-hydrosphere 205 uncoded + 77 coded, empty-systems 72, settlement-missing-body 51+51, prose.lowercaseFactionMidSentence 47, ARCH_MINIMUM_UNSATISFIED 110, cold-climate 38+38, sub-neptune geology 16+16, belt gravity/geology 7+7 each ×2, hot-atmosphere 7+7, debris keep-out 5.
- The audit's exit-1 stops being "baseline" at Task 7. Until then, each task's gate is: its own category reaches 0 AND no category count increases.
- Commit per task on `develop`, Conventional Commits scope `star-system`, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Gates per task: `npx tsc --noEmit`, `npm run lint`, unit tests on Node 20, census comparison.

### Key research facts (verified 2026-07-03; line numbers may drift a few lines)

- The audit runs BOTH validators: `validateSystem()` (coded, prefixed `CODE: message` via `addValidationFindings`, `scripts/audit-star-system-generator.ts:302-317`) AND its own legacy `auditBody`/`auditSettlement` loops (`scripts/audit-star-system-generator.ts:1099-1100`) with duplicated, sometimes stale logic — that's the double emission.
- Canonical plausibility sets live in `lib/generator/environmentCompatibility.ts:199-234` (`extremeHotAllowedAtmospheres`, `extremeHotAllowedHydrospheres` — which ALLOWS `'Magma seas / lava lakes'` — `coldAllowedClimateTags`, `envelopeAllowedGeologies`, `anomalyAllowedGeologies`). The audit script keeps stale local copies at `scripts/audit-star-system-generator.ts:167-201`; its hydrosphere copy wrongly omits `'Magma seas / lava lakes'`.
- Generator pool `extremeHotVolatiles` (`data/mechanics.json:144`) contains `'Liquid sulfur seas'`, which BOTH validators reject for Furnace/Inferno. The draw site is `rollHydrosphere` (`lib/generator/index.ts:1414-1442`), correctly conditioned on `extremeHotThermalZones` — the pool value is the bug.
- Residual hot-atmosphere / cold-climate / sub-neptune-geology / belt-gravity/geology errors are split-authority drift: details drawn under one category/thermal zone, body later re-categorized. `rollGeology`/`gravityLabel`/`generateClimate` are each internally consistent (`index.ts:1340-1361`, `989-997`, `1444-1468`).
- Empty systems + ARCH minimums: `generateBodies` (`index.ts:2847-2902`) pushes architecture-replacement bodies BEFORE the binary-stability survivor filter (`index.ts:2900`: keep if `orbitAu.locked || (value >= minOrbitAu && value <= maxOrbitAu)`), so replacements can be filtered right back out, and `replacementOrbitAu` can return `undefined` when the band minimum exceeds `maxOrbitAu` (`index.ts:2806`). Minimum definitions: `lib/generator/architecture.ts:194-246`; evaluation `architecture.ts:374-424`. The coded validator already downgrades to warning when `systemIsOrbitVolumeConstrained` (`lib/generator/validation.ts:455-470`); the audit-only empty-system check warns for tight binaries (`scripts/audit-star-system-generator.ts:1060-1075`).
- Settlements: `attachSettlementsToDebrisFields` (`lib/generator/debrisFields.ts:410-426`) deliberately re-anchors a settlement to a debris field with `{ ...settlement, debrisFieldId: field.id, bodyId: undefined }`; both validators then report "missing body \"undefined\"" (`validation.ts:490-499`, audit `:548-561`). Generator intent wins — the validators are wrong.
- Debris keep-out: `deriveDebrisFields` passes `hwInner` (the keep-out) into `spatialExtentForShape` (`debrisFields.ts:338-360`), but most shape branches derive `innerAu` from separation multiples without clamping (`debrisFields.ts:31-118`). The validator exempts co-orbital shapes `{trojan-camp, mass-transfer-stream, accretion-bridge, inner-pair-halo, gardener-cordon}` (`validation.ts:744-766`).
- Prose: `composeSpineSummary` (`lib/generator/graph/render/renderSystemStory.ts:~180-196`) lowercases only a leading `The|A|An` of the summary when appending it after the comma-terminated historical bridge; summary variants starting with other capitalized words (e.g. `'Every schedule in this system bends around {subject:article}, …'`, `templates/destabilizesTemplates.ts:52-55`) produce `", Every …"`, matched by `LOWERCASE_FACTION_MID_SENTENCE_PATTERN` (`scripts/audit-star-system-generator.ts:150-157, 951-957`).
- Snapshot exposure: no `.snap` pins raw `detail.hydrosphere/climate/geology`, but 5 suites pin full-`generateSystem` prose (`spineFullAxisMatrix`, `spineToneGuMatrix`, `spineToneVoiceMatrix`, `proseUnchanged`, `phase6On`) and WILL drift when generator-side RNG consumption or entity inventories change. `crisisShaping` is insulated.

---

### Task 1: De-duplicate the audit — delete legacy twins, keep audit-only checks

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`
- Test: acceptance via census + full vitest suite (the audit script has no unit tests; `npm run test:star-system-generator` runs it after vitest per `package.json:24`)

**Interfaces:**
- Consumes: `validateSystem` findings already flowing through `addValidationFindings` (unchanged).
- Produces: an audit where every check exists exactly once — coded checks via `validation.ts`, audit-only checks (empty-system, `prose.*` regex guards, corpus-statistics floors) stay in the script.

- [ ] **Step 1: Inventory the duplicated checks.** In `auditBody` (`scripts/audit-star-system-generator.ts:~370-460`) and `auditSettlement` (`:~540-600`), list every `addFinding` whose message text also exists in `lib/generator/validation.ts` (`validateBodyEnvironment`, `validateBodyPhysicalContract`, `validateSettlementCompatibility`). Known pairs from the census: extreme-hot atmosphere/hydrosphere (`:373-380`), cold climate (`:391-396`), envelope geology (`:405-407`), belt gravity label + geology (`:419-424`), settlement missing body (`:548-561`), plus any other body/settlement checks with identical message strings (moon-repeat, settlement tags/built-form/GU-function — verify each against validation.ts before touching it).

- [ ] **Step 2: Delete the duplicated legacy checks** and the now-unused stale local sets (`extremeHotAllowedAtmospheres`/`extremeHotAllowedHydrospheres`/`coldAllowedClimateTags`/`envelopeAllowedGeologies`/`anomalyAllowedGeologies` at `scripts/audit-star-system-generator.ts:167-201`) — every remaining plausibility reference in the script must import from `lib/generator/environmentCompatibility.ts` instead of a local copy. Keep intact: the empty-system check (`:1060-1075`), all `prose.*` checks, all corpus statistics/floors, and any legacy check with NO validation.ts twin (each kept check gets a one-line justification in the commit body).

- [ ] **Step 3: Run the census** (quick profile for iteration, then default). Expected: uncoded twins disappear — hot-hydrosphere drops from 205+77 to exactly the coded 77 (the 128 magma-seas-only findings vanish per the canonical allowed-set), settlement drops 102→51, cold-climate 76→38, geology/gravity/atmosphere pairs halve. Total ≈ 437. Record the exact new census in the commit message body — Tasks 2-6 measure against it.

- [ ] **Step 4: Full suite on Node 20 + lint + tsc** (no generator change → zero snapshot churn expected; verify `git status` shows only the script).

- [ ] **Step 5: Commit** `refactor(star-system): single-source audit checks through validateSystem`

---

### Task 2: Debris-anchored settlements are valid — fix the validator

**Files:**
- Modify: `lib/generator/validation.ts` (`validateSettlementCompatibility`, `:490-499`)
- Modify: `lib/generator/types.ts` or wherever the settlement type declares `bodyId` (make it `bodyId?: string` / `bodyId: string | undefined` if not already — check first; `attachSettlementsToDebrisFields` already writes `undefined`, so the type may already allow it)
- Test: `lib/generator/__tests__/validation.test.ts` (extend; create the describe block if the file organizes differently — follow its existing structure)

**Interfaces:**
- Consumes: `GeneratedSystem.debrisFields` (each field has `id`), settlements with `debrisFieldId?: string`.
- Produces: validator behavior — a settlement with `debrisFieldId` referencing an existing field and `bodyId === undefined` is VALID; `SETTLEMENT_MISSING_BODY` fires only when (a) `bodyId` is set but matches no body, or (b) BOTH `bodyId` and `debrisFieldId` are unset/unresolvable. New code `SETTLEMENT_MISSING_DEBRIS_FIELD` for a dangling `debrisFieldId`.

- [ ] **Step 1: Failing tests** — build a minimal `GeneratedSystem` fixture (copy the fixture style already used in validation tests): (1) settlement `{bodyId: undefined, debrisFieldId: 'df-1'}` with `debrisFields: [{id: 'df-1', …}]` → zero settlement findings; (2) `{bodyId: undefined, debrisFieldId: 'df-missing'}` → one `SETTLEMENT_MISSING_DEBRIS_FIELD` error; (3) `{bodyId: 'nope', debrisFieldId: undefined}` → `SETTLEMENT_MISSING_BODY` (existing behavior preserved); (4) `{bodyId: undefined, debrisFieldId: undefined}` → `SETTLEMENT_MISSING_BODY`.
- [ ] **Step 2: Run → FAIL** (case 1 currently emits SETTLEMENT_MISSING_BODY).
- [ ] **Step 3: Implement** in `validateSettlementCompatibility`:

```ts
const body = settlement.bodyId === undefined
  ? undefined
  : system.bodies.find((candidate) => candidate.id === settlement.bodyId)
if (settlement.bodyId === undefined && settlement.debrisFieldId !== undefined) {
  const field = system.debrisFields.find((candidate) => candidate.id === settlement.debrisFieldId)
  if (!field) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_MISSING_DEBRIS_FIELD', path: `${path}.debrisFieldId`,
      message: `Settlement references missing debris field "${settlement.debrisFieldId}".`, source: 'generated' }))
  }
  return findings
}
if (!body) {
  findings.push(finding({ severity: 'error', code: 'SETTLEMENT_MISSING_BODY', path: `${path}.bodyId`,
    message: `Settlement references missing body "${settlement.bodyId}".`, source: 'generated' }))
  return findings
}
```
(Adapt the `finding(...)` call shape and `source` value to the file's existing helpers — copy a neighboring finding literally. If `validationCodes` is a registry, add `settlementMissingDebrisField` there rather than inlining the string. Skip the body-dependent checks below this guard for debris-anchored settlements — they have no body.)

- [ ] **Step 4: Run tests → PASS. Census: settlement-missing-body 51 → 0** (default profile), nothing else moves. Full suite + lint + tsc; no snapshot churn expected (validator-only).
- [ ] **Step 5: Commit** `fix(star-system): validate debris-anchored settlements against their field`

---

### Task 3: Environment reconciliation — kill split-authority detail drift + the sulfur pool value

**Files:**
- Modify: `data/mechanics.json` (line 144: remove `"Liquid sulfur seas"` from `extremeHotVolatiles`; do NOT touch `hydrosphereTable` roll 15 — Hot-zone sulfur worlds remain legal)
- Create: `lib/generator/reconcileBodyDetails.ts`
- Modify: `lib/generator/index.ts` — wire the reconciliation at the end of `generateBodies` (after the survivor filter, inside/around `applyFinalDesignations`, `:2900-2902`)
- Test: `lib/generator/__tests__/reconcileBodyDetails.test.ts` (create)

**Interfaces:**
- Consumes: the shared sets from `environmentCompatibility.ts` (`extremeHotAllowedAtmospheres`, `extremeHotAllowedHydrospheres`, `coldAllowedClimateTags`, `envelopeAllowedGeologies`), `extremeHotThermalZones`/`coldThermalZones` from `domain.ts:64-65`, and the exact thermal-zone + category derivations `validation.ts:239-285` uses (import the same helpers — `isEnvelopeCategory`, `isSolidSurfaceCategory` or their equivalents — so generator and validator cannot disagree).
- Produces:
```ts
export function reconcileBodyDetails(body: GeneratedBody, rng: SeededRng): GeneratedBody
```
Pure per-body correction: derive the FINAL thermal zone and category from the body as-built, then for each incompatible detail re-pick deterministically from the allowed pool via `rng` (the caller passes a dedicated fork per body). Rules, mirroring the validator exactly:
  - Furnace/Inferno + non-envelope + non-anomaly: atmosphere ∉ `extremeHotAllowedAtmospheres` → re-pick from `extremeHotAtmospheres` pool; hydrosphere ∉ `extremeHotAllowedHydrospheres` → re-pick from the (now sulfur-free) `extremeHotVolatiles` pool.
  - Cold/Cryogenic/Dark + solid-surface: any climate tag ∉ `coldAllowedClimateTags` → replace that tag with a pick from `coldClimateTags` (mechanics.json:149) not already present on the body.
  - Envelope category (sub-neptune/gas-giant/ice-giant): geology ∉ `envelopeAllowedGeologies` → re-pick from `envelopeGeologies`; hydrosphere/atmosphere likewise if the validator constrains them (mirror `validateBodyPhysicalContract` exactly — read it before coding).
  - Belt: geology → `'Minor-body rubble and collision families'` (single value, no draw); gravityLabel → `'Not applicable: distributed belt or swarm.'` (the exact string `gravityLabel()` at `index.ts:989-997` produces).
  - Re-picked values keep the existing `Fact<string>` wrapping — preserve `confidence`/`source` from the value being replaced, and never touch `locked` facts (check how locked imports mark facts; skip reconciliation for locked details and let the validator's locked-conflict path handle them).

- [ ] **Step 1: Failing tests** — hand-build bodies with each incompatibility (furnace body with `'Liquid sulfur seas'`; cold solid body with a hot climate tag; sub-neptune with `'Active volcanism'` geology; belt with a surface-gravity label) and assert `reconcileBodyDetails` output passes the corresponding `validation.ts` check (call the real validator functions on a wrapping fixture — real-behavior assertion, not string equality). Plus: a compatible body is returned unchanged (same object values), and same-seed determinism.
- [ ] **Step 2: Run → FAIL** (module not found).
- [ ] **Step 3: Implement + wire.** In `generateBodies`, after `const filtered = bodies.filter(…)`:

```ts
const reconciled = filtered.map((body) => reconcileBodyDetails(body, rng.fork(`reconcile-${body.id}`)))
return applyFinalDesignations(systemName, reconciled)
```
(If `body.id` is assigned only inside `applyFinalDesignations`, fork on the body's index or pre-designation identifier instead — inspect first; the fork label must be stable per body.)

- [ ] **Step 4: Run tests → PASS. Regenerate snapshots on Node 20** (`vitest -u`; the 5 exposed prose suites may drift because entity inventories can change). **Census (default): hot-hydrosphere 77 → 0, hot-atmosphere 7 → 0, cold-climate 38 → 0, sub-neptune geology 16 → 0, belt gravity 7 → 0, belt geology 7 → 0.** Full suite + lint + tsc.
- [ ] **Step 5: Commit** `fix(star-system): reconcile body details with final thermal zone and category`

---

### Task 4: Architecture minimums — replace after the survivor filter, inside the stable window

**Files:**
- Modify: `lib/generator/index.ts` `generateBodies` (`:2847-2902`) and `replacementOrbitAu` (`:~2806`)
- Test: `lib/generator/__tests__/architectureEnforcement.test.ts` (create)

**Interfaces:**
- Consumes: `evaluateArchitectureSatisfaction`, `replacementSlotsForUnsatisfiedRequirements` (`architecture.ts:374-446`) — unchanged signatures.
- Produces: reordered `generateBodies` internals; no signature change. New behavior: (1) survivor filter runs FIRST; (2) replacement slots are computed from the filtered list; (3) replacement orbits are clamped into `[max(minOrbitAu, bandMin), min(maxOrbitAu, bandMax)]` — a replacement is only skipped when that intersection is empty; (4) if the final list is empty and the window `[minOrbitAu, maxOrbitAu]` is non-empty (and the system isn't the volatile-companion hazard-belt path), force-place one body of the architecture's first `replacementKind` at the window midpoint via the existing replacement machinery.

- [ ] **Step 1: Failing tests** — drive `generateBodies` directly (it's module-internal? if not exported, test through `generateSystem` with seeds/architectures known to trip the filter — find 2-3 offending seeds from the audit output, e.g. `ssg-audit-frontier-balanced-low-sparse-0000`, and use their exact options via the audit's `makeOptions` shape). Assertions: (a) for each offending seed, `evaluateArchitectureSatisfaction(system.architecture.name.value, system.bodies)` returns no unmet minimum OR `systemIsOrbitVolumeConstrained(system)` is true; (b) `system.bodies.length > 0` OR the tight-binary condition from the audit's empty-system check holds; (c) every body orbit respects `orbitAu.locked || (minOrbitAu <= value <= maxOrbitAu)` — reuse the filter predicate.
- [ ] **Step 2: Run → FAIL on the offending seeds.**
- [ ] **Step 3: Implement the reorder + clamp.** Sketch (adapt names to the real code):

```ts
const survivors = bodies.filter((b) => b.orbitAu.locked || (b.orbitAu.value >= minOrbitAu && b.orbitAu.value <= maxOrbitAu))
const slots = replacementSlotsForUnsatisfiedRequirements(evaluateArchitectureSatisfaction(architectureName, survivors))
for (const slot of slots) {
  const orbitAu = replacementOrbitAu(slot, rng, minOrbitAu, maxOrbitAu)
  if (orbitAu === undefined) continue
  … generate replacement body at orbitAu, push to survivors …
}
if (survivors.length === 0 && minOrbitAu < maxOrbitAu && Number.isFinite(minOrbitAu)) {
  … force-place one replacementKind body at (minOrbitAu + Math.min(maxOrbitAu, minOrbitAu * 4)) / 2 …
}
return applyFinalDesignations(systemName, survivors.map((body) => reconcileBodyDetails(body, rng.fork(`reconcile-${…}`))))
```
`replacementOrbitAu` gains `minOrbitAu`/`maxOrbitAu` params and intersects its band with the window instead of returning `undefined` whenever bandMin > maxOrbitAu. Keep all draws on the same `rng` fork discipline the function already uses. The midpoint formula above is a placeholder shape — pick something deterministic inside the window; if `maxOrbitAu` is `Infinity`, use the architecture band's own midpoint clamped ≥ `minOrbitAu`.

- [ ] **Step 4: Run tests → PASS. Snapshot regen on Node 20. Census (default): ARCH_MINIMUM_UNSATISFIED 110 → 0 errors** (warnings for orbit-constrained systems are fine and expected), **empty-systems 72 → 0 errors** (tight-binary warnings fine). Full suite + lint + tsc.
- [ ] **Step 5: Commit** `fix(star-system): enforce architecture minimums inside the binary stability window`

---

### Task 5: Clamp debris-field extents to the circumbinary keep-out

**Files:**
- Modify: `lib/generator/debrisFields.ts` (`spatialExtentForShape`, `:31-118`)
- Test: `lib/generator/__tests__/debrisFields.test.ts` (extend or create, following existing test layout)

**Interfaces:**
- Consumes: `inputs.hwInner` (already passed in at `:338-360`).
- Produces: for every shape NOT in the validator's co-orbital exemption set `{trojan-camp, mass-transfer-stream, accretion-bridge, inner-pair-halo, gardener-cordon}` (`validation.ts:744-766`), the returned extent satisfies `innerAu >= hwInner` and `outerAu > innerAu`. Implement as a single clamp applied to the computed extent before return — one code path, not per-branch edits:

```ts
const CO_ORBITAL_SHAPES: ReadonlySet<DebrisFieldShape> = new Set(['trojan-camp', 'mass-transfer-stream', 'accretion-bridge', 'inner-pair-halo', 'gardener-cordon'])

function clampToKeepOut(extent: SpatialExtent, shape: DebrisFieldShape, hwInner: number): SpatialExtent {
  if (CO_ORBITAL_SHAPES.has(shape) || extent.innerAu.value >= hwInner) return extent
  const innerAu = { ...extent.innerAu, value: hwInner }
  const outerValue = Math.max(extent.outerAu.value, hwInner * 1.2)
  return { ...extent, innerAu, outerAu: { ...extent.outerAu, value: outerValue } }
}
```
(Match the real `SpatialExtent`/`Fact` shapes — the `{ ...fact, value }` spread must preserve confidence/source fields; check whether the extent facts carry a `basis`/note string and update it to say `clamped to circumbinary keep-out` only if sibling code already writes such notes.)

- [ ] **Step 1: Failing test** — call `spatialExtentForShape('exocomet-swarm', …)` (and `common-envelope-shell`, `kozai-scattered-halo`) with inputs where the unclamped `innerAu` falls below `hwInner`; assert `innerAu >= hwInner` and `outerAu > innerAu`. Co-orbital shape (`trojan-camp`) with the same inputs stays unclamped.
- [ ] **Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS; snapshot regen if any prose drifts (unlikely — extents aren't prose inputs, but verify); census: DEBRIS_FIELD_GEOMETRY_INVALID 5 → 0.** Full suite + lint + tsc.
- [ ] **Step 5: Commit** `fix(star-system): clamp debris field extents to circumbinary keep-out`

---

### Task 6: Spine-summary bridge join — stop emitting ", Capitalized …"

**Files:**
- Modify: `lib/generator/graph/render/renderSystemStory.ts` (`composeSpineSummary`, `:~180-196`)
- Test: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts` (extend)

**Interfaces:**
- Produces: `composeSpineSummary(bridge, summary)` — unchanged signature. New rule: when the summary starts with `The|A|An`, keep today's behavior (lowercase the article, comma-join). When it starts with any other capitalized word, convert the bridge's trailing comma to a period and append the summary capitalized. When it starts lowercase (e.g. a `{subject:article}` slot rendered as "the …"), keep the comma-join.

- [ ] **Step 1: Failing tests**

```ts
describe('composeSpineSummary bridge joins', () => {
  it('comma-joins and lowercases a leading article', () => {
    expect(composeSpineSummary('X took shape in the war,', 'The ledger never closed.'))
      .toBe('X took shape in the war, the ledger never closed.')
  })
  it('period-joins a summary starting with a capitalized non-article', () => {
    expect(composeSpineSummary('X took shape in the war,', 'Every schedule bends around it.'))
      .toBe('X took shape in the war. Every schedule bends around it.')
  })
  it('comma-joins a summary starting lowercase', () => {
    expect(composeSpineSummary('X took shape in the war,', 'the survey office disagrees.'))
      .toBe('X took shape in the war, the survey office disagrees.')
  })
})
```
(`composeSpineSummary` is currently module-private — export it, mirroring how `pronominalizeSecondMention` is exported for its tests.)

- [ ] **Step 2: Run → FAIL. Step 3: Implement**:

```ts
function composeSpineSummary(bridge: string, summary: string): string {
  if (summary.length === 0) return bridge
  const articleMatch = summary.match(LEADING_ARTICLE_PATTERN)
  if (articleMatch !== null) {
    const lowered = articleMatch[1].toLowerCase()
    return `${bridge} ${lowered}${summary.slice(articleMatch[1].length)}`
  }
  if (/^[A-Z]/.test(summary)) {
    return `${bridge.replace(/,$/, '.')} ${summary}`
  }
  return `${bridge} ${summary}`
}
```

- [ ] **Step 4: Run → PASS. Snapshot regen on Node 20** (spine summaries change wherever a bridge met a capitalized summary — read the diff; the new period-joined sentences must read cleanly). **Census: prose.lowercaseFactionMidSentence 47 → 0.** Also confirm `prose.bridgeSubjectArticle` (audit `:948`) didn't increase. Full suite + lint + tsc.
- [ ] **Step 5: Commit** `fix(star-system): period-join spine bridge before capitalized summary variants`

---

### Task 7: Flip the audit to a gate

**Files:**
- Modify: `CLAUDE.md` (project) — replace the "audit exits 1 with ~50 pre-existing content errors — baseline" note with: the audit is a gate; `npm run test:star-system-generator` must exit 0.
- Modify: `docs/superpowers/plans/2026-07-02-narrative-conflict-refactor.md` STATUS block — strike the baseline-errors line.
- Test: the audit itself.

- [ ] **Step 1: Run the default-profile audit → expect exit 0, zero `[error]` lines.** If any error remains, it belongs to one of Tasks 1-6 — fix there, do not special-case here. Run the deep profile once (`STAR_SYSTEM_AUDIT_PROFILE=deep`, 4800 systems, slow) and record its census in the commit body; deep-only stragglers get filed as follow-ups in the commit message, not fixed here.
- [ ] **Step 2: Update the two docs.** Verify `npm run test:star-system-generator` (vitest + audit) passes end-to-end on Node 20.
- [ ] **Step 3: Full gates one last time: `npm run test`, lint, tsc, `npm run build`.**
- [ ] **Step 4: Commit** `chore(star-system): promote generator audit to a hard gate`

---

## Self-review notes

- Coverage vs census: hot-hydrosphere (T1 kills the 128 stale-set findings, T3 the 77 real ones), hot-atmosphere (T3), cold-climate (T1 halves, T3 zeroes), empty-systems + ARCH (T4), settlements (T2 after T1 halves), sub-neptune/belt details (T1 halves, T3 zeroes), debris keep-out (T5), prose (T6), gate (T7). 768 → 0 fully allocated.
- Order is load-bearing: T1 first so every later census is single-emission; T3 depends on the sulfur-free pool landing in the same task as the reconciler (otherwise reconciliation re-picks sulfur back in); T4 reuses T3's `reconcileBodyDetails` in its final return; T7 last.
- Adjudications encoded: magma seas on furnace worlds are PLAUSIBLE (canonical runtime set wins over the audit's stale copy); debris-anchored settlements are VALID (generator intent wins); `'Liquid sulfur seas'` on Furnace/Inferno is implausible per both validators (generator pool loses); Hot-zone (non-extreme) sulfur worlds stay legal.
- Snapshot churn expected on T3/T4/T6 (generator/prose changes), none on T1/T2/T5 (validator/audit/geometry-only) — verify per task rather than assume.
- Type-consistency: `reconcileBodyDetails(body, rng)` defined in T3, reused in T4's return path; `SETTLEMENT_MISSING_DEBRIS_FIELD` introduced once in T2.

# Narrative Conflict Refactor Implementation Plan

> **STATUS (2026-07-03): COMPLETE.** All 20 tasks done and pushed to
> `origin/develop` (Tasks 16–20 in commits `bdbc9c0..410c645`, including the
> Task 15 owed audit validation and the final whole-branch review fixes).
> Final review verdict: ready to merge. Full suite green on Node 20
> (1701 tests — historical; CI has since moved to Node 24), tsc/lint clean,
> build + search-index untouched-check pass.
> Repetition floors measured: spine summaries 1.0 (≥0.90), body paragraphs
> 1.0 (≥0.85), phenomenon conflictHooks 0.892 (≥0.60), max hook repeat 4 (≤4).
>
> **Follow-ups filed (not blocking):**
> - ~~Beat-opener phrase repeats within a single system~~ FIXED `0cbad0b`:
>   per-system beat-template decks; within-system repeats 62% → 0% of systems.
> - ~~Thin hook tag×category cells~~ IMPROVED `1395704`: all 21 cells of
>   {contracts, encounters, twists} × 7 high-traffic tags now ≥5 entries
>   (+42). Max hook-repeat still exactly 4 (ceiling entries 8 → 7, now
>   almost all in rumor/npc tag-subcells) — gate unchanged at ≤4; reaching
>   ≤3 would need a rumor/npc subcell pass (diminishing returns).
> - Rumor/npc resonant-term bias halved in Task 20; thematic hook↔system
>   coherence pinned only by the metrics corpus — spot-read after next
>   content change.
> - `data/hooks.json` rumors/npcs/twists ordering drifted from `GU_HOOKS.md`
>   (pre-existing) — regeneration produces an ordering-only diff.
> - `bindEntryText` is exported and throws on entries failing `canBindEntry`
>   (production path safe; document precondition or throw descriptively).
> - ~~Story-shape monoculture~~ FIXED 2026-07-03 (`add75eb..e75cc86`), from
>   user report "every System story starts with 'The compact between X and Y
>   broke…'": spine selection was argmax (same edge type won every seed per
>   tone/distribution), backstory attached 100%, one bridge template per
>   family, and CONTROLS/DEPENDS_ON were structurally dead (CONTROL_DOMAINS
>   shared zero terms with faction-bank domains; DEPENDS_ON eligibility
>   contradicted its own nounPhrase templates). Now: seeded type-diverse
>   spine sampling, 0.55 backstory roll, 5-variant bridge pools with rotating
>   composition, vocabulary aligned. Measured: "compact broke" openers
>   62/120 → 4/120; all four spine types win seeds in every cell (max ~45%).
>   Audit census 768 → 723; see the status block in
>   `2026-07-03-audit-baseline-burn-down.md` (Task 6 done there,
>   `story.hiddenLeak` 2 filed).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-sentence edge rendering with a structured conflict-synthesis layer (parties, stakes, temperature, complications, visible signs) rendered through beat grammars, plus grounded stakes, load-bearing secrets, phenomenon livelihoods, slotted hooks, and expanded faction banks.

**Architecture:** A new `conflicts/` module promotes spine edges from `buildRelationshipGraph` into `Conflict` objects; `renderSystemStory` renders them via beat grammars with per-system no-repeat variant decks. Downstream, settlement prose, phenomenon prose, and hook selection bind to conflict parties/stakes. All randomness flows through dedicated `SeededRng` forks.

**Tech Stack:** TypeScript (strict, no `any`), Vitest (`npm run test`, unit config), JSON data tables under `src/features/tools/star_system_generator/data/`.

**Spec:** `docs/superpowers/specs/2026-07-02-narrative-conflict-refactor-design.md`

## Global Constraints

- Root: `src/features/tools/star_system_generator/` — all paths below relative to it unless starting with `docs/` or `scripts/`.
- **Run all tests on Node 24** (plain `npm run test`; CI moved to Node 24 in `52daa54`, and `spineFullAxisMatrix` snapshots diverge between Node majors — generate them on 24, never 20; `.nvmrc` pins 24).
- Never use `any`; use `unknown` or precise types. Prefix unused params with `_`.
- No code comments unless stating a non-obvious constraint.
- Determinism: every random draw comes from a `SeededRng` passed in; no `Math.random`, no `Date`. New draw sites use dedicated forks so streams are isolated.
- Old-seed output WILL change (approved). Snapshot suites are regenerated with `vitest -u` on Node 24 as part of the task that changes output, and the diff is committed with that task.
- `SystemStoryOutput { spineSummary, body, hooks }` fields keep their existing names/types; new fields are additive optional.
- Narrative strings stored on generator output remain wrapped as `Fact<string>` (`{value, confidence, source}`).
- Commit per task on `develop`, Conventional Commits with scope `star-system`, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Gates per task: `npx tsc --noEmit` (via `npm run lint` + typecheck), `npm run lint`, unit tests on Node 24.
- `scripts/audit-star-system-generator.ts` exits 1 with ~50 pre-existing content errors — baseline, not a gate.

### Register guide for all authored text (from the setting primer + strongest existing material)

Working-class frontier under a silent god. Concrete nouns, present tense, no
melodrama; the horror is administrative ("the manifest is clean", "the briefing
nobody got"). People have jobs, debts, and rituals. GU physics is glimpsed
through its economy: bleed harvests, chiral assays, calibration scars, gate
throat schedules. Good exemplars to match: "departure boards quietly cancel
the cheaper berths"; "the medic who stocks both handednesses… searches every
patient's pockets before she touches them."

---

## Phase 1 — Conflict anatomy + spine rendering

### Task 1: Conflict types + stake grounding

**Files:**
- Create: `lib/generator/conflicts/types.ts`
- Create: `lib/generator/conflicts/stakes.ts`
- Create: `lib/generator/conflicts/index.ts`
- Test: `lib/generator/conflicts/__tests__/stakes.test.ts`

**Interfaces:**
- Consumes: `EntityRef`, `EdgeType`, `RelationshipEdge`, `SystemRelationshipGraph` from `../graph/types`.
- Produces (used by Tasks 2–6, 8, 12):

```ts
// lib/generator/conflicts/types.ts
import type { EdgeType, EntityRef } from '../graph/types'

export type ConflictTemperature = 'simmering' | 'open' | 'aftermath' | 'frozen'
export type ConflictRole = 'aggressor' | 'defender' | 'bystander'

export interface ConflictParty {
  ref: EntityRef
  role: ConflictRole
  stake: string
}

export type ComplicationKind = 'secret' | 'deadline' | 'third-party' | 'gu-anomaly'

export interface ConflictComplication {
  kind: ComplicationKind
  text: string
  sourceRef?: EntityRef
}

export interface Conflict {
  id: string
  edgeId: string
  edgeType: EdgeType
  pressure: string
  parties: ConflictParty[]
  stakeRef: EntityRef | null
  temperature: ConflictTemperature
  frozenReason?: string
  complication?: ConflictComplication
  visibleSign: string
}
```

```ts
// lib/generator/conflicts/stakes.ts
export function resolveStakeRef(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
): EntityRef | null
```

Resolution order (spec §4 "Grounded stakes"):
1. If `edge.qualifier` exactly matches (case-insensitive) the `displayName` of an entity in `graph.entities`, return that entity.
2. Else the first DEPENDS_ON or CONTROLS edge (in `graph.edges` order) where subject or object is one of this edge's endpoints; return the *other* endpoint of that edge if its kind is `guResource | phenomenon | body | route | gate | settlement`.
3. Else the first entity in `graph.entities` of kind `phenomenon` or `guResource`.
4. Else `null`. Never return an abstract string.

- [x] **Step 1: Write failing tests** in `lib/generator/conflicts/__tests__/stakes.test.ts` covering: qualifier-matches-entity wins; DEPENDS_ON neighbor fallback; phenomenon fallback; null when inventory has only the two principals. Build minimal `SystemRelationshipGraph` fixtures by hand (entities + edges arrays; `edgesByEntity`/`edgesByType`/spine ids can be empty/derived helpers in the test).
- [x] **Step 2: Run** `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator/lib/generator/conflicts` → FAIL (module not found).
- [x] **Step 3: Implement** `types.ts`, `stakes.ts` per the interfaces above; `index.ts` re-exports both.
- [x] **Step 4: Run tests** → PASS. Run `npm run lint`.
- [x] **Step 5: Commit** `feat(star-system): conflict types and stake grounding resolver`

### Task 2: Ground CONTESTS/CONTRADICTS qualifiers at the rule level

**Files:**
- Modify: `lib/generator/graph/rules/contestsRules.ts` (qualifier assignment; currently uses `concretizeDomain`)
- Modify: `lib/generator/graph/rules/contradictsRules.ts` (same pattern)
- Modify: `lib/generator/graph/rules/settingPatterns.ts` (delete `concretizeDomain` once unreferenced)
- Test: `lib/generator/graph/__tests__/contestsRules.test.ts`, `contradictsRules.test.ts` (update existing)

**Interfaces:**
- Consumes: `RuleContext` from `rules/ruleTypes.ts` (has entity inventory + facts).
- Produces: `RelationshipEdge.qualifier` is now either the `displayName` of a real entity in the system inventory or `undefined` — never an abstract domain phrase. Task 1's `resolveStakeRef` step 1 depends on this.

Implementation: where these rules currently derive `qualifier` from a shared
faction domain via `concretizeDomain(domain)`, instead scan the rule's
`RuleContext` inventory for an entity whose kind is
`guResource | phenomenon | route | gate | settlement | body` and whose
narrative-fact domains overlap the shared domain (the rules already have the
matched domain string); pick the first match in inventory order for
determinism. If none, leave `qualifier` undefined (templates already have
`{qualifier|fallback}` fallbacks).

- [x] **Step 1: Update the existing rule tests** to assert the new behavior: given a context containing a guResource with an overlapping domain, `qualifier` equals its displayName; given none, `qualifier` is `undefined`; assert no output ever equals a `concretizeDomain` phrase ("conflict record", "trade ledger", "chain of authority").
- [x] **Step 2: Run** the two test files → FAIL.
- [x] **Step 3: Implement** in both rule files; delete `concretizeDomain` from `settingPatterns.ts` and fix any remaining importers (grep `concretizeDomain`).
- [x] **Step 4: Run the full graph test dir** on Node 24; regenerate any spine-matrix snapshots this changes (`vitest run -u` on the affected snapshot suites) and eyeball the diff for grounded qualifiers.
- [x] **Step 5: Commit** `feat(star-system): ground contest/contradict qualifiers in real entities`

### Task 3: Party building (triangles)

**Files:**
- Create: `lib/generator/conflicts/parties.ts`
- Test: `lib/generator/conflicts/__tests__/parties.test.ts`

**Interfaces:**
- Consumes: `SeededRng` from `../rng`; graph types; `ConflictParty` from Task 1.
- Produces: `buildParties(edge: RelationshipEdge, graph: SystemRelationshipGraph, rng: SeededRng): ConflictParty[]`

Rules:
- Principals: `edge.subject` → role `aggressor`, `edge.object` → role `defender` (for DEPENDS_ON, subject is `defender` and object `aggressor` — the depended-on thing holds the power).
- Bystander: collect entities adjacent (via `graph.edgesByEntity`) to either principal, excluding the principals themselves and any entity kind of `system | star`; prefer kinds `settlement` then `namedFaction` then anything else; pick uniformly with `rng.int` among the best-preference tier. If none, return two parties.
- `stake` strings: per-role phrase pools (aggressor: what they'd win; defender: what they'd lose; bystander: what it costs them), ≥6 phrases per role, chosen with `rng.int`. Pools live in `parties.ts` as `const` arrays; slot `{stake}` display names are NOT baked in here (the renderer binds names).

```ts
const AGGRESSOR_STAKES: readonly string[] = [
  'the right to set tariffs no one else can audit',
  'first claim on the next harvest window',
  'a monopoly that dies the moment anyone measures it',
  'control of the schedule everyone else plans around',
  'the authority to declare what counts as contaminated',
  'standing to rewrite the charter in their own hand',
]
// DEFENDER_STAKES and BYSTANDER_STAKES: same shape, ≥6 each, defender = what
// they lose ('the margin that keeps the lights on', …), bystander = the cost
// they pay ('rationed air while the principals negotiate', …).
```

- [x] **Step 1: Write failing tests**: two principals + roles correct; DEPENDS_ON role inversion; bystander drawn from adjacency, never a principal, never star/system; settlement preferred over faction; deterministic for same rng seed; two-party when no adjacency.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** with complete stake pools (6+ per role) in register.
- [x] **Step 4: Run** → PASS; lint.
- [x] **Step 5: Commit** `feat(star-system): conflict party builder with bystander triangles`

### Task 4: Temperature selection

**Files:**
- Create: `lib/generator/conflicts/temperature.ts`
- Test: `lib/generator/conflicts/__tests__/temperature.test.ts`

**Interfaces:**
- Consumes: `BuildGraphOptions` from `../graph/types`; `SeededRng`.
- Produces: `selectTemperature(edge: RelationshipEdge, graph: SystemRelationshipGraph, options: BuildGraphOptions, rng: SeededRng): { temperature: ConflictTemperature; frozenReason?: string }`

Weights (base, by edge type — then adjusted):
```ts
const BASE: Record<ConflictTemperature, number> = { simmering: 3, open: 2, aftermath: 1, frozen: 1 }
```
- CONTESTS/DESTABILIZES: `open` +2. WITNESSES/CONTRADICTS/SUPPRESSES/HIDES_FROM: `simmering` +2. Historical consequence link present: `aftermath` +2.
- `frozen` is only eligible when a reason exists, checked in order: (a) any SUPPRESSES or HIDES_FROM edge incident on a principal (reason: "a suppressed record keeps both sides quiet"); (b) mutual DEPENDS_ON between principals (reason: "each side holds the other's lifeline"); (c) `options.gu === 'high' || options.gu === 'fracture'` (reason: "escalation here looks, from orbit, like someone building toward an ASI — and the Gardener watches"). When eligible, `frozen` +3. When ineligible its weight is 0.
- Pick by weighted draw using a single `rng.next()`.

- [x] **Step 1: Write failing tests**: frozen never selected without a reason (force rng low with a stub SeededRng returning fixed values); frozen selected with suppression edge + rng in its band; reasons text as specified; deterministic; exactly one `rng.next()` consumed (stub counts calls — RNG-order contract).
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement.**
- [x] **Step 4: Run** → PASS; lint.
- [x] **Step 5: Commit** `feat(star-system): conflict temperature with setting-native frozen states`

### Task 5: Complications (load-bearing secrets) + pressure

**Files:**
- Create: `lib/generator/conflicts/complications.ts`
- Create: `lib/generator/conflicts/pressure.ts`
- Test: `lib/generator/conflicts/__tests__/complications.test.ts`, `__tests__/pressure.test.ts`

**Interfaces:**
- Consumes: `Settlement` from `../../types` (fields `name: Fact<string>`, `hiddenTruth: Fact<string>`); graph types; Task 1 types.
- Produces:

```ts
export function bindComplication(
  edge: RelationshipEdge,
  parties: readonly ConflictParty[],
  graph: SystemRelationshipGraph,
  settlements: readonly Settlement[],
  rng: SeededRng,
): ConflictComplication | undefined

export function derivePressure(
  edge: RelationshipEdge,
  stakeRef: EntityRef | null,
  rng: SeededRng,
): string
```

`bindComplication` priority:
1. **secret** — if any party ref is a settlement whose `hiddenTruth.value` is non-empty: `{ kind: 'secret', text: lowerFirst(hiddenTruth.value), sourceRef }` (`lowerFirst` from `../prose/helpers`).
2. **third-party** — if a historical edge's `consequenceEdgeIds` includes this edge id: `{ kind: 'third-party', text: edge.summary ?? 'an old betrayal neither side names' }` using the historical edge's summary.
3. **deadline / gu-anomaly** — pools (≥6 each) in register; `gu-anomaly` only when a phenomenon/guHazard is a party or stake, else `deadline`. Chosen with one `rng.int`.
4. With probability 0.25 (`rng.chance(0.25)` drawn FIRST, before any branch, to keep draw order fixed) return `undefined` — not every conflict is complicated.

`derivePressure`: pools keyed by edge type (≥5 phrases each, `{stake}` slot allowed); DESTABILIZES uses the subject (the phenomenon IS the pressure): `'{subject} does not negotiate and does not stop'` style entries; slot binding deferred to renderer — pressure strings may contain `{stake}`/`{subject}` placeholders resolved in Task 8.

- [x] **Step 1: Write failing tests**: secret binds settlement hiddenTruth + sourceRef; third-party binds historical summary; deadline vs gu-anomaly gating; undefined branch consumes identical draw count as other branches up to its early return (assert with counting stub: chance() always first); pressure pool per edge type non-empty and ≥5.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** with complete pools.
- [x] **Step 4: Run** → PASS; lint.
- [x] **Step 5: Commit** `feat(star-system): load-bearing complications and pressure derivation`

### Task 6: Visible signs + buildConflicts orchestrator

**Files:**
- Create: `lib/generator/conflicts/visibleSigns.ts`
- Create: `lib/generator/conflicts/buildConflicts.ts`
- Modify: `lib/generator/conflicts/index.ts` (export `buildConflicts`)
- Test: `lib/generator/conflicts/__tests__/visibleSigns.test.ts`, `__tests__/buildConflicts.test.ts`

**Interfaces:**
- Produces:

```ts
// visibleSigns.ts
export function composeVisibleSign(
  edgeType: EdgeType,
  temperature: ConflictTemperature,
  rng: SeededRng,
): string
// returns a template string with optional {aggressor} {defender} {bystander} {stake} slots

// buildConflicts.ts
export interface BuildConflictsInput {
  graph: SystemRelationshipGraph
  settlements: readonly Settlement[]
  options: BuildGraphOptions
}
export function buildConflicts(input: BuildConflictsInput, rng: SeededRng): Conflict[]
```

`visibleSigns.ts`: `SIGNS: Partial<Record<EdgeType, Partial<Record<ConflictTemperature, readonly string[]>>>>` with a `DEFAULT_SIGNS: Record<ConflictTemperature, readonly string[]>` fallback. Author ≥4 signs per temperature in DEFAULT plus ≥3 per temperature for CONTESTS, DESTABILIZES, DEPENDS_ON, CONTROLS (the spine-eligible types). All present-tense witnessable scenes:
```ts
open: [
  'Dock crews from {aggressor} and {defender} unload under separate armed escorts that pretend not to watch each other.',
  'Every shift change, someone repaints the boundary line around {stake} a hand-width farther out.',
  ...
]
```

`buildConflicts`: for each of `graph.spineEdgeIds` (max 3), look up the edge, fork `rng.fork(edge.id)`, then in fixed order: `resolveStakeRef` (no rng) → `buildParties` → `selectTemperature` → `bindComplication` → `derivePressure` → `composeVisibleSign`. `id: 'conflict-' + edge.id'`. Returns `Conflict[]` in spine order.

- [x] **Step 1: Write failing tests**: sign pools meet minimum counts and every string's slots ⊆ {aggressor,defender,bystander,stake}; buildConflicts returns one conflict per spine edge with all fields populated; same input+seed → deep-equal output; different edge ids → independent forks (mutating spine order doesn't change the conflict built for a given edge id).
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** with complete sign pools.
- [x] **Step 4: Run whole conflicts dir** → PASS; lint.
- [x] **Step 5: Commit** `feat(star-system): visible signs and buildConflicts orchestrator`

### Task 7: Template pool expansion (authoring)

**Files:**
- Modify: all 12 files in `lib/generator/graph/render/templates/` (contests, destabilizes, contradicts, controls, dependsOn, hosts, suppresses, witnesses, hidesFrom, betrayed, foundedBy, displaced)
- Test: `lib/generator/graph/render/__tests__/templatePools.test.ts` (create)

**Interfaces:**
- Consumes/preserves: `EdgeTemplateFamily` shape from `templates/types.ts` — `body`, `bodyByTone`, `spineSummary`, `spineSummaryByTone`, `historicalBridge`, `hook`.
- Produces: every present-era family has `body.length >= 8` and `bodyByTone.cinematic/astronomy` each ≥8; `spineSummaryByTone` for all three tones each ≥4; historical families (BETRAYED/FOUNDED_BY/DISPLACED) `body >= 6`. Existing templates are kept (they're tested/voiced); new ones append. Every proper-noun-capable slot uses `:article` where mid-sentence lowercase is needed (audit existing entries while here — the SAMPLE_REVIEW title-case bug).

Register per tone: balanced = plainspoken dispatch ("The ledger says one thing; the manifests say another, and {subject} pays the difference."); cinematic = knife-edge ("{subject} keeps the receipts. {object} keeps the witnesses."); astronomy = instrument-first ("Every survey pass over {qualifier|the contested band} returns numbers {subject} refuses to publish.").

- [x] **Step 1: Write the pool-size test** asserting the counts above for all 12 families, and that every template's `expects` keys appear in its `text` (regex `\{(\w+)`) and vice versa.
- [x] **Step 2: Run** → FAIL on counts.
- [x] **Step 3: Author the templates** (~250 sentences). Match tone registers; every sentence must work with slot substitution of multiword proper nouns.
- [x] **Step 4: Run pool test + full render tests** on Node 24; regenerate render/prose/spine-matrix snapshots (`-u`); read a sample of the snapshot diff aloud for register drift.
- [x] **Step 5: Commit** `feat(star-system): expand edge template pools to spec floors (8 body/4 summary per tone)`

### Task 8: Beat-grammar conflict renderer

**Files:**
- Create: `lib/generator/graph/render/conflictNarrative.ts`
- Test: `lib/generator/graph/render/__tests__/conflictNarrative.test.ts`

**Interfaces:**
- Consumes: `Conflict`, `ConflictParty` (Task 1); `GeneratorTone`; `SeededRng`; `resolveSlots`/`EdgeRenderContext` from `./slotResolver`; `capitalizeForPosition`, `guardDoubledNoun` from `./grammarSafety`.
- Produces: `renderConflictNarrative(conflict: Conflict, tone: GeneratorTone, rng: SeededRng): string[]` — 2–4 complete sentences.

Beats: `pressure`, `parties`, `temperature`, `complication`, `sign`. Grammars per tone (arrays of beat orders):
```ts
const GRAMMARS: Record<GeneratorTone, readonly (readonly Beat[])[]> = {
  balanced: [
    ['pressure', 'parties', 'sign'],
    ['parties', 'temperature', 'complication', 'sign'],
    ['sign', 'parties', 'pressure'],
    ['parties', 'complication', 'sign'],
  ],
  cinematic: [
    ['sign', 'parties', 'temperature'],
    ['parties', 'pressure', 'complication', 'sign'],
    ['temperature', 'parties', 'sign'],
  ],
  astronomy: [
    ['pressure', 'parties', 'complication'],
    ['parties', 'pressure', 'sign'],
    ['pressure', 'temperature', 'parties', 'sign'],
  ],
}
```
Per-beat sentence pools (≥4 templates per beat per tone) with slots
`{aggressor}` `{defender}` `{bystander}` `{stake}` `{pressure}` `{secret}`
`{frozenReason}`; bind via a local `bindConflictSlots(text, conflict)` that
substitutes display names / strings and falls back gracefully (bystander beat
templates are skipped when no bystander; complication beat skipped when no
complication — grammar order compresses). Slot binding happens BEFORE
`capitalizeForPosition`/`guardDoubledNoun`. One `rng.next()` picks the grammar;
one per emitted beat picks the sentence template.

- [x] **Step 1: Write failing tests**: returns 2–4 sentences ending in periods; skips bystander/complication beats when absent; binds party names verbatim; frozen conflicts mention their `frozenReason` when the temperature beat is present; deterministic per seed; no unresolved `{` braces in output for any (tone × grammar × fixture) sweep.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** with complete beat pools (≥4 × 5 beats × 3 tones ≈ 60 sentences, in register).
- [x] **Step 4: Run** → PASS; lint.
- [x] **Step 5: Commit** `feat(star-system): beat-grammar conflict narrative renderer`

### Task 9: Rework renderSystemStory + anti-repetition decks + pronominalization

**Files:**
- Modify: `lib/generator/graph/render/renderSystemStory.ts`
- Modify: `lib/generator/graph/types.ts` (add `conflicts?: Conflict[]` to `SystemStoryOutput`; import type from `../conflicts/types` — if this creates a cycle, move the field's type to a structural re-export in `graph/types.ts`)
- Test: `lib/generator/graph/render/__tests__/renderSystemStory.test.ts` (extend), snapshots regen

**Interfaces:**
- Produces: `renderSystemStory(graph, rng, options?, conflicts?: readonly Conflict[]): SystemStoryOutput` — 4th param optional so existing tests/fixtures still compile; output gains `conflicts` echo.

Changes:
1. **Spine paragraph**: for each spine-cluster edge that has a matching conflict (`conflict.edgeId === edge.id`), render `renderConflictNarrative(conflict, tone, bodyRng.fork(edge.id)).join(' ')` instead of `renderEdgeSentence`; non-conflict edges keep sentence rendering.
2. **Variant decks**: replace `pickVariant` with a per-call `VariantDeck` class: constructor shuffles indices via Fisher–Yates using the rng; `draw()` returns next index, reshuffling when exhausted. One deck per template family per render call — a system never repeats a body template while alternatives remain.
3. **Spine summary pronominalization**: after `composeSpineSummary`, if the summary contains the subject displayName twice, replace the second occurrence with `'it'` (kind ∈ phenomenon/guHazard/body/ruin) or `'they'` (faction/settlement). Implement as exported `pronominalizeSecondMention(text: string, ref: EntityRef): string` for testability.
4. `conflicts` echoed onto the returned object.

- [x] **Step 1: Write failing tests**: deck never repeats until exhaustion (unit-test `VariantDeck` directly); conflict-backed spine edge renders multi-sentence conflict text; `pronominalizeSecondMention` cases (phenomenon→it, faction→they, single mention untouched, overlapping-name safety: only exact displayName matches).
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement.**
- [x] **Step 4: Run full render suite** on Node 24, regen snapshots (`-u`), review diff.
- [x] **Step 5: Commit** `feat(star-system): conflict-driven story rendering with no-repeat decks`

### Task 10: Wire conflicts into generateSystem + GENERATOR_VERSION

**Files:**
- Modify: `lib/generator/index.ts` (~line 4367–4400: after `buildRelationshipGraph`, before `renderSystemStory`)
- Modify: `lib/export/` modules (stamp version into JSON/text export payloads — grep for the export builders)
- Test: `__tests__/generator-determinism.test.ts` (runs as-is; snapshots regen), new assertions in `lib/generator/__tests__/` for version presence

**Interfaces:**
- Produces: `export const GENERATOR_VERSION = 2 as const` in `lib/generator/index.ts`; `GeneratedSystem` narrative flows: `const conflicts = buildConflicts({ graph: relationshipGraph, settlements, options: graphOptions }, rng.fork('conflicts'))` then `renderSystemStory(relationshipGraph, rng.fork('story'), graphOptions, conflicts)`.

Notes: `rng.fork('conflicts')` is a NEW fork label — it does not perturb existing forks' streams (forks are seed-string derived, not draw-order derived), but downstream output changes anyway via rendering; that's the approved break.

- [x] **Step 1: Write failing test**: generated system's `systemStory.conflicts` array is non-empty for a seed known to produce spine edges (pick by probing 3 candidate seeds in the test setup and asserting at least one yields conflicts); export payload contains `generatorVersion: 2`.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** wiring + version stamping.
- [x] **Step 4: Full unit test run on Node 24** with snapshot regen; `npm run lint`; `npm run build` once to confirm static export unaffected.
- [x] **Step 5: Commit** `feat(star-system): wire conflict synthesis into generation, add GENERATOR_VERSION`

### Task 11: Prose bug sweep (articles + historical endpoints)

**Files:**
- Modify: `lib/generator/graph/history.ts` (`pickHistoricalEndpoints` — currently identity no-op; make it swap endpoints when the historical type reads object-first, e.g. FOUNDED_BY renders founder-first)
- Modify: any `templates/*.ts` entries found by audit to use bare `{subject}`/`{object}` mid-sentence where the slot can hold a phenomenon/ruin (add `:article`)
- Test: `lib/generator/graph/__tests__/historicalRotation.test.ts` (extend), snapshots regen

- [x] **Step 1: Write failing test** for `pickHistoricalEndpoints`: FOUNDED_BY yields founder as subject (was inverted/no-op).
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Regen snapshots on Node 24**, grep rendered snapshot text for ` [A-Z][a-z]+.*firsthand` style bare-title mid-sentence hits. **Step 5: Commit** `fix(star-system): historical endpoint order and mid-sentence article slots`

## Phase 2 — Settlement integration

### Task 12: crisisTruthPairs table + coherent selection

**Files:**
- Modify: `data/settlements.json` (add `crisisTruthPairs` section)
- Modify: `lib/generator/data/settlements.ts` (typed loader export)
- Modify: `lib/generator/index.ts` settlement generation (where `crisis` and `hiddenTruth` are drawn from `crises`/`hiddenTruths` pools)
- Test: `lib/generator/__tests__/crisisTruthPairs.test.ts` (create)

**Interfaces:**
- Produces: `crisisTruthPairs: ReadonlyArray<{ crisis: string; truths: readonly string[] }>` — ~40 entries; each `crisis` must exactly match an entry in the existing `crises` pool, each truth either matches `hiddenTruths` or is new (new ones get added to `hiddenTruths` too). Selection logic: draw crisis as today; then with `rng.chance(0.7)` and a matching pair entry, draw hiddenTruth from `pair.truths`; else draw from the full pool as today. Draw order: chance() then exactly one int() in BOTH branches (index into truths or into full pool) so the RNG stream shape is identical on both paths.

Authoring guide: the truth explains, caused, or is threatened by the crisis. Example entries:
```json
{ "crisis": "Storm shelter capacity numbers leaked", "truths": [
  "The shelter manifests were forged to hide sold berths",
  "The Iggygate is misaligned on purpose",
  "Officials pre-sold shelter space to a syndicate that never arrived" ] },
{ "crisis": "Ship full of dead arrives", "truths": [
  "The quarantine is political",
  "The clinic is hiding a second exposure syndrome",
  "The manifest lists a crew that never existed" ] }
```

- [x] **Step 1: Write failing tests**: every pair's crisis exists in `crises`; every truth exists in `hiddenTruths`; pair count ≥ 40; generation with a fixed seed picks a paired truth when chance passes (stub-level unit test on the selection function — extract it as `selectCoherentHiddenTruth(crisis, rng)` in `lib/generator/index.ts` or a small new module `lib/generator/settlementCoherence.ts`, preferred).
- [x] **Step 2: Run** → FAIL. **Step 3: Author ~40 pairs + implement `lib/generator/settlementCoherence.ts`.** **Step 4: Run + snapshot regen on Node 24.** **Step 5: Commit** `feat(star-system): causally paired settlement crises and hidden truths`

### Task 13: Closer variety (settlementProse + graphAwareSettlementHook)

**Files:**
- Modify: `lib/generator/prose/settlementProse.ts` (lines ~79–85 hardcoded closers)
- Modify: `lib/generator/prose/graphAwareSettlementHook.ts` (3 fixed strings)
- Test: extend `lib/generator/prose/__tests__/` suites; snapshots regen

**Interfaces:**
- Produces: `settlementProse.ts` closers: per-tone pools ≥6 (tone param threaded from caller — check `settlementHookSynthesis` signature and add `tone: GeneratorTone` param; update its call site in `lib/generator/index.ts:3579` area). `graphAwareSettlementHook.ts`: per-edge-type pools ≥6 each for CONTESTS/DEPENDS_ON/SUPPRESSES with `{other}` and optional `{stake}` slots, picked via the existing rng param.

- [x] **Step 1: Write failing pool-count tests + a distribution test** (render 30 settlements across seeds; assert no closer string exceeds 40% share).
- [x] **Step 2: Run** → FAIL. **Step 3: Author pools + thread tone.** **Step 4: Run + snapshot regen.** **Step 5: Commit** `feat(star-system): varied settlement closers keyed to tone and conflict edges`

### Task 14: whyHere re-subjecting

**Files:**
- Modify: `lib/generator/prose/graphAwareSettlementWhyHere.ts`
- Test: `lib/generator/prose/__tests__/` (extend); snapshots regen

**Interfaces:**
- Produces: templates re-authored so the settlement (`{settlement}` slot, new) is the grammatical actor and the anchor (`{anchor}`) is the place: "X stays because the seam under {anchor} pays for what it costs" — kill "route geometry maintains its footprint" class errors. Keep the 11-category × 3-tone × 3-variant structure; raise to ≥4 variants per cell where natural (target, not a hard gate; pool test asserts ≥3).

- [x] **Step 1: Failing test**: rendered whyHere for a fixture settlement starts with or contains the settlement displayName as subject, and never uses the anchor name in subject position followed by a volitional verb (regex on the fixed template list, not runtime output).
- [x] **Step 2–4: Implement, run, regen snapshots on Node 24.** **Step 5: Commit** `fix(star-system): settlement as actor in whyHere prose`

## Phase 3 — Phenomena as conflict engines

### Task 15: Livelihoods schema + authoring

**Files:**
- Modify: `data/narrative.json` (`phenomena[*]`: add `livelihoods`, fill `variants` for all 32)
- Modify: `lib/generator/data/narrative.ts` (types: `PhenomenonLivelihood`, extend `PhenomenonEntry`)
- Modify: `scripts/audit-star-system-data.ts` (validate new shapes)
- Test: `__tests__/gu-narrative-data.test.ts` (extend)

**Interfaces:**
- Produces:
```ts
export interface PhenomenonLivelihood {
  actor: string        // 'bleed-widow salvage circles'
  dependence: string   // 'sell recovered harvester rigs back to the guilds'
  friction: string     // 'every recovered rig is legally still guild property'
}
// PhenomenonEntry gains: livelihoods: readonly PhenomenonLivelihood[] (>=2)
// and variants required to include >=3 entries each for travelEffect,
// surveyQuestion, sceneAnchor (conflictHook variants become obsolete in Task 16).
```

- [x] **Step 1: Failing data test**: all 32 phenomena have ≥2 livelihoods with non-empty fields and ≥3 variants for the three fields.
- [x] **Step 2: Run** → FAIL. **Step 3: Author** (~64 livelihoods + ~a few hundred short variant strings; Roadside Picnic method — who lives off it, what they owe, what breaks). **Step 4: Run data tests + audit script shape checks.** **Step 5: Commit** `feat(star-system): phenomenon livelihoods and full variant coverage`

### Task 16: Composed conflictHook

**Files:**
- Modify: `lib/generator/index.ts` `generatePhenomena` (~3745) / `pickPhenomenonField` (~3771)
- Create: `lib/generator/prose/phenomenonConflict.ts`
- Test: `lib/generator/prose/__tests__/phenomenonConflict.test.ts`

**Interfaces:**
- Produces: `composePhenomenonConflict(entry: PhenomenonEntry, rng: SeededRng): string` — picks one livelihood (`rng.int`), one friction frame from ≥6 templates (`'{actor} {dependence}, but {friction}.'` variations with connective variety), replacing the static `conflictHook` value in generated phenomena. The static `conflictHook` string stays in data as fallback for entries lacking livelihoods (none after Task 15, but the guard stays).

- [x] **Step 1: Failing tests**: two different rng streams give different hooks for the same phenomenon; output has no unresolved braces; fallback path returns base `conflictHook`.
- [x] **Step 2–4: Implement, run, snapshot regen on Node 24.** **Step 5: Commit** `feat(star-system): compose phenomenon conflict hooks from livelihoods`

## Phase 4 — Hooks + factions + metrics

### Task 17: Hook skeleton slots + binder

**Files:**
- Modify: `data/hooks.json` (add optional `slots` to entries; retrofit ~15 existing entries with slot versions)
- Modify: `lib/generator/data/hooks.ts` (extend `HookEntry` type: `{ text: string; tags: string[]; binds?: readonly ('party'|'place'|'stake'|'phenomenon')[] }` — `text` may contain `{party}` `{place}` `{stake}` `{phenomenon}`)
- Modify: `lib/generator/hooks.ts` (`selectSystemHooks` gains a `conflicts: readonly Conflict[]` + `entities: readonly EntityRef[]` context; binder resolves slots; entries with unresolvable binds are filtered from candidates BEFORE picking so draw behavior stays pool-driven)
- Modify: `lib/generator/index.ts` call site (~4407) to pass conflicts/entities
- Test: `lib/generator/__tests__/hookBinding.test.ts` (create)

Binding sources: `{party}` → a conflict party displayName (prefer faction/settlement); `{place}` → a settlement or body displayName; `{stake}` → `conflict.stakeRef.displayName`; `{phenomenon}` → a phenomenon entity displayName. Draw one `rng.int` per distinct slot in the chosen entry.

- [x] **Step 1: Failing tests**: slotted entry binds real names; entry with unsatisfiable binds never selected; unslotted entries unaffected; deterministic.
- [x] **Step 2–4: Implement, run, snapshot regen.** **Step 5: Commit** `feat(star-system): hook skeletons bound to system conflicts`

### Task 18: Hook pool growth (authoring)

**Files:**
- Modify: `data/hooks.json`
- Test: extend `lib/generator/__tests__/hookBinding.test.ts` with pool-size floors

**Interfaces:** rumors ≥40 (+15), contracts ≥33 (+10), encounters ≥32 (+10), npcs ≥36 (+10), twists ≥25 (+8). New entries in register, tagged with existing HOOK_TERMS vocabulary, ~half using slots.

- [x] **Step 1: Failing pool-size test. Step 2: Run → FAIL. Step 3: Author. Step 4: Run; spot-read 10 rendered hooks. Step 5: Commit** `feat(star-system): grow hook pools with slotted entries`

### Task 19: Faction bank expansion + spine dominance cap

**Files:**
- Modify: `lib/generator/factions/banks/balancedBank.ts` (seeds 10 → 24; grow stems/suffixes)
- Modify: `lib/generator/graph/score.ts` `selectEdges` (cap: at most 1 spine edge may have a seed-bank faction endpoint; implement by passing the seed-faction name set into `BuildGraphOptions`-adjacent plumbing — add optional `seedFactionNames?: ReadonlySet<string>` to `selectEdges` args threaded from `buildRelationshipGraph`)
- Test: `lib/generator/graph/__tests__/spineDominance.test.ts` (create), factions tests extend

- [x] **Step 1: Failing tests**: balanced bank ≥24 seeds, all unique names; across a 30-seed corpus no single faction name appears in >30% of spines (generate via `buildRelationshipGraph` fixtures or full `generateSystem`); cap logic unit test with synthetic candidates.
- [x] **Step 2–4: Implement, run, snapshot regen on Node 24.** **Step 5: Commit** `feat(star-system): expand faction banks and cap seed-faction spine dominance`

### Task 20: Dead data removal + repetition metrics gate

**Files:**
- Modify: `data/narrative.json` (delete `narrativeStructures`, `narrativeVariablePools`, `namedFactions` if audit/tests no longer need it — check `@deprecated` consumers first; keep if legacy graph-rule tests still import)
- Modify: `lib/generator/data/narrative.ts` (drop dead exports), `scripts/audit-star-system-data.ts` (drop dead validators)
- Create: `__tests__/narrative-repetition.test.ts`
- Test: full suite

Repetition test (the spec §10 floors), over 40 fixed seeds (`metric-0`…`metric-39`, frontier/balanced/normal/normal):
```ts
// distinct-ratio floors:
// spine summaries >= 0.90 distinct among non-empty
// conflict body paragraphs >= 0.85
// phenomenon conflictHooks >= 0.60
// no single hook-pool entry text appears > 4 times across the corpus
```

- [x] **Step 1: Write the metrics test** (expected initially PASS if Phases 1–4 landed; if any floor fails, treat as a real quality bug — fix pools/selection, do not lower floors).
- [x] **Step 2: Remove dead data + exports; run FULL suite on Node 24 + lint + `npm run build` + `npm run generate-search-index` untouched-check.**
- [x] **Step 3: Commit** `feat(star-system): repetition metrics gate; remove dead narrative structures`
- [x] **Step 4: Final sweep**: run the 50-seed sampler ad hoc, read 5 systems end-to-end for register/coherence; file follow-ups rather than scope-creep.

---

## Self-review notes

- Spec §4 anatomy → Tasks 1, 3–6. §5 rendering → 7–9. §6 → 12–14. §7 → 15–16. §8 → 17–18. §9 → 19. §10 → 10 (version), 20 (metrics), per-task snapshot regen. §12 dead data → 20. Coverage complete.
- Type names consistent: `Conflict`, `ConflictParty`, `ConflictTemperature`, `ConflictComplication`, `buildConflicts`, `renderConflictNarrative`, `resolveStakeRef`, `selectTemperature`, `bindComplication`, `derivePressure`, `composeVisibleSign`, `pronominalizeSecondMention`, `selectCoherentHiddenTruth`, `composePhenomenonConflict`.
- Authoring tasks (7, 12, 13, 15, 18) carry objective pass criteria via pool-size/shape tests; register guide is in Global Constraints.

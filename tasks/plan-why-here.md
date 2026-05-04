# Plan: Retire Legacy `settlementWhyHere`, Promote and Enrich Graph-Aware Producer

## Critical Pre-Implementation Finding

**`graphAwareSettlementWhyHere` never fires in production.** `generateSystem`
(`index.ts:3168`) calls `graphAwareReshape` passing the raw `options` object.
`graphAwareReshape` exits at the `noFlags` guard (`graphAwareReshape.ts:26-32`)
because `options.graphAware` is `undefined` in every production call —
`useGeneratorQueryState` never sets it. Legacy `settlementWhyHere`
(`index.ts:2514`) is the **only** producer firing today.

The retirement cascade therefore needs an extra **Phase 0** that the Narrative
Lines pattern (commit `8090c5b`) didn't need: promote the graph-aware producer
from opt-in flag to unconditional default before deleting the legacy path.
Skipping Phase 0 means Phase 1 deletes the only working producer.

---

## Decisions Locked

1. **Phase 1 + enrichment ship together.** No standalone "delete legacy then
   enrich later" — the presence-score fallback and per-tone templates land
   in the same change as the deletion. Eliminates the placeholder problem
   and the window where thin-graph settlements lose content.
2. **Sentence cap = 2.** No optional third sentence. The hazard + control
   combination folds into richer sentence-2 templates (`"{anchor} {sits-clause}
   under {faction}'s authority despite {hazard}."`), keeping the card readable
   alongside the existing ~4-sentence `tagHook`.
3. **No placeholder text.** When both the graph and presence-fallback paths
   produce nothing, `whyHere` carries an empty-string sentinel; UI and
   markdown export suppress the row. Rendering empty is cleaner than a stub
   like `"{anchor}: established human presence"`.
4. **RNG-break documented.** Phase 1 shifts every downstream RNG roll. The
   scale-split plan does the same in its Phase B/D. Coordinate messaging:
   one "v2 generator" announcement once both ship.

---

## Part 1 — Retirement Cascade

### Phase 0: Promote graph-aware to unconditional default

**Goal:** make `graphAwareSettlementWhyHere` run for every settlement on every
system, not just in tests.

**Files modified:**

- `lib/generator/prose/graphAwareReshape.ts`
  - Lines 26-32: drop `flags.settlementWhyHere` from the `noFlags` early-exit
    check. After this change `noFlags` only gates on `phenomenonNote` and
    `settlementHookSynthesis`.
  - Lines 35-37: extract the settlement-whyHere pass into an always-running
    block; `settlementHookSynthesis` stays flag-gated.
  - Lines 45-74 (`reshapeSettlement`): drop the `if (flags.settlementWhyHere)`
    guard so the `newWhyHere` replacement always executes. Keep
    `settlementHookSynthesis` guard.
- `lib/generator/prose/__tests__/graphAwareReshape.test.ts`
  - Lines 60-70: rewrite reference-identity test for the new
    always-runs-when-loop-runs semantics.
  - Lines 274-315: drop `settlementWhyHere: true` from option objects and
    rename test titles.

**RNG caution:** `index.ts:2514` calls `rng.fork('why-here-${index + 1}')`.
The fork stream is consumed by the legacy function. **Do not delete it in
Phase 0** — only in Phase 1. Keeping it preserves the downstream RNG stream.

**Audit gate before Phase 1:**

- `npm run test` clean
- Manual generation: a system with two settlements; confirm
  `settlement.whyHere.confidence === 'inferred'` and source contains
  `'Graph-aware reshape'` for any settlement with incident graph edges
- `npm run build` — no TS errors
- Snapshot tests that capture `settlement.whyHere` updated explicitly

---

### Phase 1: Delete legacy + ship enriched graph-aware producer

**Files modified — retirement:**

- `lib/generator/prose/settlementProse.ts`
  - Lines 49-87: delete entire `settlementWhyHere` function
  - Line 1: drop unused `OrbitingBody` import
  - Line 6: drop unused `SettlementPresenceScore`, `GuOverlay`, `Reachability`,
    `SettlementAnchor` imports
  - Lines 3-5: keep — still used by `settlementHookSynthesis`
- `lib/generator/index.ts`
  - Line 120: drop `settlementWhyHere` from named imports
  - Line 2514: remove call **including** `rng.fork('why-here-${index + 1}')`.
    This shifts every downstream RNG roll — settlement scale, authority,
    tags, condition, crisis, hidden truth, encounter sites, name. Document
    in commit message.
  - Line 2572: replace `whyHere: fact(whyHere, ...)` with
    `whyHere: fact('', 'human-layer', 'Populated by graph-aware reshape')`.
    Empty-string sentinel — reshape overwrites with graph-derived content,
    presence-score fallback, or leaves empty when both are barren.
- `lib/generator/prose/__tests__/settlementProse.test.ts`
  - Line 2: drop `settlementWhyHere` from named import
  - Lines 71-90: delete `describe('settlementWhyHere', ...)` block
  - Other describe blocks unchanged

**Files modified — enrichment:**

- `lib/generator/prose/graphAwareSettlementWhyHere.ts` (rewrite — see spec
  in Part 2 below)
  - New signature: `(settlement, graph, rng, tone) => string | null`
  - Query `DESTABILIZES`, `CONTROLS`, `CONTESTS`, `HIDES_FROM` in addition
    to existing `HOSTS` + `DEPENDS_ON`
  - Per-tone template arrays (mirror `spineSummaryByTone`)
  - 2-sentence cap: structural sentence 1 + conditional pressure/value
    sentence 2. No sentence 3 — combine via richer sentence-2 templates.
  - Presence-score fallback when both `HOSTS` and `DEPENDS_ON` are absent
- `lib/generator/prose/graphAwareReshape.ts`
  - Line 49: rename `_rng: SeededRng` → `rng: SeededRng`
  - Pass `rng.fork(\`why-here-\${settlement.id}\`)` and `input.options.tone`
    to the enriched function

**Files modified — empty-string suppression in consumers:**

- `components/SettlementCard.tsx`: suppress the `whyHere` rendering branch
  when `settlement.whyHere.value === ''`. Confirm exact line by reading
  current render order.
- `lib/export/markdown.ts`: skip the `whyHere` line in the settlement
  block when `settlement.whyHere.value === ''`.

**Files modified — tests:**

- `lib/generator/prose/__tests__/graphAwareSettlementWhyHere.test.ts`:
  add cases for tone-variant selection, DESTABILIZES → hazard clause,
  presence-score fallback (`guValue ≥ 3` + no edges → non-null), barren
  case (no edges + all-zero presence → null), determinism (same fork +
  same inputs → identical output), 2-sentence cap (no output exceeds two
  sentences in any tone × edge combination).

**Audit gate before Phase 2:**

- `npm run test` clean — `settlementProse.test.ts` and the expanded
  `graphAwareSettlementWhyHere.test.ts` cases all pass
- `npm run build` — no TS errors
- Manual generation: 20 settlements across distribution × tone combinations;
  confirm meaningful `whyHere` content (or empty + suppressed row) in every
  case; no placeholder strings appear
- `grep -r 'settlementWhyHere' src/` returns only the `types.ts` field and
  `graphAwareReshape.ts` flag (Phase 2 cleans those)

---

### Phase 2: Remove orphaned `graphAware.settlementWhyHere` option

**Files modified:**

- `types.ts` lines 23-27: drop `settlementWhyHere?: boolean` from
  `GenerationOptions.graphAware`
- `lib/generator/prose/graphAwareReshape.ts`: remove residual
  `flags.settlementWhyHere` references; confirm `noFlags` only tests the
  remaining two flags
- `lib/generator/prose/__tests__/graphAwareReshape.test.ts`: drop
  `settlementWhyHere: true` from all option objects (TS catches misses);
  rename surviving test titles

**Audit gate:**

- `npm run test` and `npm run build` clean
- `grep -r 'settlementWhyHere' src/` → zero hits

---

## Part 2 — Enriched Producer Spec (lands in Phase 1)

### Enriched signature

```ts
export function graphAwareSettlementWhyHere(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
  tone: GeneratorTone,
): string | null
```

`rng` and `tone` are already in scope at the `reshapeSettlement` call site —
caller change is `_rng → rng` (drop underscore) and pass `input.options.tone`
through.

### Graph edges to query (beyond HOSTS + DEPENDS_ON)

- **DESTABILIZES** (`object.id === settlement.id`) — names the hazard entity
  putting the site at risk. Recovers `"hazards are severe"` semantic with a
  named entity.
- **CONTROLS** (`object.id === settlement.id`) — names the faction in formal
  authority. Enables `"under [faction] administration"`.
- **CONTESTS** (either endpoint = settlement) — enables
  `"disputed with [faction]"`.
- **HIDES_FROM** (`subject.id === settlement.id`) — recovers legal-heat
  semantics with named authority.

Presence scores (`settlement.presence.*`) remain available for the
sparse-graph fallback path.

### Sentence structure: 2 sentences max

- **Sentence 1 (structural):** where it sits + what it depends on. Same
  edge logic as today, plus per-tone variant arrays.
- **Sentence 2 (conditional pressure / value / authority):** include if
  any of: `DESTABILIZES` targets settlement; `presence.guValue.value ≥ 2`;
  `presence.legalHeat.value ≥ 2`; `CONTROLS` or `CONTESTS` edge exists.
  Pick highest-priority present clause — graph entity over score-derived.
  When `DESTABILIZES` and `CONTROLS`/`CONTESTS` coexist, use a combined
  template (`"{anchor} operates under {faction}'s authority despite
  {hazard}."`) rather than emitting a third sentence.

### Per-tone template variants

Mirror the existing `spineSummaryByTone` / `CONNECTIVES_BY_TONE` pattern.
Static records inside `graphAwareSettlementWhyHere.ts`:

```ts
const STRUCTURAL_BOTH: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} sits on {host} and depends on {dep}.',
    '{anchor} occupies {host}, drawing on {dep} to stay viable.',
  ],
  astronomy: [
    '{anchor} maintains a {host}-anchored configuration with a {dep}-dependent supply chain.',
    '{anchor} occupies {host} in a configuration reliant on {dep}.',
  ],
  cinematic: [
    '{anchor} clings to {host} — nothing runs without {dep}.',
    '{anchor} is carved into {host}, kept alive by {dep}.',
  ],
}
```

Plus parallel records for `STRUCTURAL_DEPENDS_ONLY`, `STRUCTURAL_HOSTS_ONLY`,
`PRESSURE_HAZARD`, `PRESSURE_GU`, `PRESSURE_LEGAL`, `PRESSURE_FACTION`,
and the combined-clause `PRESSURE_HAZARD_PLUS_FACTION`. Selection:
`variants[rng.int(0, variants.length - 1)]`.

### Presence-score fallback

When both `HOSTS` and `DEPENDS_ON` are absent, build a single sentence from
`settlement.anchorName.value` + `settlement.presence.*` checked in priority
order: `guValue ≥ 3`, then `resource ≥ 3`, then `strategic ≥ 3`, then
`habitability ≥ 2`. Simpler than legacy's 5-template switch and doesn't need
the full `OrbitingBody`/`GuOverlay`/`Reachability` parameter list. If all
scores are low, return `null` (consumer suppresses the row).

### RNG fork strategy in caller

`graphAwareReshape.ts:reshapeSettlement` line 49: change `_rng: SeededRng` →
`rng: SeededRng`. Pass `rng.fork(\`why-here-\${settlement.id}\`)` to the
enriched function — settlement-id-keyed forks are stable across reordering.

---

## Part 3 — Expansion Opportunities Post-Retirement

- **Era-stamped Why Here.** `RelationshipEdge.era === 'historical'` is
  populated by `attachHistoricalEvents`. If a `FOUNDED_BY` historical edge
  touches the settlement, prepend `"Established during [era],"`. Mirror the
  `dependsOnTemplates.ts` slot-resolver pattern.
- **Cross-settlement rival framing.** A `CONTESTS` edge between two
  settlements enables `"Its claim over {host} is disputed by {rival
  settlement}"` as the sentence-2 variant.
- **Distribution-axis phrasing shift.** `options.distribution` is in scope.
  `frontier` should weight contested/hidden clauses; `realistic` should
  weight resource/access clauses. Reuse the Phase D `distributionMultiplier`
  idea — weight, not branch.
- **HIDES_FROM at high legal heat.** `HIDES_FROM` + `legalHeat ≥ 3` warrants
  a dedicated `"operates in deliberate obscurity, evading [authority]"`
  variant. Unrepresentable in legacy.
- **Hazard-edge expansion.** Today only `DESTABILIZES` carries hazard
  intensity. Adding `ENDANGERS` / `THREATENS` edge types would let the
  producer distinguish acute crisis from chronic risk — a richer reading
  of presence.hazard than the binary "high or low."
- **Tautology guard for shared-prefix anchors.** Phase 0 surfaced cases
  where the anchor name and host body share a prefix
  (`"Meissa's Forge II orbital space sits on Meissa's Forge II."`).
  Sentence 1 templates should detect prefix overlap and either drop the
  redundant `{host}` slot, switch to a non-naming connective (`"the site
  here"`), or pick a `STRUCTURAL_DEPENDS_ONLY` variant. Add a tautology
  test to the Phase 1 coverage list.

---

## Part 4 — Risks + Coverage

### Risks

- **RNG stream disruption (Phase 1).** Removing
  `rng.fork('why-here-${index + 1}')` shifts every downstream roll. Existing
  bookmarked URLs produce different settlements. Accepted; document in
  commit alongside scale-split's seed-break.
- **Snapshot test invalidation (Phase 0).** Recent commit `1c5390f` added a
  cross-tone voice snapshot. If it captures `whyHere`, Phase 0 invalidates
  it. Locate before starting; update explicitly after Phase 0 manual review.
- **`graphAwareReshape.test.ts` reference-identity tests (lines 60-70).**
  Loop now runs unconditionally when graph-aware flags exist. Tests asserting
  reference identity for "unchanged" cases must use options without
  `graphAware` key at all.
- **Empty-string consumers.** If any code reads `settlement.whyHere.value`
  and assumes truthy non-empty content, it will break on barren systems.
  Audit during Phase 1: `grep -rn 'whyHere\.value' src/`.

### Coverage to add in Phase 1

- Tone-variant selection — `tone='cinematic'` produces cinematic strings
- Presence-score fallback — `guValue === 3` + no edges produces non-null
- Determinism — same `rng.fork(...)` + same inputs produces identical output
- Sentence-2 conditionality — all-zero presence + no relevant edges produces
  sentence 1 only (no sentence 2)
- Combined-clause templates — `DESTABILIZES` + `CONTROLS` produces a single
  combined sentence-2, never two sentences
- Empty-output path — barren graph + all-zero presence returns `null` or
  empty string, and the consumers suppress the row

---

## File Reference Map

| Path | Phase | Change |
|---|---|---|
| `lib/generator/prose/graphAwareReshape.ts` | 0, 1, 2 | Drop flag gate; pass `rng`+`tone` to enriched fn |
| `lib/generator/prose/__tests__/graphAwareReshape.test.ts` | 0, 1, 2 | Update flag-dependent assertions |
| `lib/generator/prose/settlementProse.ts` | 1 | Delete `settlementWhyHere` (49-87); drop orphaned imports |
| `lib/generator/index.ts` | 1 | Drop import (120); remove call+fork (2514); empty-string sentinel (2572) |
| `lib/generator/prose/__tests__/settlementProse.test.ts` | 1 | Delete describe block (71-90) |
| `lib/generator/prose/graphAwareSettlementWhyHere.ts` | 1 | Add `rng`, `tone`; per-tone arrays; 2-sentence cap; presence fallback |
| `lib/generator/prose/__tests__/graphAwareSettlementWhyHere.test.ts` | 1 | Add tone, hazard, fallback, determinism, cap, empty-output tests |
| `components/SettlementCard.tsx` | 1 | Suppress row when `whyHere.value === ''` |
| `lib/export/markdown.ts` | 1 | Skip line when `whyHere.value === ''` |
| `types.ts` | 2 | Remove `settlementWhyHere?: boolean` from `GenerationOptions.graphAware` |

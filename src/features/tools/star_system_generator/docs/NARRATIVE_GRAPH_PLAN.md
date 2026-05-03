# Narrative Relationship Graph Plan

## Purpose

Procedurally generated star systems currently feel like parallel layers stacked rather than a coherent system. The physical, GU, and human layers each produce good local prose, but they do not reference each other by name; the result reads as three independent generators whose outputs share a page.

This plan introduces a relationship graph layer between fact extraction and prose rendering. The graph captures present-tense relationships between named entities (settlements, bodies, GU resources, phenomena, factions, ruins) and explains 1-2 of those relationships with attached backstory events. The renderer consumes graph edges to produce a new System Story output and to retrofit settlement, phenomenon, and `whyHere` prose so existing surfaces gain cross-layer specificity.

The intended outcome is that every generated system feels like a particular place where particular things happen between particular people, rather than a generic situation with names dropped in.

## Background

The star system generator already produces:

- A typed `narrativeFacts[]` ledger with subject identity, domain tags, and confidence labels.
- 84 authored `tagPairHooks`, 32 structured phenomena, and 24 narrative structure templates.
- Strong physical/GU/human layer separation, deterministic seeded RNG with stage forking, and well-developed audit coverage.

A pre-design audit identified three classes of problem:

1. **Cross-layer cohesion gaps.** The GU overlay never appears in settlement prose. Phenomena and settlements never reference each other by name. Thread beats and tagHook closes are invariant boilerplate across every settlement in a system.
2. **Grammar bugs at composition seams.** `crisisPressureSentence` produces verb-collision sentences for crises that already contain a verb. `hiddenCauseBeatText` produces doubled-noun outputs ("the hidden evidence is evidence of..."). `whyHere` is a semicolon-list pretending to be a sentence. `crisisByScale` overrides cover only 2 of 8+ scales. Phenomena and remnants have no deduplication.
3. **Composition functions are unreachable for testing.** All prose-shaping helpers (`settlementHookSynthesis`, `crisisAsPressure`, `hiddenCauseBeatText`, etc.) are private functions buried in a 3,927-line `index.ts`. They cannot be unit-tested or systematically improved.

The strongest existing pattern - the `narrativeFacts[]` ledger - already provides the right substrate for a graph layer. The graph extends rather than replaces it.

## Design Decisions

The brainstorming session settled the following:

- **Architectural target:** Caves of Qud-style entity-anchored prose, full Level 3 (relationship graph as a real pipeline stage with per-edge templates).
- **Temporal model:** Option 2 (present-tense graph plus 1-2 attached historical events per system that explain present edges; no full Dwarf Fortress timeline).
- **Edge palette:** 12 types in 4 functional groups (see below).
- **Integration scope:** Approach B (graph drives a new System Story panel, replaces narrative threads, and serves as a lookup layer that existing settlement / phenomenon / `whyHere` prose consult on demand with graceful fallback).
- **Existing surfaces:** `narrativeLines` and `narrativeThreads` remain populated for one release as a compatibility shim, then are removed.

## Edge Palette

Twelve edge types in four functional groups. The palette is derived from recurring patterns in existing `tagPairHooks`, `crises`, `hiddenTruths`, and `phenomena`.

**Spine edges (structural):**

- `HOSTS` - physical containment (body hosts settlement; system hosts ruin).
- `CONTROLS` - authority over access or quota (faction controls gate or route asset).
- `DEPENDS_ON` - material requirement (settlement depends on GU resource).

**Active edges (present-tense pressure):**

- `CONTESTS` - rival claim to same target.
- `DESTABILIZES` - physical or GU disruption affecting another entity.
- `SUPPRESSES` - actor preventing visibility or action (Sol/Gardener interdiction theme).

**Epistemic edges (the falsified-records theme):**

- `CONTRADICTS` - competing records about same fact.
- `WITNESSES` - only or last evidence of past event (AI witness custody pattern).
- `HIDES_FROM` - secret kept from specific actor.

**Historical edges (attach 1-2 per system):**

- `FOUNDED_BY` - origin event (e.g., a settlement was founded by a faction during a named era).
- `BETRAYED` - past breach of compact (e.g., one faction broke faith with another).
- `DISPLACED` - forced movement (e.g., a population was forced to a body or away from one).

Historical edges always carry `era: 'historical'`, an `approxEra` string, and a `consequenceEdgeIds[]` list pointing to the present-tense edges they explain. They are separate edges in the graph, not metadata on present edges.

## Architecture

### Pipeline Placement

```
[1-12]  All entity-producing stages              (unchanged)
[13]    buildNarrativeFacts                       (unchanged)
[13b]   buildRelationshipGraph         <- NEW
[13c]   attachHistoricalEvents         <- NEW
[14']   renderSystemStory              <- REPLACES generateNarrativeLines + generateNarrativeThreads
[15']   renderEntityHooks              <- UPDATED: settlement, phenomenon, whyHere prose pull from graph
[16]    runNoAlienGuard                          (unchanged)
```

The graph stage forks a dedicated RNG (`rng.fork('graph')`) so its internal choices do not affect downstream RNG streams. Same fork model used by the rest of the generator today.

### Output Extension

```ts
GeneratedSystem {
  ...existing fields...
  relationshipGraph: SystemRelationshipGraph    // NEW (contains both present and historical edges)
  systemStory: SystemStoryOutput                // NEW (primary narrative surface)
  narrativeLines: NarrativeLine[]               // RETAINED (deprecated, populated for 1 release)
  narrativeThreads: NarrativeThread[]           // RETAINED (deprecated, populated for 1 release)
}
```

### Core Data Types

```ts
type EntityRef = {
  kind: 'system' | 'star' | 'body' | 'settlement' | 'guResource' | 'guHazard'
      | 'phenomenon' | 'ruin' | 'namedFaction' | 'localInstitution' | 'route' | 'gate'
  id: string                  // unique within system
  displayName: string
  layer: 'physical' | 'gu' | 'human'
}

type EdgeType =
  | 'HOSTS' | 'CONTROLS' | 'DEPENDS_ON'                    // spine
  | 'CONTESTS' | 'DESTABILIZES' | 'SUPPRESSES'             // active
  | 'CONTRADICTS' | 'WITNESSES' | 'HIDES_FROM'             // epistemic
  | 'FOUNDED_BY' | 'BETRAYED' | 'DISPLACED'                // historical

type RelationshipEdge = {
  id: string
  type: EdgeType
  subject: EntityRef
  object: EntityRef
  qualifier?: string
  visibility: 'public' | 'contested' | 'hidden'
  confidence: Confidence       // reuses existing union
  groundingFactIds: string[]   // narrativeFacts that justified this edge
  era: 'present' | 'historical'
  weight: number               // 0-1, used for renderer salience

  // Historical-only fields (populated iff era === 'historical')
  approxEra?: string           // 'second wave', 'before the quarantine'
  summary?: string             // pre-rendered prose for the historical event
  consequenceEdgeIds?: string[] // present edges this historical edge explains
}

type SystemRelationshipGraph = {
  entities: EntityRef[]
  edges: RelationshipEdge[]              // includes both present-tense and historical edges
  edgesByEntity: Record<string, string[]>  // entityId -> edgeIds
  edgesByType: Record<EdgeType, string[]>
  spineEdgeIds: string[]                 // 1-3 present edges that define this system's character
  historicalEdgeIds: string[]            // 0-2 historical edges
}

type SystemStoryOutput = {
  spineSummary: string         // 1 sentence: defining tension
  body: string[]               // 2-3 short paragraphs of edge-rendered prose
  hooks: string[]              // 3-5 GM-facing one-liners derived from contested + hidden edges
}
```

### Relationship to Existing Fact Ledger

- Facts answer "what is true about X?" - atomic, attribute-style.
- Edges answer "what is true between X and Y?" - relational.
- Every edge carries `groundingFactIds[]` so the audit can trace why an edge was generated and downstream consumers can pull supporting detail.
- Facts are not modified by the graph stage. Implicitly relational facts (e.g., a settlement fact naming its body) are hoisted into explicit edges; new emergent edges (e.g., `CONTESTS` between two factions juxtaposed on the same target) are net-new.

## Generation Algorithm

### Step 1: Edge Generation Rules

Every rule is a pure function over the fact ledger.

```ts
type EdgeRule = {
  id: string                   // stable for determinism
  edgeType: EdgeType
  match: (facts: NarrativeFact[], entities: EntityRef[]) => RuleMatch[]
  build: (match: RuleMatch, ctx: BuildCtx) => RelationshipEdge | null
}
```

A rule may fire zero or more times against the fact set. Rules are organized by edge type (one file per edge type under `lib/generator/graph/rules/`). Setting-flavored rules consult a registered pattern dictionary in `settingPatterns.ts` so adding setting flavor (Sol/Gardener triggers, edited-records markers, GU bleed cues) is a one-file addition rather than a rule rewrite.

Rule application order is alphabetical by `rule.id` - stable, deterministic, no implicit ordering hazards.

Estimated total: ~25-30 rules across the 9 present-tense edge types (most types need 2-4 rules to cover their natural fact patterns). Historical edges have no rule files; they are generated by `history.ts` (see Step 5-7).

### Step 2: Scoring

Each candidate edge gets:

- Base weight from its rule (0.0-1.0).
- Novelty bonus (+0.1) if no edge of the same type exists yet.
- Cross-layer bonus (+0.15) if subject and object are in different layers.
- Named-entity bonus (+0.1) if both subject and object have proper names.

Final score = weight + bonuses. Sorted descending. Duplicate-target edges (same subject/object/type) collapse with the highest score winning.

### Step 3: Budget Selection

Two-phase pick:

**Spine (1-3 edges):** Top-scored edges among the dramatic types (`CONTESTS`, `DESTABILIZES`, `DEPENDS_ON`, `CONTROLS`). Each spine edge must be named-on-named (both subject and object have proper names). Spine edges must touch at least 2 different layers across the set.

**Peripheral (3-9 edges):** Fill remaining budget by picking edges that increase graph connectivity, preferring edges that touch already-spined entities or connect previously-disconnected layers. Cap per type: no more than 2 edges of the same type in peripheral.

**Total cap:** `max_edges = 6 + min(6, num_settlements + num_phenomena)`. Hard ceiling 12.

### Step 4: Index

Build the convenience indexes (`edgesByEntity`, `edgesByType`, `spineEdgeIds`). Frozen in output - no surprise mutation downstream.

### Step 5-7: Historical Edge Attachment

After present-tense edges are selected, generate 1-2 historical edges that explain spine edges.

**Score "needs backstory" on spine edges:**

- `CONTROLS`, `CONTESTS`, `DEPENDS_ON`, `CONTRADICTS`: high (the obvious "why?" question).
- `DESTABILIZES`, `SUPPRESSES`: medium (the past act that started it).
- `HOSTS`, `WITNESSES`: low (do not need backstory by themselves).

**Map present edge type to eligible historical edge type:**

| Present Edge | Eligible Historical Edge(s) | Rendering intent |
|---|---|---|
| `CONTROLS` | `FOUNDED_BY` | "X founded the controlled entity during era Y" |
| `CONTESTS` | `BETRAYED` | "A and B's compact broke during era Y" |
| `DEPENDS_ON` | `DISPLACED` | "X was displaced to its current dependency during era Y" |
| `DESTABILIZES` | `FOUNDED_BY` | "the destabilizing entity was founded under flawed assumptions" |
| `SUPPRESSES` | `BETRAYED` | "a compact was broken when the suppressing party seized control" |
| `CONTRADICTS` | `BETRAYED` | "records were edited as a breach of public trust during era Y" |

**Generate the historical edge:**

- Pick subject and object from the present edge's entities (often a faction/actor + the entity they affected).
- Roll `approxEra` from the era pool (`data/eras.ts`).
- Render `summary` via the historical edge type's template family (see Edge Templates).
- Set `era = 'historical'`, `consequenceEdgeIds = [presentEdge.id]`.

**Cap at 2 historical edges per system.** Sparse systems may produce 1 or 0.

### Determinism

- Rule order: alphabetical by `rule.id`.
- Edge ties broken by stable hash of edge content.
- All RNG draws via `rng.fork('graph')` and sub-forks `graph:rules`, `graph:scoring`, `graph:budget`, `graph:history`.
- Same seed produces same graph, always.

## Rendering & Downstream Integration

### System Story Renderer

```
renderSystemStory(graph, rng):
  1. spineSummary  <- top spine edge + its linked historical edge (if any) woven (1 sentence)
  2. body[]        <- cluster present edges into 2-3 paragraphs
  3. hooks[]       <- contested + hidden edges as GM-facing one-liners
```

The renderer finds linked historical edges via `historicalEdge.consequenceEdgeIds.includes(presentEdge.id)`.

**Paragraph clustering:**

- Para 1 (spine cluster): spine edges + immediate neighbors. Covers main tension.
- Para 2 (active cluster): remaining `CONTESTS`, `DESTABILIZES`, `SUPPRESSES`. Covers what is pressing.
- Para 3 (epistemic cluster): `CONTRADICTS`, `WITNESSES`, `HIDES_FROM` with `visibility: 'public' | 'contested'`. Hidden epistemic edges never reach body prose - they go to `hooks[]`.

Sparse systems with few edges produce 1-2 paragraphs, not 3. No padding.

### Edge Templates

Each edge type has a small template family:

```ts
type EdgeTemplateFamily = {
  edgeType: EdgeType
  body: EdgeTemplate[]              // 3-5 variants
  spineSummary: EdgeTemplate
  historicalBridge: EdgeTemplate    // used when edge.era === 'historical'
  hook: EdgeTemplate[]              // 2-3 GM-facing inversions
}

type EdgeTemplate = {
  text: string
  expects: { [slot: string]: SlotShape }
}

type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'
```

**Slot syntax:**

```
{subject}              display form    -> "Orison Hold"
{subject:article}      with article    -> "the Route Authority" / "Orison Hold"
{subject:lower}        lowercased      -> "orison hold"  (mid-sentence)
{qualifier|fallback}   default          -> uses fallback if qualifier is undefined
{historical:summary}   linked event    -> "the second-wave terraforming failure"
{historical:era}       linked era      -> "the second wave"
```

`{historical:*}` slots resolve via `consequenceEdgeIds` lookup against any historical edge that points to the current edge. Empty if none linked.

**Authoring budget:** ~5-8 templates per edge type x 12 types = 60-100 templates total, plus an era pool of 8-12 strings in `data/eras.ts`. Lives in `lib/generator/graph/render/templates/` as one file per edge type. The 3 historical edge types (`FOUNDED_BY`, `BETRAYED`, `DISPLACED`) get their own template families using the same shape as present edge types — their `body` templates render the historical summary; their `historicalBridge` template is unused.

### Grammar Safety

The renderer fixes audit-identified grammar bugs at the slot-substitution layer:

1. **Slot-shape contracts.** Each template declares the linguistic shape per slot (`properNoun`, `nounPhrase`, `verbPhrase`, `clause`). The renderer reshapes incoming values to match - strips terminal punctuation, lowercases, removes leading articles. Centralizes the `crisisPressureSentence` verb-collision fix.
2. **Boundary-aware capitalization.** The renderer tracks position (sentence-start, after-comma, after-semicolon, mid-clause) and capitalizes accordingly.
3. **Doubled-noun guard.** Normalizes leading nouns ("evidence", "proof", "records", "logs") on slot values before applying templates that add their own. Centralized lookup table.

These fixes live in `lib/generator/graph/render/grammarSafety.ts` with isolated unit tests.

### Connective Tissue

Within a paragraph, sentence joins use a small connective dictionary keyed by `(prevEdgeType, nextEdgeType)`:

```ts
const CONNECTIVES = {
  'CONTESTS->DESTABILIZES':   'Meanwhile, ',
  'CONTROLS->CONTESTS':       'But ',
  'DEPENDS_ON->DESTABILIZES': 'And ',
  'spine->CONTRADICTS':       'Privately, ',
  // 12-15 entries; fallback empty string
}
```

First sentence in a paragraph never gets a connective.

### Downstream Consumer Integration

Three existing prose functions get a graph parameter and a thin lookup. Each falls back to current behavior when no relevant edge exists.

**`settlementHookSynthesis`:**

- Look up edges where subject.id === this.settlement.id OR object.id === this.settlement.id.
- Filter to spine + active edges (`CONTESTS`, `DEPENDS_ON`, `SUPPRESSES`).
- If found, render via that edge's body template, scoped to this settlement, and use it as the closing sentence.
- Else fall back to "Control of the {function} decides who has leverage."

This eliminates the invariant 4th-sentence boilerplate that the audit flagged.

**`phenomenonNote`:**

- Replace the run-on `Transit:/Question:/Hook:/Image:` blob.
- Render the four structured fields as 2-3 prose sentences with connectives.
- If a `DESTABILIZES` edge connects this phenomenon to a named target, name the target explicitly.

**`settlementWhyHere`:**

- Replace semicolon-list output entirely.
- Render from the settlement's incoming `DEPENDS_ON` and `HOSTS` edges, joined with proper connectives.
- Result: 1-2 prose sentences instead of a list. Falls back to current semicolon list if no edges.

## File Layout

```
lib/generator/
+-- graph/                              [NEW]
|   +-- index.ts                        public: buildRelationshipGraph, attachHistoricalEvents, renderSystemStory
|   +-- types.ts                        EntityRef, RelationshipEdge, SystemRelationshipGraph, SystemStoryOutput
|   +-- entities.ts                     entity inventory builders from facts
|   +-- score.ts                        scoring + budget selection
|   +-- history.ts                      historical event attachment
|   +-- rules/
|   |   +-- index.ts                    exports allRules array
|   |   +-- ruleTypes.ts                EdgeRule, RuleMatch, BuildCtx
|   |   +-- settingPatterns.ts          regex/keyword dictionary
|   |   +-- hostsRules.ts               (present edge rule files)
|   |   +-- controlsRules.ts
|   |   +-- dependsOnRules.ts
|   |   +-- contestsRules.ts
|   |   +-- destabilizesRules.ts
|   |   +-- suppressesRules.ts
|   |   +-- contradictsRules.ts
|   |   +-- witnessesRules.ts
|   |   +-- hidesFromRules.ts
|   |   +-- (note: FOUNDED_BY/BETRAYED/DISPLACED have no rule files - generated by history.ts)
|   +-- render/
|   |   +-- index.ts                    renderSystemStory
|   |   +-- slotResolver.ts             {slot:modifier|fallback} parser + substitution
|   |   +-- grammarSafety.ts            shape reshape, capitalization, doubled-noun guard
|   |   +-- connectives.ts              connective dictionary
|   |   +-- clusters.ts                 edge -> paragraph clustering
|   |   +-- templates/
|   |       +-- index.ts
|   |       +-- (one file per edge type, 12 files)
|   +-- data/
|   |   +-- eras.ts                     historical era pool
|   +-- __tests__/
+-- prose/                              [NEW - extracted from index.ts]
    +-- index.ts
    +-- helpers.ts                      sentenceFragment, definiteNounPhrase, lowerFirst, smoothTechnicalPhrase
    +-- crisisShaping.ts                crisisAsPressure, crisisPressureSentence (uses grammarSafety)
    +-- settlementProse.ts              settlementHookSynthesis, settlementWhyHere (graph-aware)
    +-- phenomenonProse.ts              phenomenonNote (graph-aware)
    +-- __tests__/
```

After Phase 0 extraction, `lib/generator/index.ts` shrinks from 3,927 lines to roughly 600-800 lines (the orchestrator only).

`hiddenCauseBeatText` and `choiceBeatText` are retired - their job is taken over by edge templates. They remain populated for one release, then are deleted in Phase 8.

## Testing Strategy

### Unit Tests (new)

- Each rule file: `match()` and `build()` against synthetic fact ledgers.
- `score.ts`: budget enforcement, spine selection, named-on-named requirement.
- `history.ts`: present-edge-to-historical-edge type mapping coverage, era pool draws, `consequenceEdgeIds` linking.
- `grammarSafety.ts`: each transform against fixture inputs.
- `slotResolver.ts`: every supported slot syntax variant.
- Template snapshot tests: each of the 12 edge types renders representative inputs to expected prose.

### Integration Tests (new)

- Fixed seeds produce stable graphs (snapshot).
- Fixed seeds produce stable `systemStory` (snapshot).
- Settlement prose with graph-aware lookup matches expectation.
- Determinism across multiple runs of same seed.

### Existing Tests

- Every existing test must continue passing through every phase.
- `npm run audit:star-system-generator:quick` and `:deep` continue passing.
- `npm run audit:star-system-data` continues passing.

### New Audit Checks

- Edge count per system within budget (6-12).
- No duplicate edges (`subject + object + type`).
- All spine edges are named-on-named.
- All `groundingFactIds` exist in the ledger.
- Templates have no unresolved `{slot}` placeholders in deterministic corpus.
- No doubled-word patterns ("evidence is evidence of") in rendered output.

### Fixture Seeds

A small library chosen to exercise: sparse system, hub system, GU-heavy, GU-light, single-settlement, multi-settlement, multi-faction. Snapshot files keyed by seed so PR diffs surface every prose change.

## Rollout Phases

Each phase is independently shippable. No phase removes capability until Phase 8.

Detailed per-phase implementation plans live alongside this document under `docs/NARRATIVE_GRAPH_PHASE_<N>_PLAN.md` and are linked in the Status column below.

| Phase | Work | Effort | Verifiable end state | Status |
|---|---|---|---|---|
| **0** | Extract prose helpers from `index.ts` to `lib/generator/prose/`. No behavior change. Add unit tests for extracted helpers. Land grammar bug fixes (`crisisPressureSentence` verb collision, `hiddenCauseBeatText` doubled noun) inline. | 1 week | All existing tests pass. New unit tests cover the helpers. `index.ts` shrinks below 1500 lines. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_0_PLAN.md) |
| **1** | Build `graph/types.ts`, `graph/entities.ts`, scaffold `buildRelationshipGraph` returning empty graph. Add `relationshipGraph` to `GeneratedSystem`. | 1 week | All existing tests pass. New `relationshipGraph` field exists, empty. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_1_PLAN.md) |
| **2** | First 4 rules: `HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES`. Implement `score.ts` + budget selection. No rendering yet. | 1.5 weeks | Audit shows graphs being generated. Edges visible in JSON export. No prose change. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_2_PLAN.md) |
| **3** | Renderer + `systemStory` output. Implement `slotResolver`, `grammarSafety`, `clusters`, `connectives`, templates for the 4 rule types from Phase 2. Wire into pipeline. | 1.5 weeks | `systemStory` populated for fixture systems. `narrativeLines/Threads` still populated. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_3_PLAN.md) |
| **4** | Remaining 5 active/epistemic rules and templates: `CONTROLS`, `SUPPRESSES`, `CONTRADICTS`, `WITNESSES`, `HIDES_FROM`. **Phase 3 carryover:** wire `template.expects[slotName]` through `slotResolver` for per-slot `nounPhrase`/article reshape (deferred from Phase 3). Re-measure empty-story rate after the 5 new rule types land — escalate to Phase 7 if still >3%. | 1 week | Full edge coverage. Hooks output populated. Per-slot reshape live. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_4_PLAN.md) |
| **5** | Historical edges: `attachHistoricalEvents` stage in `history.ts`, era pool in `data/eras.ts`, template families for `FOUNDED_BY` / `BETRAYED` / `DISPLACED`. **Phase 3 carryover:** historical edges compete for spine slots — re-measure spine-size percentile spread (Phase 3 was uniformly 3 across p10/p50/p90). | 1 week | Backstory sentences appear in `spineSummary` for systems whose spine edges qualify for backstory. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_5_PLAN.md) |
| **6** | Downstream integration. Wire `settlementHookSynthesis`, `phenomenonNote`, `settlementWhyHere` to consult the graph. Each independently flag-gated. | 1 week | Settlement cards reference cross-layer entities by name. Phenomenon notes name destabilization targets. | ✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_6_PLAN.md) |
| **7** | Add new audit checks. Manual review of 20 sample systems. Tune templates and rules based on review. **Phase 5 carryovers:** (a) tune CONTRADICTS bridge prepositions vs era-pool entries that already start with "before"/"pre-" (avoids "during before the quarantine"); (b) consider exporting `HISTORICAL_ELIGIBLE_TYPES` from `history.ts` so the audit script doesn't drift from the canonical eligibility set; (c) rotate historical-edge body variants in `renderHistoricalSummary` (currently always picks `family.body[0]`, so variants 1–2 of FOUNDED_BY / BETRAYED / DISPLACED are dead in production — rotate via `stableHashString(presentEdge.id) % family.body.length`); (d) align DESTABILIZES `historicalBridge.expects.subject` to `nounPhrase` to match the family's `body` templates (today's `properNoun` shape skips article-stripping when the subject is a phenomenon); (e) resolve `pickHistoricalEndpoints` in `history.ts` — either land real subject/object inversion logic for DISPLACED (the original intent) or delete the dead-identical branch and tighten the `EntityRef | undefined` return type to non-nullable. **Phase 3 carryover:** spineSummary length variance widened by Phase 5 (p90 jumped from 111–116 to 221 chars — target met). Tune empty-story rate if Phase 5 didn't resolve it (Phase 5 baseline: 6.77%, unchanged). **Phase 6 carryovers:** (f) settlementHookSynthesis trigger rate landed at 0% (target 40–60%) because the spine selector's named-on-named requirement filters out guResource-based DEPENDS_ON edges — either broaden spine eligibility to allow guResource as named-enough, carve a separate settlement-spine-eligibility list, or document 0% as an intentional design choice; (g) whyHere graph-aware rate landed at 54.9% (target 70–90%) — investigate which settlements are missing both DEPENDS_ON and HOSTS edges, likely pointing to gaps in rule files (settlements on unnamed bodies, or settlements without a tagged GU resource dependency). | 0.5 week | New audit passes. Sample review shows cohesion improvement. | 📝 Planned — [plan](./NARRATIVE_GRAPH_PHASE_7_PLAN.md) |
| **8** | Deprecate `narrativeLines/Threads`. Remove the parallel population, delete `hiddenCauseBeatText`/`choiceBeatText`. | 0.5 week | `index.ts` clean of dead narrative code. | ⏳ Not yet planned |

**Total: ~8.5 weeks** of focused work. **Completed so far:** Phases 0, 1, 2, 3, 4, 5, 6 (~8 weeks of plan-equivalent effort).

## Risk Mitigation

- **Phase 0 is the safest possible work** (pure refactor) and verifies the test surface is healthy before any new code lands. If Phase 0 surfaces breakage, fix before betting more on the foundation.
- **Determinism risk:** adding `rng.fork('graph')` introduces a new seed branch. Existing seeds produce the same output for unchanged stages, but corpus snapshots for `narrativeLines/Threads` may need regenerating. Documented in the Phase 1 PR.
- **Downstream integration risk:** Phase 6 is the riskiest because it touches user-visible prose. Each of the three consumers is gated by an independent feature flag in code. If one regresses, revert that one without losing the others.
- **Authoring risk:** 60-100 templates is real authoring work. The phase plan stages it (Phases 3 and 4 split present-edge templates 4 + 5; Phase 5 adds the 3 historical-edge template families) so the lift is bounded.

## Quality Bars Per Phase

Every phase must, before merging:

- All existing tests pass.
- New tests for the phase's surface are present and pass.
- `npm run audit:star-system-generator:quick` passes.
- `npm run audit:star-system-data` passes.
- `npm run lint` and `npm run build` pass.
- For Phase 6+ : manual review of at least 10 generated systems comparing against pre-phase output.

## A Worked Example

The architecture sections describe an end-to-end example. To make the design concrete, here is the same hypothetical Nosaxa IV system rendered through the new pipeline.

After graph generation:

Present edges:
- **Spine:** `DEPENDS_ON(Orison Hold, chiral ice belt)`
- **Spine:** `CONTESTS(Route Authority, Kestrel Free Compact)`, qualifier="quota over the ice belt"
- `DESTABILIZES(flare-amplified bleed season, chiral ice belt)`
- `CONTRADICTS(Authority's flare logs, Compact's witness records)`, visibility=hidden
- `HOSTS(Nosaxa IV-b, Orison Hold)`
- `CONTROLS(Route Authority, Iggygate Nosaxa-IV)`

Historical edges (linked to spine edges):
- `DISPLACED(first-wave survivors, chiral ice belt)`, approxEra="second wave", summary="the second-wave terraforming failure forced the survivors onto the chiral ice", consequenceEdgeIds=[`DEPENDS_ON(Orison Hold, chiral ice belt)`.id]

After rendering:

```
spineSummary:
  "Orison Hold has held the chiral ice belt since the second-wave terraforming
   failure forced the survivors onto it - but the Route Authority and the
   Kestrel Free Compact can't both set the quota."

body:
  [0] (spine cluster)
  "Orison Hold sits on Nosaxa IV-b, depending on the chiral ice belt for
   everything. The Route Authority controls the Iggygate that lets ships in.
   Meanwhile, the Kestrel Free Compact is contesting the Authority's right
   to set quotas."

  [1] (active cluster)
  "The flare-amplified bleed season is destabilizing the ice belt's chirality
   faster than the Authority's models predicted. Each missed shielded window
   costs the Hold another week of supply."

hooks:
  - "The Authority's flare logs and the Compact's witness records don't
     agree - and someone has the original."
  - "A neutral broker between the Authority and the Compact would have leverage."
```

Plus, downstream:

- The settlement card for Orison Hold gets a final sentence that names the chiral ice belt and the bleed season instead of "Control of the loading dock decides who has leverage."
- The phenomenon card for the bleed season gets "...corrupting Orison Hold's chiral feedstock" instead of generic "shapes travel and survey."
- `whyHere` for Orison Hold reads as 1-2 prose sentences instead of a semicolon list.

## Acceptance Criteria

- `relationshipGraph` and `systemStory` fields are populated on every generated system.
- The graph contains 6-12 present edges depending on system complexity, with 1-3 spine edges that are named-on-named.
- Spine edges touch at least 2 different layers (physical/GU/human).
- 0-2 historical edges link to spine edges via `consequenceEdgeIds`. Sparse systems may have 0.
- `systemStory.spineSummary` is a single sentence weaving the top spine edge with its linked historical edge when one exists.
- `systemStory.body` produces 1-3 paragraphs of edge-rendered prose with proper connectives (typical 2-3, sparse systems 1-2, hard ceiling 3).
- `systemStory.hooks` produces 3-5 GM-facing one-liners derived from `contested` and `hidden` edges.
- Settlement cards reference cross-layer entities (GU resources, phenomena, named factions) by name when relevant edges exist.
- Phenomenon notes name destabilization targets when `DESTABILIZES` edges exist.
- `settlementWhyHere` produces 1-2 prose sentences instead of a semicolon list when relevant edges exist.
- Same seed produces same graph and same rendered prose.
- All existing tests pass. All existing audits pass. New audit checks pass.
- `npm run lint`, `npm run test`, `npm run build` pass before each phase merge.
- Manual review of 20 sample systems shows clear cohesion improvement compared to baseline.

## Out of Scope

- Body-interest text and orbital-table descriptions (decoupled, not retrofitted).
- LLM-rendered prose alternatives (separate problem; client-only static export prefers procedural).
- Multi-event historical timelines (Option 3 - explicitly rejected during brainstorming).
- Generic L1 name-substitution-only approach (Approach A - rejected as too narrow).
- Graph-first regeneration where settlements/phenomena consume edges as inputs (Approach C - rejected as too risky).
- New input controls for graph density or edge type weighting (could come later).
- Custom era pools per setting (the era pool is fixed in `data/eras.ts` for this design pass).

## References

- `docs/PRD.md` - the product requirements that established the layered architecture.
- `docs/POLISH_ROADMAP.md` - Priorities 5 and 6 are subsumed by this plan.
- `docs/POST_AUDIT_REMODEL_PLAN.md` - prior architectural work this plan builds on.
- `data/narrative.json` - the existing `narrativeStructures` and `narrativeVariablePools` are gradually retired by this plan.
- `lib/generator/index.ts` - the source of the audit findings and the file Phase 0 extracts from.

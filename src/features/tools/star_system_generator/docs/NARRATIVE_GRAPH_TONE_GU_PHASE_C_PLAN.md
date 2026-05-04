# Tone/GU Phase C: Per-Tone Voice (Template Diction) + Per-Tone Era Pools

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Even after Phase A widens the spine pool and Phase B varies the faction names, body[0] **template voice** is identical per edge type regardless of tone. A `cinematic` CONTESTS spine and a `balanced` CONTESTS spine produce the same template family with the same RNG-picked variant. Phase C ships per-tone template variants for the top-4 spine-eligible edge types so even when two systems pick the same edge type for the spine, body[0] reads in a different voice.

**Architecture:** Scoped per-tone authoring. Top-4 spine-eligible edge types (CONTESTS, CONTROLS, DESTABILIZES, plus one of {CONTRADICTS, BETRAYED} — pick the more-frequent at audit time). Body[0] surface ONLY (deferred: hooks, full body[N>0]). Per-tone era pools (`balanced` / `cinematic` / `astronomy` × 8–12 eras each). Per-tone connective banks. Renderer routes to tone-appropriate variant first, then RNG-picks within tone.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** [Master plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md) Phases table, row "Phase C".

**Branch:** Work on `develop`. Push to `origin/develop` after every successful task.

**Scope:**
- Task 1: Survey to confirm the top-4 spine-eligible edge types for variant authoring (CONTESTS, CONTROLS, DESTABILIZES are confirmed; the 4th is empirical).
- Task 2: Author per-tone era pools in new file `lib/generator/graph/render/data/eras.ts` (or extend existing one). 3 tones × 8–12 eras each.
- Task 3: Author per-tone body[0] template variants for the 4 edge types. ~36–48 strings total. Lives alongside existing template families (`templates/contestsTemplates.ts`, etc.) as `body` array entries with a new `tone` discriminator.
- Task 4: Author per-tone spineSummary variants for the same 4 edge types. ~24–36 strings total.
- Task 5: Per-tone connective banks in `connectives.ts`. Cheap visible-diff add-on.
- Task 6: Renderer wiring — `renderClause` and `renderSpineSummary` route by tone first, then RNG-pick within tone. Pass tone through render context.
- Task 7: Cross-tone snapshot test for the top-4 edge types showing visibly different prose voice + audit check on body[0] string diversity.

**Out of scope:**
- Per-tone variants for non-top-4 edge types (HOSTS, DEPENDS_ON, SUPPRESSES, WITNESSES, HIDES_FROM, FOUNDED_BY, DISPLACED). Authoring cost is the gating factor; non-top-4 edges win the spine slot infrequently per audit data.
- Per-tone variants for body[N>0] surfaces. Body[0] is the lead and the most user-impactful surface; body[1+] paragraphs read as supporting structural prose where voice variance has diminishing returns.
- Per-tone variants for hooks. Hooks are GM-facing one-liners with their own voice; per-tone-ifying them would 3× the hook-authoring surface for a surface that's structurally distinct from body prose.
- Distribution + density axes (Phase D).

---

## Architectural Notes

### Why scoped to top-4 edge types × body[0] only

Per-tone templates fan out fast: 12 edge types × 3 tones × 4 surfaces (body[0], body[1+], spineSummary, hook) × 4 variants = 576 strings. The original tone/gu plan rejected that scope; this rewrite endorses the rejection for cost-of-authoring reasons.

Phase C's scoped surface: 4 edge types × 3 tones × 1 surface (body[0]) × 3-4 variants = ~36-48 strings. Plus spineSummary: 4 × 3 × 2-3 = ~24-36 strings. Total ~60-84 strings of authored prose. Tractable in 6-8 days.

The reason this works: body[0] is the LEAD sentence-cluster the reader sees. Voice signal there propagates the sense of tone across the whole reading experience even if body[1+] reads in a neutral voice. Hooks read as their own genre (GM-facing one-liners) so their voice already differs from body prose; per-tone-ifying them is over-engineering.

### How the existing template family shape extends

Today's `EdgeTemplateFamily` (`templates/types.ts`) has:
```ts
type EdgeTemplateFamily = {
  edgeType: EdgeType
  body: EdgeTemplate[]
  spineSummary: EdgeTemplate
  historicalBridge: EdgeTemplate
  hook: EdgeTemplate[]
}
```

Phase C extends this to:
```ts
type EdgeTemplateFamily = {
  edgeType: EdgeType
  body: EdgeTemplate[]                      // existing variants (default voice)
  bodyByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>   // NEW
  spineSummary: EdgeTemplate                // existing single template
  spineSummaryByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>   // NEW (multiple variants per tone)
  historicalBridge: EdgeTemplate
  hook: EdgeTemplate[]
}
```

The new `bodyByTone` and `spineSummaryByTone` fields are optional. If a family has `bodyByTone: { cinematic: [...], astronomy: [...] }` but no entry for `balanced`, the renderer falls back to the existing `body[]` for balanced. This means Phase C can ship per-tone variants for 4 edge types and leave the other 8 untouched without breaking those 8.

### Renderer routing

`renderEdgeSentence` in `renderSystemStory.ts:164-182` currently:
```ts
const family = templateFor(edge.type)
if (family.body.length === 0 || family.body[0].text === '') return ''
const variant = pickVariant(family.body, rng)
```

Phase C extends this to:
```ts
const family = templateFor(edge.type)
const tonedBody = family.bodyByTone?.[ctx.tone] ?? family.body
if (tonedBody.length === 0 || tonedBody[0].text === '') return ''
const variant = pickVariant(tonedBody, rng)
```

Same RNG-pick logic, different array. The render context (`EdgeRenderContext`) gets a new `tone: GeneratorTone` field, threaded through from `renderSystemStory(graph, options, facts, rng)` — Phase A added the threading, Phase C pulls it into the render context.

### Per-tone era pools

Today's eras are a single static array (read `data/eras.ts` to see the current shape). Phase C splits into 3 sub-pools:

- `cinematic`: "the betrayal years", "after the crown fell", "in the silent decade", "before the salt-debt", "the reckoning era"
- `astronomy`: "the third pulse cycle", "between the calibration runs", "the Bonn-Tycho census", "after Cycle 7", "during the spectral survey"
- `balanced`: keep current ("the long quiet", "pre-collapse", "the bleed years", "the second wave", etc.)

Era selection in `history.ts` becomes tone-aware: `pickEra(rng, tone)` returns a string from the appropriate sub-pool. Same RNG, different pool.

### Per-tone connectives

`connectives.ts` (current shape: 15 entries keyed by `(prevType, nextType)` → string) is the lowest-effort, highest-visible-diff add-on. Phase C extends to:

```ts
const CONNECTIVES_BY_TONE: Record<GeneratorTone, Partial<Record<Pair, string>>> = {
  balanced: {/* current 15 */},
  cinematic: { 'CONTESTS->DESTABILIZES': 'And then,', 'CONTROLS->CONTESTS': 'Until,', /* ... */ },
  astronomy: { 'CONTESTS->DESTABILIZES': 'Concurrently,', 'CONTROLS->CONTESTS': 'However,', /* ... */ },
}
```

Each tone's variant set is small (5-8 entries for the most common pairs). The fallback chain is: tone-specific → balanced default → empty string.

### Faction-name token interpolation

The existing slot syntax (`{subject}`, `{object}`, `{qualifier|fallback}`, etc.) is voice-neutral. Per-tone templates use the same slots. Phase B's per-tone faction names + Phase C's per-tone templates compose naturally: a `cinematic` system gets cinematic faction names slotted into cinematic templates.

### Determinism

- No new RNG forks. `pickVariant(tonedBody, rng)` uses the same `rng` as today's `pickVariant(family.body, rng)`.
- Same seed + same tone produce same template variant pick.
- `tone='balanced'` falls through to existing template arrays for templates that haven't been per-tone-ified — byte-identical for those edge types.

### Snapshot contract

Phase B regenerated `proseUnchanged.test.ts` for faction-name diversity. Phase C will regenerate it AGAIN for default-tone seeds (because per-tone templates land for `balanced` tone too — `balancedBody[]` will have new variants alongside the existing ones, so the variant pick changes for affected seeds).

This is the THIRD deliberate softening of the byte-identical-default contract. The pattern is established (Phase 8 Task 1, Phase B Task 6, Phase C). Each PR documents its drift; reviewers eyeball the regenerated snapshot.

The cross-tone snapshot test in Task 7 becomes the new long-term contract for per-tone voice. Future template tweaks regenerate it intentionally; reviewers see the diff per cell.

---

## File Structure

**Files added:**
- `src/features/tools/star_system_generator/lib/generator/graph/render/data/eras.ts` — per-tone era pools (NEW; or rewrite of existing `data/eras.ts` if it lives there).
- `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneVoiceMatrix.test.ts` — cross-tone body[0] snapshot test (Task 7).

**Files modified:**
- `src/features/tools/star_system_generator/lib/generator/graph/render/templates/types.ts` — extend `EdgeTemplateFamily` with `bodyByTone` + `spineSummaryByTone` optional fields.
- `src/features/tools/star_system_generator/lib/generator/graph/render/templates/contestsTemplates.ts` — Task 3 + 4 (per-tone variants for body and spineSummary).
- `src/features/tools/star_system_generator/lib/generator/graph/render/templates/controlsTemplates.ts` — same.
- `src/features/tools/star_system_generator/lib/generator/graph/render/templates/destabilizesTemplates.ts` — same.
- `src/features/tools/star_system_generator/lib/generator/graph/render/templates/[contradictsOrBetrayed]Templates.ts` — same (whichever wins Task 1's frequency survey).
- `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts` — Task 6 (renderer routing by tone).
- `src/features/tools/star_system_generator/lib/generator/graph/render/connectives.ts` — Task 5 (per-tone connectives).
- `src/features/tools/star_system_generator/lib/generator/graph/history.ts` — Task 2 (era selection becomes tone-aware via `pickEra(rng, tone)`).
- `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap` — regenerated; deliberate softening (third one).
- `scripts/audit-star-system-generator.ts` — Task 7 (`narrative.body0VoiceDiversity` audit check).
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` — final task: mark Phase C done.

**Files unchanged:**
- All edge rule files.
- All non-top-4 template families (HOSTS, DEPENDS_ON, SUPPRESSES, WITNESSES, HIDES_FROM, FOUNDED_BY, BETRAYED-or-CONTRADICTS-whichever-isn't-picked, DISPLACED).
- All graph-aware prose consumers.
- `phase6On.test.ts` snapshot (does not pin spineSummary or body[0]; should stay stable).
- `clusters.ts` (cluster pulling unchanged; voice variance is in template authoring, not in which edges cluster).
- `slotResolver.ts`, `grammarSafety.ts` (slot syntax unchanged; per-tone templates use the same slots).

---

## Conventions

- Run `npx tsc --noEmit` as part of every task's verification.
- Commit message style: lowercase `<type>: <subject>` with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious. The per-tone variant arrays warrant brief header comments stating the tone register intent (matches the bank-file convention from Phase B).
- Push to `origin/develop` after every successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types. Prefix unused params with `_`.
- The `phase6On.test.ts` snapshot must remain stable across all tasks. If it regenerates, STOP and diagnose.
- `proseUnchanged.test.ts` snapshot WILL regenerate at Task 6 — this is the third deliberate softening. Inspect the diff manually.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run audit:star-system-generator:deep` after Task 7.

---

## Task 1: Confirm the top-4 spine-eligible edge types

**Why:** The plan commits to per-tone variants for CONTESTS, CONTROLS, DESTABILIZES (already known winners post-Phase-A) plus one of {CONTRADICTS, BETRAYED}. Run a frequency survey to determine which of the two is more impactful. Author the variants for the winner.

**Files:** Read-only.

- [ ] **Step 1: Survey spine-edge-type frequency post-Phase-A**

  ```bash
  node --import tsx/esm -e "
  import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => {
    const counts = {}
    const tones = ['balanced', 'astronomy', 'cinematic']
    for (const tone of tones) {
      for (let i = 0; i < 100; i++) {
        const sys = m.generateSystem({
          seed: 'phase-c-survey-' + tone + '-' + i,
          distribution: 'frontier', tone, gu: 'normal', settlements: 'normal',
          graphAware: { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true },
        })
        const top = sys.relationshipGraph.edges.find(e => e.id === sys.relationshipGraph.spineEdgeIds[0])
        if (top) counts[top.type] = (counts[top.type] ?? 0) + 1
      }
    }
    console.log('Spine type frequency across 300 seeds (3 tones × 100 each):')
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(' ', t, c))
  })
  "
  ```

  Read the output. Confirm CONTESTS, CONTROLS, DESTABILIZES are top-3. Note the 4th most frequent — likely CONTRADICTS or BETRAYED.

- [ ] **Step 2: Decide the 4th edge type**

  - If CONTRADICTS is 4th: author per-tone variants for CONTRADICTS in subsequent tasks.
  - If BETRAYED is 4th: author for BETRAYED.
  - If neither is in the top-6: STOP and reconsider scope. Phase C's value depends on the 4 chosen types being commonly-winning spine edges. If they're rare, the per-tone authoring effort doesn't pay off.

  Document the decision in task notes for Task 3 (no commit yet — this task is read-only).

- [ ] **Step 3: Per-task quality gate**

  No code changes; just confirm:
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All clean.

---

## Task 2: Author per-tone era pools

**Why:** Eras appear in `historicalBridge` templates ("...broke {historical:era|in an earlier reckoning},..."). Today's era pool is voice-neutral. Per-tone era pools give the historical bridges per-tone character even on the existing (un-modified) template families.

**Files:**
- Add or rewrite: `src/features/tools/star_system_generator/lib/generator/graph/render/data/eras.ts` (locate the existing one first)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/history.ts`

- [ ] **Step 1: Locate the existing era pool**

  ```bash
  grep -rn "ERAS\|eras\b" src/features/tools/star_system_generator/lib/generator/graph/ --include="*.ts"
  ```

  Find the existing array (likely `data/eras.ts` per the master plan's File Layout section). Read its current shape and consumer:

  ```bash
  grep -n "pickEra\|ERAS" src/features/tools/star_system_generator/lib/generator/graph/history.ts
  ```

- [ ] **Step 2: Refactor era pool into per-tone shape**

  ```ts
  import type { GeneratorTone } from '../../../../../types'

  // balanced: existing voice-neutral era pool. Pre-Phase-C default.
  const BALANCED_ERAS = [
    'the long quiet', 'pre-collapse', 'the bleed years', 'the second wave',
    'the founders\' generation', 'before the gate fell', 'after the first quarantine',
    'in the early settlement, ' /* ... 8-12 entries */
  ] as const

  // cinematic: dramatic, character-anchored eras. Suggests betrayal,
  // collapse, ritual.
  const CINEMATIC_ERAS = [
    'the betrayal years', 'after the crown fell', 'in the silent decade',
    'before the salt-debt', 'the reckoning era', 'after the last vow',
    'in the broken-oath era', 'before the witness died', /* 8-12 entries */
  ] as const

  // astronomy: clinical, instrument-anchored eras. Suggests cycles,
  // calibration runs, surveys.
  const ASTRONOMY_ERAS = [
    'the third pulse cycle', 'between the calibration runs', 'the Bonn-Tycho census',
    'after Cycle 7', 'during the spectral survey', 'in the long-baseline era',
    'before the catalog was sealed', 'after the eighth pulse, ' /* 8-12 entries */
  ] as const

  const ERAS_BY_TONE: Record<GeneratorTone, readonly string[]> = {
    balanced: BALANCED_ERAS,
    cinematic: CINEMATIC_ERAS,
    astronomy: ASTRONOMY_ERAS,
  }

  export function pickEra(rng: SeededRng, tone: GeneratorTone): string {
    const pool = ERAS_BY_TONE[tone]
    return pool[Math.floor(rng.next() * pool.length)]
  }
  ```

  Each pool ≥8 entries; aim for 10–12.

- [ ] **Step 3: Update `history.ts` to pass tone into `pickEra`**

  Find the call site of the existing era pick. Update the signature path: `attachHistoricalEvents` needs to receive the tone. The call site is `buildRelationshipGraph` (Phase A's threading channel exists already).

  Add `tone: GeneratorTone` to `attachHistoricalEvents`'s input parameter object, and thread to `pickEra(rng, tone)` at the call site.

- [ ] **Step 4: Run tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  ```

  Expected: test failures in `proseUnchanged.test.ts` for seeds whose historical bridges include era references (`balanced` should be byte-identical because it draws from the same era list, just via a tone-discriminator that picks the same one for `balanced`). If `balanced` regenerates: ensure the `BALANCED_ERAS` array order matches the previous static pool order so the RNG pick lands on the same string.

- [ ] **Step 5: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: per-tone era pools for historical bridges

  Split the static era pool into 3 tone-conditioned sub-pools.
  cinematic eras suggest betrayal, ritual, character-anchored time
  ("the betrayal years"). astronomy eras suggest cycles, calibrations,
  instrument-anchored time ("the third pulse cycle"). balanced
  preserves the existing voice-neutral pool.

  history.ts's pickEra now takes a tone arg, threaded from Phase A's
  BuildGraphOptions. proseUnchanged.test.ts byte-identical for
  balanced-tone seeds (same era pool order, same RNG pick).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Author per-tone body[0] template variants for the top-4 edge types

**Why:** This is the main authoring lift. Per-tone body variants for CONTESTS, CONTROLS, DESTABILIZES, and the Task-1-chosen 4th type. ~36–48 strings total.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/templates/types.ts` (extend `EdgeTemplateFamily`)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/templates/contestsTemplates.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/templates/controlsTemplates.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/templates/destabilizesTemplates.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/templates/[type-from-Task-1]Templates.ts`

- [ ] **Step 1: Extend `EdgeTemplateFamily` type**

  Edit `templates/types.ts`. Add the optional field:

  ```ts
  import type { GeneratorTone } from '../../../../../types'

  export interface EdgeTemplateFamily {
    edgeType: EdgeType
    body: EdgeTemplate[]
    bodyByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>
    spineSummary: EdgeTemplate
    spineSummaryByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>
    historicalBridge: EdgeTemplate
    hook: EdgeTemplate[]
  }
  ```

- [ ] **Step 2: Author CONTESTS variants**

  Edit `templates/contestsTemplates.ts`. Add `bodyByTone`:

  ```ts
  export const contestsTemplates: EdgeTemplateFamily = {
    edgeType: 'CONTESTS',
    body: [
      // existing 4 entries (default voice)
    ],
    bodyByTone: {
      cinematic: [
        { text: '{subject} swore the pact would hold; {object} swore otherwise.', expects: { subject: 'properNoun', object: 'properNoun' } },
        { text: 'Between {subject} and {object} the knife is already drawn.', expects: { subject: 'properNoun', object: 'properNoun' } },
        { text: '{subject} keeps the receipts. {object} keeps the witnesses.', expects: { subject: 'properNoun', object: 'properNoun' } },
      ],
      astronomy: [
        { text: '{subject} and {object} report incompatible measurements of {qualifier|the same instrument-time}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
        { text: '{subject}\'s observation cohort and {object}\'s cohort cannot agree on the calibration record.', expects: { subject: 'properNoun', object: 'properNoun' } },
        { text: 'A standards dispute between {subject} and {object} is open in the measurement court.', expects: { subject: 'properNoun', object: 'properNoun' } },
      ],
    },
    spineSummary: {/* existing */},
    historicalBridge: {/* existing */},
    hook: [/* existing */],
  }
  ```

  3 cinematic variants + 3 astronomy variants. balanced falls back to the existing `body[]`.

- [ ] **Step 3: Author CONTROLS variants**

  Same shape, in `templates/controlsTemplates.ts`. cinematic: focus on overt power, oaths, fealty. astronomy: focus on licenses, allocations, time-share, jurisdiction.

- [ ] **Step 4: Author DESTABILIZES variants**

  In `templates/destabilizesTemplates.ts`. cinematic: focus on dread, encroachment, tide-of-darkness imagery. astronomy: focus on amplitudes, perturbations, phase shifts.

- [ ] **Step 5: Author the 4th edge type's variants (CONTRADICTS or BETRAYED)**

  Per Task 1's decision.

- [ ] **Step 6: Per-task quality gate (no renderer wiring yet)**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All green. The new `bodyByTone` fields are present on the template families but not yet read by the renderer (Task 6 wires that). proseUnchanged.test.ts byte-identical because nothing reads the new fields yet.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: per-tone body[0] template variants for top-4 spine edge types

  Author bodyByTone variants for CONTESTS, CONTROLS, DESTABILIZES,
  and [CONTRADICTS|BETRAYED]. ~36-48 strings total. cinematic variants
  use noir/oath/violence register; astronomy variants use clinical/
  instrument/measurement register.

  Renderer wiring deferred to Task 6 (proseUnchanged byte-identical
  in this commit because nothing reads bodyByTone yet).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Author per-tone spineSummary variants

**Why:** spineSummary is the headline one-liner — high impact per-string. Per-tone variants for the same 4 edge types as Task 3.

**Files:**
- Modify: same 4 template files as Task 3.

- [ ] **Step 1: Author spineSummaryByTone for each of the 4 edge types**

  Per-tone variants — 2-3 per cell. Example for CONTESTS:

  ```ts
  spineSummaryByTone: {
    cinematic: [
      { text: '{subject} and {object} are bleeding each other dry — and the system cheers them on.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Between {subject} and {object} the war is already lost; only the funerals remain.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} and {object} hold incompatible records on the same observation; the resolution is jurisdictional.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'A standards dispute between {subject} and {object} is the system\'s open question.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  ```

- [ ] **Step 2: Per-task quality gate (no renderer wiring yet)**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All green.

- [ ] **Step 3: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: per-tone spineSummary variants for top-4 spine edge types

  Author spineSummaryByTone variants for the same 4 edge types as
  Task 3. ~24-36 strings total. spineSummary is the headline one-liner;
  per-tone variants here have the highest user-visible impact per
  authored string.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Per-tone connective banks

**Why:** Cheap visible-diff add-on. Per-tone connectives change the rhythm of body paragraphs without authoring template variants.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/connectives.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts` (call site for `connectiveFor` becomes tone-aware)

- [ ] **Step 1: Extend `connectives.ts` to per-tone banks**

  ```ts
  import type { GeneratorTone } from '../../../../types'

  const BALANCED_CONNECTIVES: Partial<Record<Pair, string>> = {
    // existing 15 entries (current voice)
  }

  const CINEMATIC_CONNECTIVES: Partial<Record<Pair, string>> = {
    'CONTESTS->DESTABILIZES': 'And then,',
    'CONTROLS->CONTESTS': 'Until,',
    'DEPENDS_ON->DESTABILIZES': 'And worse,',
    'CONTESTS->CONTRADICTS': 'In private,',
    // 5-8 entries
  }

  const ASTRONOMY_CONNECTIVES: Partial<Record<Pair, string>> = {
    'CONTESTS->DESTABILIZES': 'Concurrently,',
    'CONTROLS->CONTESTS': 'However,',
    'DEPENDS_ON->DESTABILIZES': 'Furthermore,',
    'CONTESTS->CONTRADICTS': 'In the records,',
    // 5-8 entries
  }

  const CONNECTIVES_BY_TONE = {
    balanced: BALANCED_CONNECTIVES,
    cinematic: CINEMATIC_CONNECTIVES,
    astronomy: ASTRONOMY_CONNECTIVES,
  } as const

  export function connectiveFor(
    prev: EdgeType | undefined,
    next: EdgeType,
    tone: GeneratorTone,
  ): string {
    if (prev === undefined) return ''
    const key = `${prev}->${next}` as Pair
    return CONNECTIVES_BY_TONE[tone][key]
      ?? CONNECTIVES_BY_TONE.balanced[key]
      ?? ''
  }
  ```

  Fallback chain: tone-specific → balanced → empty.

- [ ] **Step 2: Update the renderer call site**

  In `renderSystemStory.ts`, find `connectiveFor(prev, edge.type)` and add `tone`:

  ```ts
  const connective = connectiveFor(prev, edge.type, ctx.tone)
  ```

  Requires `ctx.tone` to be threaded into `EdgeRenderContext` — defer to Task 6 if Task 6 is ordered before; otherwise add the threading here.

- [ ] **Step 3: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All green. proseUnchanged regenerates for cinematic/astronomy seeds (none in the existing snapshot — those use balanced). For balanced seeds, the BALANCED_CONNECTIVES preserve the existing 15 entries — byte-identical.

- [ ] **Step 4: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: per-tone connective banks

  Cheap visible-diff add-on: per-tone variants for the most common
  edge-pair connectives. cinematic uses 'And then,' / 'Until,' /
  'And worse,'; astronomy uses 'Concurrently,' / 'However,' /
  'Furthermore,'; balanced preserves the existing 15 entries.

  Fallback chain: tone-specific → balanced → empty. Connective
  selection at render time uses the tone field threaded via
  EdgeRenderContext.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 6: Renderer wiring + proseUnchanged regeneration

**Why:** Tasks 3–5 ship the per-tone variants but don't yet wire the renderer to read them. Task 6 lands the wiring AND the deliberate `proseUnchanged.test.ts` regeneration.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap`

- [ ] **Step 1: Add `tone` to `EdgeRenderContext`**

  In `renderSystemStory.ts`, find `EdgeRenderContext` (read the type definition):

  ```ts
  interface EdgeRenderContext {
    subject: EntityRef
    object: EntityRef
    qualifier?: string
    edgeType: EdgeType
    visibility: EdgeVisibility
    tone: GeneratorTone   // NEW
  }
  ```

- [ ] **Step 2: Update `renderSystemStory` to receive and propagate tone**

  The signature becomes:
  ```ts
  export function renderSystemStory(
    graph: SystemRelationshipGraph,
    facts: NarrativeFact[],
    options: BuildGraphOptions,
    rng: SeededRng,
  ): SystemStoryOutput
  ```

  Pass `options.tone` into every `renderClause` / `renderEdgeSentence` call site, and into the `EdgeRenderContext` constructions.

- [ ] **Step 3: Update `renderEdgeSentence` to route by tone**

  Change:
  ```ts
  const variant = pickVariant(family.body, rng)
  ```
  To:
  ```ts
  const tonedBody = family.bodyByTone?.[ctx.tone] ?? family.body
  const variant = pickVariant(tonedBody, rng)
  ```

- [ ] **Step 4: Update `renderSpineSummary` (the spine-summary composer) similarly**

  Find the spine-summary rendering function. Change the lookup:
  ```ts
  const spineTemplate = pickVariant(family.spineSummaryByTone?.[ctx.tone] ?? [family.spineSummary], rng)
  ```

  Note: the existing `spineSummary` is a single template, not an array — wrap it in `[family.spineSummary]` when falling back. Phase C's per-tone variant is an array of 2-3.

- [ ] **Step 5: Update the call site of `renderSystemStory` in `lib/generator/index.ts`**

  Pass `options` (Phase A's `BuildGraphOptions`) into `renderSystemStory`.

- [ ] **Step 6: Run tests, expect proseUnchanged failure**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: FAIL. The variant lookup now finds `bodyByTone.balanced ?? body[]` for the 4 retuned edge types — `balanced` doesn't have explicit `bodyByTone` entries (Task 3 added cinematic + astronomy only), so it falls through to existing `body[]`. Snapshot SHOULD be byte-identical for balanced-tone seeds in this case.

  If it fails for balanced seeds: there's an edge case in the fallback. Read the diff. Most likely cause: `bodyByTone.balanced` is `undefined` (not set), `?? family.body` triggers correctly, then `pickVariant(family.body, rng)` runs — same RNG, same array, same pick. If snapshot drifts, the variant order in `body[]` shifted (e.g., the per-tone variants accidentally got prepended); fix the variant order.

  If it fails for cinematic/astronomy seeds (none in the existing snapshot): expected — those seeds aren't in the snapshot. No regeneration needed for those.

- [ ] **Step 7: Per-task quality gate (without snapshot regeneration)**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All green except possibly proseUnchanged. If proseUnchanged genuinely needs regenerating because of a structural variant-pick difference, regenerate now:

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts -u
  ```

  Inspect diff: confirm only template-pick changes, no broken slot resolution.

- [ ] **Step 8: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: wire renderer to per-tone template variants

  renderClause / renderEdgeSentence now route to bodyByTone[tone]
  before falling back to family.body. renderSpineSummary similarly
  routes to spineSummaryByTone[tone]. Tone is threaded into
  EdgeRenderContext from BuildGraphOptions (Phase A's channel).

  proseUnchanged.test.ts [byte-identical | regenerated]: [explain
  whichever case fired in Step 6, and document the diff if
  regenerated].

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 7: Cross-tone snapshot test + body[0] diversity audit check

**Why:** Tasks 3–6 ship the per-tone voice. Task 7 pins the cross-tone behavior as a snapshot contract AND adds a corpus-level audit check on body[0] string diversity.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneVoiceMatrix.test.ts`
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Build the cross-tone voice snapshot**

  Create `spineToneVoiceMatrix.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { generateSystem } from '../../index'

  describe('spine tone × edge type voice matrix', () => {
    const tones = ['balanced', 'cinematic', 'astronomy'] as const
    const edgeTypes = ['CONTESTS', 'CONTROLS', 'DESTABILIZES', /* the Task 1 4th */] as const
    const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

    for (const edgeType of edgeTypes) {
      for (const tone of tones) {
        it(`tone=${tone} edge=${edgeType}: body[0] reads in tone voice`, () => {
          // Use a curated seed that reliably produces this edge type for this tone.
          // (Curate by hand from the Task 1 frequency survey.)
          const seed = `voice-matrix-${edgeType}-${tone}-1`
          const sys = generateSystem({
            seed, distribution: 'frontier', tone, gu: 'normal', settlements: 'normal',
            graphAware: flags,
          })
          expect({
            spineEdgeType: sys.relationshipGraph.edges.find(e => e.id === sys.relationshipGraph.spineEdgeIds[0])?.type ?? null,
            spineSummary: sys.systemStory.spineSummary,
            body0: sys.systemStory.body[0] ?? null,
          }).toMatchSnapshot()
        })
      }
    }
  })
  ```

- [ ] **Step 2: Generate the snapshot and inspect**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/spineToneVoiceMatrix.test.ts -u
  ```

  Inspect the snapshot file. For each (edge type × tone) cell:
  - Confirm body[0] reads in the expected register (cinematic = noir; astronomy = clinical; balanced = neutral).
  - Confirm faction names slot in correctly.
  - Confirm no broken slot resolution.

  If a cell reads in the wrong register: Task 3's variant for that cell is mis-authored; revise and regenerate.

- [ ] **Step 3: Add body[0] diversity audit check**

  In `scripts/audit-star-system-generator.ts`:

  ```ts
  // narrative.body0VoiceDiversity: across the deep-audit corpus, body[0]
  // strings within a single tone should be ≥50% unique (catches a regression
  // where all balanced systems use template variant 0, all cinematic use
  // variant 0, etc.).
  const body0ByTone = new Map<string, Set<string>>()
  for (const sys of corpus) {
    const tone = sys.options.tone
    const body0 = sys.systemStory.body[0] ?? ''
    if (!body0ByTone.has(tone)) body0ByTone.set(tone, new Set())
    body0ByTone.get(tone)!.add(body0)
  }
  for (const [tone, set] of body0ByTone) {
    const samplesForTone = corpus.filter(s => s.options.tone === tone).length
    const uniquenessRate = set.size / samplesForTone
    if (uniquenessRate < 0.5 && samplesForTone >= 100) {
      addFinding(findings, 'warning', 'corpus', 'narrative.body0VoiceDiversity',
        `body[0] uniqueness for tone=${tone}: ${set.size}/${samplesForTone} (${Math.round(100 * uniquenessRate)}%, expected ≥50%). Variants may be collapsing.`)
    }
  }
  ```

- [ ] **Step 4: Run deep audit**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: 0 findings. If `narrative.body0VoiceDiversity` warns:
  - For balanced: variants may not have been added to `body[]` (only to `bodyByTone`). Check the variant counts.
  - For cinematic / astronomy: the bodyByTone array is too small. Add more variants.

- [ ] **Step 5: Update master overview's Phases table**

  Mark Phase C done.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  test: cross-tone voice matrix snapshot + body[0] diversity audit

  spineToneVoiceMatrix.test.ts pins body[0] and spineSummary per
  (tone × edge type) cell for the top-4 spine edge types. Future
  template-variant changes regenerate this snapshot intentionally;
  reviewers see per-cell diffs.

  narrative.body0VoiceDiversity audit check warns if body[0] strings
  within a single tone are <50% unique across the deep-audit corpus.
  Catches a future regression where one variant dominates within a tone.

  Marks Phase C done in master overview. Phase D (distribution +
  density axes) is the next phase.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (from master overview) | Task |
|---|---|
| Per-tone era pools (3 tones × 8–12 eras) | Task 2 |
| Per-tone body[0] template variants for top-4 edge types | Tasks 1, 3 |
| Per-tone spineSummary variants for top-4 edge types | Task 4 |
| Renderer wiring (tone-aware variant selection) | Task 6 |
| Per-tone connective banks | Task 5 |
| Cross-tone snapshot test for top-4 edge types | Task 7 |
| Audit: body[0] string diversity ≥50% within a tone | Task 7 |
| Determine the 4th edge type empirically | Task 1 |
| Master-overview Phase C row marked done | Task 7 |

**Estimated commits:** 7 (one per task; Task 1 is read-only and may not commit).

**Estimated effort:** ~6–8 days. Tasks 3 and 4 are the largest (template authoring).

---

## Risks & deferred items

- **Authoring quality is the gating factor.** Per-tone templates are creative writing tasks. First-cut variants may read awkwardly. Iteration loop: regenerate Task 7 snapshot, eyeball each cell, refine. Iteration is bounded — variants live in 4 template files.
- **The 4th edge type may be a tossup.** If CONTRADICTS and BETRAYED tie for 4th in Task 1's survey, pick the more dramatic-feeling one (likely BETRAYED) since per-tone variants are most impactful when the base prose has voice room to differentiate.
- **Variant pick determinism.** `pickVariant(tonedBody, rng)` uses the same RNG as the un-toned `pickVariant(family.body, rng)`. For balanced-tone seeds with `bodyByTone.balanced` undefined, the RNG pick must land on the same array index — confirm in Task 6 by spot-checking a balanced-tone seed pre/post-Task-6.
- **Spine summary fallback shape mismatch.** The existing `spineSummary: EdgeTemplate` is a single template; `spineSummaryByTone: { [tone]: EdgeTemplate[] }` is an array. The fallback `family.spineSummaryByTone?.[ctx.tone] ?? [family.spineSummary]` wraps the single template in an array; if a future template family changes the shape, this fallback may break — keep the wrapping consistent.
- **`historicalBridge` not per-tone-ified.** Phase C deliberately doesn't add per-tone variants for the historicalBridge template. The era-pool variation (Task 2) provides the tone variance for historical bridges; the template structure stays neutral. If post-Phase-C surveys show historical bridges read same-voiced regardless of era, that's a follow-up.
- **Slot syntax dependencies.** Per-tone templates use the same slot syntax as existing ones (`{subject}`, `{object}`, `{qualifier|fallback}`, `{historical:era}`). If a per-tone variant uses a slot the family's `EdgeTemplate.expects` doesn't declare, the renderer will error. Each new variant declares the slots it expects.
- **proseUnchanged regeneration scope.** Task 6's regeneration should be limited to seeds whose spine edge type is one of the top-4. If non-top-4 edge types' snapshots regenerate, an unintended cascade has occurred — diagnose. Most likely cause: `bodyByTone.balanced` accidentally introduced for an un-modified family.
- **Cohesion with Phase B.** Per-tone faction names + per-tone templates compose naturally because they use the same tone signal. But if a future axis (Phase D's distribution) wants its own variant pool, the variant-selection logic becomes 2-deep. Phase D's plan addresses this — Phase C doesn't pre-solve for it.

---

## Outputs the next phase relies on

After Phase C:
- `EdgeTemplateFamily` carries optional `bodyByTone` and `spineSummaryByTone` fields. Phase D could extend with `bodyByDistribution` if needed (recommended: don't, distribution variance is in scoring, not templates).
- Per-tone era pools live in `data/eras.ts`. Phase D could extend with per-distribution eras, but again recommended: distribution shapes the system, not the era pool.
- Per-tone connectives in `connectives.ts`.
- `spineToneVoiceMatrix.test.ts` is the long-term contract for per-tone voice.
- `narrative.body0VoiceDiversity` audit check is live.
- The Phase 7 review's "every system reads template-shuffled" complaint is structurally addressed at the voice layer for the top-4 spine-eligible edge types.

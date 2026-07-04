# Body-Prose Pronominalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut proper-noun density in conflict body paragraphs by replacing repeat entity mentions with pronouns, so multi-conflict paragraphs stop reading "Danfeng's Flare Belt III … Danfeng's Flare Belt III … Danfeng's Flare Belt III" (currently up to 4 full mentions in one paragraph, observed in `spineToneVoiceMatrix.test.ts.snap`).

**Architecture:** A new pure textual post-pass `reduceProperNounDensity(paragraph, refs)` runs on each assembled body paragraph inside `renderParagraph` (`lib/generator/graph/render/renderSystemStory.ts`). It never touches the RNG (no draw-stream shifts), keeps every entity's FIRST mention as the full displayName (existing `toContain` tests depend on this), and applies two conservative substitution rules: same-sentence repeats, and sentence-opening mentions whose antecedent was the sole entity of the previous sentence. The existing spine-summary pronominalization (`pronominalizeSecondMention`) is left untouched.

**Tech Stack:** TypeScript (strict, no `any`), Vitest unit config, existing snapshot suites.

## Global Constraints

- Root: `src/features/tools/star_system_generator/` — all paths below relative to it.
- **Run all tests on Node 24** (plain `npm run test`; CI moved to Node 24 in `52daa54`, and `spineFullAxisMatrix` snapshots diverge between Node majors — generate them on 24, never 20; `.nvmrc` pins 24).
- Never use `any`; use `unknown` or precise types. Prefix unused params with `_`.
- No code comments unless stating a non-obvious constraint.
- The post-pass is a PURE FUNCTION of the assembled string + entity refs. It must not consume `SeededRng` — any RNG use would reshuffle unrelated variant-deck draws.
- Old-seed output WILL change (approved). Snapshot suites regenerated with `vitest -u` on Node 24 in the same commit as the wiring task.
- The pronoun is always `it`/`its` (`It`/`Its` at sentence start), for every `EntityKind` — matching the existing spine-summary behavior (`pronominalizeSecondMention` in `renderSystemStory.ts`; line numbers drifted after the 2026-07-03 spine-diversity session, which also added bridge-variant picks and three summary composition modes to `renderSpineSummary` — body-paragraph rendering is unaffected) and avoiding verb-agreement breakage ("they presses") that textual substitution cannot repair.
- Commit per task on `develop`, Conventional Commits scope `star-system`, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Gates per task: `npx tsc --noEmit`, `npm run lint`, unit tests on Node 24.
- `scripts/audit-star-system-generator.ts` reports **723** errors with `STAR_SYSTEM_AUDIT_FINDING_LIMIT=100000` (re-measured 2026-07-03 after the spine-diversity session `add75eb..e75cc86`; was 768). After the wiring task, re-run and require: no NEW error categories and total count ≤ 723, with 0 tolerance on `prose.*` categories (`prose.lowercaseFactionMidSentence` is now 0 — keep it there). Known non-prose stragglers: `story.hiddenLeak` 2.

### Why the matching must be boundary-aware and longest-first (measured hazard)

The name registry systematically builds site names as `"<body name> <descriptor>"`, so real systems contain nested pairs like `Calvera-10 V` / `Calvera-10 V Platform` and `Danfeng's Flare Belt III` / `Danfeng's Flare Belt III Cylinder` (both in current snapshots). A plain `indexOf` replacer (like the existing `replaceSecond`) would rewrite the prefix inside the longer name, producing `"…on it Cylinder…"`. The algorithm below claims longer-name spans first so shorter names can never match inside them.

---

### Task 1: `reduceProperNounDensity` core — occurrence finder + same-sentence rule

**Files:**
- Create: `lib/generator/graph/render/pronominalize.ts`
- Test: `lib/generator/graph/render/__tests__/pronominalize.test.ts`

**Interfaces:**
- Consumes: `EntityRef` from `../types` (shape: `{ kind, id, displayName, layer }`).
- Produces (Task 2 extends the same file; Task 3 wires it):
```ts
export function reduceProperNounDensity(paragraph: string, refs: readonly EntityRef[]): string
```

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { reduceProperNounDensity } from '../pronominalize'
import type { EntityRef } from '../../types'

function ref(displayName: string, kind: EntityRef['kind'] = 'namedFaction'): EntityRef {
  return { kind, id: displayName.toLowerCase().replace(/\W+/g, '-'), displayName, layer: 'narrative' }
}

describe('reduceProperNounDensity — same-sentence rule', () => {
  it('replaces the second same-sentence mention with "it"', () => {
    const out = reduceProperNounDensity(
      'Orison Hold guards the ledger because Orison Hold wrote it.',
      [ref('Orison Hold', 'settlement')],
    )
    expect(out).toBe('Orison Hold guards the ledger because it wrote it.')
  })

  it('never rewrites a shorter name nested inside a longer tracked name', () => {
    const out = reduceProperNounDensity(
      'Calvera-10 V carries Calvera-10 V Platform on its surface, and Calvera-10 V pays for the privilege.',
      [ref('Calvera-10 V', 'body'), ref('Calvera-10 V Platform', 'settlement')],
    )
    expect(out).toBe('Calvera-10 V carries Calvera-10 V Platform on its surface, and it pays for the privilege.')
  })

  it('replaces a same-sentence possessive repeat with "its"', () => {
    const out = reduceProperNounDensity(
      "The Helion Debt Synod audits every berth, and the Helion Debt Synod's ledger never closes.",
      [ref('the Helion Debt Synod')],
    )
    expect(out).toBe("The Helion Debt Synod audits every berth, and its ledger never closes.")
  })

  it('leaves single mentions and untracked names untouched', () => {
    const text = 'Orison Hold guards the ledger while the Kestrel Free Compact watches.'
    expect(reduceProperNounDensity(text, [ref('Orison Hold', 'settlement')])).toBe(text)
  })

  it('does not match inside hyphenated extensions of a name', () => {
    const text = 'Calvera-10 anchors the route; Calvera-100 does not exist.'
    expect(reduceProperNounDensity(text, [ref('Calvera-10', 'body')])).toBe(text)
  })

  it('never replaces the first mention of an entity in the paragraph', () => {
    const out = reduceProperNounDensity(
      'The dispute is old. Orison Hold denies Orison Hold ever signed.',
      [ref('Orison Hold', 'settlement')],
    )
    expect(out).toBe('The dispute is old. Orison Hold denies it ever signed.')
  })

  it('pronominalizes at most one distinct entity per sentence (ambiguity guard)', () => {
    const out = reduceProperNounDensity(
      'Orison Hold sues the Kestrel Free Compact because Orison Hold says the Kestrel Free Compact lied.',
      [ref('Orison Hold', 'settlement'), ref('the Kestrel Free Compact')],
    )
    expect(out).toBe('Orison Hold sues the Kestrel Free Compact because it says the Kestrel Free Compact lied.')
  })
})
```

Notes baked into these tests: case-sensitive exact-name matching (same as the existing spine helper); the first entity to earn a substitution in a sentence claims it, later distinct entities keep their full names (two different "it"s in one sentence would be ambiguous).

- [ ] **Step 2: Run to verify failure**

Run: `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx vitest run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/pronominalize.test.ts --config vitest.unit.config.ts`
Expected: FAIL — `Cannot find module '../pronominalize'`.

- [ ] **Step 3: Implement**

```ts
import type { EntityRef } from '../types'

interface Occurrence {
  start: number
  end: number
  name: string
  possessive: boolean
}

const WORDLIKE_BEFORE = /[A-Za-z0-9'-]/
const WORDLIKE_AFTER = /[A-Za-z0-9-]/

function findOccurrences(sentence: string, namesLongestFirst: readonly string[]): Occurrence[] {
  const claimed = new Array<boolean>(sentence.length).fill(false)
  const occurrences: Occurrence[] = []
  for (const name of namesLongestFirst) {
    let from = 0
    while (from <= sentence.length - name.length) {
      const start = sentence.indexOf(name, from)
      if (start < 0) break
      const before = start === 0 ? '' : sentence[start - 1]
      let end = start + name.length
      const possessive = sentence.startsWith("'s", end)
      if (possessive) end += 2
      const after = end < sentence.length ? sentence[end] : ''
      const boundaryOk =
        (before === '' || !WORDLIKE_BEFORE.test(before)) &&
        (after === '' || !WORDLIKE_AFTER.test(after))
      const overlapsClaim = claimed.slice(start, end).some(Boolean)
      if (boundaryOk && !overlapsClaim) {
        for (let i = start; i < end; i += 1) claimed[i] = true
        occurrences.push({ start, end, name, possessive })
        from = end
      } else {
        from = start + 1
      }
    }
  }
  return occurrences.sort((a, b) => a.start - b.start)
}

function pronounFor(occurrence: Occurrence, atSentenceStart: boolean): string {
  const base = occurrence.possessive ? 'its' : 'it'
  return atSentenceStart ? base.charAt(0).toUpperCase() + base.slice(1) : base
}

function applyReplacements(sentence: string, replacements: readonly Occurrence[]): string {
  let result = sentence
  const rightToLeft = [...replacements].sort((a, b) => b.start - a.start)
  for (const occurrence of rightToLeft) {
    const pronoun = pronounFor(occurrence, occurrence.start === 0)
    result = result.slice(0, occurrence.start) + pronoun + result.slice(occurrence.end)
  }
  return result
}

export function reduceProperNounDensity(paragraph: string, refs: readonly EntityRef[]): string {
  const names = [...new Set(refs.map(r => r.displayName).filter(n => n.length >= 4))]
    .sort((a, b) => b.length - a.length)
  if (names.length === 0) return paragraph
  const sentences = paragraph.split(/(?<=[.!?]) /)
  const namedEarlier = new Set<string>()
  const rewritten = sentences.map(sentence => {
    const occurrences = findOccurrences(sentence, names)
    if (occurrences.length === 0) return sentence
    const seenThisSentence = new Set<string>()
    const replacements: Occurrence[] = []
    let pronominalizedEntity: string | null = null
    for (const occurrence of occurrences) {
      const repeatInSentence = seenThisSentence.has(occurrence.name)
      seenThisSentence.add(occurrence.name)
      if (!namedEarlier.has(occurrence.name) && !repeatInSentence) continue
      if (!repeatInSentence) continue
      if (pronominalizedEntity !== null && pronominalizedEntity !== occurrence.name) continue
      pronominalizedEntity = occurrence.name
      replacements.push(occurrence)
    }
    for (const name of seenThisSentence) namedEarlier.add(name)
    return applyReplacements(sentence, replacements)
  })
  return rewritten.join(' ')
}
```

(The `namedEarlier` set is populated in Task 1 but only the same-sentence rule fires; Task 2 adds the cross-sentence rule that consumes it. The `!namedEarlier.has(...) && !repeatInSentence` guard is what keeps the paragraph's first mention intact.)

- [ ] **Step 4: Run the tests**

Same command as Step 2. Expected: all 7 PASS.

- [ ] **Step 5: Run lint + typecheck, then commit**

```bash
npm run lint && npx tsc --noEmit
git add src/features/tools/star_system_generator/lib/generator/graph/render/pronominalize.ts src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/pronominalize.test.ts
git commit -m "feat(star-system): boundary-aware same-sentence pronominalization core

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Cross-sentence antecedent rule

**Files:**
- Modify: `lib/generator/graph/render/pronominalize.ts`
- Test: `lib/generator/graph/render/__tests__/pronominalize.test.ts` (extend)

**Interfaces:**
- Consumes/Produces: same `reduceProperNounDensity` signature; behavior extended.

Rule being added: if the previous sentence mentioned exactly ONE tracked entity, and the current sentence's first tracked occurrence is that same entity (already fully named earlier in the paragraph), replace that occurrence with `it`/`its` (`It`/`Its` when it opens the sentence). At most one cross-sentence substitution per sentence, and it counts toward the one-distinct-entity-per-sentence ambiguity guard.

- [ ] **Step 1: Write the failing tests** (append to the existing describe file)

```ts
describe('reduceProperNounDensity — cross-sentence rule', () => {
  it('pronominalizes a sentence-opening mention whose antecedent was the sole entity of the previous sentence', () => {
    const out = reduceProperNounDensity(
      'Orison Hold holds the water contract. Orison Hold denies this in every hearing.',
      [ref('Orison Hold', 'settlement')],
    )
    expect(out).toBe('Orison Hold holds the water contract. It denies this in every hearing.')
  })

  it('keeps the full name when the previous sentence mentioned two tracked entities', () => {
    const text =
      'Orison Hold sued the Kestrel Free Compact. Orison Hold lost.'
    const out = reduceProperNounDensity(text, [ref('Orison Hold', 'settlement'), ref('the Kestrel Free Compact')])
    expect(out).toBe(text)
  })

  it('keeps the full name when the previous sentence mentioned a different sole entity', () => {
    const text = 'The Kestrel Free Compact filed first. Orison Hold filed second. Orison Hold paid the fee.'
    const out = reduceProperNounDensity(text, [ref('Orison Hold', 'settlement'), ref('the Kestrel Free Compact')])
    expect(out).toBe('The Kestrel Free Compact filed first. Orison Hold filed second. It paid the fee.')
  })

  it('handles the possessive cross-sentence case with "Its"', () => {
    const out = reduceProperNounDensity(
      "Orison Hold runs the dock. Orison Hold's ledger says otherwise.",
      [ref('Orison Hold', 'settlement')],
    )
    expect(out).toBe("Orison Hold runs the dock. Its ledger says otherwise.")
  })

  it('does not chain pronouns across more than one sentence gap', () => {
    const out = reduceProperNounDensity(
      'Orison Hold runs the dock. It bills by the hour. Orison Hold keeps the difference.',
      [ref('Orison Hold', 'settlement')],
    )
    expect(out).toBe('Orison Hold runs the dock. It bills by the hour. It keeps the difference.')
  })

  it('reproduces the observed snapshot pathology and reduces it', () => {
    const para =
      "Danfeng's Flare Belt III will blink first, and Danfeng's Flare Belt III Cylinder absorbs the difference. " +
      "The principals are the first-wave ghost colony and Danfeng's Flare Belt III. " +
      "Danfeng's Flare Belt III carries Danfeng's Flare Belt III Cylinder on its surface."
    const out = reduceProperNounDensity(para, [
      ref("Danfeng's Flare Belt III", 'body'),
      ref("Danfeng's Flare Belt III Cylinder", 'settlement'),
      ref('the first-wave ghost colony'),
    ])
    const fullMentions = out.split("Danfeng's Flare Belt III").length - 1
    expect(fullMentions).toBeLessThan(5)
    expect(out.startsWith("Danfeng's Flare Belt III will blink first")).toBe(true)
    expect(out).toContain("Danfeng's Flare Belt III Cylinder")
  })
})
```

Note on the last test: `split` counts nested prefixes too, so the assertion is deliberately a coarse "density went down" bound (baseline is 5 counting the two Cylinder prefixes); the exact-output tests above carry the precision.

- [ ] **Step 2: Run to verify the new tests fail**

Run: same vitest command as Task 1 Step 2.
Expected: the 6 new tests FAIL (cross-sentence mentions keep full names); the 7 Task 1 tests still PASS.

- [ ] **Step 3: Implement** — replace the sentence-mapping body of `reduceProperNounDensity` with:

```ts
  const namedEarlier = new Set<string>()
  let previousSoleEntity: string | null = null
  const rewritten = sentences.map(sentence => {
    const occurrences = findOccurrences(sentence, names)
    if (occurrences.length === 0) {
      previousSoleEntity = null
      return sentence
    }
    const seenThisSentence = new Set<string>()
    const replacements: Occurrence[] = []
    let pronominalizedEntity: string | null = null
    occurrences.forEach((occurrence, index) => {
      const repeatInSentence = seenThisSentence.has(occurrence.name)
      seenThisSentence.add(occurrence.name)
      const crossSentenceEligible =
        index === 0 &&
        !repeatInSentence &&
        namedEarlier.has(occurrence.name) &&
        previousSoleEntity === occurrence.name
      if (!repeatInSentence && !crossSentenceEligible) return
      if (!namedEarlier.has(occurrence.name) && !repeatInSentence) return
      if (pronominalizedEntity !== null && pronominalizedEntity !== occurrence.name) return
      pronominalizedEntity = occurrence.name
      replacements.push(occurrence)
    })
    for (const name of seenThisSentence) namedEarlier.add(name)
    const distinct = new Set(occurrences.map(o => o.name))
    previousSoleEntity = distinct.size === 1 ? occurrences[0].name : null
    return applyReplacements(sentence, replacements)
  })
```

(`previousSoleEntity` stays set when the sole mention was itself pronominalized — the antecedent is still that entity — which is what makes the "does not chain more than one gap" test pass: the third sentence's antecedent is sentence 2's sole entity.)

- [ ] **Step 4: Run all pronominalize tests** — expected: 13/13 PASS.

- [ ] **Step 5: Lint + typecheck + commit**

```bash
npm run lint && npx tsc --noEmit
git add -A src/features/tools/star_system_generator/lib/generator/graph/render
git commit -m "feat(star-system): cross-sentence antecedent pronominalization

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire into `renderParagraph` + snapshots + corpus density gate

**Files:**
- Modify: `lib/generator/graph/render/renderSystemStory.ts` (`renderParagraph`, currently lines ~198–225)
- Test: `lib/generator/graph/render/__tests__/renderSystemStoryConflicts.test.ts` (extend)
- Test: `__tests__/narrative-repetition.test.ts` (extend with a density assertion)
- Regenerate: `lib/generator/graph/__tests__/__snapshots__/spineFullAxisMatrix.test.ts.snap`, `spineToneVoiceMatrix.test.ts.snap`, and any other suite that fails on Node 24 after the change (check `spineToneGuMatrix` — it snapshots edge-type metadata and may be untouched).

**Interfaces:**
- Consumes: `reduceProperNounDensity(paragraph, refs)` from Task 2; `Conflict` (has `parties: ConflictParty[]` each with `.ref: EntityRef`, and `stakeRef: EntityRef | null`).
- Produces: no signature changes — `renderParagraph` still returns `string`.

- [ ] **Step 1: Write the failing integration test** (in `renderSystemStoryConflicts.test.ts`, alongside the existing multi-conflict fixtures — reuse that file's fixture builders)

```ts
it('pronominalizes repeat entity mentions within a body paragraph', () => {
  const { graph, conflicts } = buildThreeConflictFixture()  // the existing 3-CONTESTS-edges fixture used by the beat-deck test
  const story = renderSystemStory(graph, createSeededRng('pronoun-seed'), { tone: 'balanced' }, conflicts)
  const para = story.body[0]
  const subjectName = conflicts[0].parties[0].ref.displayName
  expect(para).toContain(subjectName)
  const mentions = countBoundaryMentions(para, subjectName)
  expect(mentions).toBeLessThanOrEqual(2)
  expect(para).toMatch(/\b[Ii]ts?\b/)
})
```

with this helper at the top of the file (boundary-aware so nested longer names don't inflate the count):

```ts
function countBoundaryMentions(text: string, name: string): number {
  let count = 0
  let from = 0
  while (true) {
    const at = text.indexOf(name, from)
    if (at < 0) return count
    const before = at === 0 ? '' : text[at - 1]
    const after = text[at + name.length] ?? ''
    if (!/[A-Za-z0-9'-]/.test(before) && !/[A-Za-z0-9-]/.test(after)) count += 1
    from = at + name.length
  }
}
```

And the corpus density gate (append to `__tests__/narrative-repetition.test.ts`, reusing its `SYSTEMS` corpus):

```ts
it('no entity is fully named more than 3 times in a single body paragraph', () => {
  for (const system of SYSTEMS) {
    for (const paragraph of system.systemStory.body) {
      const names = system.relationshipGraph.entities.map(e => e.displayName).filter(n => n.length >= 4)
      const sorted = [...new Set(names)].sort((a, b) => b.length - a.length)
      const claimedCounts = countClaimedMentions(paragraph, sorted)
      for (const [name, count] of claimedCounts) {
        expect(count, `${name} appears ${count}x in one paragraph`).toBeLessThanOrEqual(3)
      }
    }
  }
})
```

`countClaimedMentions` mirrors the longest-first claiming of the implementation (copy the ~20-line helper into the test file; it returns a `Map<string, number>`). NOTE: verify the generated system output exposes the graph as `system.relationshipGraph` — if the property name differs, adapt (check `types.ts` / `generateSystem` return shape). If a floor of 3 fails on the corpus, investigate the offending paragraph before loosening: the same-sentence and cross-sentence rules may need the `previousSoleEntity` freshness rule extended, and 4+ full mentions in one paragraph is exactly the pathology this plan exists to remove. Do not raise the cap above 3 without reporting the paragraph.

- [ ] **Step 2: Run to verify failure**

Run the two test files on Node 24. Expected: the new integration test FAILS on `mentions <= 2` (current output has 3–4), and the corpus gate FAILS on at least one paragraph (the ×4 pathology is pinned in current snapshots).

- [ ] **Step 3: Implement the wiring** in `renderSystemStory.ts`:

Add import:
```ts
import { reduceProperNounDensity } from './pronominalize'
```

In `renderParagraph`, replace the final `return sentences.join(' ')` with:

```ts
  const refs: EntityRef[] = []
  for (const edge of edges) {
    refs.push(edge.subject, edge.object)
    const conflict = conflictByEdgeId.get(edge.id)
    if (conflict) {
      for (const party of conflict.parties) refs.push(party.ref)
      if (conflict.stakeRef) refs.push(conflict.stakeRef)
    }
  }
  return reduceProperNounDensity(sentences.join(' '), refs)
```

(`EntityRef` is already imported in this file for other signatures; add it to the import list if not.)

- [ ] **Step 4: Run the two test files** → expected PASS. Then regenerate snapshots and eyeball the diff:

```bash
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx vitest run -u --config vitest.unit.config.ts src/features/tools/star_system_generator
git diff --stat -- '*.snap'
```

Read every changed `.snap` hunk: pronoun substitutions must read grammatically (no "it Cylinder", no "It's" where "Its" belongs, no double pronouns for different entities in one sentence). Broken prose in a snapshot = a rule bug; fix the rule, do not hand-edit snapshots.

- [ ] **Step 5: Full gates + audit no-new-errors check**

```bash
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npm run test
npm run lint && npx tsc --noEmit
STAR_SYSTEM_AUDIT_FINDING_LIMIT=100000 npx tsx scripts/audit-star-system-generator.ts 2>&1 | grep -c '^\[error\]'
```

Expected: full suite green; audit error count ≤ 768 with no new categories (compare category census via `sed -E 's/^\[error\] \S+ //; s/"[^"]*"/"X"/g; s/[0-9]+(\.[0-9]+)?/N/g' | sort | uniq -c` against the baseline in the audit burn-down plan). The `prose.doublePreposition` / `prose.lowercaseFactionMidSentence` counts must not increase — pronoun substitution touching those surfaces would be a regression.

- [ ] **Step 6: Commit**

```bash
git add -A src/features/tools/star_system_generator
git commit -m "feat(star-system): pronominalize repeat entity mentions in body paragraphs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review notes

- First-mention preservation is load-bearing for existing assertions: `renderSystemStoryConflicts.test.ts:77-78` (`toContain('Kestrel Free Compact')`), `renderSystemStory.test.ts:184-203` (`toContain('Helion Debt Synod')`, `toContain('Orison Hold')`) — the `namedEarlier`/`repeatInSentence` guard guarantees it.
- The pass is deliberately NOT applied to `spineSummary` (existing `pronominalizeSecondMention` path stays), NOT applied to hooks (separately rendered surface with its own first mentions), and NOT applied across paragraphs (each `renderParagraph` call is independent — a reader treats a paragraph break as antecedent reset anyway).
- Type consistency: `EntityRef` from `lib/generator/graph/types.ts`; `Conflict.parties[].ref` / `Conflict.stakeRef` shapes confirmed against `lib/generator/conflicts/types.ts`.
- Determinism: pure string function; the determinism suites (`toEqual` across two same-seed runs) pass untouched.

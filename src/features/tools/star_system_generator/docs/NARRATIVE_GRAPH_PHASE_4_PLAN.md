# Narrative Graph Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the 5 remaining present-tense edge types — `CONTROLS`, `SUPPRESSES`, `CONTRADICTS`, `WITNESSES`, `HIDES_FROM` — both as rules (graph generation) and as template families (rendering). Wire `template.expects` through `slotResolver` so per-slot `nounPhrase`/article reshape happens at substitution time (Phase 3 carryover). Expand the connective dictionary for the new edge-type pairs. Re-measure the empty-story rate after the new types land — escalate to Phase 7 if still >3%. After this phase, every present-tense `EdgeType` has both a real rule set AND a real template family; the renderer's body/hooks output is fully populated for typical systems.

**Architecture:** Phase 4 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Phase 2 landed the first 4 rule types (HOSTS/DEPENDS_ON/CONTESTS/DESTABILIZES); Phase 3 landed the renderer + templates for those 4 types. Phase 4 fills in the remaining 5 types end-to-end. After this phase, only the 3 historical edge types (FOUNDED_BY/BETRAYED/DISPLACED — Phase 5) remain unbuilt, and downstream prose surfaces (Phase 6) are still unwired.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Sections "Edge Palette" (active + epistemic groups), "Generation Algorithm", "Edge Templates", "Connective Tissue", "Acceptance Criteria".

**Branch:** Work on `develop`. Phase 3 is already merged. No push.

**Scope:**
- Task 1: Wire `template.expects` through `slotResolver` so each slot's value passes through `reshapeSlot` for its declared shape (Phase 3 carryover).
- Task 2: Expand `settingPatterns.ts` with the keyword tables the new rules need (`INTERDICTION_KEYWORDS`, `WITNESS_KEYWORDS`, `CONTRADICTION_KEYWORDS`, `CONTROL_DOMAINS`).
- Task 3: `CONTROLS` rules — 2 rules (faction-controls-routeAsset, faction-controls-settlement-via-uniqueDomain).
- Task 4: `SUPPRESSES` rules — 2 rules (gardener-faction-suppresses-restricted-target, authority-suppresses-hiddenTruth).
- Task 5: `CONTRADICTS` rules — 2 rules (ruinHook-vs-settlementAuthority, hiddenTruth-vs-publicSurface).
- Task 6: `WITNESSES` rules — 2 rules (aiSituation-witnesses-ruin, ruinHook-witnesses-historicalEvent).
- Task 7: `HIDES_FROM` rules — 2 rules (hiddenTruth-from-gardenerFaction, aiSituation-from-authority).
- Task 8: `CONTROLS` template family.
- Task 9: `SUPPRESSES` template family.
- Task 10: `CONTRADICTS` template family.
- Task 11: `WITNESSES` template family.
- Task 12: `HIDES_FROM` template family.
- Task 13: Connectives dictionary expansion (cover the new edge-type pairs) + audit re-measure (empty-story rate, edge-type coverage). Add 2 new integrity checks for hidden-edge handling.
- Task 14: Final verification.

**Out of scope:**
- Historical edges (Phase 5) — `FOUNDED_BY`, `BETRAYED`, `DISPLACED` rule generation and template families remain stub families.
- Downstream consumer integration (Phase 6) — `settlementHookSynthesis`, `phenomenonNote`, `settlementWhyHere` continue to use their existing logic. The prose-unchanged snapshot pinned in Phase 3 must hold.
- Retiring `narrativeLines`/`narrativeThreads` (Phase 8).
- Manual review of 20 sample systems (Phase 7).
- Tuning template prose for cohesion (Phase 7).

---

## Architectural Notes

### Why rules first, templates second

After Tasks 3-7 land but before 8-12, the graph stage produces `CONTROLS`/`SUPPRESSES`/`CONTRADICTS`/`WITNESSES`/`HIDES_FROM` edges with valid metadata, but `templateFor(...)` still returns the stub family for those types. The renderer's `renderEdgeSentence` already handles empty-text templates by returning `''`, and `renderParagraph` skips empty sentences — so the audit measures the new edge counts without the rendered-prose distribution shifting yet. Then Tasks 8-12 light up rendering for each new type one at a time. This staging mirrors Phase 2 (rules first, no rendering) → Phase 3 (renderer + 4 families). It also keeps the prose-unchanged snapshot from Phase 3 untouched: rules don't affect any of the existing prose surfaces tracked in `proseUnchanged.test.ts`.

### Template `expects` wiring (Phase 3 carryover)

Phase 3 declared `EdgeTemplate.expects: Partial<Record<string, SlotShape>>` but did not flow it into `slotResolver`. Phase 3 templates worked around this by using only `properNoun` slots — values passed through unmodified except for the `:article` modifier and the global capitalize/dedouble passes.

Phase 4 lands the wiring:

1. `resolveSlots(template, ctx)` becomes `resolveSlots(template, ctx, expects?)` where `expects` is the per-slot shape map.
2. After resolving a slot's raw value but before applying its `:modifier`, `resolveSlots` calls `reshapeSlot(value, expects[slot.name] ?? 'properNoun')`. For `nounPhrase` shapes, this strips a leading definite article and trailing punctuation; for `properNoun`, it only trims whitespace and trailing punctuation.
3. Modifiers run after reshape. So `{object:article}` on a `nounPhrase` `'the chiral ice belt'` reshapes to `'chiral ice belt'`, then `:article` decides whether to prepend `'the '` based on `startsWithUppercase`. For lowercase nouns, `'the chiral ice belt'` is reconstructed cleanly; for proper nouns (`Orison Hold`), no article is prepended. The composition is well-defined and idempotent.
4. `renderTemplate` (in `renderSystemStory.ts`) passes `template.expects` into `resolveSlots`.
5. The default shape (when a slot has no entry in `expects`) is `'properNoun'` — preserves Phase 3 behavior for templates that haven't yet declared per-slot shapes.

### Visibility semantics for new edge types

| EdgeType | Default visibility | Rule-driven override |
|---|---|---|
| `CONTROLS` | `public` | none in Phase 4 |
| `SUPPRESSES` | `contested` for visible interdiction, `hidden` for the secret-suppression rule (`SUPPRESSES:authority-over-hiddenTruth`) | rule emits `'hidden'` explicitly |
| `CONTRADICTS` | `contested` (someone notices the discrepancy) | none |
| `WITNESSES` | `public` (the AI situation or ruin is observable; only the implication is private) | none |
| `HIDES_FROM` | `hidden` (the whole point) | none |

Hidden edges never reach `body[]` (Phase 3's `clusterEdges` filters them out for the epistemic cluster). They flow to `hooks[]` via the existing hook eligibility logic. Phase 4 therefore exercises the hidden-edges-go-to-hooks branch that was dead in Phase 3.

### Why these rules

The 5 new edge types map to recurring patterns in the existing fact ledger and `narrative.json` data:

- **CONTROLS:** `gu.bleedLocation` and `settlement.location` facts tagged `routeAsset` represent the controllable resource. Named factions whose `domains` include `route` / `transit` / `compliance` / `gardener-interdiction` are the natural controllers. Authority text on settlements may also identify a unique controlling faction (when only one faction's domains match — distinct from CONTESTS, which fires only on multi-faction overlap).
- **SUPPRESSES:** the Sol-interdiction theme runs through `narrative.json` (Pale Choir Communion, Sol-interdiction compliance office, Ninth Ledger Office) and the `gardener-interdiction` domain. The first rule is overt: a gardener-interdiction faction suppresses a phenomenon / gu.bleedLocation / settlement whose facts contain `'sol-interdiction'`/`'gardener'`/`'sealed'` keywords. The second rule is covert: settlement.authority and settlement.hiddenTruth on the same settlement indicate the authority is suppressing the hidden truth — visibility `'hidden'`.
- **CONTRADICTS:** the falsified-records theme. `ruin.hook` text often references catastrophe, missing records, or alternate origin stories that contradict `settlement.authority` framing of the same body. `settlement.hiddenTruth` and `settlement.tagHook` on the same settlement frequently land on opposite sides of the same domain (the hidden truth is the unedited version of what the public-facing tagHook claims).
- **WITNESSES:** `settlement.aiSituation` is the canonical "AI as last witness" signal. Pair with a ruin on the same body (or system-wide if no body match). `ruin.hook` referencing a named historical event (catastrophe, quarantine) coupled with another fact mentioning the same era forms a "ruin is the only evidence of X" relation.
- **HIDES_FROM:** `settlement.hiddenTruth` is hidden FROM the gardener-interdiction faction by default when one is present in the system. If the settlement.aiSituation contains `'illegal'`/`'unregistered'`/`'unrecorded'`/`'sealed'` keywords, the AI is hidden FROM the local enforcing authority faction.

These rules are starting points. The implementer may tune `baseWeight` and keyword sets based on what the audit shows during the deep run; the reviewer's bar is "edge fires for the right reasons on representative seeds, not "weights match the plan exactly."

### Connective expansion strategy

Phase 3's dictionary has 6 entries. Phase 4 adds ~10 entries to cover the new pairs that appear in real paragraphs:

- Spine cluster transitions involving CONTROLS (e.g., `HOSTS->CONTROLS`, `CONTROLS->DEPENDS_ON`, `CONTROLS->CONTESTS`).
- Active cluster transitions involving SUPPRESSES (e.g., `DESTABILIZES->SUPPRESSES`, `SUPPRESSES->CONTESTS`).
- Epistemic cluster joins (e.g., `CONTRADICTS->WITNESSES`, `WITNESSES->CONTRADICTS`).

The total dictionary is bounded — most pairs fall through to empty-string. Phase 7 will tune entries based on sample-system review.

### Empty-story rate re-measurement

Phase 3's audit reported 6.77% empty-story rate (4800-system deep run): the system has zero spine edges and no body paragraphs. Phase 4's hypothesis is that adding 5 edge types lowers this number by giving more systems at least one spine candidate (CONTROLS counts as named-on-named when faction → settlement) and at least one cluster-eligible non-spine edge.

The plan's exit criterion is **empty-story rate ≤ 3%**. If the post-Phase-4 measurement is still above 3%, Task 13 records the actual number and adds a flag in the master plan's Phase 7 row to dedicate tuning effort there. Phase 4 does NOT block on hitting 3% — it blocks on the metric being measured and reported.

### Hidden-edge → hook path coverage

Phase 3's hook path silently skipped hidden edges because no rule produced any (`hidden`-visibility edges came online with `HIDES_FROM` and the secret-suppression `SUPPRESSES` rule). Phase 4 must verify:

- Hidden edges do NOT appear in `body[]`. (Phase 3 cluster logic.)
- Hidden edges DO appear in `hooks[]` when the eligible-edges path includes them. (Phase 3 `pickHookEligibleEdges` already includes them, so this should be automatic.)
- The total hook count stays in the 0-5 range — adding more eligible edges shouldn't push past the cap (Phase 3 already enforces `>= 5` exit).

Task 13 adds two integrity checks: (1) no hidden edge appears in any `body[i]` paragraph (a regression test for the cluster filter), (2) every system with a hidden edge produces at least one hook (sanity check that hidden edges aren't being dropped silently).

### Determinism

No new RNG sub-forks are introduced. All Phase 4 rules read from `BuildCtx.rng` exactly the way Phase 2 rules do (most don't draw RNG at all; the few that do use `ctx.rng.fork(rule.id)`). The connective dictionary is fully deterministic. Per-slot reshape is deterministic. Same seed → same graph → same systemStory.

---

## File Structure

**New files (created in this phase):**
- `lib/generator/graph/rules/controlsRules.ts` — 2 rules.
- `lib/generator/graph/rules/suppressesRules.ts` — 2 rules.
- `lib/generator/graph/rules/contradictsRules.ts` — 2 rules.
- `lib/generator/graph/rules/witnessesRules.ts` — 2 rules.
- `lib/generator/graph/rules/hidesFromRules.ts` — 2 rules.
- `lib/generator/graph/__tests__/controlsRules.test.ts`
- `lib/generator/graph/__tests__/suppressesRules.test.ts`
- `lib/generator/graph/__tests__/contradictsRules.test.ts`
- `lib/generator/graph/__tests__/witnessesRules.test.ts`
- `lib/generator/graph/__tests__/hidesFromRules.test.ts`
- `lib/generator/graph/render/templates/controlsTemplates.ts`
- `lib/generator/graph/render/templates/suppressesTemplates.ts`
- `lib/generator/graph/render/templates/contradictsTemplates.ts`
- `lib/generator/graph/render/templates/witnessesTemplates.ts`
- `lib/generator/graph/render/templates/hidesFromTemplates.ts`

**Files modified:**
- `lib/generator/graph/render/slotResolver.ts` — `resolveSlots` accepts an optional `expects` parameter; per-slot `reshapeSlot` runs before modifier application.
- `lib/generator/graph/render/__tests__/slotResolver.test.ts` — new tests covering per-slot reshape composition with modifiers.
- `lib/generator/graph/render/renderSystemStory.ts` — `renderTemplate` passes `template.expects` into `resolveSlots`.
- `lib/generator/graph/render/templates/index.ts` — replace 5 `stubFamily(...)` entries with the real imports.
- `lib/generator/graph/render/connectives.ts` — add ~10 entries covering the new edge-type pairs.
- `lib/generator/graph/render/__tests__/connectives.test.ts` — assertions for the new pairs.
- `lib/generator/graph/rules/settingPatterns.ts` — add `INTERDICTION_KEYWORDS`, `WITNESS_KEYWORDS`, `CONTRADICTION_KEYWORDS`, `CONTROL_DOMAINS` tables.
- `lib/generator/graph/rules/__tests__/settingPatterns.test.ts` — assertions for new tables.
- `lib/generator/graph/rules/index.ts` — extend `allRules` with the 10 new rules. Re-sort alphabetically by `rule.id`.
- `scripts/audit-star-system-generator.ts` — extend per-edge-type counts to cover the new types; print full edge-type distribution; add 2 new integrity checks (hidden-in-body, hidden-without-hook).

**Files unchanged:**
- All `data/` JSON. All `prose/` modules. `lib/generator/index.ts` (the call site is unchanged — Phase 4 only changes what rules+templates are registered). `audit:star-system-data`. The Phase 3 prose-unchanged snapshot.

---

## Conventions (from Phase 0/1/2/3, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report. The plan's test text drifts; the function is the contract.
- Keep `graph/index.ts` and `render/index.ts` barrels named-only — no `export * from`.
- Commit message style: `<type>: <subject>` lowercase, with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (use a HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious.
- Do not push.
- NEVER use `any` type. Use `unknown`, specific interfaces, or union types.
- Templates are content. The plan provides example template strings as starting points; the implementer may tighten or vary the prose. The reviewer's bar is "natural English, no unresolved slots, no grammar bugs from the master audit list, no setting-incongruity"; not "matches the plan's example string verbatim."
- The Phase 3 `proseUnchanged.test.ts` must keep passing across every Phase 4 task. Phase 4 must not touch any existing prose surface.
- Lessons from Phase 3 to apply now:
  - Avoid `:lower` modifiers on slots that may resolve to proper nouns. With per-slot reshape (Task 1) live, prefer `nounPhrase` shape + `:article` over `:lower` for non-proper-noun slots.
  - When a template uses `{qualifier|fallback}`, double-check the rule sets `qualifier` to a noun phrase (not an entity ID).

---

## Task 1: Wire `template.expects` through `slotResolver`

**Why:** Phase 3 left a known carryover: templates declare per-slot shapes via `EdgeTemplate.expects` but the resolver ignores it and applies only global passes. With 5 new template families landing in this phase (several of which need `nounPhrase` shapes for non-proper-noun slots like phenomena, gu hazards, and authority text), the resolver needs to honor `expects` before any new template author starts writing.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/slotResolver.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/slotResolver.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/renderSystemStory.ts`

- [ ] **Step 1: Extend `resolveSlots` signature**

  In `slotResolver.ts`, add an optional `expects` parameter:

  ```ts
  import type { SlotShape } from './templates/types'
  import { reshapeSlot } from './grammarSafety'

  export function resolveSlots(
    template: string,
    ctx: EdgeRenderContext,
    expects?: Partial<Record<string, SlotShape>>,
  ): string {
    return template.replace(SLOT_PATTERN, (_full, expr: string) => {
      const slot = parseSlotExpression(expr)
      return resolveOne(slot, ctx, expects)
    })
  }

  function resolveOne(
    slot: SlotExpression,
    ctx: EdgeRenderContext,
    expects: Partial<Record<string, SlotShape>> | undefined,
  ): string {
    if (slot.name === 'historical') return ''

    let raw: string | undefined
    if (slot.name === 'subject') raw = ctx.subject.displayName
    else if (slot.name === 'object') raw = ctx.object.displayName
    else if (slot.name === 'qualifier') raw = ctx.qualifier
    else throw new Error(`unknown slot: ${slot.name}`)

    if (raw === undefined || raw === '') {
      return slot.fallback ?? ''
    }

    const shape: SlotShape = expects?.[slot.name] ?? 'properNoun'
    const reshaped = reshapeSlot(raw, shape)

    return applyModifier(reshaped, slot.modifier)
  }
  ```

  Behavior:
  - Default shape is `'properNoun'` when `expects` is undefined or doesn't declare that slot. This preserves Phase 3 behavior for any caller that doesn't pass `expects`.
  - `reshapeSlot` runs before `applyModifier`, so `:article` sees the article-stripped value and decides whether to add one back based on capitalization.
  - The fallback path (when `raw` is empty/undefined) is unchanged — fallback strings are content authored by the template, not entity values, so they don't need reshape.

- [ ] **Step 2: Update `renderSystemStory.ts` call sites**

  In `renderSystemStory.ts`, update every `resolveSlots(template.text, ctx)` call to `resolveSlots(template.text, ctx, template.expects)`:

  ```ts
  // renderTemplate
  let result = resolveSlots(template.text, ctx, template.expects)

  // renderHooks
  let rendered = resolveSlots(template.text, ctx, template.expects)

  // renderSpineSummary
  let result = resolveSlots(template.text, ctx, template.expects)
  ```

- [ ] **Step 3: Add tests for per-slot reshape**

  Append to `slotResolver.test.ts`:

  ```ts
  describe('resolveSlots with per-slot expects', () => {
    it('reshapes nounPhrase slots — strips leading "the" before applying :article', () => {
      const ctx = makeCtx({
        object: { kind: 'guResource', id: 'gu', displayName: 'the chiral ice belt', layer: 'gu' },
      })
      // Without expects: 'the chiral ice belt' kept as-is, :article would prepend 'the' again → "the the chiral..."
      // With nounPhrase expects: 'the' stripped first → 'chiral ice belt' → :article → 'the chiral ice belt'.
      expect(resolveSlots('depends on {object:article}', ctx, { object: 'nounPhrase' }))
        .toBe('depends on the chiral ice belt')
    })

    it('reshapes nounPhrase slots — strips trailing punctuation before substitution', () => {
      const ctx = makeCtx({
        qualifier: 'the dispute,',
      })
      expect(resolveSlots('over {qualifier|fallback}', ctx, { qualifier: 'nounPhrase' }))
        .toBe('over dispute')
    })

    it('preserves properNoun shape (default) when expects undeclared', () => {
      const ctx = makeCtx()
      // Default (no expects passed) is unchanged from Phase 3 behavior.
      expect(resolveSlots('{subject}', ctx)).toBe('Orison Hold')
    })

    it('preserves properNoun shape (default) when slot is missing from expects', () => {
      const ctx = makeCtx()
      // expects has 'object' but not 'subject' — subject defaults to properNoun.
      expect(resolveSlots('{subject}', ctx, { object: 'nounPhrase' })).toBe('Orison Hold')
    })

    it('reshape composes idempotently with :article and :lower', () => {
      const ctx = makeCtx({
        subject: { kind: 'phenomenon', id: 'p', displayName: 'a flare-amplified bleed season', layer: 'gu' },
      })
      // nounPhrase → strip 'a ' → 'flare-amplified bleed season' → :article → 'the flare-amplified bleed season'
      expect(resolveSlots('{subject:article}', ctx, { subject: 'nounPhrase' }))
        .toBe('the flare-amplified bleed season')
    })

    it('does NOT strip "the " when shape is properNoun', () => {
      // Edge case: a proper noun starting with 'The' (rare) — must not be mangled.
      const ctx = makeCtx({
        subject: { kind: 'namedFaction', id: 'f', displayName: 'The Pale Choir Communion', layer: 'human' },
      })
      expect(resolveSlots('{subject}', ctx, { subject: 'properNoun' }))
        .toBe('The Pale Choir Communion')
    })
  })
  ```

  Run, expect FAIL until Step 1 lands.

- [ ] **Step 4: Run tests, expect PASS**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/slotResolver.test.ts
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  All Phase 3 tests must continue passing. The prose-unchanged snapshot must hold (per-slot reshape only fires when `expects` is passed; Phase 3 templates didn't pass it, so output was unchanged for any template that didn't declare a non-`properNoun` shape).

  **Edge case to verify:** Phase 3's `DEPENDS_ON` and `DESTABILIZES` templates declared `nounPhrase` shapes for the `object`/`subject` slots. After Task 1, those slots will now actually reshape. If the prose-unchanged test fails, the reshape is producing slightly different output than the Phase 3 baseline — this is **intentional** for Phase 4. Update the snapshot in this commit and document the change in the commit message.

  Wait — `proseUnchanged.test.ts` does NOT track `systemStory` content. It only tracks: `systemName`, `settlement.tagHook`, `settlement.whyHere`, `phenomenon.note`, narrativeLines/threads counts. The systemStory is NOT pinned by snapshot anywhere. So per-slot reshape changes only systemStory text, which is not yet pinned. The Phase 3 prose-unchanged snapshot is unaffected. Good.

  However, Phase 3 snapshot tests within `templates.test.ts` and `renderSystemStory.test.ts` use `toMatch(/.../)` regex assertions, not byte-exact snapshots. They should keep passing.

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: wire EdgeTemplate.expects through slotResolver for per-slot reshape

  Phase 3 left this as carryover. resolveSlots now accepts an optional
  expects: Partial<Record<string, SlotShape>> parameter and applies
  reshapeSlot(value, shape) to each resolved slot before any modifier.
  Default shape is 'properNoun' for backward compatibility — Phase 3
  call sites that don't pass expects produce identical output to before.
  Phase 4 templates declaring nounPhrase shapes now correctly strip
  leading articles + trailing punctuation before :article modifiers
  decide whether to add an article back, eliminating the
  "the the chiral ice belt" duplication risk and the "the dispute,"
  trailing-comma artifact.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Setting-pattern keyword tables for new rules

**Why:** Each of the 5 new rule types needs setting-flavor keyword/regex matching. Centralizing these tables in `settingPatterns.ts` (already established in Phase 2) keeps the rule files narrow and keeps tuning to one file.

**Files:**
- Modify: `lib/generator/graph/rules/settingPatterns.ts`
- Modify: `lib/generator/graph/__tests__/settingPatterns.test.ts`

- [ ] **Step 1: Extend `settingPatterns.ts`**

  Append four new exports:

  ```ts
  // Used by SUPPRESSES + HIDES_FROM rules. Matches Sol/Gardener interdiction theme.
  export const INTERDICTION_KEYWORDS = [
    'sol-interdiction', 'sol interdiction', 'gardener', 'sealed', 'compliance',
    'exclusion', 'interdiction', 'censored', 'redacted',
  ] as const

  // Used by WITNESSES rules. Matches "AI as last witness" + ruin-as-evidence patterns.
  export const WITNESS_KEYWORDS = [
    'last witness', 'only witness', 'sole record', 'memory gap', 'memory gaps',
    'unrecorded', 'before the quarantine', 'first wave', 'second wave',
    'pre-collapse', 'pre-arrival', 'archive', 'archives',
  ] as const

  // Used by CONTRADICTS rules. Matches "edited records" theme.
  export const CONTRADICTION_KEYWORDS = [
    'edited', 'falsified', 'reclassified', 'rewritten', 'altered', 'forged',
    'doctored', 'discrepancy', 'two accounts', 'conflicting', 'official version',
    'unofficial', 'unrecorded',
  ] as const

  // Used by CONTROLS rules. The faction-domain set that legitimately implies
  // controlling authority over routes/sites/quotas (vs CONTESTS, where multiple
  // factions overlap on the same domain).
  export const CONTROL_DOMAINS = [
    'route', 'transit', 'compliance', 'gardener-interdiction', 'authority',
    'enforcement', 'customs', 'patrol',
  ] as const
  ```

  These lists are conservative starting points. Phase 7 may add or trim entries.

- [ ] **Step 2: Add tests**

  Append to `__tests__/settingPatterns.test.ts`:

  ```ts
  describe('INTERDICTION_KEYWORDS', () => {
    it('includes the gardener-interdiction theme keywords', () => {
      expect(INTERDICTION_KEYWORDS).toContain('gardener')
      expect(INTERDICTION_KEYWORDS).toContain('sol-interdiction')
      expect(INTERDICTION_KEYWORDS).toContain('sealed')
    })
  })

  describe('WITNESS_KEYWORDS', () => {
    it('includes "last witness" and era markers', () => {
      expect(WITNESS_KEYWORDS).toContain('last witness')
      expect(WITNESS_KEYWORDS).toContain('first wave')
      expect(WITNESS_KEYWORDS).toContain('archive')
    })
  })

  describe('CONTRADICTION_KEYWORDS', () => {
    it('includes "edited records" theme markers', () => {
      expect(CONTRADICTION_KEYWORDS).toContain('edited')
      expect(CONTRADICTION_KEYWORDS).toContain('falsified')
      expect(CONTRADICTION_KEYWORDS).toContain('discrepancy')
    })
  })

  describe('CONTROL_DOMAINS', () => {
    it('includes route/compliance/interdiction control axes', () => {
      expect(CONTROL_DOMAINS).toContain('route')
      expect(CONTROL_DOMAINS).toContain('compliance')
      expect(CONTROL_DOMAINS).toContain('gardener-interdiction')
    })
  })
  ```

- [ ] **Step 3: Quality gate + commit**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/settingPatterns.test.ts
  npx tsc --noEmit
  npm run lint
  ```

  ```
  git commit -m "$(cat <<'EOF'
  feat: add keyword tables for phase 4 narrative graph rules

  INTERDICTION_KEYWORDS (SUPPRESSES + HIDES_FROM), WITNESS_KEYWORDS
  (WITNESSES), CONTRADICTION_KEYWORDS (CONTRADICTS), CONTROL_DOMAINS
  (CONTROLS faction-domain filter). Conservative starting sets; Phase 7
  tunes after sample-system review.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: CONTROLS rules

**Why:** First of the 5 new rule types. Mirrors Phase 2's CONTESTS pattern but emits when a single named faction's domains uniquely identify it as the controlling authority (vs CONTESTS, which fires when multiple factions overlap).

**Files:**
- Create: `lib/generator/graph/rules/controlsRules.ts`
- Create: `lib/generator/graph/__tests__/controlsRules.test.ts`
- Modify: `lib/generator/graph/rules/index.ts` — add the new rules to `allRules` and re-sort.

- [ ] **Step 1: Author rules**

  ```ts
  import type { NarrativeFact } from '../../../../types'
  import type { EdgeRule, RuleMatch } from './ruleTypes'
  import { mintEdgeId } from './ruleTypes'
  import { containsWord, CONTROL_DOMAINS } from './settingPatterns'
  import type { EntityRef } from '../types'
  import { namedFactions, type NamedFaction } from '../../data/narrative'

  const FACTIONS_BY_NAME: ReadonlyMap<string, NamedFaction> = new Map(
    namedFactions.map(f => [f.name, f]),
  )

  function getFactionEntities(entities: ReadonlyArray<EntityRef>): EntityRef[] {
    return entities.filter(e => e.kind === 'namedFaction')
  }

  function factionFactIdsForName(
    factsByKind: ReadonlyMap<string, ReadonlyArray<NarrativeFact>>,
    name: string,
  ): string[] {
    const facts = factsByKind.get('namedFaction') ?? []
    return facts.filter(f => f.value.value === name).map(f => f.id)
  }

  // Rule 1: a named faction with control-axis domains controls the body that
  // hosts a route asset (gu.bleedLocation tagged 'routeAsset' or
  // settlement.location tagged 'routeAsset').
  export const controlsRouteAssetRule: EdgeRule = {
    id: 'CONTROLS:namedFaction-routeAsset',
    edgeType: 'CONTROLS',
    baseWeight: 0.55,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      const factionEntities = getFactionEntities(ctx.entities)
      if (factionEntities.length === 0) return matches

      // Find route-asset-tagged location facts.
      const candidateFactKinds = ['gu.bleedLocation', 'settlement.location'] as const
      const routeAssetFacts: NarrativeFact[] = []
      for (const kind of candidateFactKinds) {
        for (const fact of ctx.factsByKind.get(kind) ?? []) {
          if (fact.tags?.includes('routeAsset')) routeAssetFacts.push(fact)
        }
      }
      if (routeAssetFacts.length === 0) return matches

      for (const fact of routeAssetFacts) {
        // The "controlled object" is the body the route asset is anchored to.
        // For settlement.location, the subjectId is a settlement; we need its body.
        // For gu.bleedLocation, the fact may carry a body reference in its domains.
        const targetEntity = resolveControlTarget(fact, ctx)
        if (!targetEntity) continue

        for (const factionEntity of factionEntities) {
          const faction = FACTIONS_BY_NAME.get(factionEntity.displayName)
          if (!faction) continue
          // Check the faction has at least one CONTROL_DOMAINS-axis domain.
          const controlDomain = faction.domains.find(d => CONTROL_DOMAINS.includes(d))
          if (!controlDomain) continue

          const factionFactIds = factionFactIdsForName(ctx.factsByKind, factionEntity.displayName)
          matches.push({
            subject: factionEntity,
            object: targetEntity,
            qualifier: controlDomain,
            groundingFactIds: [...factionFactIds, fact.id],
          })
        }
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build(match, rule, _ctx) {
      const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
      return {
        id,
        type: rule.edgeType,
        subject: match.subject,
        object: match.object,
        qualifier: match.qualifier,
        visibility: match.visibility ?? rule.defaultVisibility,
        confidence: match.confidence ?? 'derived',
        groundingFactIds: match.groundingFactIds,
        era: 'present',
        weight: match.weight ?? rule.baseWeight,
      }
    },
  }

  // Rule 2: a faction uniquely matches a settlement's authority text — i.e., only
  // one faction's domains overlap with the authority text's keywords. (CONTESTS
  // covers the multi-faction-overlap case; CONTROLS covers the unique-match case.)
  export const controlsSettlementUniqueDomainRule: EdgeRule = {
    id: 'CONTROLS:namedFaction-settlement-uniqueDomain',
    edgeType: 'CONTROLS',
    baseWeight: 0.5,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      const factionEntities = getFactionEntities(ctx.entities)
      if (factionEntities.length === 0) return matches

      const authorityFacts = ctx.factsByKind.get('settlement.authority') ?? []
      if (authorityFacts.length === 0) return matches

      for (const fact of authorityFacts) {
        if (!fact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(fact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue

        // Find every faction whose domains contain at least one keyword present
        // in the authority text.
        const matchingFactions: { faction: EntityRef; domain: string }[] = []
        for (const factionEntity of factionEntities) {
          const faction = FACTIONS_BY_NAME.get(factionEntity.displayName)
          if (!faction) continue
          const matchedDomain = faction.domains.find(d =>
            containsWord(fact.value.value, d),
          )
          if (matchedDomain) matchingFactions.push({ faction: factionEntity, domain: matchedDomain })
        }
        // Only fire when exactly ONE faction matches — otherwise CONTESTS handles it.
        if (matchingFactions.length !== 1) continue

        const { faction, domain } = matchingFactions[0]
        const factionFactIds = factionFactIdsForName(ctx.factsByKind, faction.displayName)
        matches.push({
          subject: faction,
          object: settlementRef,
          qualifier: domain,
          groundingFactIds: [...factionFactIds, fact.id],
        })
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build(match, rule, _ctx) {
      const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
      return {
        id,
        type: rule.edgeType,
        subject: match.subject,
        object: match.object,
        qualifier: match.qualifier,
        visibility: match.visibility ?? rule.defaultVisibility,
        confidence: match.confidence ?? 'derived',
        groundingFactIds: match.groundingFactIds,
        era: 'present',
        weight: match.weight ?? rule.baseWeight,
      }
    },
  }

  // Helper: given a route-asset fact, return the body entity it controls.
  function resolveControlTarget(fact: NarrativeFact, ctx: BuildCtx): EntityRef | undefined {
    // For settlement.location, the subjectId is the settlement; look up its bodyId
    // in ctx.input.settlements, then look up the body entity.
    if (fact.kind === 'settlement.location' && fact.subjectId) {
      const settlement = ctx.input.settlements.find(s => s.id === fact.subjectId)
      if (!settlement?.bodyId) return undefined
      return ctx.entitiesById.get(settlement.bodyId)
    }
    // For gu.bleedLocation, the fact's value may name a body; if not, fall back
    // to the system entity (rare path — most route assets are body-anchored).
    if (fact.kind === 'gu.bleedLocation') {
      // Find a body entity whose displayName appears in the fact text.
      for (const entity of ctx.entities) {
        if (entity.kind === 'body' && containsWord(fact.value.value, entity.displayName)) {
          return entity
        }
      }
      return ctx.entities.find(e => e.kind === 'system')
    }
    return undefined
  }
  ```

  **Note on `BuildCtx` import for the helper:** add `import type { BuildCtx } from './ruleTypes'` at the top.

  **Note on `fact.tags`:** verify this field exists on `NarrativeFact` (Phase 2's research confirmed it does — facts carry `tags: string[]`). If not, adjust the helper to read tags from a different path.

- [ ] **Step 2: Author tests**

  File: `__tests__/controlsRules.test.ts`. Mirror the structure of `contestsRules.test.ts` (which already exists from Phase 2). Required test coverage:

  - `controlsSettlementUniqueDomainRule` fires when exactly one faction's domain matches authority text.
  - `controlsSettlementUniqueDomainRule` does NOT fire when two or more factions match (let CONTESTS handle it).
  - `controlsRouteAssetRule` fires when a route-asset-tagged location fact + a faction with a CONTROL_DOMAINS-axis domain are both present.
  - `controlsRouteAssetRule` does NOT fire when no faction has a control domain.
  - Both rules emit edges with `defaultVisibility: 'public'`.
  - Both rules sort matches deterministically by (subject.id, object.id).
  - `groundingFactIds` are populated and reference valid fact ids.

- [ ] **Step 3: Register in `rules/index.ts`**

  ```ts
  import { controlsRouteAssetRule, controlsSettlementUniqueDomainRule } from './controlsRules'

  export const allRules: ReadonlyArray<EdgeRule> = [
    // ... existing 9 rules
    controlsRouteAssetRule,
    controlsSettlementUniqueDomainRule,
  ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  ```

- [ ] **Step 4: Quality gate**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph
  npx tsc --noEmit
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  npm run audit:star-system-generator:quick
  ```

  Expected: all pass. Audit shows CONTROLS edges appearing in the per-edge-type counts.

- [ ] **Step 5: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add CONTROLS rules to narrative graph

  Two rules: namedFaction-routeAsset (faction with route/transit/compliance
  domain controls the body anchoring a routeAsset-tagged location fact)
  and namedFaction-settlement-uniqueDomain (faction uniquely matches a
  settlement's authority text — distinct from CONTESTS, which fires on
  multi-faction overlap). Both default to 'public' visibility. Wired into
  allRules; rule order remains alphabetical.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: SUPPRESSES rules

**Why:** Captures the Sol/Gardener interdiction theme that runs through `narrative.json`. Two rules: visible interdiction (faction enforces compliance against an interdiction-keyword target) and covert suppression (settlement.authority suppresses a hiddenTruth on the same settlement).

**Files:**
- Create: `lib/generator/graph/rules/suppressesRules.ts`
- Create: `lib/generator/graph/__tests__/suppressesRules.test.ts`
- Modify: `lib/generator/graph/rules/index.ts`

- [ ] **Step 1: Author rules**

  ```ts
  // Rule 1: gardener-interdiction-tagged faction suppresses an interdiction-
  // keyword-bearing target (phenomenon, gu.bleedLocation, settlement.hiddenTruth).
  export const suppressesGardenerInterdictionRule: EdgeRule = {
    id: 'SUPPRESSES:gardener-interdiction-target',
    edgeType: 'SUPPRESSES',
    baseWeight: 0.5,
    defaultVisibility: 'contested',
    match(ctx) {
      const matches: RuleMatch[] = []
      const interdictionFactions = getFactionEntities(ctx.entities).filter(f => {
        const faction = FACTIONS_BY_NAME.get(f.displayName)
        return faction?.domains.includes('gardener-interdiction')
      })
      if (interdictionFactions.length === 0) return matches

      // Candidate targets: phenomenon facts, gu.bleedLocation facts, settlement.hiddenTruth.
      const candidateKinds = ['phenomenon', 'gu.bleedLocation', 'settlement.hiddenTruth'] as const
      for (const kind of candidateKinds) {
        const facts = ctx.factsByKind.get(kind) ?? []
        for (const fact of facts) {
          const text = fact.value.value
          if (!matchesAny(text, INTERDICTION_KEYWORDS)) continue
          const targetEntity = fact.subjectId ? ctx.entitiesById.get(fact.subjectId) : undefined
          if (!targetEntity) continue

          for (const factionEntity of interdictionFactions) {
            matches.push({
              subject: factionEntity,
              object: targetEntity,
              groundingFactIds: [
                ...factionFactIdsForName(ctx.factsByKind, factionEntity.displayName),
                fact.id,
              ],
            })
          }
        }
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build, // standard build factory — see other rule files
  }

  // Rule 2: a settlement.authority suppresses a settlement.hiddenTruth on the
  // same settlement. Visibility: 'hidden' (the suppression itself is hidden).
  export const suppressesAuthorityHiddenTruthRule: EdgeRule = {
    id: 'SUPPRESSES:authority-over-hiddenTruth',
    edgeType: 'SUPPRESSES',
    baseWeight: 0.55,
    defaultVisibility: 'hidden',
    match(ctx) {
      const matches: RuleMatch[] = []
      const hiddenTruthFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
      if (hiddenTruthFacts.length === 0) return matches

      for (const hiddenFact of hiddenTruthFacts) {
        if (!hiddenFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue

        const authorityFacts = (ctx.factsBySubjectId.get(hiddenFact.subjectId) ?? [])
          .filter(f => f.kind === 'settlement.authority')
        if (authorityFacts.length === 0) continue

        const authorityFact = authorityFacts[0]
        // Subject is the settlement itself — the institutional actor — since the
        // authority text isn't an entity; the settlement's authority *is* a
        // property of the settlement entity. Object is the settlement (suppression
        // of its own hidden truth — settlement keeps secret from outsiders).
        // Alternative model: subject = the controlling faction, if any. Use that
        // when a faction CONTROLS this settlement (look up via entitiesById):
        // skip this rule when no faction is identified — the relationship is
        // generic and adds noise.
        // PHASE 4 DECISION: skip when no controlling faction is identifiable.
        // The implementer may relax this after seeing audit numbers.
        const controllingFaction = findControllingFaction(settlementRef, ctx)
        if (!controllingFaction) continue

        matches.push({
          subject: controllingFaction,
          object: settlementRef,
          qualifier: undefined,
          confidence: 'inferred',  // covert suppression is structural inference, not direct fact
          groundingFactIds: [hiddenFact.id, authorityFact.id],
        })
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }

  function findControllingFaction(settlement: EntityRef, ctx: BuildCtx): EntityRef | undefined {
    // Reuse Task 3's logic: a faction whose domain uniquely matches the
    // settlement's authority text. Note: this duplicates a check; refactor to
    // share with controlsSettlementUniqueDomainRule if it gets called from
    // multiple places.
    const authorityFacts = (ctx.factsBySubjectId.get(settlement.id) ?? [])
      .filter(f => f.kind === 'settlement.authority')
    if (authorityFacts.length === 0) return undefined
    const authorityText = authorityFacts[0].value.value
    const factionEntities = ctx.entities.filter(e => e.kind === 'namedFaction')
    const matched: EntityRef[] = []
    for (const factionEntity of factionEntities) {
      const faction = FACTIONS_BY_NAME.get(factionEntity.displayName)
      if (!faction) continue
      if (faction.domains.some(d => containsWord(authorityText, d))) {
        matched.push(factionEntity)
      }
    }
    return matched.length === 1 ? matched[0] : undefined
  }
  ```

  Use the same `build` factory style as Phase 2 rules (omitted above for brevity).

- [ ] **Step 2: Author tests**

  Required coverage:
  - `suppressesGardenerInterdictionRule` fires when an interdiction faction + an interdiction-keyword target are both present.
  - `suppressesGardenerInterdictionRule` does NOT fire when the faction has the right domain but no target text matches the keyword set.
  - `suppressesAuthorityHiddenTruthRule` fires only when a controlling faction is identifiable (single-domain match).
  - `suppressesAuthorityHiddenTruthRule` emits `'hidden'` visibility.
  - `suppressesGardenerInterdictionRule` emits `'contested'` visibility.

- [ ] **Step 3: Register + commit**

  Add to `allRules`. Verify alphabetical sort puts `SUPPRESSES:authority-over-hiddenTruth` before `SUPPRESSES:gardener-interdiction-target`.

  Quality gate (`tsc --noEmit`, lint, test, prose-unchanged, audit:quick), then:

  ```
  git commit -m "$(cat <<'EOF'
  feat: add SUPPRESSES rules to narrative graph

  Two rules: gardener-interdiction-target (interdiction faction suppresses
  an interdiction-keyword-bearing phenomenon/bleedLocation/hiddenTruth,
  visibility 'contested') and authority-over-hiddenTruth (controlling
  faction covertly suppresses settlement's hidden truth, visibility
  'hidden'). The 'hidden'-visibility rule activates the hidden-edges-go-
  to-hooks branch that has been dormant since Phase 3.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: CONTRADICTS rules

**Why:** Captures the falsified-records theme. Two rules covering the two highest-signal patterns: ruin.hook contradicting settlement.authority on the same body, and settlement.hiddenTruth contradicting settlement.tagHook on the same settlement.

**Files:**
- Create: `lib/generator/graph/rules/contradictsRules.ts`
- Create: `lib/generator/graph/__tests__/contradictsRules.test.ts`
- Modify: `lib/generator/graph/rules/index.ts`

- [ ] **Step 1: Author rules**

  ```ts
  // Rule 1: ruin.hook on body X contradicts settlement.authority on a settlement
  // sitting on body X, when their texts share a domain (or a contradiction
  // keyword appears in either text).
  export const contradictsRuinHookAuthorityRule: EdgeRule = {
    id: 'CONTRADICTS:ruinHook-vs-settlementAuthority',
    edgeType: 'CONTRADICTS',
    baseWeight: 0.45,
    defaultVisibility: 'contested',
    match(ctx) {
      const matches: RuleMatch[] = []
      const ruinHookFacts = ctx.factsByKind.get('ruin.hook') ?? []
      const authorityFacts = ctx.factsByKind.get('settlement.authority') ?? []
      if (ruinHookFacts.length === 0 || authorityFacts.length === 0) return matches

      for (const ruinFact of ruinHookFacts) {
        if (!ruinFact.subjectId) continue
        const ruinRef = ctx.entitiesById.get(ruinFact.subjectId)
        if (!ruinRef || ruinRef.kind !== 'ruin') continue

        const ruin = ctx.input.ruins.find(r => r.id === ruinFact.subjectId)
        const ruinBodyName = ruin?.location?.value
        if (!ruinBodyName) continue

        for (const authFact of authorityFacts) {
          if (!authFact.subjectId) continue
          const settlementRef = ctx.entitiesById.get(authFact.subjectId)
          if (!settlementRef || settlementRef.kind !== 'settlement') continue
          const settlement = ctx.input.settlements.find(s => s.id === authFact.subjectId)
          if (!settlement?.bodyId) continue
          const bodyEntity = ctx.entitiesById.get(settlement.bodyId)
          if (!bodyEntity || !containsWord(ruinBodyName, bodyEntity.displayName)) continue

          // Check signal: a contradiction keyword in either text, or a shared domain.
          const sharedDomain = sharedDomains(ruinFact.domains ?? [], authFact.domains ?? [])
          const hasContradictionKw =
            matchesAny(ruinFact.value.value, CONTRADICTION_KEYWORDS)
            || matchesAny(authFact.value.value, CONTRADICTION_KEYWORDS)
          if (sharedDomain.length === 0 && !hasContradictionKw) continue

          matches.push({
            subject: ruinRef,
            object: settlementRef,
            qualifier: sharedDomain[0],
            groundingFactIds: [ruinFact.id, authFact.id],
          })
        }
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }

  // Rule 2: settlement.hiddenTruth contradicts settlement.tagHook (or settlement.tag)
  // on the same settlement, when both texts share a domain.
  export const contradictsHiddenPublicRule: EdgeRule = {
    id: 'CONTRADICTS:hiddenTruth-vs-publicSurface',
    edgeType: 'CONTRADICTS',
    baseWeight: 0.5,
    defaultVisibility: 'contested',
    match(ctx) {
      const matches: RuleMatch[] = []
      const hiddenFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
      const tagHookFacts = ctx.factsByKind.get('settlement.tagHook') ?? []
      if (hiddenFacts.length === 0 || tagHookFacts.length === 0) return matches

      for (const hiddenFact of hiddenFacts) {
        if (!hiddenFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue

        const matchingTagHooks = tagHookFacts.filter(t =>
          t.subjectId === hiddenFact.subjectId
          && sharedDomains(t.domains ?? [], hiddenFact.domains ?? []).length > 0,
        )
        if (matchingTagHooks.length === 0) continue

        // Subject is the settlement; the relationship represents the settlement
        // being self-contradictory (public vs private framing diverge).
        // Object is also the settlement — but that produces a self-loop. Use the
        // first faction CONTROLS the settlement as a more interesting object,
        // or fall through to the system entity if none.
        const controllingFaction = findControllingFaction(settlementRef, ctx)
        const objectRef = controllingFaction ?? ctx.entities.find(e => e.kind === 'system')
        if (!objectRef) continue

        matches.push({
          subject: settlementRef,
          object: objectRef,
          qualifier: matchingTagHooks[0].domains?.[0],
          groundingFactIds: [hiddenFact.id, matchingTagHooks[0].id],
        })
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }
  ```

- [ ] **Step 2: Tests**

  Required coverage:
  - Both rules emit edges with `defaultVisibility: 'contested'`.
  - `contradictsRuinHookAuthorityRule` fires when ruin and settlement share a body AND share a domain (or one carries a CONTRADICTION_KEYWORDS keyword).
  - `contradictsRuinHookAuthorityRule` does NOT fire when the ruin and settlement are on different bodies.
  - `contradictsHiddenPublicRule` fires when a hidden-truth + tag-hook on the same settlement share a domain.
  - `contradictsHiddenPublicRule` does NOT fire when no shared domain.

- [ ] **Step 3: Register + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add CONTRADICTS rules to narrative graph

  Two rules covering the falsified-records theme: ruin-hook-vs-authority
  (contested record on same body) and hiddenTruth-vs-publicSurface
  (settlement's private vs public framing on same domain). Both default
  to 'contested' visibility — the discrepancy is observable but the
  resolution is in dispute.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: WITNESSES rules

**Why:** Captures the "AI as last witness" + "ruin as evidence" patterns. Two rules: settlement.aiSituation witnesses a ruin on the same body, and ruin.hook witnesses a historical event when paired with another fact mentioning the same era.

**Files:**
- Create: `lib/generator/graph/rules/witnessesRules.ts`
- Create: `lib/generator/graph/__tests__/witnessesRules.test.ts`
- Modify: `lib/generator/graph/rules/index.ts`

- [ ] **Step 1: Author rules**

  ```ts
  // Rule 1: settlement.aiSituation on settlement S witnesses a ruin R on the same
  // body. Subject = settlement (the AI's host); object = ruin.
  export const witnessesAiSituationRuinRule: EdgeRule = {
    id: 'WITNESSES:aiSituation-witnesses-ruin',
    edgeType: 'WITNESSES',
    baseWeight: 0.45,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      const aiFacts = ctx.factsByKind.get('settlement.aiSituation') ?? []
      if (aiFacts.length === 0) return matches

      for (const aiFact of aiFacts) {
        if (!aiFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(aiFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue
        const settlement = ctx.input.settlements.find(s => s.id === aiFact.subjectId)
        if (!settlement?.bodyId) continue
        const body = ctx.entitiesById.get(settlement.bodyId)
        if (!body) continue

        // Find ruins on the same body.
        for (const ruin of ctx.input.ruins) {
          if (!ruin.location || !containsWord(ruin.location.value, body.displayName)) continue
          const ruinRef = ctx.entitiesById.get(ruin.id)
          if (!ruinRef) continue

          const ruinHookIds = (ctx.factsBySubjectId.get(ruin.id) ?? [])
            .filter(f => f.kind === 'ruin.hook' || f.kind === 'ruin.type')
            .map(f => f.id)

          matches.push({
            subject: settlementRef,
            object: ruinRef,
            groundingFactIds: [aiFact.id, ...ruinHookIds],
          })
        }
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }

  // Rule 2: ruin.hook witnesses a historical event when its text carries a
  // WITNESS_KEYWORDS marker AND another fact references the same era.
  export const witnessesRuinHookEventRule: EdgeRule = {
    id: 'WITNESSES:ruinHook-witnesses-historicalEvent',
    edgeType: 'WITNESSES',
    baseWeight: 0.4,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      const ruinHookFacts = ctx.factsByKind.get('ruin.hook') ?? []

      for (const ruinFact of ruinHookFacts) {
        if (!ruinFact.subjectId) continue
        const ruinRef = ctx.entitiesById.get(ruinFact.subjectId)
        if (!ruinRef) continue

        // Identify the witness keyword that fired.
        const matchedWitnessKw = WITNESS_KEYWORDS.find(k =>
          containsWord(ruinFact.value.value, k),
        )
        if (!matchedWitnessKw) continue

        // Find another fact that references the SAME witness keyword (typically
        // an era marker — 'first wave' / 'second wave' / 'before the quarantine').
        const allOtherFacts = ctx.facts.filter(f =>
          f.id !== ruinFact.id
          && containsWord(f.value.value, matchedWitnessKw),
        )
        if (allOtherFacts.length === 0) continue

        // Object is the system itself — the ruin is the witness, the event
        // happened to the system. (Phase 5 will wire this into historical-edge
        // attachment; Phase 4 just emits the present-tense WITNESSES edge.)
        const systemRef = ctx.entities.find(e => e.kind === 'system')
        if (!systemRef) continue

        matches.push({
          subject: ruinRef,
          object: systemRef,
          qualifier: matchedWitnessKw,
          groundingFactIds: [ruinFact.id, ...allOtherFacts.map(f => f.id)],
        })
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }
  ```

- [ ] **Step 2: Tests**

  Required coverage:
  - `witnessesAiSituationRuinRule` fires when an AI settlement and a ruin share a body.
  - `witnessesAiSituationRuinRule` does NOT fire when ruin and settlement are on different bodies.
  - `witnessesRuinHookEventRule` fires when a ruin.hook text contains a WITNESS_KEYWORDS marker AND another fact contains the same marker.
  - `witnessesRuinHookEventRule` does NOT fire when only the ruin.hook contains the keyword.

- [ ] **Step 3: Register + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add WITNESSES rules to narrative graph

  Two rules: aiSituation-witnesses-ruin (settlement AI on same body as
  a ruin) and ruinHook-witnesses-historicalEvent (ruin.hook + another
  fact share an era keyword like 'first wave' or 'before the quarantine').
  Both 'public' visibility — the AI/ruin's existence is observable, only
  the implication is private. Phase 5 will link these to historical edges.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 7: HIDES_FROM rules

**Why:** Activates the secret-kept-from pattern. Two rules: settlement.hiddenTruth is hidden from a gardener-interdiction faction; settlement.aiSituation containing illegality keywords is hidden from the local controlling authority.

**Files:**
- Create: `lib/generator/graph/rules/hidesFromRules.ts`
- Create: `lib/generator/graph/__tests__/hidesFromRules.test.ts`
- Modify: `lib/generator/graph/rules/index.ts`

- [ ] **Step 1: Author rules**

  ```ts
  // Rule 1: settlement.hiddenTruth is hidden from a gardener-interdiction faction
  // present in the system. Subject = settlement; object = faction.
  export const hidesFromHiddenTruthGardenerRule: EdgeRule = {
    id: 'HIDES_FROM:hiddenTruth-from-gardenerFaction',
    edgeType: 'HIDES_FROM',
    baseWeight: 0.5,
    defaultVisibility: 'hidden',
    match(ctx) {
      const matches: RuleMatch[] = []
      const hiddenFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
      if (hiddenFacts.length === 0) return matches

      const gardenerFactions = ctx.entities.filter(e => {
        if (e.kind !== 'namedFaction') return false
        const faction = FACTIONS_BY_NAME.get(e.displayName)
        return faction?.domains.includes('gardener-interdiction')
      })
      if (gardenerFactions.length === 0) return matches

      for (const hiddenFact of hiddenFacts) {
        if (!hiddenFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue

        for (const factionEntity of gardenerFactions) {
          matches.push({
            subject: settlementRef,
            object: factionEntity,
            groundingFactIds: [
              hiddenFact.id,
              ...factionFactIdsForName(ctx.factsByKind, factionEntity.displayName),
            ],
          })
        }
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }

  // Rule 2: settlement.aiSituation with 'illegal'/'unregistered'/'unrecorded'/
  // 'sealed' keywords is hidden from the controlling authority faction.
  // Subject = settlement; object = controlling faction.
  const AI_HIDING_KEYWORDS = ['illegal', 'unregistered', 'unrecorded', 'sealed', 'unsanctioned'] as const

  export const hidesFromAiSituationAuthorityRule: EdgeRule = {
    id: 'HIDES_FROM:aiSituation-from-authority',
    edgeType: 'HIDES_FROM',
    baseWeight: 0.5,
    defaultVisibility: 'hidden',
    match(ctx) {
      const matches: RuleMatch[] = []
      const aiFacts = ctx.factsByKind.get('settlement.aiSituation') ?? []
      if (aiFacts.length === 0) return matches

      for (const aiFact of aiFacts) {
        if (!aiFact.subjectId) continue
        if (!matchesAny(aiFact.value.value, AI_HIDING_KEYWORDS)) continue
        const settlementRef = ctx.entitiesById.get(aiFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue

        const controllingFaction = findControllingFaction(settlementRef, ctx)
        if (!controllingFaction) continue

        matches.push({
          subject: settlementRef,
          object: controllingFaction,
          groundingFactIds: [
            aiFact.id,
            ...factionFactIdsForName(ctx.factsByKind, controllingFaction.displayName),
          ],
        })
      }

      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build,
  }
  ```

- [ ] **Step 2: Tests**

  Required coverage:
  - Both rules emit `defaultVisibility: 'hidden'`.
  - `hidesFromHiddenTruthGardenerRule` fires only when both a hiddenTruth and a gardener-interdiction faction are present.
  - `hidesFromAiSituationAuthorityRule` fires only when an aiSituation contains an AI_HIDING keyword AND a controlling faction is identifiable.
  - Edges are deduplicated and sorted deterministically.

- [ ] **Step 3: Register + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add HIDES_FROM rules to narrative graph

  Two rules: hiddenTruth-from-gardenerFaction (settlement's hidden truth
  is hidden from any present interdiction faction) and aiSituation-from-
  authority (illegal/unregistered/sealed AI is hidden from the controlling
  authority faction). Both 'hidden' visibility — the rendered output
  surfaces these only via hooks[], never body[].

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 8: CONTROLS template family

**Why:** First template family for the new edge types. The renderer's plumbing is unchanged from Phase 3 — Task 8 just authors the strings.

**Files:**
- Create: `lib/generator/graph/render/templates/controlsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts` — replace stub with real family.
- Modify: `lib/generator/graph/render/__tests__/templates.test.ts` — add a CONTROLS render-snapshot test.

- [ ] **Step 1: Author templates**

  ```ts
  import type { EdgeTemplateFamily } from './types'

  // CONTROLS edges: subject = namedFaction; object = body, settlement, or system.
  // Tone: matter-of-fact, present-tense. Qualifier (when present) is the control
  // domain ('route', 'compliance', 'transit', etc.) — surface it as a noun phrase.
  export const controlsTemplates: EdgeTemplateFamily = {
    edgeType: 'CONTROLS',
    body: [
      {
        text: '{subject} controls {object}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} sets the {qualifier|terms} for {object}.',
        expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
      },
      {
        text: '{object} answers to {subject}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Nothing moves through {object} without {subject}\'s sign-off.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
    spineSummary: {
      text: '{subject} writes the rules everything in {object} has to live by.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },  // Phase 5
    hook: [
      {
        text: 'What did {subject} pay to lock down {object}?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Who in {object} wants {subject} gone?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
  }
  ```

- [ ] **Step 2: Register**

  ```ts
  // templates/index.ts
  import { controlsTemplates } from './controlsTemplates'

  // Replace `CONTROLS: stubFamily('CONTROLS'),` with `CONTROLS: controlsTemplates,`
  ```

- [ ] **Step 3: Render-snapshot test**

  Add to `templates.test.ts`:

  ```ts
  describe('CONTROLS family', () => {
    it('renders a body sentence with subject + object', () => {
      const story = renderSystemStory(makeControlsGraph(), createSeededRng('controls-test'))
      expect(story.body[0]).toContain('Route Authority')
      expect(story.body[0]).not.toContain('{')
      expect(story.body[0]).toMatch(/[.!?]$/)
    })
  })
  ```

- [ ] **Step 4: Quality gate + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add CONTROLS template family for narrative graph renderer

  4 body variants, 1 spineSummary, 2 hooks. Subject is a namedFaction
  (properNoun); object is a body/settlement/system (properNoun);
  qualifier is the control axis (nounPhrase, e.g., 'route' / 'compliance').

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 9: SUPPRESSES template family

**Files:**
- Create: `lib/generator/graph/render/templates/suppressesTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author templates**

  ```ts
  // SUPPRESSES edges: subject = namedFaction; object = phenomenon, gu.bleedLocation,
  // settlement, or settlement.hiddenTruth-bearing settlement. Visibility may be
  // 'contested' (visible interdiction) or 'hidden' (covert suppression of own
  // hidden truth). The body templates apply to the visible case; the hooks apply
  // to both. Hidden-visibility edges never reach body[] (cluster filter).
  export const suppressesTemplates: EdgeTemplateFamily = {
    edgeType: 'SUPPRESSES',
    body: [
      {
        text: '{subject} keeps {object:article} off the official record.',
        expects: { subject: 'properNoun', object: 'nounPhrase' },
      },
      {
        text: '{subject} runs interdiction patrols around {object}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Anything {subject} flags about {object} stops at {subject}\'s threshold.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} treats {object:article} as a compliance problem.',
        expects: { subject: 'properNoun', object: 'nounPhrase' },
      },
    ],
    spineSummary: {
      text: '{subject} is making sure no one says {object:article} out loud.',
      expects: { subject: 'properNoun', object: 'nounPhrase' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      {
        text: 'What does {subject} stand to lose if {object} stops being a secret?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Who already knows about {object} and is waiting to use it?',
        expects: { object: 'properNoun' },
      },
      {
        text: 'What price would buy {subject}\'s silence about {object}?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
  }
  ```

- [ ] **Step 2-4: register, snapshot test, commit**

  Standard pattern.

  ```
  git commit -m "$(cat <<'EOF'
  feat: add SUPPRESSES template family for narrative graph renderer

  4 body variants, 1 spineSummary, 3 hooks. Object slots use nounPhrase
  shape with :article modifier so phenomena/hazards (lowercase nouns)
  get articles cleanly while named factions/settlements stay capitalized.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 10: CONTRADICTS template family

**Files:**
- Create: `lib/generator/graph/render/templates/contradictsTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author templates**

  ```ts
  // CONTRADICTS edges: subject = ruin or settlement; object = settlement, faction, or system.
  // Theme: two records on the same topic disagree. Templates emphasize the
  // discrepancy as the noteworthy fact, not the resolution.
  export const contradictsTemplates: EdgeTemplateFamily = {
    edgeType: 'CONTRADICTS',
    body: [
      {
        text: '{subject}\'s record disagrees with {object}\'s on {qualifier|the same point}.',
        expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
      },
      {
        text: '{subject} says one thing about {qualifier|what happened}; {object} says another.',
        expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
      },
      {
        text: 'The story {subject} tells doesn\'t match the one {object} keeps.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} and {object} both claim authority over {qualifier|the record}.',
        expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
      },
    ],
    spineSummary: {
      text: '{subject} and {object} are telling two different stories about {qualifier|what really happened}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      {
        text: 'Whose version of {qualifier|the record} would survive a third-party audit?',
        expects: { qualifier: 'nounPhrase' },
      },
      {
        text: 'Who edited the version everyone reads?',
        expects: {},
      },
      {
        text: 'What changes if {subject}\'s version turns out to be the true one?',
        expects: { subject: 'properNoun' },
      },
    ],
  }
  ```

- [ ] **Step 2-4: register, snapshot test, commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add CONTRADICTS template family for narrative graph renderer

  4 body variants, 1 spineSummary, 3 hooks. Qualifier is the shared
  domain (nounPhrase), with a sensible fallback when the rule didn't
  attach one.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 11: WITNESSES template family

**Files:**
- Create: `lib/generator/graph/render/templates/witnessesTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author templates**

  ```ts
  // WITNESSES edges: subject = settlement (with AI) or ruin; object = ruin or system.
  // Qualifier (when set) is an era marker like 'first wave' or 'before the quarantine'.
  export const witnessesTemplates: EdgeTemplateFamily = {
    edgeType: 'WITNESSES',
    body: [
      {
        text: '{subject} is the only thing in the system that remembers {object} firsthand.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} carries an unbroken chain of records back to {object}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'What {object} was, only {subject} can still describe.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject} watched {object} happen and never deleted the logs.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
    spineSummary: {
      text: '{subject} is the last living memory of {object}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      {
        text: 'Who would pay to read what {subject} actually saw?',
        expects: { subject: 'properNoun' },
      },
      {
        text: 'Who would pay to make sure {subject} forgets?',
        expects: { subject: 'properNoun' },
      },
      {
        text: 'What does {subject} remember about {qualifier|that era} that nothing else does?',
        expects: { subject: 'properNoun', qualifier: 'nounPhrase' },
      },
    ],
  }
  ```

- [ ] **Step 2-4: register, snapshot test, commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add WITNESSES template family for narrative graph renderer

  4 body variants, 1 spineSummary, 3 hooks. Subject = AI-bearing
  settlement or witness-ruin (properNoun); object = ruin or system
  (properNoun). Hooks invert the witness theme — who needs the witness
  spoken vs silenced.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 12: HIDES_FROM template family

**Why:** The hidden-edges-go-to-hooks branch in `pickHookEligibleEdges` has been live since Phase 3 but has not had any actual hidden edges to render. With Tasks 4 (SUPPRESSES hidden) and 7 (HIDES_FROM) emitting `'hidden'` edges, this template family activates that path.

**Files:**
- Create: `lib/generator/graph/render/templates/hidesFromTemplates.ts`
- Modify: `lib/generator/graph/render/templates/index.ts`
- Modify: `templates.test.ts`

- [ ] **Step 1: Author templates**

  ```ts
  // HIDES_FROM edges: subject = settlement; object = faction. Visibility is always
  // 'hidden' — the edge never reaches body[]. Templates here are used ONLY for
  // hooks (Phase 3's body cluster filter excludes hidden epistemic edges).
  // The body[] entries are still authored so that if future phases relax the
  // filter, the templates exist; they're harmless until then.
  export const hidesFromTemplates: EdgeTemplateFamily = {
    edgeType: 'HIDES_FROM',
    body: [
      {
        text: '{subject} works hard to keep what it knows out of {object}\'s reach.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Whatever {subject} is hiding, it\'s hiding it specifically from {object}.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: '{subject}\'s records are clean — except in the places {object} would look.',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
    spineSummary: {
      text: '{subject} has something specific it can\'t let {object} find.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    historicalBridge: { text: '', expects: {} },
    hook: [
      {
        text: 'What does {subject} need to keep from {object}?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'Who could broker an exchange of what {subject} has for {object}\'s silence?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
      {
        text: 'How long can {subject} keep this from {object} before slipping?',
        expects: { subject: 'properNoun', object: 'properNoun' },
      },
    ],
  }
  ```

- [ ] **Step 2: Register**

  Replace `HIDES_FROM: stubFamily('HIDES_FROM'),` with `HIDES_FROM: hidesFromTemplates,`.

- [ ] **Step 3: Test that hidden HIDES_FROM edges land in hooks, not body**

  Add to `renderSystemStory.test.ts`:

  ```ts
  it('routes hidden HIDES_FROM edges into hooks, never body', () => {
    const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Pale Choir Communion', layer: 'human' }
    const hiddenEdge = makeEdge({
      id: 'h1', type: 'HIDES_FROM',
      subject: settlement, object: faction,
      visibility: 'hidden',
    })
    const graph = makeGraph([hiddenEdge], [])
    const story = renderSystemStory(graph, createSeededRng('hidden-test'))
    // No body paragraph contains the hidden edge's text.
    for (const para of story.body) {
      expect(para).not.toContain('Pale Choir Communion')
    }
    // At least one hook references the edge.
    expect(story.hooks.some(h => h.includes('Pale Choir Communion'))).toBe(true)
  })
  ```

- [ ] **Step 4: Quality gate + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add HIDES_FROM template family for narrative graph renderer

  3 body variants (defensive — never rendered while cluster filter
  excludes hidden epistemic edges), 1 spineSummary, 3 hooks. Activates
  the hidden-edges-go-to-hooks path that was dormant through Phase 3.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 13: Connectives expansion + audit re-measurement + 2 integrity checks

**Why:** With 5 new edge types live in the renderer, paragraph joins now span a larger pair-space. The connective dictionary needs ~10 new entries to keep paragraphs reading as joined-up English rather than choppy sentence lists. The audit needs to surface (a) the new edge-type counts, (b) the post-Phase-4 empty-story rate, (c) two new integrity checks for the hidden-edge-to-hooks routing.

**Files:**
- Modify: `lib/generator/graph/render/connectives.ts`
- Modify: `lib/generator/graph/render/__tests__/connectives.test.ts`
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Expand `connectives.ts`**

  Append to `CONNECTIVES`:

  ```ts
  const CONNECTIVES: Partial<Record<Pair, string>> = {
    // ... existing 6 entries from Phase 3 ...

    // CONTROLS (spine cluster, structural neighbor).
    'HOSTS->CONTROLS': 'Above ground, ',
    'CONTROLS->DEPENDS_ON': 'Underneath, ',
    'CONTROLS->CONTESTS': 'But not unchallenged: ',
    'DEPENDS_ON->CONTROLS': 'And ',

    // SUPPRESSES (active cluster).
    'CONTESTS->SUPPRESSES': 'Quietly, ',
    'DESTABILIZES->SUPPRESSES': 'In the meantime, ',
    'SUPPRESSES->CONTESTS': 'Predictably, ',

    // Epistemic cluster joins.
    'CONTRADICTS->WITNESSES': 'And yet, ',
    'WITNESSES->CONTRADICTS': 'Even so, ',
    'CONTRADICTS->CONTRADICTS': 'On another front, ',
  }
  ```

  Also add comments above each block calling out the cluster the pair belongs to. Keep entries narrow — Phase 7 may tune them based on sample-system review.

- [ ] **Step 2: Test the new pairs**

  ```ts
  it('returns connectives for new Phase 4 pairs', () => {
    expect(connectiveFor('HOSTS', 'CONTROLS')).toBe('Above ground, ')
    expect(connectiveFor('CONTESTS', 'SUPPRESSES')).toBe('Quietly, ')
    expect(connectiveFor('CONTRADICTS', 'WITNESSES')).toBe('And yet, ')
  })
  ```

- [ ] **Step 3: Extend audit per-edge-type stats**

  In `scripts/audit-star-system-generator.ts`, the audit's `CorpusStats` already counts edges by type (Phase 2). Verify all 12 types are now reaching the print block. If only 4 were specifically printed, extend to print all 12 (or print them in a single map-iteration loop).

  Add empty-story-rate computation:
  ```ts
  const emptyStoryRate = stats.systemsWithEmptyStory / stats.systems
  console.log(`Empty-story rate: ${(emptyStoryRate * 100).toFixed(2)}% (${stats.systemsWithEmptyStory}/${stats.systems})`)

  // Phase 4 exit metric: ≤ 3% target.
  if (emptyStoryRate > 0.03) {
    console.log(`  WARN: empty-story rate exceeds Phase 4 target (3%) — flagged for Phase 7 tuning.`)
  }
  ```

  This is a *warning print*, not a failed audit — Phase 4 reports the number; Phase 7 acts on it.

- [ ] **Step 4: Two new integrity checks**

  In `auditSystem`:

  ```ts
  // Check: no hidden edge appears in body[] (cluster filter must hold).
  const hiddenEdgeIds = new Set(
    system.relationshipGraph.edges
      .filter(e => e.visibility === 'hidden')
      .map(e => e.id),
  )
  if (hiddenEdgeIds.size > 0) {
    // The audit can't easily reverse-map a body sentence back to its source edge,
    // but it CAN check that the hidden edge's subject AND object names don't both
    // appear in the same body paragraph (a strong signal that the edge leaked).
    for (const edge of system.relationshipGraph.edges) {
      if (edge.visibility !== 'hidden') continue
      for (const para of system.systemStory.body) {
        if (para.includes(edge.subject.displayName) && para.includes(edge.object.displayName)) {
          addFinding(findings, 'error', seed, 'story.hiddenLeak',
            `Hidden edge ${edge.id} appears to leak into body paragraph: "${para}"`)
          break
        }
      }
    }
  }

  // Check: every system with hidden edges produces at least one hook.
  if (hiddenEdgeIds.size > 0 && system.systemStory.hooks.length === 0) {
    addFinding(findings, 'warning', seed, 'story.hiddenWithoutHook',
      `${hiddenEdgeIds.size} hidden edge(s) but no hooks produced.`)
  }
  ```

- [ ] **Step 5: Run audit deep + verify metric**

  ```
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  Read the printed empty-story rate. Three outcomes:
  - **≤ 3%**: Phase 4 exit criterion met. Note in commit message.
  - **3-6%**: Phase 4 reduced rate but did not meet target. Flag in commit message; master plan's Phase 7 row gets a note (already there per the existing carryover) to dedicate effort.
  - **> 6%**: Investigate. Likely indicates a rule isn't firing on real fixtures (e.g., `findControllingFaction` rejecting too aggressively). STOP and diagnose — likely a one-line tweak to a rule's match condition.

- [ ] **Step 6: Commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: expand connectives + surface phase 4 metrics in audit + 2 checks

  Adds 10 connective entries covering CONTROLS/SUPPRESSES paragraph
  joins and epistemic-cluster joins. Audit now prints all 12 edge-type
  counts plus the corpus empty-story rate against the Phase 4 ≤3%
  target, and adds two integrity checks: hidden-edge-leak (regression
  test for the cluster filter) and hidden-without-hook (hidden edges
  must surface as hooks).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 14: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Full quality bar**

  ```
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  npm run audit:star-system-data
  npm run build
  ```

- [ ] **Step 2: Spot-check rendered story output for Phase 4 edge types**

  Render a few seeds and skim the systemStory output for each new edge type:

  ```
  node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { for (const seed of ['phase4-spot-1', 'phase4-spot-2', 'phase4-spot-3']) { const sys = m.generateSystem({ seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' }); const types = new Set(sys.relationshipGraph.edges.map(e => e.type)); console.log(seed, '— types:', [...types].sort().join(', ')); console.log('  spine:', sys.systemStory.spineSummary); console.log('  body[0]:', sys.systemStory.body[0]?.slice(0, 150)); console.log('  hooks:', sys.systemStory.hooks); console.log() } })"
  ```

  Expected: at least some seeds produce CONTROLS / SUPPRESSES / CONTRADICTS / WITNESSES / HIDES_FROM edges. Body sentences for the new types read as natural English. Hooks include hidden-edge content for systems with `HIDES_FROM` edges.

- [ ] **Step 3: Existing-prose snapshot still passes**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: 3/3 pass. If any snapshot fails, Phase 4 has accidentally affected upstream prose — investigate immediately.

- [ ] **Step 4: Confirm rules + templates module structure**

  ```
  ls src/features/tools/star_system_generator/lib/generator/graph/rules/
  ls src/features/tools/star_system_generator/lib/generator/graph/render/templates/
  ```

  Expected:
  - rules: `index.ts`, `ruleTypes.ts`, `settingPatterns.ts`, plus 9 `<edgeType>Rules.ts` files (`hosts`, `dependsOn`, `contests`, `destabilizes`, `controls`, `suppresses`, `contradicts`, `witnesses`, `hidesFrom`).
  - templates: `index.ts`, `types.ts`, plus 9 `<edgeType>Templates.ts` files (same set).

- [ ] **Step 5: Phase 4 acceptance**

  - All 9 present-tense edge types have working rule sets ✓
  - All 9 present-tense edge types have working template families ✓
  - `template.expects[slot]` flows through `slotResolver` (Phase 3 carryover) ✓
  - Connective dictionary covers CONTROLS/SUPPRESSES/epistemic transitions ✓
  - Empty-story rate measured and reported (≤3% target; if not, recorded for Phase 7) ✓
  - Hidden edges never appear in body, always available as hooks ✓
  - `hooks[]` populated for systems with hidden epistemic / hidden suppression edges ✓
  - Same seed produces same `systemStory` ✓
  - All existing tests pass ✓
  - All existing audits pass ✓
  - 2 new audit integrity checks pass ✓
  - **Existing rendered prose is byte-identical for any seed** ✓ (verified by `proseUnchanged.test.ts`)
  - `npm run lint`, `npm run test`, `npm run build` pass ✓

- [ ] **Step 6: Update master plan**

  Edit `docs/NARRATIVE_GRAPH_PLAN.md`:
  - Phase 4 status changes from `⏳ Not yet planned` to `✅ Done — [plan](./NARRATIVE_GRAPH_PHASE_4_PLAN.md)`.
  - Update the "Completed so far" line at the bottom of the Rollout Phases table to include Phase 4 (~6 weeks of plan-equivalent effort).
  - If empty-story rate exceeded 3%, leave the existing Phase 7 carryover note about empty-story tuning in place (it's already there from Phase 3); otherwise consider trimming it.
  - Commit the docs update separately:
    ```
    git commit -m "docs: mark phase 4 complete in master narrative graph plan"
    ```

---

## Spec coverage check (self-review)

| Spec requirement | Task |
|---|---|
| Per-slot `expects` reshape (Phase 3 carryover) | Task 1 |
| Setting-pattern keyword tables for new rules | Task 2 |
| `CONTROLS` rules (2) | Task 3 |
| `SUPPRESSES` rules (2) | Task 4 |
| `CONTRADICTS` rules (2) | Task 5 |
| `WITNESSES` rules (2) | Task 6 |
| `HIDES_FROM` rules (2) | Task 7 |
| `CONTROLS` template family | Task 8 |
| `SUPPRESSES` template family | Task 9 |
| `CONTRADICTS` template family | Task 10 |
| `WITNESSES` template family | Task 11 |
| `HIDES_FROM` template family | Task 12 |
| Connective dictionary expansion | Task 13 |
| Audit empty-story re-measurement | Task 13 |
| 2 new integrity checks (hidden-leak, hidden-without-hook) | Task 13 |
| Existing tests + audits + prose unchanged | Verified after every task; final check Task 14 |

**Estimated commits:** 14-17 (one per task plus possible review-fix commits).

**Estimated effort:** ~1 week (matching the master plan's Phase 4 budget). The rules in Tasks 3-7 are pattern-similar — any speedup from compounding subagent familiarity is a win.

---

## Risks & deferred items

- **Per-slot reshape may shift `systemStory` content for systems already exercised by Phase 3 templates.** `DEPENDS_ON` and `DESTABILIZES` declared `nounPhrase` shapes that did nothing in Phase 3; in Phase 4 they take effect. The Phase 3 prose-unchanged snapshot doesn't track `systemStory`, so this is silent. The change is desired (cleaner article handling), but Phase 7 sample-review may surface tone shifts. Mitigation: spot-check 3-5 seeds before/after Task 1 and capture any prose oddities in the Task 1 commit message.
- **Rule-fire rates are unknown until the deep audit runs.** Some rules (especially `WITNESSES:ruinHook-witnesses-historicalEvent` and `HIDES_FROM:aiSituation-from-authority`) require multiple specific facts to coincide. They may fire rarely. Phase 4 does not block on every rule firing in every system — only on the rules existing, being tested in isolation, and not crashing on representative seeds. Phase 7 will tune fire rates based on sample review.
- **`SUPPRESSES:authority-over-hiddenTruth` requires `findControllingFaction` to identify a unique faction.** If most systems don't have a unique-domain faction match, this rule fires rarely. The implementer may relax the constraint in a fix-up commit if Task 13's audit shows the rule never fires.
- **The empty-story rate target (≤3%) may not be achievable with Phase 4 alone.** Phase 3 reported 6.77%. Adding 5 edge types + 5 template families likely cuts this in half but may not reach 3%. Task 13 records the actual number; the master plan's Phase 7 row already carries the carryover. Phase 4 is OK to ship even at 3-5%.
- **Hidden HIDES_FROM body templates are dead code in Phase 4** because `clusterEdges` excludes hidden epistemic edges from `epistemicCluster`. Phase 4 ships them anyway as defensive content (and so the family shape is complete) — they cost ~6 lines and unblock any future phase that wants to relax the filter or add a "secrets-revealed" rendering mode.
- **CONTRADICTS' object-resolution fallback (system entity) may produce stilted prose** when no controlling faction is identifiable. Templates use `{object}` directly so a system named "G2V Frontier" reads OK; if the system entity's `displayName` is generic ("Frontier System"), the prose becomes vague. Phase 7 tunes.
- **`fact.tags` field assumption.** Task 3's `controlsRouteAssetRule` reads `fact.tags?.includes('routeAsset')`. Verify the field exists on `NarrativeFact` (Phase 2's research path). If not, the rule needs to use a different signal (e.g., text-based `containsWord` against route keywords).
- **No new RNG forks.** Phase 4 reuses the existing `'graph:rules'` and `'story:body'`/`'story:hooks'` fork hierarchy. The prose-unchanged snapshot from Phase 3 must continue to hold across all 14 commits.

---

## Outputs the next phase relies on

After Phase 4:
- All 9 present-tense edge types have rules in `allRules` (sorted alphabetically by `rule.id`) and template families in `templateFor(...)`.
- `slotResolver.resolveSlots(template, ctx, expects)` is the canonical surface; Phase 5 uses the same signature when rendering historical edges.
- The connective dictionary covers all common adjacent-pair transitions for present-tense clusters; Phase 5 may add entries for `historical->present` transitions in spine-summary weaving.
- Hidden epistemic + hidden suppression edges flow through hooks. Phase 5's historical-edge attachment will not modify this routing — it adds a fourth category of edges (era=historical) that are rendered exclusively in spineSummary weaving and never via cluster paragraphs.
- The audit reports the corpus's empty-story rate, edge-type distribution, and hidden-edge handling — Phase 5 baselines against these numbers when measuring whether historical attachment improves narrative density.
- `findControllingFaction` (introduced in Task 4 via Tasks 4 + 7) is a useful helper that Phase 5's `attachHistoricalEvents` may want to lift into `ruleTypes.ts` or a new `entityHelpers.ts` if it gains a third caller.

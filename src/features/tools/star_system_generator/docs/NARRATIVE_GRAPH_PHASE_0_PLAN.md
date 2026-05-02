# Narrative Graph Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract prose-shaping helpers from the 3,927-line `lib/generator/index.ts` into a new `lib/generator/prose/` module, add unit tests for each extracted function, and fix the `crisisPressureSentence` verb-collision bug — without changing generator output for any existing seed.

**Architecture:** Phase 0 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Pure refactor (move-without-changing) for nine functions plus one inline expression, followed by one targeted bug fix. Each extracted function gets characterization tests so subsequent phases can iterate safely.

**Tech Stack:** TypeScript (strict), Vitest (`npm run test`), ESLint (`npm run lint`), existing audit scripts (`npm run audit:star-system-generator:quick`, `npm run audit:star-system-data`).

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` (in this directory).

**Scope:** Extract prose helpers as listed in the spec's File Layout section. Fix the verb-collision bug in `crisisPressureSentence`. Add characterization tests for `hiddenCauseBeatText` (no fix in this phase — function is retired in Phase 8). Defer extraction of world-class tables and other data definitions to follow-up work; this phase is bounded to prose helpers.

**Out of scope:** Any change to graph types, edges, rendering, or downstream consumer wiring (those are Phases 1–6). Any change to `hiddenCauseBeatText` or `choiceBeatText` behavior (retired in Phase 8). Any change to RNG seeding, fork model, or pipeline order.

---

## File Structure

**New files (created in this phase):**
- `lib/generator/prose/index.ts` — barrel re-export of all extracted helpers.
- `lib/generator/prose/helpers.ts` — `lowerFirst`, `sentenceFragment`, `sentenceStart`, `stripTerminalPunctuation`, `smoothTechnicalPhrase`, `definiteNounPhrase`, `normalizeNarrativeText`.
- `lib/generator/prose/crisisShaping.ts` — `conditionAsPressure`, `crisisAsPressure`, `crisisPressureSentence`.
- `lib/generator/prose/settlementProse.ts` — `settlementHookSynthesis`, `settlementWhyHere`.
- `lib/generator/prose/phenomenonProse.ts` — `phenomenonNote` (extracted from inline expression at `index.ts:2871`).
- `lib/generator/prose/__tests__/helpers.test.ts`
- `lib/generator/prose/__tests__/crisisShaping.test.ts`
- `lib/generator/prose/__tests__/settlementProse.test.ts`
- `lib/generator/prose/__tests__/phenomenonProse.test.ts`
- `lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts` — characterization-only, function not moved.

**Files modified:**
- `lib/generator/index.ts` — local function definitions removed; new imports from `./prose` added; one bug fix applied to `crisisPressureSentence` (now living in `prose/crisisShaping.ts`).

**Files unchanged:**
- All `data/`, `components/`, `hooks/` files. All other generator modules. All existing test files.

---

## Task 1: Module skeleton and baseline verification

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/index.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/.gitkeep`

- [ ] **Step 1: Verify baseline tests pass before changing anything**

Run from repo root:
```
npm run test -- --run src/features/tools/star_system_generator
```
Expected: all suites pass. Note the count for later comparison.

- [ ] **Step 2: Run baseline lint and audits**

```
npm run lint
npm run audit:star-system-generator:quick
npm run audit:star-system-data
```
Expected: all green.

- [ ] **Step 3: Create the prose module barrel**

File: `src/features/tools/star_system_generator/lib/generator/prose/index.ts`
```ts
export * from './helpers'
export * from './crisisShaping'
export * from './settlementProse'
export * from './phenomenonProse'
```

- [ ] **Step 4: Create the tests directory placeholder**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/.gitkeep`
Empty file — needed so the directory is committed even before tests are added.

- [ ] **Step 5: Verify nothing breaks**

```
npm run lint
```
Expected: PASS. (`prose/index.ts` re-exports from files that don't yet exist — but since nothing imports from it yet, lint should not complain. If lint does complain about missing modules, comment out the four `export * from './X'` lines and re-add each one as its file is created in subsequent tasks. Document this in the commit message.)

- [ ] **Step 6: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/
git commit -m "refactor: scaffold prose module for star system generator"
```

---

## Task 2: Extract `lowerFirst`, `sentenceFragment`, `sentenceStart`, `stripTerminalPunctuation`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/helpers.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:352-371` (remove four function definitions, add import)

These four functions are tightly coupled (each builds on the previous) and total ~20 lines. Extract together.

- [ ] **Step 1: Write failing test for `lowerFirst`**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation } from '../helpers'

describe('lowerFirst', () => {
  it('lowercases the first character', () => {
    expect(lowerFirst('Orison Hold')).toBe('orison Hold')
  })
  it('preserves AI prefix', () => {
    expect(lowerFirst('AI custody')).toBe('AI custody')
  })
  it('preserves GU prefix', () => {
    expect(lowerFirst('GU resource')).toBe('GU resource')
  })
  it('preserves Sol prefix', () => {
    expect(lowerFirst('Sol/Gardener watch')).toBe('Sol/Gardener watch')
  })
  it('preserves Iggygate prefix', () => {
    expect(lowerFirst('Iggygate Nosaxa-IV')).toBe('Iggygate Nosaxa-IV')
  })
  it('preserves Pinchdrive prefix', () => {
    expect(lowerFirst('Pinchdrive incident')).toBe('Pinchdrive incident')
  })
  it('returns empty string unchanged', () => {
    expect(lowerFirst('')).toBe('')
  })
})

describe('sentenceFragment', () => {
  it('lowercases first character for ordinary phrase', () => {
    expect(sentenceFragment('Compliance team seizes the port')).toBe('compliance team seizes the port')
  })
  it('preserves AI/GU/Sol/Iggygate/Pinchdrive prefixes', () => {
    expect(sentenceFragment('Sol or Gardener watch')).toBe('Sol or Gardener watch')
    expect(sentenceFragment('AI witness core')).toBe('AI witness core')
  })
  it('lowercases proper-noun-only phrases entirely', () => {
    expect(sentenceFragment('Kestrel Free Compact')).toBe('kestrel free compact')
  })
})

describe('sentenceStart', () => {
  it('uppercases the first character', () => {
    expect(sentenceStart('compliance team')).toBe('Compliance team')
  })
  it('returns empty string unchanged', () => {
    expect(sentenceStart('')).toBe('')
  })
})

describe('stripTerminalPunctuation', () => {
  it('removes trailing period', () => {
    expect(stripTerminalPunctuation('Hello.')).toBe('Hello')
  })
  it('removes trailing question mark', () => {
    expect(stripTerminalPunctuation('Hello?')).toBe('Hello')
  })
  it('removes trailing exclamation', () => {
    expect(stripTerminalPunctuation('Hello!')).toBe('Hello')
  })
  it('removes multiple trailing punctuation', () => {
    expect(stripTerminalPunctuation('Hello!?.')).toBe('Hello')
  })
  it('preserves internal punctuation', () => {
    expect(stripTerminalPunctuation('Hello, world.')).toBe('Hello, world')
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: FAIL with "Cannot find module '../helpers'".

- [ ] **Step 3: Create `helpers.ts` with the four functions copied verbatim from `index.ts:352-371`**

File: `src/features/tools/star_system_generator/lib/generator/prose/helpers.ts`
```ts
export function lowerFirst(value: string): string {
  if (!value) return value
  if (/^(AI|GU|Sol|Iggygate|Pinchdrive)\b/.test(value)) return value
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`
}

export function sentenceFragment(value: string): string {
  if (/^(AI|GU|Sol|Iggygate|Pinchdrive)\b/.test(value)) return value
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(value)) return value.toLowerCase()
  return lowerFirst(value)
}

export function sentenceStart(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function stripTerminalPunctuation(value: string): string {
  return value.replace(/[.!?]+$/g, '')
}
```

Note: bodies are byte-identical to `index.ts:352-371` except for the added `export` keyword.

- [ ] **Step 4: Run helpers test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: PASS — all 16 cases.

- [ ] **Step 5: Remove the four function definitions from `index.ts`**

File: `src/features/tools/star_system_generator/lib/generator/index.ts`

Delete lines 352–371 (the four `function` definitions for `lowerFirst`, `sentenceFragment`, `sentenceStart`, `stripTerminalPunctuation`).

- [ ] **Step 6: Add import at the top of `index.ts`**

File: `src/features/tools/star_system_generator/lib/generator/index.ts`

Add to the imports section (immediately after the last existing relative import):
```ts
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation } from './prose/helpers'
```

- [ ] **Step 7: Run full test suite to confirm nothing else broke**

```
npm run test -- --run src/features/tools/star_system_generator
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass. (Specifically, the determinism test and any test that exercises generated output should still pass — these functions are now imported from a different file but their behavior is byte-identical.)

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/helpers.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract sentence helpers to prose module"
```

---

## Task 3: Extract `smoothTechnicalPhrase` and `definiteNounPhrase`

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/helpers.ts` (append two functions)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts` (append two describe blocks)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:373-386` (remove definitions, extend import)

- [ ] **Step 1: Append failing tests to `helpers.test.ts`**

Append to `src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts`:
```ts
describe('smoothTechnicalPhrase', () => {
  it('smooths refinery/gate/AI compound', () => {
    expect(smoothTechnicalPhrase('a refinery/gate/AI seizure'))
      .toBe('a the refinery, gate, or AI systems seizure')
  })
  it('smooths metric/radiation', () => {
    expect(smoothTechnicalPhrase('metric/radiation hazard'))
      .toBe('metric and radiation hazard')
  })
  it('smooths shielding/chiral', () => {
    expect(smoothTechnicalPhrase('shielding/chiral overlap'))
      .toBe('shielding and chiral overlap')
  })
  it('smooths Sol/Gardener', () => {
    expect(smoothTechnicalPhrase('Sol/Gardener compliance team'))
      .toBe('Sol or Gardener compliance team')
  })
  it('passes through unchanged when no patterns match', () => {
    expect(smoothTechnicalPhrase('the chiral ice belt'))
      .toBe('the chiral ice belt')
  })
})

describe('definiteNounPhrase', () => {
  it('adds "the" prefix to bare noun', () => {
    expect(definiteNounPhrase('Iggygate control station'))
      .toBe('the iggygate control station')
  })
  it('preserves existing "the" prefix', () => {
    expect(definiteNounPhrase('the loading dock'))
      .toBe('the loading dock')
  })
  it('preserves "a"/"an" prefixes', () => {
    expect(definiteNounPhrase('a fueling depot')).toBe('a fueling depot')
    expect(definiteNounPhrase('an outpost')).toBe('an outpost')
  })
  it('preserves "access to"/"control of"/"custody of" leads', () => {
    expect(definiteNounPhrase('access to the gate')).toBe('access to the gate')
    expect(definiteNounPhrase('control of quotas')).toBe('control of quotas')
    expect(definiteNounPhrase('custody of records')).toBe('custody of records')
  })
  it('strips terminal punctuation before processing', () => {
    expect(definiteNounPhrase('Iggygate.')).toBe('the iggygate')
  })
  it('returns empty string unchanged', () => {
    expect(definiteNounPhrase('')).toBe('')
  })
})
```

Update the import line at the top of the file to include the new symbols:
```ts
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation, smoothTechnicalPhrase, definiteNounPhrase } from '../helpers'
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: FAIL with "smoothTechnicalPhrase is not exported" or similar.

- [ ] **Step 3: Append the two functions to `helpers.ts`**

Append to `src/features/tools/star_system_generator/lib/generator/prose/helpers.ts`:
```ts
export function smoothTechnicalPhrase(value: string): string {
  return value
    .replace(/\brefinery\/gate\/AI\b/gi, 'the refinery, gate, or AI systems')
    .replace(/\bmetric\/radiation\b/gi, 'metric and radiation')
    .replace(/\bshielding\/chiral\b/gi, 'shielding and chiral')
    .replace(/\bSol\/Gardener\b/g, 'Sol or Gardener')
}

export function definiteNounPhrase(value: string): string {
  const phrase = smoothTechnicalPhrase(stripTerminalPunctuation(sentenceFragment(value)).trim())
  if (!phrase) return phrase
  if (/^(the|a|an|access to|control of|custody of|safe transit|public|root)\b/i.test(phrase)) return phrase
  return `the ${phrase}`
}
```

Bodies are byte-identical to `index.ts:373-386` except for `export`.

- [ ] **Step 4: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: PASS — all cases including the 11 new ones.

- [ ] **Step 5: Remove the two definitions from `index.ts:373-386`**

Delete the bodies of `smoothTechnicalPhrase` (lines 373-379) and `definiteNounPhrase` (lines 381-386).

- [ ] **Step 6: Extend the existing prose import in `index.ts`**

Update the import line added in Task 2:
```ts
import {
  lowerFirst,
  sentenceFragment,
  sentenceStart,
  stripTerminalPunctuation,
  smoothTechnicalPhrase,
  definiteNounPhrase,
} from './prose/helpers'
```

- [ ] **Step 7: Run full test suite**

```
npm run test -- --run src/features/tools/star_system_generator
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass.

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/helpers.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract phrase shaping helpers to prose module"
```

---

## Task 4: Extract `normalizeNarrativeText`

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/helpers.ts` (append one function)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts` (append one describe block)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:3636-3649` (remove definition; site at 3700 uses local — update to imported)

- [ ] **Step 1: Append failing tests to `helpers.test.ts`**

Append a `describe('normalizeNarrativeText', ...)` block:
```ts
describe('normalizeNarrativeText', () => {
  it('collapses runs of whitespace to single spaces', () => {
    expect(normalizeNarrativeText('Hello   world')).toBe('Hello world.')
  })
  it('rewrites "The unrecognized local crews" to drop the article', () => {
    expect(normalizeNarrativeText('The unrecognized local crews demand pay'))
      .toBe('Unrecognized local crews demand pay.')
  })
  it('rewrites "The officially falsified records" to drop the article', () => {
    expect(normalizeNarrativeText('The officially falsified records show losses'))
      .toBe('Officially falsified records show losses.')
  })
  it('removes doubled "the the"', () => {
    expect(normalizeNarrativeText('control of the the gate'))
      .toBe('Control of the gate.')
  })
  it('capitalizes first character', () => {
    expect(normalizeNarrativeText('the dispute is hardening'))
      .toBe('The dispute is hardening.')
  })
  it('preserves existing terminal period', () => {
    expect(normalizeNarrativeText('done.')).toBe('Done.')
  })
  it('preserves question mark', () => {
    expect(normalizeNarrativeText('who decides?')).toBe('Who decides?')
  })
  it('preserves exclamation', () => {
    expect(normalizeNarrativeText('go!')).toBe('Go!')
  })
  it('appends period when no terminal punctuation', () => {
    expect(normalizeNarrativeText('the bell rings')).toBe('The bell rings.')
  })
  it('returns empty string unchanged', () => {
    expect(normalizeNarrativeText('')).toBe('')
  })
})
```

Update the import line to add `normalizeNarrativeText`.

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: FAIL with "normalizeNarrativeText is not exported".

- [ ] **Step 3: Append `normalizeNarrativeText` to `helpers.ts`**

```ts
export function normalizeNarrativeText(value: string): string {
  const normalized = value
    .replace(/\s+/g, ' ')
    .replace(/\bThe unrecognized local crews\b/g, 'Unrecognized local crews')
    .replace(/\bThe officially falsified records\b/g, 'Officially falsified records')
    .replace(/\bthe the\b/gi, 'the')
    .trim()

  if (!normalized) return normalized
  const capitalized = `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  return capitalized.endsWith('.') || capitalized.endsWith('?') || capitalized.endsWith('!')
    ? capitalized
    : `${capitalized}.`
}
```

Body byte-identical to `index.ts:3636-3649` except `export`.

- [ ] **Step 4: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts
```
Expected: PASS.

- [ ] **Step 5: Remove definition from `index.ts:3636-3649`**

Delete the function body. The single call site at `index.ts:3700` (inside `generateNarrativeLines`) uses the bare name and will resolve to the imported symbol after Step 6.

- [ ] **Step 6: Add `normalizeNarrativeText` to the existing prose import**

```ts
import {
  lowerFirst,
  sentenceFragment,
  sentenceStart,
  stripTerminalPunctuation,
  smoothTechnicalPhrase,
  definiteNounPhrase,
  normalizeNarrativeText,
} from './prose/helpers'
```

- [ ] **Step 7: Run full test suite + determinism test specifically**

```
npm run test -- --run src/features/tools/star_system_generator
```
Expected: PASS. Pay particular attention to `generator-determinism.test.ts` — `normalizeNarrativeText` is on a hot path for narrative line text, so any deviation will surface there.

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/helpers.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/helpers.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract normalizeNarrativeText to prose module"
```

---

## Task 5: Extract `conditionAsPressure` and `crisisAsPressure` to `crisisShaping.ts`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:388-426` (remove two definitions; add import)

- [ ] **Step 1: Write failing tests**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { conditionAsPressure, crisisAsPressure } from '../crisisShaping'

describe('conditionAsPressure', () => {
  it('maps "recently evacuated" condition with place', () => {
    expect(conditionAsPressure('recently evacuated', 'Orison Hold'))
      .toBe('the recent evacuation of Orison Hold')
  })
  it('maps "under quarantine" with place', () => {
    expect(conditionAsPressure('under quarantine', 'Orison Hold'))
      .toBe('the quarantine at Orison Hold')
  })
  it('maps "divided by class zones"', () => {
    expect(conditionAsPressure('divided by class zones', 'Orison Hold'))
      .toBe('class-zone divisions at Orison Hold')
  })
  it('maps "pristine and overfunded"', () => {
    expect(conditionAsPressure('pristine and overfunded', 'Orison Hold'))
      .toBe('the overfunded order at Orison Hold')
  })
  it('maps "efficient but joyless"', () => {
    expect(conditionAsPressure('efficient but joyless', 'Orison Hold'))
      .toBe('joyless efficiency at Orison Hold')
  })
  it('maps "population unknown" / falsified', () => {
    expect(conditionAsPressure('population unknown', 'Orison Hold'))
      .toBe('falsified population records at Orison Hold')
    expect(conditionAsPressure('records falsified', 'Orison Hold'))
      .toBe('falsified population records at Orison Hold')
  })
  it('falls through to "<condition> conditions at <place>"', () => {
    expect(conditionAsPressure('Cramped and noisy', 'Orison Hold'))
      .toBe('cramped and noisy conditions at Orison Hold')
  })
})

describe('crisisAsPressure', () => {
  it('maps "the base broadcasts two contradictory distress calls"', () => {
    expect(crisisAsPressure('The base broadcasts two contradictory distress calls'))
      .toBe('contradictory distress calls from the base')
  })
  it('maps "a whole district goes silent"', () => {
    expect(crisisAsPressure('A whole district goes silent'))
      .toBe('a silent district')
  })
  it('maps "ship full of dead arrives"', () => {
    expect(crisisAsPressure('Ship full of dead arrives'))
      .toBe('the arrival of a ship full of dead')
  })
  it('maps "bleed node changed course"', () => {
    expect(crisisAsPressure('Bleed node changed course'))
      .toBe('a drifting bleed node')
  })
  it('maps "Sol/Gardener warning sign detected"', () => {
    expect(crisisAsPressure('Sol/Gardener warning sign detected'))
      .toBe('a detected Sol or Gardener warning sign')
  })
  it('handles labor strike with article injection', () => {
    expect(crisisAsPressure('Labor strike'))
      .toBe('a labor strike')
  })
  it('handles unknown native microbial hazard with vowel article', () => {
    expect(crisisAsPressure('Unknown native microbial hazard'))
      .toBe('an unknown native microbial hazard')
  })
  it('passes unmatched crisis through after lowercase + smoothing', () => {
    expect(crisisAsPressure('Sol/Gardener compliance team seizes the port'))
      .toBe('Sol or Gardener compliance team seizes the port')
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: FAIL — "Cannot find module '../crisisShaping'".

- [ ] **Step 3: Create `crisisShaping.ts` with the two functions copied verbatim from `index.ts:388-426`**

File: `src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts`
```ts
import { sentenceFragment, smoothTechnicalPhrase } from './helpers'

export function conditionAsPressure(value: string, place: string): string {
  const condition = sentenceFragment(value)
  if (/recently evacuated/i.test(value)) return `the recent evacuation of ${place}`
  if (/under quarantine/i.test(value)) return `the quarantine at ${place}`
  if (/divided by class zones/i.test(value)) return `class-zone divisions at ${place}`
  if (/pristine and overfunded/i.test(value)) return `the overfunded order at ${place}`
  if (/efficient but joyless/i.test(value)) return `joyless efficiency at ${place}`
  if (/population unknown|falsified/i.test(value)) return `falsified population records at ${place}`
  return `${condition} conditions at ${place}`
}

export function crisisAsPressure(value: string): string {
  const crisis = smoothTechnicalPhrase(sentenceFragment(value))
  if (/the base broadcasts two contradictory distress calls/i.test(value)) return 'contradictory distress calls from the base'
  if (/a whole district goes silent/i.test(value)) return 'a silent district'
  if (/ship full of dead arrives/i.test(value)) return 'the arrival of a ship full of dead'
  if (/everyone is lying about casualty numbers/i.test(value)) return 'lies about casualty numbers'
  if (/crisis is staged to hide something worse/i.test(value)) return 'a staged crisis'
  if (/children or civilians trapped/i.test(value)) return 'trapped civilians'
  if (/essential expert missing/i.test(value)) return 'a missing essential expert'
  if (/old first-wave map found/i.test(value)) return 'a newly found first-wave map'
  if (/Sol\/Gardener warning sign detected/i.test(value)) return 'a detected Sol or Gardener warning sign'
  if (/AI refuses unsafe operation/i.test(value)) return 'AI refusal to operate unsafely'
  if (/illegal AI expansion discovered/i.test(value)) return 'a discovered illegal AI expansion'
  if (/medical supplies stolen/i.test(value)) return 'stolen medical supplies'
  if (/hull breach hidden from public/i.test(value)) return 'a hidden hull breach'
  if (/bleed node changed course/i.test(value)) return 'a drifting bleed node'
  if (/flare season arrived early/i.test(value)) return 'an early flare season'
  if (/chiral harvest turned toxic/i.test(value)) return 'a toxic chiral harvest'
  if (/radiation storm incoming/i.test(value)) return 'an incoming radiation storm'
  if (/metric storm trapped ships/i.test(value)) return 'ships trapped by a metric storm'
  if (/election or succession crisis/i.test(value)) return 'an election or succession crisis'
  if (/^sabotage of (.+)$/i.test(value)) return crisis.replace(/^sabotage of /i, 'sabotage against ')
  if (/^(labor strike|debt revolt|corporate security crackdown|pirate protection demand|smuggler war|refugee surge|quarantine violation|unknown native microbial hazard|failed terraforming release|medical supplies stolen|military coup|salvage claim dispute|life-support cascade|radiation storm incoming|flare season arrived early|hull breach hidden from public|bleed node changed course|chiral harvest turned toxic|Iggygate schedule failure|pinchdrive calibration accident)$/i.test(crisis)) {
    const article = /^[aeiou]/i.test(crisis) ? 'an' : 'a'
    return `${article} ${crisis}`
  }
  return crisis
}
```

Bodies are byte-identical to `index.ts:388-426` except `export` keywords and the explicit imports of `sentenceFragment`, `smoothTechnicalPhrase`.

- [ ] **Step 4: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: PASS — all cases.

- [ ] **Step 5: Remove the two definitions from `index.ts:388-426`**

Delete `conditionAsPressure` (lines 388-397) and `crisisAsPressure` (lines 399-426).

- [ ] **Step 6: Add import to `index.ts`**

Add a new import line below the existing `./prose/helpers` import:
```ts
import { conditionAsPressure, crisisAsPressure } from './prose/crisisShaping'
```

(`conditionAsPressure` may not be referenced anywhere — check with `grep -n "conditionAsPressure" index.ts`. If unused, leave only `crisisAsPressure` in the import. The export from `crisisShaping.ts` keeps the function available for any future call site.)

- [ ] **Step 7: Run full test suite**

```
npm run test -- --run src/features/tools/star_system_generator
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass.

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract crisisAsPressure to prose module"
```

---

## Task 6: Extract `crisisPressureSentence` (without bug fix yet)

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts` (append one function)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts` (append one describe block)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:428-438` (remove definition; extend import)

This task moves the function as-is, capturing current behavior in tests including the broken case. The bug fix lands in Task 7.

- [ ] **Step 1: Append failing tests to `crisisShaping.test.ts`**

Append:
```ts
describe('crisisPressureSentence', () => {
  it('handles "ships trapped" with plural-shifted consequence', () => {
    expect(crisisPressureSentence('Metric storm trapped ships', 'keeps the lane closed'))
      .toBe('Ships trapped by a metric storm keep the lane closed.')
  })
  it('handles "trapped civilians" with plural-shifted consequence', () => {
    expect(crisisPressureSentence('Children or civilians trapped', 'makes evacuation urgent'))
      .toBe('Trapped civilians make evacuation urgent.')
  })
  it('handles is/are/was/were verbs with comma-which clause', () => {
    expect(crisisPressureSentence('Hull breach hidden from public', 'forces silence on the crew'))
      .toBe('A hidden hull breach forces silence on the crew.')
    // "a hidden hull breach" — starts with "a", caught by article branch, not is/are branch
  })
  it('handles sabotage', () => {
    expect(crisisPressureSentence('Sabotage of life support', 'keeps tempers raw'))
      .toBe('Sabotage against life support keeps tempers raw.')
  })
  it('handles articled crises', () => {
    expect(crisisPressureSentence('Bleed node changed course', 'keeps gate politics under stress'))
      .toBe('A drifting bleed node keeps gate politics under stress.')
  })
  // Captures the verb-collision bug present pre-Task-7. Task 7 will replace this expectation.
  it('falls through to "The crisis around X" for unmatched crises (PRE-FIX BEHAVIOR)', () => {
    expect(crisisPressureSentence('Sol/Gardener compliance team seizes the port', 'keeps trade frozen'))
      .toBe('The crisis around Sol or Gardener compliance team seizes the port keeps trade frozen.')
  })
})
```

Update the import to include `crisisPressureSentence`.

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: FAIL — "crisisPressureSentence is not exported".

- [ ] **Step 3: Append `crisisPressureSentence` to `crisisShaping.ts`**

First, **extend the existing `./helpers` import** at the top of the file to add `sentenceStart`:

```ts
import { sentenceFragment, sentenceStart, smoothTechnicalPhrase } from './helpers'
```

Then append the function (body byte-identical to `index.ts:428-438`):

```ts
export function crisisPressureSentence(value: string, consequence: string): string {
  const crisis = crisisAsPressure(value)
  if (/^(ships trapped|trapped civilians|lies about)\b/i.test(crisis)) {
    const pluralConsequence = consequence.replace(/^keeps\b/i, 'keep').replace(/^makes\b/i, 'make')
    return `${sentenceStart(crisis)} ${pluralConsequence}.`
  }
  if (/\b(?:is|are|was|were|has|have|cannot|can|will|would)\b/i.test(crisis)) return `${sentenceStart(crisis)}, which ${consequence}.`
  if (/^sabotage\b/i.test(crisis)) return `${sentenceStart(crisis)} ${consequence}.`
  if (/^(?:a|an|the)\s/i.test(crisis)) return `${sentenceStart(crisis)} ${consequence}.`
  return `The crisis around ${crisis} ${consequence}.`
}
```

- [ ] **Step 4: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: PASS — including the PRE-FIX BEHAVIOR test.

- [ ] **Step 5: Remove definition from `index.ts:428-438`**

Delete `crisisPressureSentence`.

- [ ] **Step 6: Extend the import in `index.ts`**

```ts
import { conditionAsPressure, crisisAsPressure, crisisPressureSentence } from './prose/crisisShaping'
```

- [ ] **Step 7: Run full test suite + audit**

```
npm run test -- --run src/features/tools/star_system_generator
npm run audit:star-system-generator:quick
```
Expected: all pass. Generator output is unchanged.

- [ ] **Step 8: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract crisisPressureSentence to prose module"
```

---

## Task 7: Fix the verb-collision bug in `crisisPressureSentence`

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts:crisisPressureSentence` (one new branch + fallback)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts` (replace PRE-FIX expectation, add new cases)

The bug: when a crisis like "Sol/Gardener compliance team seizes the port" already contains its own subject + finite verb, the fallback `The crisis around X Y.` produces a verb-collision: "The crisis around Sol or Gardener compliance team seizes the port keeps trade frozen." The fix detects clause-shaped crises (those that fall through every branch and don't start with an article) and rewrites them with a `When X, the situation Y.` wrapper.

- [ ] **Step 1: Update the test to express the desired behavior (RED)**

In `src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts`, find:
```ts
it('falls through to "The crisis around X" for unmatched crises (PRE-FIX BEHAVIOR)', () => {
  expect(crisisPressureSentence('Sol/Gardener compliance team seizes the port', 'keeps trade frozen'))
    .toBe('The crisis around Sol or Gardener compliance team seizes the port keeps trade frozen.')
})
```

Replace with:
```ts
it('wraps clause-shaped crises with "When X, the situation Y" (verb-collision fix)', () => {
  expect(crisisPressureSentence('Sol/Gardener compliance team seizes the port', 'keeps trade frozen'))
    .toBe('When Sol or Gardener compliance team seizes the port, the situation keeps trade frozen.')
})
it('wraps another lexical-verb crisis', () => {
  expect(crisisPressureSentence('Archive court releases two incompatible rulings', 'keeps litigation alive'))
    .toBe('When archive court releases two incompatible rulings, the situation keeps litigation alive.')
})
it('still falls back to "The crisis around X" when crisis has no detectable verb shape', () => {
  // A truly bare noun-phrase crisis with no article — engineered as a regression check
  expect(crisisPressureSentence('something unspecified', 'shapes politics'))
    .toBe('The crisis around something unspecified shapes politics.')
})
```

- [ ] **Step 2: Run tests to confirm RED**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: FAIL on the two new wrap-with-When cases.

- [ ] **Step 3: Update `crisisPressureSentence` in `crisisShaping.ts`**

**Extend the existing `./helpers` import** at the top of the file to add `lowerFirst`:
```ts
import { lowerFirst, sentenceFragment, sentenceStart, smoothTechnicalPhrase } from './helpers'
```

Replace the function body so the final fallback distinguishes clause-shaped vs noun-phrase crises:
```ts
export function crisisPressureSentence(value: string, consequence: string): string {
  const crisis = crisisAsPressure(value)
  if (/^(ships trapped|trapped civilians|lies about)\b/i.test(crisis)) {
    const pluralConsequence = consequence.replace(/^keeps\b/i, 'keep').replace(/^makes\b/i, 'make')
    return `${sentenceStart(crisis)} ${pluralConsequence}.`
  }
  if (/\b(?:is|are|was|were|has|have|cannot|can|will|would)\b/i.test(crisis)) return `${sentenceStart(crisis)}, which ${consequence}.`
  if (/^sabotage\b/i.test(crisis)) return `${sentenceStart(crisis)} ${consequence}.`
  if (/^(?:a|an|the)\s/i.test(crisis)) return `${sentenceStart(crisis)} ${consequence}.`
  // Clause-shaped crisis (subject + finite verb, no leading article).
  // Detect: starts with a capitalized proper-noun-like token followed by another word.
  // Wraps with "When X, the situation Y" to avoid verb-collision with the consequence verb.
  if (/^(AI|GU|Sol|Iggygate|Pinchdrive)\b/.test(crisis) || /^[A-Z][a-z]/.test(crisis) || /\s\w+(?:s|es|ed)\b/.test(crisis)) {
    return `When ${lowerFirst(crisis)}, the situation ${consequence}.`
  }
  return `The crisis around ${crisis} ${consequence}.`
}
```

The new branch fires when ANY of three signals is present:
- Crisis starts with a setting-specific proper noun prefix (`AI`, `GU`, `Sol`, etc.) — `lowerFirst` preserves these correctly.
- Crisis starts with `[A-Z][a-z]` — a capitalized word, indicating a proper noun subject.
- Crisis contains a space-word ending in `s/es/ed` — a finite-verb signal.

Falling through requires: no leading article, no setting prefix, no leading capital, and no s/es/ed verb-ending word — extremely rare ("something unspecified" is engineered to hit this).

- [ ] **Step 4: Run tests to confirm GREEN**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
```
Expected: PASS — including the three new fix cases.

- [ ] **Step 5: Run full test suite + determinism + audit**

```
npm run test -- --run src/features/tools/star_system_generator
npm run audit:star-system-generator:quick
npm run audit:star-system-generator:deep
```
Expected: all pass.

**This is a behavioral change.** Some generator-determinism snapshot tests may fail because they captured the old buggy output. If `generator-determinism.test.ts` fails, examine each diff:
- If the diff is on a `crisisPressureSentence` output that previously contained "The crisis around <subject>" plus a doubled verb, the new output is correct — update the snapshot.
- If the diff is anywhere else, investigate before updating.

To update determinism snapshots after confirming each diff is intentional:
```
npm run test -- --run src/features/tools/star_system_generator -u
```
Then re-run without `-u` to confirm green.

- [ ] **Step 6: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/crisisShaping.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/crisisShaping.test.ts
# plus any updated determinism snapshots
git add src/features/tools/star_system_generator/__tests__/__snapshots__/  2>/dev/null || true
git commit -m "fix: wrap clause-shaped crises to prevent verb-collision sentences"
```

---

## Task 8: Extract `settlementHookSynthesis` to `settlementProse.ts`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:2254-2279` (remove definition; add import)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (export `settlementTagHook` if currently private, since `settlementHookSynthesis` calls it)

The function depends on `settlementTagHook` (also in `index.ts`) and on the `SeededRng` type. Determine whether `settlementTagHook` is already exported by grepping; if not, export it temporarily so the new file can import it.

- [ ] **Step 1: Export `settlementTagHook` from `index.ts`**

`settlementTagHook` is defined at `index.ts:2240` and is currently private. The new `settlementProse.ts` will import it from `index.ts`. This creates a runtime-safe import cycle (`index.ts → prose/settlementProse → index.ts`) — TS resolves it because neither side touches the other at module-init time, only at function-call time.

Change `index.ts:2240` from:
```ts
function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string {
```
to:
```ts
export function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string {
```

- [ ] **Step 2: Write failing tests for `settlementHookSynthesis`**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { settlementHookSynthesis } from '../settlementProse'
import { createSeededRng } from '../../rng'

describe('settlementHookSynthesis', () => {
  it('produces a four-sentence hook for a regular-scale settlement', () => {
    const rng = createSeededRng('test-seed-1')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Outpost',
      siteCategory: 'orbital',
      settlementFunction: 'Iggygate control station',
      condition: 'Cramped and noisy',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'The route weather board sells safe windows twice',
      encounterSites: ['cargo dock', 'maintenance bay'],
      guIntensity: 'normal',
    })
    // Four sentences, each ending with period; we check shape rather than exact prose
    // because the tagHook draws from authored content that may evolve.
    const sentences = result.split(/(?<=[.])\s+/)
    expect(sentences.length).toBeGreaterThanOrEqual(3)
    expect(sentences.length).toBeLessThanOrEqual(4)
    // Final sentence is currently the boilerplate close
    expect(result).toMatch(/Control of the iggygate control station decides who has leverage\.$/)
    // Hidden truth appears with "Privately, " prefix
    expect(result).toMatch(/Privately, the route weather board sells safe windows twice\./)
  })

  it('uses automation-specific pressure for "Automated only" scale', () => {
    const rng = createSeededRng('test-seed-2')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Automated only',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Dormant',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Maintenance airlock'],
      guIntensity: 'normal',
    })
    expect(result).toMatch(/Automation failure turns maintenance airlock into the key scene\./)
  })

  it('uses salvage pressure for "Abandoned" scale', () => {
    const rng = createSeededRng('test-seed-3')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Abandoned',
      siteCategory: 'orbital',
      settlementFunction: 'survey rig',
      condition: 'Stripped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A community funeral compact protects the site',
      encounterSites: ['Skeleton hab'],
      guIntensity: 'normal',
    })
    expect(result).toMatch(/Salvage pressure centers on skeleton hab\./)
  })

  it('uses fracture-specific consequence when guIntensity contains "fracture"', () => {
    const rng = createSeededRng('test-seed-4')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Outpost',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Cramped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Cargo dock'],
      guIntensity: 'major fracture',
    })
    expect(result).toContain('makes the GU work impossible to treat as routine')
  })
})
```

- [ ] **Step 3: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: FAIL — "Cannot find module '../settlementProse'".

- [ ] **Step 4: Create `settlementProse.ts` with `settlementHookSynthesis` copied verbatim from `index.ts:2254-2279`**

File: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts`
```ts
import type { SeededRng } from '../rng'
import { sentenceStart, sentenceFragment, definiteNounPhrase } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagHook } from '../index'

export function settlementHookSynthesis(
  rng: SeededRng,
  obviousTag: string,
  deeperTag: string,
  context: {
    scale: string
    siteCategory: string
    settlementFunction: string
    condition: string
    crisis: string
    hiddenTruth: string
    encounterSites: string[]
    guIntensity: string
  }
): string {
  const base = settlementTagHook(rng, obviousTag, deeperTag)
  const pressure =
    context.scale === 'Automated only' ? `Automation failure turns ${context.encounterSites[0].toLowerCase()} into the key scene.` :
    context.scale === 'Abandoned' ? `Salvage pressure centers on ${context.encounterSites[0].toLowerCase()}.` :
    context.guIntensity.includes('fracture') || context.guIntensity.includes('shear') ? crisisPressureSentence(context.crisis, 'makes the GU work impossible to treat as routine') :
    crisisPressureSentence(context.crisis, `keeps ${context.siteCategory.toLowerCase()} politics under stress`)
  const secret = sentenceFragment(context.hiddenTruth)
  const functionPressure = definiteNounPhrase(context.settlementFunction)

  return `${sentenceStart(base)} ${pressure} Privately, ${secret}. Control of ${functionPressure} decides who has leverage.`
}
```

The body is byte-identical to `index.ts:2254-2279` except for `export` and the explicit imports.

**Note on circular import:** `settlementProse.ts` imports `settlementTagHook` from `../index`, while `index.ts` imports `settlementHookSynthesis` from `./prose/settlementProse`. This cycle is benign — both sides only use the imported symbols at function-call time, never at module-init time, so TS resolves cleanly. No structural workaround is required for Phase 0.

- [ ] **Step 5: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: PASS — all four cases.

- [ ] **Step 6: Remove the definition from `index.ts:2254-2279`**

Delete `settlementHookSynthesis`.

- [ ] **Step 7: Add import to `index.ts`**

```ts
import { settlementHookSynthesis } from './prose/settlementProse'
```

- [ ] **Step 8: Run full test suite + audit**

```
npm run test -- --run src/features/tools/star_system_generator
npm run lint
npm run audit:star-system-generator:quick
```
Expected: all pass.

- [ ] **Step 9: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
# Plus settlementTagHook.ts if approach (a) was taken
git add src/features/tools/star_system_generator/lib/generator/settlementTagHook.ts 2>/dev/null || true
git commit -m "refactor: extract settlementHookSynthesis to prose module"
```

---

## Task 9: Extract `settlementWhyHere` to `settlementProse.ts`

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts` (append one function)
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts` (append one describe block)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:2669-2707` (remove definition; extend import)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` — export `scoreSettlementPresence` so its return type is reachable from the new file (or define an explicit `SettlementPresence` type)

`settlementWhyHere` parameters use `ReturnType<typeof scoreSettlementPresence>` and `ReturnType<typeof generateGuOverlay>` and `ReturnType<typeof generateReachability>` — these helper functions must be exportable from `index.ts` for the new file to use `ReturnType` against them. Also depends on `OrbitingBody` (from `../../types`) and `SettlementAnchor` type.

- [ ] **Step 1: Locate the supporting types**

Run:
```
grep -n "function scoreSettlementPresence\|function generateGuOverlay\|function generateReachability\|interface SettlementAnchor\|type SettlementAnchor" src/features/tools/star_system_generator/lib/generator/index.ts
```

If any of these are not yet exported, change `function X` to `export function X` (or `interface X` to `export interface X`) so the new file can import them.

- [ ] **Step 2: Append failing tests to `settlementProse.test.ts`**

```ts
import { settlementWhyHere } from '../settlementProse'
// at the top, extend the existing import

describe('settlementWhyHere', () => {
  // settlementWhyHere depends on full system fixtures; we use deterministic generated input.
  // For Phase 0, we test that the function runs without error and produces a non-empty string
  // for a representative input. Behavioral characterization (which template is chosen for a
  // given seed) is captured by the generator-determinism snapshot tests.

  it('produces a non-empty string for a typical settlement', async () => {
    const { generateSystem } = await import('../../index')
    const system = generateSystem({ seed: 'phase0-whyhere-1' })
    const settlement = system.settlements[0]
    expect(settlement.whyHere?.value).toBeTruthy()
    expect(settlement.whyHere?.value.length).toBeGreaterThan(20)
  })

  it('selects one of five templates deterministically', async () => {
    const { generateSystem } = await import('../../index')
    const a = generateSystem({ seed: 'phase0-whyhere-2' })
    const b = generateSystem({ seed: 'phase0-whyhere-2' })
    expect(a.settlements[0]?.whyHere?.value).toBe(b.settlements[0]?.whyHere?.value)
  })
})
```

(This task does not test `settlementWhyHere` directly with fabricated arguments — its parameter types are tightly coupled to other generator internals. Direct unit tests would require building a fake `OrbitingBody`, fake presence object, fake GU overlay, fake reachability, fake anchor — too brittle. The integration tests above plus existing determinism snapshots provide adequate coverage.)

- [ ] **Step 3: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: FAIL — "settlementWhyHere is not exported".

- [ ] **Step 4: Append `settlementWhyHere` to `settlementProse.ts`**

Body is copied verbatim from `index.ts:2669-2707`. Imports at top of file may need extending:
```ts
import type { OrbitingBody } from '../../types'
import type { SeededRng } from '../rng'
import type { scoreSettlementPresence, generateGuOverlay, generateReachability, SettlementAnchor } from '../index'
import { sentenceStart, sentenceFragment, definiteNounPhrase } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagHook } from '../index'

// (settlementHookSynthesis from previous task remains here)

export function settlementWhyHere(
  rng: SeededRng,
  body: OrbitingBody,
  presence: ReturnType<typeof scoreSettlementPresence>,
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
  anchor: SettlementAnchor
): string {
  const reasons: string[] = []

  if (presence.resource >= 3) reasons.push(`resources are strong here, especially ${guOverlay.resource.value.toLowerCase()}`)
  else if (presence.resource >= 2) reasons.push('local materials, volatiles, or fuel justify permanent infrastructure')

  if (presence.access >= 3) reasons.push(`${reachability.className.value.toLowerCase()} access keeps traffic viable`)
  else if (presence.access >= 2) reasons.push('access is manageable for prepared crews')

  if (presence.strategic >= 3) reasons.push('the site controls a militarily or commercially important approach')
  else if (presence.strategic >= 2) reasons.push('the site watches a useful route or resource')

  if (presence.guValue >= 3) reasons.push('GU value is high enough to justify danger and secrecy')
  else if (presence.guValue >= 1) reasons.push('local metric signatures add research or extraction value')

  if (presence.habitability >= 2) reasons.push(`${body.name.value} offers unusually forgiving environmental support`)
  if (presence.hazard >= 3) reasons.push('hazards are severe, so the site exists because the payoff is worth the risk')
  else if (presence.hazard >= 1) reasons.push('hazards shape operations but do not prevent occupation')
  if (presence.legalHeat >= 2) reasons.push('legal or interdiction pressure explains the secrecy and tension')

  const selected = reasons.slice(0, 3)
  if (selected.length === 0) {
    selected.push(`${anchor.name} is the best available compromise between access, shelter, and useful work`)
  }

  const template = rng.int(1, 5)
  if (template === 1) return `${anchor.name}: ${selected.join('; ')}.`
  if (template === 2) return `Crews keep choosing ${anchor.name} because ${selected.join('; ')}.`
  if (template === 3) return `The case for ${anchor.name} is practical: ${selected.join('; ')}.`
  if (template === 4) return `${anchor.name} survives because ${selected.join('; ')}.`
  return `At ${anchor.name}, the settlement logic is ${selected.join('; ')}.`
}
```

If TypeScript complains about importing `scoreSettlementPresence`/`generateGuOverlay`/`generateReachability`/`SettlementAnchor` from `../index` (cycle), see the cycle note in Task 8 — accept the cycle, or extract these into smaller modules in a follow-up task. Phase 0 prioritizes the move; resolving cycles is mechanical follow-up work.

- [ ] **Step 5: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts
```
Expected: PASS.

- [ ] **Step 6: Remove definition from `index.ts:2669-2707`**

Delete `settlementWhyHere`.

- [ ] **Step 7: Add import to `index.ts`**

```ts
import { settlementHookSynthesis, settlementWhyHere } from './prose/settlementProse'
```

- [ ] **Step 8: Run full test suite + audit + determinism**

```
npm run test -- --run src/features/tools/star_system_generator
npm run audit:star-system-generator:quick
npm run audit:star-system-generator:deep
npm run lint
```
Expected: all pass — including determinism snapshots, since the function body is byte-identical.

- [ ] **Step 9: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract settlementWhyHere to prose module"
```

---

## Task 10: Extract phenomenon note to `phenomenonProse.ts`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/phenomenonProse.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/phenomenonProse.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts:2871` (replace inline expression with function call)

This is an inline-to-function refactor. The `note` string at `index.ts:2871` is currently constructed inside `generatePhenomena`:
```ts
const note = `Transit: ${phenomenon.travelEffect} Question: ${phenomenon.surveyQuestion} Hook: ${phenomenon.conflictHook} Image: ${phenomenon.sceneAnchor}`
```

Extract to a function with the exact same output. Phase 0 keeps behavior identical; Phase 6 (downstream integration) replaces the body to be graph-aware.

- [ ] **Step 1: Write failing tests**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/phenomenonProse.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { phenomenonNote } from '../phenomenonProse'

describe('phenomenonNote', () => {
  it('formats a structured phenomenon as Transit/Question/Hook/Image', () => {
    const result = phenomenonNote({
      label: 'Dense debris disk',
      confidence: 'inferred',
      travelEffect: 'Approach vectors require slow burns.',
      surveyQuestion: 'Which fragments carry isotopes?',
      conflictHook: 'Insurers and salvagers dispute lanes.',
      sceneAnchor: 'A cutter drifts beside a glittering wall.',
    })
    expect(result).toBe(
      'Transit: Approach vectors require slow burns. Question: Which fragments carry isotopes? Hook: Insurers and salvagers dispute lanes. Image: A cutter drifts beside a glittering wall.'
    )
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/phenomenonProse.test.ts
```
Expected: FAIL — "Cannot find module '../phenomenonProse'".

- [ ] **Step 3: Create `phenomenonProse.ts`**

File: `src/features/tools/star_system_generator/lib/generator/prose/phenomenonProse.ts`
```ts
import type { PhenomenonEntry } from '../data/narrative'

export function phenomenonNote(phenomenon: PhenomenonEntry): string {
  return `Transit: ${phenomenon.travelEffect} Question: ${phenomenon.surveyQuestion} Hook: ${phenomenon.conflictHook} Image: ${phenomenon.sceneAnchor}`
}
```

If `PhenomenonEntry` is not exported from `lib/generator/data/narrative.ts`, export it. Confirm with:
```
grep -n "PhenomenonEntry" src/features/tools/star_system_generator/lib/generator/data/narrative.ts
```

- [ ] **Step 4: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/phenomenonProse.test.ts
```
Expected: PASS.

- [ ] **Step 5: Replace the inline expression at `index.ts:2871`**

Add an import near the top of `index.ts`:
```ts
import { phenomenonNote } from './prose/phenomenonProse'
```

Find:
```ts
const note = `Transit: ${phenomenon.travelEffect} Question: ${phenomenon.surveyQuestion} Hook: ${phenomenon.conflictHook} Image: ${phenomenon.sceneAnchor}`
```

Replace with:
```ts
const note = phenomenonNote(phenomenon)
```

- [ ] **Step 6: Run full test suite + audit + determinism**

```
npm run test -- --run src/features/tools/star_system_generator
npm run audit:star-system-generator:quick
npm run audit:star-system-data
```
Expected: all pass. The phenomenon `note` field's output is byte-identical to before, so the determinism snapshot is unchanged.

- [ ] **Step 7: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/phenomenonProse.ts \
         src/features/tools/star_system_generator/lib/generator/prose/__tests__/phenomenonProse.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "refactor: extract phenomenonNote to prose module"
```

---

## Task 11: Add characterization tests for `hiddenCauseBeatText`

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts`

The function is **NOT extracted** in Phase 0 (it is retired entirely in Phase 8 when `narrativeThreads` is removed). This task only adds regression tests against the function's current behavior so future phases can detect any unintended drift.

The function lives at `index.ts:440-450`. To make it testable, export it from `index.ts`.

- [ ] **Step 1: Export `hiddenCauseBeatText` from `index.ts`**

In `src/features/tools/star_system_generator/lib/generator/index.ts:440`, change:
```ts
function hiddenCauseBeatText(secretText: string): string {
```
to:
```ts
export function hiddenCauseBeatText(secretText: string): string {
```

- [ ] **Step 2: Write characterization tests**

File: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { hiddenCauseBeatText } from '../../index'

describe('hiddenCauseBeatText (characterization, retired in Phase 8)', () => {
  it('handles secret starting with "records" with plural verb', () => {
    expect(hiddenCauseBeatText('Records show the false casualty list'))
      .toBe('Records show the false casualty list are driving the conflict.')
  })
  it('handles secret starting with "evidence" with singular verb', () => {
    expect(hiddenCauseBeatText('Evidence of labor massacre'))
      .toBe('Evidence of labor massacre is driving the conflict.')
  })
  it('handles secret starting with "proof" with singular verb', () => {
    expect(hiddenCauseBeatText('Proof of the falsified order'))
      .toBe('Proof of the falsified order is driving the conflict.')
  })
  it('uses "the hidden cause is that" for "the X is/are/..." secrets', () => {
    expect(hiddenCauseBeatText('The settlement is insolvent'))
      .toBe('The hidden cause is that the settlement is insolvent.')
    expect(hiddenCauseBeatText('A debt ledger nobody wants is being audited'))
      .toBe('The hidden cause is that a debt ledger nobody wants is being audited.')
  })
  it('falls back to "the hidden evidence is" for unmatched shapes', () => {
    expect(hiddenCauseBeatText('community funeral compact protects the site'))
      .toBe('The hidden evidence is community funeral compact protects the site.')
  })
  it('strips terminal punctuation from input', () => {
    expect(hiddenCauseBeatText('Evidence of labor massacre.'))
      .toBe('Evidence of labor massacre is driving the conflict.')
  })
})
```

- [ ] **Step 3: Run test to confirm pass**

```
npm run test -- --run src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts
```
Expected: PASS — all six cases.

If any case FAILS, the actual output diverges from what I expected when writing this plan. Update the expectation in the test to match the function's actual current behavior (this is characterization — the goal is to capture present truth, not to define correctness). Document the divergence in the commit message.

- [ ] **Step 4: Run full test suite**

```
npm run test -- --run src/features/tools/star_system_generator
```
Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/features/tools/star_system_generator/lib/generator/prose/__tests__/hiddenCauseBeatText.test.ts \
         src/features/tools/star_system_generator/lib/generator/index.ts
git commit -m "test: add characterization for hiddenCauseBeatText (retired in Phase 8)"
```

---

## Task 12: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run full quality bar**

```
npm run lint
npm run test -- --run src/features/tools/star_system_generator
npm run audit:star-system-generator:quick
npm run audit:star-system-generator:deep
npm run audit:star-system-data
npm run build
```
Expected: ALL pass with no warnings introduced.

- [ ] **Step 2: Verify line-count progress on `index.ts`**

```
wc -l src/features/tools/star_system_generator/lib/generator/index.ts
```
Expected: significantly fewer than the starting count (3,927). The exact target is below 1500 lines per the spec, but Phase 0 alone is unlikely to reach <1500 without extracting world-class tables and other inlined data; that work is deferred to a follow-up. Phase 0 success = ~150 lines removed (the prose helpers). If the count is anywhere between 3,750 and 3,800, that is the expected outcome of Phase 0.

- [ ] **Step 3: Spot-check generated output is unchanged**

```
node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { const sys = m.generateSystem({ seed: 'phase0-spot' }); console.log(JSON.stringify({ name: sys.name.value, settlements: sys.settlements.map(s => s.tagHook?.value), phenomena: sys.phenomena.map(p => p.note?.value) }, null, 2)) })"
```
Examine output by eye. Compare against output before Phase 0 by checking out the pre-Phase-0 commit, running the same command, and diffing.

If the only difference is in `crisisPressureSentence`-affected outputs (the verb-collision fix), that is the single intended behavioral change. Any other difference is a regression and must be investigated before proceeding.

- [ ] **Step 4: Confirm prose module structure**

```
ls -R src/features/tools/star_system_generator/lib/generator/prose/
```
Expected:
```
src/features/tools/star_system_generator/lib/generator/prose/:
__tests__  crisisShaping.ts  helpers.ts  index.ts  phenomenonProse.ts  settlementProse.ts

src/features/tools/star_system_generator/lib/generator/prose/__tests__:
crisisShaping.test.ts  helpers.test.ts  hiddenCauseBeatText.test.ts  phenomenonProse.test.ts  settlementProse.test.ts
```

- [ ] **Step 5: Final commit (only if there are uncommitted changes from verification fixes)**

If verification steps surfaced any small fixes:
```
git add ...
git commit -m "chore: verification touchups for narrative graph phase 0"
```

If everything was clean, skip — no empty commits.

- [ ] **Step 6: Phase 0 done — note Phase 1 readiness**

Phase 0 acceptance per the spec:
- All existing tests pass ✓
- New unit tests cover the helpers ✓
- `index.ts` shrinks (target <1500 acknowledged as deferred to follow-up data-table extraction) ✓
- Grammar bug fixes landed (verb-collision in `crisisPressureSentence`) ✓
- `hiddenCauseBeatText` characterized (no fix; function retired in Phase 8) ✓

The repository is now ready for Phase 1: build `graph/types.ts`, `graph/entities.ts`, scaffold `buildRelationshipGraph` returning empty graph, add `relationshipGraph` to `GeneratedSystem`.

---

## Spec coverage check (self-review)

Phase 0 task → spec requirement:

| Spec requirement | Task |
|---|---|
| Extract prose helpers from `index.ts` to `lib/generator/prose/` | Tasks 2-10 |
| Helpers: `lowerFirst`, `sentenceFragment`, `sentenceStart`, `stripTerminalPunctuation`, `smoothTechnicalPhrase`, `definiteNounPhrase`, `normalizeNarrativeText` → `helpers.ts` | Tasks 2, 3, 4 |
| `crisisAsPressure`, `crisisPressureSentence` (and `conditionAsPressure`) → `crisisShaping.ts` | Tasks 5, 6 |
| `settlementHookSynthesis`, `settlementWhyHere` → `settlementProse.ts` | Tasks 8, 9 |
| `phenomenonNote` → `phenomenonProse.ts` | Task 10 |
| Add unit tests for extracted helpers | Tests are in every extraction task |
| Land grammar fix: `crisisPressureSentence` verb collision | Task 7 |
| Land grammar fix: `hiddenCauseBeatText` doubled noun | **PARTIAL** — characterization only (Task 11). The audit's specific example does not fail the function's regex chain in my analysis, so this is treated as regression-prevention, not a bug fix. If Task 11 surfaces a real failure it gets fixed inline. |
| All existing tests pass | Verified at end of every task and in Task 12 |
| `index.ts` < 1500 lines | **PARTIAL** — Phase 0 alone removes ~150 lines. Reaching <1500 requires further extraction (world-class tables, etc.) which the spec does not list under Phase 0's prose-helper scope. Acknowledged as deferred. |
| `hiddenCauseBeatText` and `choiceBeatText` retired in Phase 8 | Out of Phase 0 scope (preserved as-is) |

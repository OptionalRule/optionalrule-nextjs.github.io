# Sample Review — 2026-05-07 (post phenomenon-note fix)

Second sample pass after landing the conjunction-before-question fix in
`graphAwarePhenomenonNote.ts`. Same 20-seed corpus as
`SAMPLE_REVIEW_2026-05.md`. Goal: confirm the fix landed cleanly, surface
issues that are now more visible with the louder bug gone, and re-rank
priorities.

## Fix verification

- **43 phenomenon notes** generated across the 20-seed corpus.
- **0 conjunction-before-question incidents** in phenomenon notes (regex
  sweep `\b(And|But|Meanwhile),\s+[A-Z]`).
- The 7 remaining `Meanwhile, ...` matches in the corpus are all in
  *body paragraph [1]* joiners ("Meanwhile, X is corroding Y") which join
  declarative clauses and were intentionally untouched.

### Framer distribution

| Framer | Count | Routes |
|---|---|---|
| `No one has settled` | 10 | declarative (clean wh-) |
| `Crews still ask` | 10 | declarative (clean wh-) |
| `What remains contested:` | 8 | declarative (clean wh-) |
| `The open question is` | 5 | declarative (clean wh-) |
| `Contested:` | 5 | interrogative (yes/no + wh+aux) |
| `Open question:` | 3 | interrogative (yes/no + wh+aux) |
| `Unsettled:` | 1 | interrogative |
| `Crews still argue:` | 1 | interrogative |

Declarative framers (33/43, 77%) dominate as expected since most
surveyQuestions in `narrative.json` are clean wh-questions.
Interrogative framers (10/43, 23%) handle the yes/no + wh+aux-inverted
cases correctly. Per-seed determinism preserved (verified by 200-seed
sweep test).

### Concrete before/after samples

| Surface | Before | After |
|---|---|---|
| Sol-interdiction picket shadow (seed 1) | "...interdiction claims. **But, What is the picket watching**, and why has its patrol shifted?" | "...interdiction claims. **Crews still argue: What is the picket watching**, and why has its patrol shifted?" |
| Salvage court evidence cache (seed 7) | "...court-licensed patrols. **And, Which** wreck record would overturn..." | "...court-licensed patrols. **No one has settled which** wreck record would overturn..." |
| Election-day metric storm cycle (seed 10) | "...ballots, and monitors. **Meanwhile, Is the cycle natural**, exploited..." | "...ballots, and monitors. **Contested: Is the cycle natural**, exploited..." |
| Public festival (seed 10) | "...around celebrated safe windows. **And, Who controls the forecast**..." | "...around celebrated safe windows. **Crews still ask who controls the forecast**..." |

The fix improved every phenomenon note in the corpus.

## New issues surfaced (now visible with the louder bug gone)

### 1. `What remains contested:` colon-fragment style

8 of 33 declarative framers use `What remains contested:` which reads as
a noun-phrase header introducing a list/clause:

> "Cache approaches trigger claim holds and court-licensed patrols. **What
> remains contested: which wreck record would overturn the current salvage
> rights.** Judges, insurers, and crews need..."

The result is grammatically defensible (`What remains contested` = noun
phrase, the embedded clause = its expansion) but the punctuation trips
the eye — period after a non-finite clause feels fragmentary. Compare
against the smoother forms:

- ✅ "Crews still ask which wreck record would overturn..."
- ✅ "The open question is which wreck record would overturn..."
- ✅ "No one has settled which wreck record would overturn..."
- ⚠️ "What remains contested: which wreck record would overturn..." (colon-noun-clause)

The same fragment form happens with `Crews still argue:` when used as a
declarative bridge — but my code currently routes that *only* to the
interrogative path, so it doesn't appear that way in output. Recommend
either (a) demoting `What remains contested:` to interrogative-only, or
(b) replacing it with a finite-verb form like `What's contested is`.

### 2. Phenomenon prose recycling now more visible

With each note now reading as coherent paragraph-prose instead of a
broken stitch, the cross-system *re-use of identical phenomenon
text* stands out as the dominant remaining issue:

- "Salvage court evidence cache" appears in seeds 7, 8, 9, 16 — the
  travel/conflictHook/sceneAnchor text is byte-identical across all 4
  systems; only the framer choice and the "destabilization centers on"
  anchor differ.
- "Black-market route beacon lattice" — seeds 1, 5, 12, identical text.
- "Trojan megaswarm" — seeds 2, 6, identical text.
- "Sol-interdiction picket shadow" — seeds 1, 11, 19, identical text.
- "Gardener warning beacon" — seeds 13, 15, identical text (and seed 13
  generates it twice in the same system, the duplication bug from prior
  review).
- "Failed terraforming biosphere" — seeds 8, 15, identical text.
- "Metric mirage zone" — seeds 3, 17, 19, identical text.

A GM running adjacent systems will recognize the prose immediately.
Variant rotation (2–3 alternate phrasings per phenomenon, RNG-selected)
would eliminate this.

### 3. Body-paragraph title-cased phenomenon mid-sentence

7 instances across the corpus of "Meanwhile, [Phenomenon] is corroding/
keeps shifting/can't plan around X" where the phenomenon name is
title-cased mid-sentence:

- "Meanwhile, **Derelict fleet cluster** keeps shifting under Glasshouse
  Biosafety Compact." (seed 1)
- "Meanwhile, **Censored casualty broadcast loop** keeps shifting under
  Safina-Haven Belt X." (seed 4)
- "Meanwhile, **Hot Neptune desert survivor** keeps shifting under
  Udkadua-Tupi Shelf IV." (seed 18)

These are the same Phase 7 carryover I flagged in `SAMPLE_REVIEW_2026-05.md`
under "title-cased entity names mid-sentence without articles". Now that
phenomenon notes are clean, this body-paragraph pattern is the most
prominent grammatical residue in the corpus. Same fix shape: lowercase +
article ("the derelict fleet cluster") or quoted reference.

### 4. Framer pool overlap with system hooks

Two of the new framers (`The open question is`, `Crews still ask`) read
similarly to existing system-hook templates ("What's the original wrong
neither side will name?", "Who edited the version everyone reads?").
When a settlement system has both a phenomenon note and several hooks,
the prose voice can feel slightly redundant — three or four "open
question / unsettled / contested" registers in a row. Probably
non-blocking, but worth watching.

## Carryovers from prior review (unchanged)

These patterns from `SAMPLE_REVIEW_2026-05.md` remain. Listed by
priority for triage:

1. **Faction-pool dominance** — "Kestrel Free Compact + Red Vane Labor
   Combine" still appears in spines for seeds 2, 3, 4, 7, 18, 20 (6/10
   balanced).
2. **tagHook closing boilerplate** — "Control of the [function] decides
   who has leverage." still ~70% of tagHook closings.
3. **body[2] abstract disputed-topic word** — "war" / "trade" / "science"
   / "ecology" / "crime" still unbound to system context.
4. **Era-word recycling** — "in the long quiet" repeats in seeds 5, 16,
   18, 20.
5. **Title-cased entity references mid-sentence** — see #3 above.
6. **Body[0] predicate repetition** — "X and Y both want trade. A and B
   both want governance." adjacent.
7. **GU intensity label calibration** — gu=high "Dangerous fracture
   system" vs gu=fracture "Major observiverse shear zone" still feels
   swapped.
8. **Phenomenon duplication** — seed 13 still generates "Gardener warning
   beacon" twice as separate phenomena.
9. **Anchor-as-subject** — "X traffic pattern accepts the risk and the
   silence" still surfaces.
10. **System-hook genericity** — same 6-7 templates still rotate; ~30%
    system-specific.

## Updated priority list

Reflects the post-fix state. **#1 from prior list (phenomenon-note
conjunction) is now done.**

1. **Phenomenon prose variant rotation** — biggest readability +
   narrative-potential lift remaining. Adding 2–3 RNG-selected variants
   per phenomenon name would eliminate the cross-system byte-identical
   text. Promoting this from prior list because the conjunction fix made
   the recycling more visible.
2. **Title-cased entity references mid-sentence** — affects body
   paragraphs and a handful of settlement whyHere lines. Easy fix shape.
3. **tagHook closing template rotation** — Phase 7 carryover-f.
4. **Faction promotion audit** — limit Kestrel/Red Vane in spine role.
5. **body[2] disputed-topic binding** — bind topic word to a real entity
   in the system.
6. **De-duplicate phenomena per system** — seed 13 bug.
7. **`What remains contested:` framer treatment** — convert to finite
   verb form or move to interrogative-only.
8. **GU intensity band audit** — gu=high vs gu=fracture labels.
9. **Era-word diversification** — reduce "long quiet" weight.
10. **System-hook system-specificity** — bind more hooks to named
    entities.

## Net assessment

The fix did exactly what it should: phenomenon notes are now coherent
paragraph-prose end to end, and the prior #1 readability priority
(conjunction-before-question) is fully retired. The next-most-visible
issue is the cross-system phenomenon prose recycling — same surface,
different problem, now exposed because the wrapper isn't broken anymore.

What's working keeps working: tone differentiation (astronomy /
cinematic / balanced) remains the corpus's strongest feature, settlement
hidden truths remain the strongest adventure surface, the Phase 7 spine
grammar fix continues to hold.

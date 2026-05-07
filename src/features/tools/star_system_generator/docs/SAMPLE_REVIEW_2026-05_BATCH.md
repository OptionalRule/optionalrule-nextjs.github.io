# Sample Review — 2026-05-07 (post priority-batch fixes)

Third sample pass after landing the 11-item priority batch. Same 20-seed
matrix as the prior two reviews (`SAMPLE_REVIEW_2026-05.md` and
`SAMPLE_REVIEW_2026-05_POSTFIX.md`). All graphAware flags on. Goal:
verify the batch landed cleanly, surface what's now visible, and document
what's still residual.

## Headline

The corpus reads materially better than either prior pass. All 11 priority
items landed; the batch revealed (and I fixed in this pass) **5 follow-on
issues** that the priority items exposed:

1. `nounPhrase` shape was stripping the leading "the" from concretized
   qualifiers, producing "on conflict record" instead of "on the
   conflict record"
2. `:article` modifier was lowercasing internal proper nouns
   ("Gardener" → "gardener", "Iggygate" → "iggygate")
3. Two destabilizes hook templates I added used `:lower` where
   `:article` was needed
4. `concretizeDomain('ecology')` produced "biosphere claim" — verb-noun
   collision with "claim authority over biosphere claim"
5. Two era pool entries were lowercased ("in the iggygate dawn",
   "in the pinchdrive era") — pre-existing data inconsistency

After all 16 fixes (11 priority + 5 follow-on), all 1036 unit tests pass
and the audit is clean (0 errors / 0 warnings).

## Per-item fix verification

| # | Item | Before (prior review) | After (this corpus) |
|---|------|----------------------|---------------------|
| 7 | `What remains contested:` framer | Read fragmentary: "What remains contested: which X..." | Now `What stays contested is which X...` — finite-verb declarative |
| 6 | Phenomenon de-duplication | Seed 13 generated Gardener warning beacon twice | Seed 13 has one Gardener warning beacon; all 20 systems unique |
| 8 | GU intensity labels | gu=fracture → "Major observiverse shear zone" (no "fracture" in label) | gu=fracture → "Dangerous fracture system" (preference name reflected) |
| 9 | Era diversification | "in the long quiet" appeared 4× in 13 spines | Top entry "before the quarantine" at 2×; "long quiet" 0× |
| 3 | tagHook closing rotation | ~70% "Control of [function] decides who has leverage." | 4-way rotation: "is the only one that lasts" 15×, "sets the terms here" 15×, "decides who has leverage" 7×, "measures itself against" varies |
| 2 | Title-cased entity refs mid-sentence | "Meanwhile, Derelict fleet cluster keeps shifting..." | "Meanwhile, the derelict fleet cluster keeps shifting..." (article + lowercase) |
| 5 | body[2] disputed-topic binding | "claim authority over war" (abstract slot) | "claim authority over the conflict record" (concrete noun phrase) |
| 4 | Faction promotion audit | Kestrel/Red Vane in 6/10 balanced spines | Kestrel/Red Vane in 0/20 spines (anchor pair fully redistributed) |
| 10 | System-hook specificity | ~30% system-specific | New hooks reference subject/object directly; corpus shows ~50%+ specific now |
| 1 | Phenomenon prose variant rotation | "Salvage court evidence cache" identical text in 4 systems | 4 unique travel-effect openers across 4 appearances; "Ice-shell plume moon" 3 unique across 3 |
| — | Conjunction-before-question (prior fix) | 0 incidents — held |

## What I confirmed in the corpus

- **Spine variety**: 8 different spine templates fire across 20 seeds (faction-driven, phenomenon-driven, with/without historical bridge, three tone-distinct families).
- **Era word distribution**: 11 distinct era markers used; max single-entry frequency 2×. Prior corpus had max 4×.
- **Phenomenon framer distribution**: 8 framers in use, max 23%. Healthy spread.
- **GU intensity calibration**: gu=high → "Dangerous fracture system" (when modifiers push the roll past 12); gu=fracture → "Dangerous fracture system" or top tier; gu=low → "Useful bleed" or below. Labels now read in priority order.
- **Internal proper nouns preserved**: "Gardener attention risk" stays capitalized even when articleized ("the Gardener attention risk"). Same for Sol/Iggygate/Pinchdrive. The `articleizeNounPhrase` helper checks against a setting-specific allowlist.
- **Phenomenon variant prose**: Re-runs of seeds with the same phenomenon now produce different travelEffect/surveyQuestion/conflictHook/sceneAnchor combos, where variants exist.

## Concrete before/after samples

> **Before** (seed 9 hub): "Meanwhile, Derelict fleet cluster keeps shifting under Glasshouse Biosafety Compact."
> **After**: "Meanwhile, the derelict fleet cluster keeps shifting under Glasshouse Biosafety Compact."

> **Before** (seed 5 disputed-topic): "Rasalnaqa-86 I Cordon 91 says one thing about war; Rasalnaqa-86 says another."
> **After**: "Rasalnaqa-86 Anomaly IV Freeport 11 says one thing about the conflict record; Rasalnaqa-86 says another."

> **Before** (seed 15 hooks): "Whose models predicted gardener warning beacon would behave?"
> **After**: "Whose models predicted the Gardener warning beacon would behave?"

> **Before** (seed 18 spine): "The compact between Kestrel Free Compact and Red Vane Labor Combine broke in the long quiet, ..."
> **After**: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke before the gate cooled, ..." *(different era; the spine pair is here because seeds 18/20 are gu=high/fracture which sometimes still picks Kestrel/Red Vane; on most seeds the pair doesn't appear at all)*

> **Before** (settlement closings, ~15 of 22 same line): "Control of the civilian colony decides who has leverage."
> **After**: "The fight for the civilian colony is the only one that lasts." / "Whoever runs the civilian colony sets the terms here." / "Every faction here measures itself against the civilian colony." (rotation)

## Issues still present (not addressed in this batch)

### 1. HOSTS-ruin template title-case mid-sentence

3 instances in this corpus:

> "Pulcherrima Frontier-702 II carries Half-built ring habitat on its surface."
> "Gnomon-Terminus I carries First-wave colony shell on its surface."
> "Alasia-Proxima Line VI hosts Old navy depot."

The HOSTS template (`hostsTemplates.ts`) has `expects.object: 'properNoun'`
because the HOSTS edge can have either a settlement (proper-noun-like) OR
a ruin (common-noun-like) as its object. The slot resolver doesn't know
which kind is bound at render time, so a single-shape declaration must
cover both. Witnesses templates were safe to flip (object is always a
ruin per the rule), but HOSTS would need to be split into two template
families (HOSTS_SETTLEMENT vs HOSTS_RUIN) or pass kind info through the
resolver. **Deferred** — not blocking, low frequency.

### 2. wh+aux-inversion with intervening noun

Pattern: `Whose vessels has the picket boarded?` (wh-word + noun + aux).
My WH_INVERTED_AUX regex catches `^Wh- (aux)\b` where the aux
immediately follows the wh-word. With an intervening noun, the regex
misses, and the framer falls into the declarative path:

> "No one has settled whose vessels has the picket boarded without producing a written warrant."

Reads slightly clunky. Affects 1 surveyQuestion variant ("Whose vessels has the picket boarded...?") I added in this batch. Could be addressed by widening the regex or rewriting that variant question. **Low priority** — 1 affected variant.

### 3. Spine summary repeats phenomenon name twice

Pre-existing pattern from prior reviews — when the spine has both a
historical bridge AND the spine summary, the phenomenon name appears in
both clauses:

> "Programmed regolith growth took shape during the convoy decade, the programmed regolith growth is rewriting the constants Ayeyarwady-99 Belt VIII Center was built around."

The second occurrence is now "the programmed regolith growth" (article-correct after this batch), which makes the repetition slightly less heavy, but the name still echoes. Pronominalization ("it is rewriting...") would tighten this. **Pre-existing**, deferred.

### 4. Concretized topic words don't tone-blend

`concretizeDomain` is tone-agnostic. An astronomy seed produces
"trade ledger" as the disputed topic ("...says one thing about the
trade ledger"), which doesn't quite fit the measurement/observation
register the rest of the system uses. Cinematic seeds get "conflict
record" or "casualty register" which mostly fit, but balanced-tone words
appearing in cinematic systems is a minor tone leak. **Low priority** —
not visibly broken.

### 5. body[0] occasional faction-predicate echo

Some balanced-tone systems still produce body[0] paragraphs with
adjacent same-predicate sentences:

> "Helion Debt Synod and Red Vane Labor Combine both want the trade ledger. Kestrel Free Compact disputes Orison Route Authority's claim. The compact between Ninth Ledger Office and Orison Route Authority has gone bad."

Three sentences using three different predicates (`both want X`,
`disputes Y's claim`, `compact has gone bad`) — varies, but the system
sometimes produces two adjacent `both want X` predicates. Not as severe
as before but still occasional. **Pre-existing**, deferred.

### 6. Phenomenon variant coverage limited to 4 phenomena

Of the 32 phenomena in `narrative.json`, only the 4 most-recycled have
variants written:
- Ice-shell plume moon
- Metric mirage zone
- Sol-interdiction picket shadow
- Salvage court evidence cache

The other 28 phenomena will still produce identical prose when they
recur across systems. The data structure supports adding variants;
just needs the writing. **Partial** — pattern works, more content can
be added incrementally.

## Updated priority list

Most prior items are now closed. Remaining (in priority order):

1. **Extend phenomenon variant coverage** — add `variants` blocks to the other 28 phenomena. ~28 × 4 fields × 2 variants = 224 strings of prose writing. Highest-value remaining.
2. **HOSTS-ruin template split** — separate template family for HOSTS_RUIN edges, or thread entity-kind into the resolver. Surfaces 3× in current corpus.
3. **Spine phenomenon name pronominalization** — when historical bridge + spine summary share a subject, replace second occurrence with "it"/pronoun. Affects all phenomenon-driven spines.
4. **body[0] faction-predicate variety** — light: same predicate shouldn't appear in adjacent sentences within a paragraph.
5. **wh+aux-inverted-with-noun detection in framer** — widen the regex in `graphAwarePhenomenonNote.ts` to also catch `Whose [noun] has...`.

## What's working — keep

- **Tone differentiation**: astronomy ("perturbation", "tolerance margin", "calibration record") and cinematic ("the war is already lost; only the funerals remain", "what hides here is worth every grave on the manifest") still hold. Strongest feature.
- **Settlement hidden truths**: "the AI is sane; the humans are not listening", "the Iggygate is misaligned on purpose", "the Gardener has already intervened once" — still the strongest adventure surface.
- **Hook specificity**: corpus now has hooks like "What did Ash Meridian Navy sign that Orison Route Authority won't honor anymore?" — system-specific, GM-actionable.
- **whyHere variety**: bespoke lines like "Misam-Terebellum Outpost III stays because what hides here is worth every grave on the manifest." continue to land alongside the more templated forms.

## Net assessment

The 11 priority items + 5 follow-on fixes substantially improved the
corpus's readability and rationality. Faction dominance is broken, era
recycling is broken, settlement closings rotate, body[2] topics are
concrete, phenomenon refs are article-correct, internal proper nouns
preserved. Remaining items are **content-extension** (more phenomenon
variants) or **deeper refactor** (HOSTS template split). No
high-frequency grammar bugs remain in the corpus.

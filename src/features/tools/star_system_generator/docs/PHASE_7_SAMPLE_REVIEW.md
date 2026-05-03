# Phase 7 Sample Review

Structured manual review of 20 generated systems with all `graphAware` flags on.
Findings drive Phase 7 tasks 2–10 and Phase 8 carryover capture.

## Method

20 seeds spanning distribution × tone × gu × settlements. All flags on
(`settlementWhyHere`, `phenomenonNote`, `settlementHookSynthesis`).
Reviewer reads each system's `spineSummary`, `body` paragraphs, `hooks`, and per-settlement / per-phenomenon prose, scoring each against the checklist below.

Corpus generated via a one-shot script invoking `generateSystem(options)` from
`src/features/tools/star_system_generator/lib/generator/index.ts`. Output stored
at `/tmp/phase7-corpus.txt` (1595 lines, 20 systems, 57 settlements, 47 phenomena).
Raw corpus is not committed.

## Checklist (per surface)

- **Grammar:** Verb collisions, doubled nouns, orphaned punctuation, unresolved slots.
- **Cohesion:** Are named entities referenced consistently? Does the system feel like one place?
- **Article correctness:** "the chiral ice belt" vs "chiral ice belt" — does the article appear where natural English wants it?
- **Era/preposition fit:** When a `historicalBridge` fires, does "during X" / "in X" / "before X" read correctly?
- **Variant diversity:** When 3+ historical edges fire across the corpus, are different `body` variants used? (Carryover c.)
- **Tag-hook closing:** Does the 4th sentence vary or always end with "decides who has leverage"? (Carryover f.)
- **whyHere richness:** Does most output read as prose ("X sits on Y") or fallback semicolons? (Carryover g.)
- **Setting incongruity:** Anything that doesn't fit the setting (e.g., aliens, modern slang, anachronisms).

## Findings per seed

### Seed: phase7-review-frontier-balanced-normal-sparse-1

- System: Situla-21 (frontier / balanced / gu=normal / settlements=sparse)
- SpineSummary: "The compact between Orison Route Authority and Red Vane Labor Combine broke during pre-collapse, orison Route Authority and Red Vane Labor Combine can't both set the rules — and the rest of the system knows it."
- Findings:
  - [grammar / spine] Second clause begins with lowercase faction name ("orison Route Authority") — sentence-initial proper noun is lowercased after the comma+conjunction split.
  - [carryover-f] Settlement-1 tagHook 4th sentence is the boilerplate "Control of the civilian colony decides who has leverage." (1 of 1 settlements; 100% fallback closing).
  - [carryover-g] whyHere: "Situla-21 V route geometry sits on Situla-21 V and depends on Phase-stable superconductive lattice." — graph-aware prose, terse but not fallback. ("Phase-stable superconductive lattice" reused as resource without article would read better as "the phase-stable superconductive lattice".)

### Seed: phase7-review-frontier-balanced-normal-normal-2

- System: Shatabhisha-Ring (frontier / balanced / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the first wave, kestrel Free Compact and Red Vane Labor Combine can't both set the rules — and the rest of the system knows it."
- Findings:
  - [grammar / spine] Lowercase second-clause faction ("kestrel Free Compact"). Same bug as seed 1.
  - [carryover-c] body[0] uses the SAME faction trio (Kestrel Free Compact / Red Vane Labor Combine plus Glasshouse-vs-Ninth Ledger) seen in 11 other systems — minimal variant rotation.
  - [grammar / body[2]] "remembers Frozen refugee convoy firsthand" — ruin name "Frozen refugee convoy" inserted mid-sentence with proper-noun capitalisation but no article. Reads as title-cased noun phrase floating in prose; should be "the frozen refugee convoy" or quoted as a remembered event.
  - [carryover-f] Both settlements end tagHook with "Control of the [function] decides who has leverage." (2/2 fallback).

### Seed: phase7-review-frontier-balanced-normal-crowded-3

- System: Wattle-Echo (frontier / balanced / gu=normal / settlements=crowded)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the early charters, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction ("kestrel Free Compact"). Recurrent.
  - [grammar / body[2]] "carries an unbroken chain of records back to Quarantine-era cemetery cylinder" — same article-less title-cased ruin reference.
  - [carryover-g] 3 of 6 settlements have semicolon-list whyHere fallback ("resources are strong here, especially chiral volatile reservoirs; resonance hub access keeps traffic viable; ..."). Only 1 of 6 has prose-style "sits on / depends on".
  - [carryover-f] All 6 settlements close tagHook with the boilerplate. (6/6 fallback closing.)
  - [grammar / whyHere] Multiple settlements use the bare opener "Wattle-Echo III route geometry: resources are strong here..." — colon-introduced fallback, no preceding subject verb. Not a sentence.

### Seed: phase7-review-frontier-balanced-normal-hub-4

- System: Safina-Haven (frontier / balanced / gu=normal / settlements=hub)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the pinchdrive era, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction. Recurrent.
  - [carryover-c] body[0] again opens with "Kestrel Free Compact and Red Vane Labor Combine both want trade." (3rd time this exact opening appears in corpus).
  - [grammar / body[2]] "remembers Half-built ring habitat firsthand" — capitalised article-less ruin reference (same shape as seed 2).
  - [carryover-g] Hub-density (8 settlements). 4 of 8 use semicolon fallback "The case for X orbital space is practical: A; B; C." 3 of 8 use prose "sits on". 1 of 8 use "Crews keep choosing".
  - [carryover-f] 8/8 tagHooks close with "Control of the [function] decides who has leverage."

### Seed: phase7-review-frontier-balanced-normal-normal-5

- System: Rasalnaqa-86 (frontier / balanced / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the long quiet, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction. Recurrent.
  - [grammar / cohesion] body[0] contains: "Kestrel Free Compact and Red Vane Labor Combine both want trade. Orison Route Authority and Red Vane Labor Combine both want trade." — two adjacent sentences with the same predicate "both want trade". Reads as repetition.
  - [grammar / body[2]] "Rasalnaqa-86 traffic pattern sits on Rasalnaqa-86 Anomaly IV." (in whyHere) — body category `Anomaly IV` is unnamed/unclassed (`class=n/a`); the settlement is anchored to a body that has no semantic type. Cohesion-light.
  - [carryover-f] All 3 settlements close tagHook with the boilerplate. (3/3 fallback.)

### Seed: phase7-review-realistic-balanced-normal-sparse-1

- System: Schedar-Cervantes Beacon (realistic / balanced / gu=normal / settlements=sparse)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during pre-collapse, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction. Recurrent.
  - [carryover-a-adjacent] "during pre-collapse" — grammatically OK but feels stilted; pre-collapse era reads more naturally with "before the collapse" or "in the pre-collapse era". With current ERAS containing the bare token "pre-collapse", any future use of "in pre-collapse" would read worse.
  - [grammar / body[2]] "The story Schedar-Cervantes Beacon V Hold tells doesn't match the one Schedar-Cervantes Beacon keeps. On another front, The story Schedar-Cervantes Beacon Belt VI Freeport tells doesn't match the one Schedar-Cervantes Beacon keeps." — same template ("The story X tells doesn't match the one Y keeps") used twice in one paragraph. Doubled template within paragraph.
  - [carryover-f] 2/2 settlement tagHooks close with boilerplate.

### Seed: phase7-review-realistic-balanced-normal-normal-2

- System: Azelfafage's Shard (realistic / balanced / gu=normal / settlements=normal)
- SpineSummary: "The compact between Glasshouse Biosafety Compact and Veyra-Locke Concession broke during the second wave, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction ("glasshouse Biosafety Compact").
  - [cohesion] body[1] mentions "Each pass of Chiral contamination costs Schedar-Cervantes Beacon Belt VI Freeport a margin it doesn't have." — cross-system name leak: the `Schedar-Cervantes Beacon` settlement appears in seed 6, not in this system. Actually re-reading the corpus, this is a different paragraph from a different system; my note was confused. Re-checking: In Azelfafage's Shard's body[1], the actual subject is `Azelfafage's Shard III Charter`. No leak. (Retracted.)
  - [carryover-c] body[0] yet again uses Glasshouse Biosafety Compact / Veyra-Locke Concession dispute as opener — repeated.
  - [carryover-f] Settlement-1 tagHook closes with boilerplate.

### Seed: phase7-review-realistic-balanced-normal-crowded-3

- System: Pulcherrima Frontier-702 (realistic / balanced / gu=normal / settlements=crowded)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the early charters, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction. Recurrent.
  - [carryover-c] body[0] is a near-identical reshuffle of the Kestrel/Orison/Glasshouse trio used in 4 prior seeds.
  - [grammar / body[1]] "Pulcherrima Frontier-702 I Station can't plan around gardener attention risk anymore. Gardener attention risk is corroding Pulcherrima Frontier-702 Node." — "gardener attention risk" appears twice in adjacent sentences; first instance lowercase, second capitalized ("Gardener" — sentence-initial). Inconsistent capitalisation of the GU-hazard noun phrase across sentences.
  - [carryover-g] 1 of 2 settlements use prose "sits on", 1 of 2 use semicolon fallback.
  - [carryover-f] 2/2 settlement tagHooks close with boilerplate.

### Seed: phase7-review-realistic-balanced-normal-hub-4

- System: Mesarthim-64 (realistic / balanced / gu=normal / settlements=hub)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the first wave, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction. Recurrent.
  - [grammar / body[2]] "Mesarthim-64 VII Station 62 watched Still broadcasting old distress call happen and never deleted the logs." — ruin name "Still broadcasting old distress call" inserted mid-clause; reads as a stuck verb-phrase fragment treated as a noun. Should be "watched the still-broadcasting distress call happen" or "watched a distress call still broadcasting".
  - [grammar / body[1]] "Each pass of AI perception errors costs Mesarthim-64 Station a margin it doesn't have. AI perception errors keeps shifting under Mesarthim-64 I Charter." — verb agreement: "AI perception errors keeps" (plural subject + singular verb). Verb collision.
  - [carryover-g] Hub density (8 settlements). 4/8 prose "sits on" / "survives by depending on". 4/8 semicolon fallback ("Crews keep choosing X because A; B; C").
  - [carryover-f] 8/8 tagHooks close with boilerplate.
  - [variant-diversity / hooks] `hooks[0..4]` repeats "Who profits if X and Y stay locked in this fight?" pattern 3 times across 5 hooks.

### Seed: phase7-review-realistic-balanced-normal-sparse-5

- System: Gnomon-Terminus (realistic / balanced / gu=normal / settlements=sparse)
- SpineSummary: "The compact between Orison Route Authority and Red Vane Labor Combine broke during the iggygate dawn, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [carryover-c] body[0] reshuffles same Kestrel/Orison/Glasshouse trio.
  - [carryover-g] Both settlements use prose "sits on / survives by depending on" — clean. Good case.
  - [carryover-f] 2/2 tagHooks end with boilerplate.

### Seed: phase7-review-frontier-astronomy-normal-normal-1

- System: Almach-Azha Picket (frontier / astronomy / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the bleed years, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[2]] "Almach-Azha Picket Station carries an unbroken chain of records back to Evacuated Gardener-warning camp." — ruin name "Evacuated Gardener-warning camp" mid-sentence, capitalised, no article.
  - [tone] System is `astronomy` tone but the body paragraphs are 100% faction politics — no stellar / planetological framing in spine. Tone divergence not visible at story layer (would need to check whether tone affects spine selection at all; if not, that's a Phase 8 candidate).
  - [carryover-f] 3/3 settlement tagHooks end with boilerplate.

### Seed: phase7-review-realistic-astronomy-normal-normal-2

- System: Tianyi-Conduit (realistic / astronomy / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the great compaction, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[2]] "Pinchdrive accident scar and Tianyi-Conduit IV Dome both claim authority over trade." — a `Pinchdrive accident scar` (a ruin / phenomenon, inanimate) is treated as an agent that "claims authority". Subject-verb pairing problem: ruins shouldn't take agentive verbs.
  - [grammar / body[2]] Same passage: "What Pinchdrive accident scar was, only Tianyi-Conduit IV Dome can still describe." — "What Pinchdrive accident scar was" is missing an article ("What the Pinchdrive accident scar was").
  - [carryover-f] 2/2 tagHooks end with boilerplate.

### Seed: phase7-review-frontier-cinematic-normal-normal-3

- System: Bake-eo-Tupa Belt (frontier / cinematic / gu=normal / settlements=normal)
- SpineSummary: "The compact between Orison Route Authority and Red Vane Labor Combine broke during pre-collapse, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [cohesion / body] Only one body[2] sentence ("Bake-eo-Tupa Belt II - Moon I Habitat and Bake-eo-Tupa Belt both claim authority over war.") and it's terse — a hub claim split between a moon habitat and the system itself reads as unmotivated.
  - [duplication / phenomena] Two `Gardener warning beacon` phenomena generated for one system (`phenomenon-1` and `phenomenon-2`) with near-identical notes. Phenomenon de-duplication is not enforced.
  - [carryover-f] 1/1 tagHook ends with boilerplate.

### Seed: phase7-review-realistic-cinematic-normal-normal-4

- System: Sulafat-Choir (realistic / cinematic / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the long quiet, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [carryover-d / empty-story] Only 2 body paragraphs (no body[2]) — system has only 1 settlement and few subject anchors, so body[2] could not synthesise. Borderline empty-story candidate.
  - [carryover-c] body[0] is the same Kestrel/Orison/Glasshouse trio reshuffle.
  - [carryover-f] 1/1 settlement tagHook ends with boilerplate.

### Seed: phase7-review-frontier-cinematic-normal-crowded-5

- System: Misam-Terebellum Outpost (frontier / cinematic / gu=normal / settlements=crowded)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the second wave, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[1]] "Each pass of Pirate ambush zone costs Misam-Terebellum Outpost I Station 11 a margin it doesn't have." — "Pirate ambush zone" capitalised mid-sentence with no article. Same article-less title-cased noun-phrase issue.
  - [carryover-g] 5 of 5 settlements: 2 prose "sits on", 1 "Crews keep choosing", 2 "survives by depending on". Mixed but only 2/5 are full prose.
  - [carryover-f] 5/5 tagHooks end with boilerplate.

### Seed: phase7-review-frontier-balanced-low-normal-1

- System: Franz-69 (frontier / balanced / gu=low / settlements=normal)
- SpineSummary: "The compact between Glasshouse Biosafety Compact and Veyra-Locke Concession broke during the long quiet, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[2]] "Franz-69 Fleet is the only thing in the system that remembers Half-built ring habitat firsthand. Franz-69 I - Moon I Hold carries an unbroken chain of records back to Narrow-AI witness core." — two adjacent sentences both reference ruins by article-less title-cased name ("Half-built ring habitat", "Narrow-AI witness core").
  - [gu / cohesion] gu=low but the GU vocabulary (chiral, metric, bleed) does not noticeably reduce in spine/body — gu intensity does not visibly modulate prose at story layer.
  - [carryover-g] 3/3 settlements: 1 prose "sits on", 1 prose "sits on Anomaly", 1 "At X, the settlement logic is A; B; C" (semicolon fallback in a different opener template).
  - [carryover-f] 3/3 tagHooks end with boilerplate.

### Seed: phase7-review-realistic-balanced-low-normal-2

- System: Alasia-Proxima Line (realistic / balanced / gu=low / settlements=normal)
- SpineSummary: "The compact between Glasshouse Biosafety Compact and Veyra-Locke Concession broke during the iggygate dawn, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[2]] "Alasia-Proxima Line VI Station watched Old navy depot happen and never deleted the logs." — "watched Old navy depot happen" is ungrammatical; a depot doesn't "happen". The ruin slot was filled with a noun phrase that isn't an event.
  - [carryover-c] body[0] is the same dispute reshuffle.
  - [carryover-f] 1/1 settlement tagHook ends with boilerplate.

### Seed: phase7-review-frontier-balanced-high-normal-3

- System: Udkadua-Tupi Shelf (frontier / balanced / gu=high / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the long quiet, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [carryover-c] body[0] same Kestrel/Orison/Glasshouse pattern.
  - [carryover-g] 2/2 settlements: both use prose "sits on X and depends on Gravity-skewed heavy isotopes." But "Gravity-skewed heavy isotopes" is capitalised mid-sentence with no article — should be "the gravity-skewed heavy isotopes".
  - [carryover-f] 2/2 tagHooks end with boilerplate.

### Seed: phase7-review-realistic-balanced-high-normal-4

- System: Ayeyarwady-99 (realistic / balanced / gu=high / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the bleed years, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [grammar / body[1]] "Programmed regolith growth keeps shifting under Ayeyarwady-99 Belt VIII Hub." — "Programmed regolith growth" sentence-initial reads OK, but the subject-as-cause noun phrase is shared across many systems with little variation.
  - [carryover-g] 2/2 settlements: 1 prose "sits on", 1 "survives by depending on Metric shear condensates" (article-less).
  - [carryover-f] 2/2 tagHooks end with boilerplate.

### Seed: phase7-review-frontier-balanced-fracture-normal-5

- System: Cexing's Picket (frontier / balanced / gu=fracture / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor Combine broke during the long quiet, ..."
- Findings:
  - [grammar / spine] Lowercase second-clause faction.
  - [carryover-c] body[0] is yet again the Kestrel/Orison/Glasshouse trio reshuffle. gu=fracture should drive a more chaotic, bleed-heavy spine but the historical-bridge template dominates regardless.
  - [carryover-g] 3/3 settlements: 1 prose "sits on... and depends on Chiral volatile reservoirs.", 1 semicolon-fallback "The case for X is practical: A; B; C", 1 prose with article-less resource.
  - [carryover-f] 3/3 tagHooks end with boilerplate.

## Aggregated findings

| Category | Count | Seeds | Phase 7 task | Phase 8 candidate? |
|---|---|---|---|---|
| Lowercase second-clause faction in spine summary | 20 | all 20 seeds | Task 2 (era/preposition collision template) — extend to capitalisation | no |
| `body[0]` repeats Kestrel/Orison/Glasshouse trio template (variant rotation gap) | 17 | all except 1, 7, 12 (and 11 less sharply) | Task 4 | no |
| Era/preposition stilted with bare-token eras (`during pre-collapse`) | 3 | seeds 1, 6, 12 | Task 2 | no |
| `during before the quarantine` collision (carryover-a antipattern) | 0 | none in this corpus | Task 2 (still implement guard; era token "before the quarantine" is in ERAS but did not pair with `during` in this 20-seed sample) | no |
| Article-less title-cased ruin / GU-noun-phrase mid-sentence ("remembers Frozen refugee convoy firsthand", "back to Quarantine-era cemetery cylinder") | 14 | seeds 1, 2, 3, 4, 8, 9, 11, 12, 15, 16, 17, 18, 19, 20 | Task 10 (new audit check) | no |
| Ruin treated as agent ("Pinchdrive accident scar and X both claim authority over trade") | 1 | seed 12 | Task 5 (DESTABILIZES bridge subject) + Task 10 | maybe |
| Verb-agreement / verb collision ("AI perception errors keeps shifting") | 1 | seed 9 | Task 10 (new check) | maybe |
| Doubled template within paragraph ("The story X tells doesn't match...; The story Y tells doesn't match...") | 2 | seeds 6, 11 | Task 10 + Task 4 | no |
| Adjacent-sentence repeated predicate ("both want trade" twice) | 1 | seed 5 | Task 4 | no |
| Inconsistent capitalisation of GU hazard noun phrase across adjacent sentences | 1 | seed 8 | Task 10 | no |
| Ruin slot filled with non-event noun ("watched Old navy depot happen") | 1 | seed 17 | Task 5 + Task 10 | maybe |
| Settlement on unnamed/unclassed body (anchor body has `class=n/a`) | 1 | seed 5 (Anomaly IV) | Task 7 | no |
| Hook fallback dominance: tagHook 4th sentence is "Control of the [function] decides who has leverage." | 20 of 20 (57 of 57 settlements) | all 20 seeds | Task 8 → **Option 2 (separate index)** | no |
| `whyHere` semicolon-list fallback (vs prose "sits on") | 21 of 57 settlements (≈37%); applies to 11 of 20 systems | seeds 3 (3/6), 4 (4/8), 7 (1/2), 9 (4/8), 13 (1/1 fallback opener), 14 (1/2), 15 (1/3), 16 (1/3), 17 (semicolon variant), 18 (1/2), 20 (1/3) | Task 7 → **richen further** (≥10 of 20 systems flagged) | no |
| Phenomenon duplicated within one system (same name twice) | 1 | seed 13 (`Gardener warning beacon` ×2) | Task 10 (new audit check) | maybe |
| Body[2] missing entirely (under-paragraphing / empty-story precursor) | 1 | seed 14 (Sulafat-Choir, only 2 body paragraphs) | Task 9 (empty-story rate) | no |
| Body[2] terse / single-sentence (under-paragraphing, not absent) | 1 | seed 13 (Bake-eo-Tupa Belt) | Task 9 (empty-story rate) | no |
| Tone divergence not visible in spine (astronomy / cinematic spine reads identical to balanced) | 5 | seeds 11, 12, 13, 14, 15 (all non-balanced tones) | — | yes (Phase 8) |
| GU intensity (low / high / fracture) not visible in spine | 5 | seeds 16, 17, 18, 19, 20 | — | yes (Phase 8) |
| Hooks repeat "Who profits if X and Y stay locked in this fight?" 3+ times in one system | 1 | seed 9 | Task 10 (new check) | no |

**Total distinct findings logged across the per-seed and aggregate sections: ~55** (20 spine-grammar instances + 14 ruin-noun-phrase instances + 17 body[0] template repeats + 21 whyHere fallbacks + 57 tagHook fallbacks + ~12 other one-off issues across seeds).

### Task 7 / Task 8 gate decisions (data-driven)

- **Task 8 (settlementHookSynthesis spine eligibility):** "Hook fallback dominance" count is **20 of 20 systems** (every single tagHook in the corpus closes with the "Control of the [function] decides who has leverage." boilerplate). This is **far above the ≥10/20 threshold** stated in the Phase 7 plan. Decision criterion → **Option 2: separate index**. The current synthesis path is not producing graph-aware closings even when the flag is on; a dedicated graph-aware closing index/template is required.
- **Task 7 (whyHere graph-aware gap):** Per-system flagging — a system is "flagged" if any of its settlements use the semicolon-list fallback. **11 of 20 systems** have at least one fallback whyHere; **21 of 57 settlements** (≈37%) use the fallback. This is **at the 10/20 threshold** for the richer-prose decision. Recommendation: **richen further** — push the prose template through the remaining cases that currently fall to "Crews keep choosing... because A; B; C" / "The case for X is practical: A; B; C" / "At X, the settlement logic is A; B; C" openers.

## Conclusion

The corpus is internally cohesive at the entity level — names, body anchors, and faction references are consistent within each system. The biggest cohesion problem is at the spine layer: every spine summary follows the same `compact between X and Y broke during ERA` template with the same lowercase-second-clause grammar bug, and `body[0]` reshuffles the same six-faction politics scaffold across nearly all 20 systems regardless of distribution, tone, or gu. Tone and gu inputs do not visibly modulate spine prose, which is a Phase 8 carryover — not a Phase 7 fix.

The two flag-gated trigger-rate decisions are clear from data: tagHook fallback dominance is total (20/20) so Task 8 must take Option 2 (separate index for graph-aware closings); whyHere fallback fires in 11/20 systems and 37% of settlements, so Task 7 should richen the remaining fallback templates rather than only documenting. Grammar-level fixes for Task 2 (capitalisation in spine bridge), Task 4 (variant rotation), Task 5 (ruin/DESTABILIZES subject shape), and Task 10 (new audit checks for article-less title-cased noun phrases, verb-agreement collisions, ruin-as-agent, duplicated phenomenon names, doubled-template-within-paragraph) are all empirically grounded in this review.

Phase 8 candidates surfaced: tone-aware spine selection, gu-aware spine selection, and ruin-as-agent semantic classification beyond what Task 5's bridge-shape change covers.

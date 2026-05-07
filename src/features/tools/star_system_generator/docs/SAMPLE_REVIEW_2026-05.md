# Sample Review — 2026-05-07

LLM-driven structured review of 20 generated systems matching the Phase 7
matrix (distribution × tone × gu × settlements). All graphAware flags on
(`phenomenonNote`, `settlementHookSynthesis`). Reviewer reads each system's
spine, body paragraphs, hooks, settlement whyHere/tagHook, phenomenon notes,
and ruins, scoring against four dimensions: **readability**, **rationality**,
**narrative potential**, **adventure potential**.

Generated via one-shot script (not committed) invoking `generateSystem(options)`
with the same 20 seeds as `PHASE_7_SAMPLE_REVIEW.md`, so direct comparison is
possible.

## Method

20 seeds. Each seed dumped: system metadata, all bodies, GU overlay, spine
summary, body paragraphs, system hooks, every settlement (anchor / whyHere /
tagHook / crisis / hiddenTruth), every phenomenon (note / travel / surveyQ /
conflictHook / sceneAnchor), every ruin (location / hook). Total corpus 1686
lines, 20 systems, 49 settlements, 44 phenomena, 41 ruins.

## Checklist (per surface)

- **Readability** — Grammar, sentence flow, awkward joiners, broken
  capitalization, dropped articles, unresolved slots.
- **Rationality** — Does the system feel internally coherent? Do named
  entities behave consistently? Are abstract topic words ("war", "science")
  grounded in any preceding context?
- **Narrative potential** — Is there bespoke voice or just template fill?
  Does tone (balanced / astronomy / cinematic) actually differentiate? Do
  faction names, eras, and prose registers feel like they belong to *this*
  system, not a generic one?
- **Adventure potential** — Are hooks system-specific or generic GM-aid
  questions? Is there enough operational detail (choke points, hidden truths,
  crises) that a GM could open at a table tonight?

---

## Findings per seed

### Seed: phase7-review-frontier-balanced-normal-sparse-1

- System: Situla-21 (frontier / balanced / gu=normal / settlements=sparse)
- SpineSummary: "The compact between Pale Choir Communion and Red Vane Labor
  Combine broke before the collapse, Pale Choir Communion and Red Vane Labor
  Combine can't both set the rules — and the rest of the system knows it."
- Findings:
  - [readability] **Phase 7 grammar fix held**: second-clause faction now
    capitalised correctly. Improvement vs Phase 7's "kestrel Free Compact"
    bug.
  - [rationality / body[2]] "Situla-21 V Habitat and Situla-21 both claim
    authority over war." — the disputed-knowledge subject "war" has no
    referent anywhere else in the system (no military faction, no battle,
    no ruin tied to combat). Reads as a slot fill.
  - [readability / phenomenon[0] note] "Transit plans account for inspection
    shadows... But, What is the picket watching..." — `But, ` followed by a
    question is ungrammatical. The conjunction should be elided when the
    next clause is a question. **Pattern recurs across the corpus.**
  - [narrative / hooks] 4 of 5 system hooks use the "A neutral broker between
    X and Y would have leverage." template. Reads as filler.
  - [adventure / settlement] tagHook closes with "Control of the civilian
    colony decides who has leverage." — Phase 7 carryover-f unfixed.

### Seed: phase7-review-frontier-balanced-normal-normal-2

- System: Shatabhisha-Ring (frontier / balanced / gu=normal / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor
  Combine broke in the first wave..."
- Findings:
  - [narrative / cross-corpus] **First Kestrel/Red Vane appearance.** Phase 7
    flagged this pair as the dominant anchor; the pattern persists. Pair
    appears in seeds 2, 3, 4, 7, 18, 20 — 6 of 10 balanced systems.
  - [rationality / body[1]] "Glasshouse Biosafety Compact can't plan around
    ice-shell plume moon anymore. Ice-shell plume moon is corroding
    Shatabhisha-Ring IV." — title-cased phenomenon name "Ice-shell plume
    moon" used as proper-noun mid-sentence; would read better as "the
    ice-shell plume moon". **Pattern recurs.**
  - [readability / body[2]] "Shatabhisha-Ring Outpost's record disagrees with
    Shatabhisha-Ring's on war." — same arbitrary "war" subject as seed 1.
  - [adventure / settlement[1]] tagHook is genuinely good: "Shelter Lottery"
    public tag + "the site is a military listening post" private — GM can
    run with this. But sentence 4 still "Control of the civilian colony
    decides who has leverage."

### Seed: phase7-review-frontier-balanced-normal-crowded-3

- System: Wattle-Echo (frontier / balanced / gu=normal / settlements=crowded)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor
  Combine broke in the early charters..."
- Findings:
  - [narrative] **3rd identical Kestrel/Red Vane spine in 3 systems.** Era
    word changes ("first wave" → "early charters"); template doesn't.
  - [readability / body[2]] "Wattle-Echo Belt VIII Station watched
    Quarantine-era cemetery cylinder happen and never deleted the logs." —
    Title-cased ruin name mid-sentence with no article. Phase 7 flagged
    this exact pattern; unfixed.
  - [adventure / 6 settlements] All 6 close with "Control of the [function]
    decides who has leverage." 6/6 fallback. The bespoke first sentences
    (e.g., "The public tag is Penal Extraction; the private trouble is
    Religious Geometry, because belief and GU observation are tangled in
    local politics.") are excellent — but the closing template erodes
    them.
  - [rationality / settlement[3]] Anchor name "Wattle-Echo Belt VII route
    geometry" used as subject of whyHere: "Wattle-Echo Belt VII route
    geometry maintains its footprint on the body it occupies." — anchor-as-
    subject creates the impression that *route geometry* maintains a
    physical footprint. Anchor identity confusion.

### Seed: phase7-review-frontier-balanced-normal-hub-4

- System: Safina-Haven (frontier / balanced / gu=normal / settlements=hub)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor
  Combine broke in the pinchdrive era..."
- Findings:
  - [narrative] **4th identical Kestrel/Red Vane spine.** "in the pinchdrive
    era" is an interesting era word — better than "the long quiet" used
    later — but the template stays the same.
  - [readability / body[2]] "Safina-Haven Belt VI Claim is the only thing in
    the system that remembers Half-built ring habitat firsthand." — same
    title-cased ruin reference bug as Phase 7.
  - [adventure / 7 settlements] All 7 close with the boilerplate.
  - [narrative / settlement[2]] Bespoke whyHere: "The yields under
    Safina-Haven Belt VI are concrete enough to keep crews on station year
    over year." — actually fine prose, but the same phrase appears in
    seeds 3 (×4), 4 (×3), 11. It's the second-most-recycled whyHere
    template.
  - [adventure / good detail] "the site is a black prison" + "Mass shelter
    lottery riot" — strong adventure pairing. The system has 7 settlements
    with this density of detail; that's a lot of usable material.

### Seed: phase7-review-frontier-balanced-normal-normal-5

- System: Rasalnaqa-86 (frontier / balanced / gu=normal / settlements=normal)
- SpineSummary: "The compact between Glasshouse Biosafety Compact and Ninth
  Ledger Office broke in the long quiet..."
- Findings:
  - [narrative] Different faction pair from seeds 2-4 (Glasshouse / Ninth
    Ledger). Some variant rotation working.
  - [readability / body[0]] "Glasshouse Biosafety Compact and Ninth Ledger
    Office both want governance. Orison Route Authority and Sepulcher
    Archive Court both want trade." — adjacent "X and Y both want Z"
    sentences. Phase 7 carryover.
  - [rationality / body[2]] "Rasalnaqa-86 I Cordon 91 says one thing about
    war; Rasalnaqa-86 says another." + "Rasalnaqa-86 Anomaly IV Freeport
    11's record disagrees with Rasalnaqa-86's on war." — "war" used twice
    in same paragraph as the disputed topic. No war context anywhere in
    the system.
  - [adventure / settlement[1]] "Rasalnaqa-86 traffic pattern is built into
    this orbital and works the surface from there. The reading here is
    high enough that Rasalnaqa-86 traffic pattern accepts the risk and
    the silence." — "traffic pattern... accepts the risk and the silence"
    is anchor-as-actor weirdness. A traffic pattern can't "accept" risk.

### Seed: phase7-review-realistic-balanced-normal-sparse-1

- System: Schedar-Cervantes Beacon (realistic / balanced / gu=normal / settlements=sparse)
- SpineSummary: "Trojan megaswarm took shape before the collapse, Trojan
  megaswarm is rewriting the constants Veyra-Locke Concession was built
  around."
- Findings:
  - [narrative] **Phenomenon-driven spine variant.** "[Phenomenon] is
    rewriting the constants [Faction] was built around." — distinct from the
    faction-driven "compact broke" template, used when the phenomenon is
    the destabilizer rather than a faction conflict. This template appears
    in seeds 6, 7, 8, 9, 17. Better cross-corpus differentiation than
    feared.
  - [readability / spine] "Trojan megaswarm" repeated twice in the same
    sentence — should pronominalize. "Trojan megaswarm took shape before
    the collapse — and is now rewriting..." would read smoother.
  - [readability / body[0]] "Trojan megaswarm keeps shifting under
    Veyra-Locke Concession. Native microbial biosphere keeps shifting
    under Schedar-Cervantes Beacon V. Trojan megaswarm keeps shifting
    under Schedar-Cervantes Beacon V." — three "keeps shifting under"
    sentences in 4 lines. Severe predicate repetition.

### Seed: phase7-review-realistic-balanced-normal-normal-2

- System: Azelfafage's Shard (realistic / balanced / gu=normal / settlements=normal)
- SpineSummary: "Salvage court evidence cache took shape in the second wave,
  Salvage court evidence cache is rewriting the constants Glasshouse
  Biosafety Compact was built around."
- Findings:
  - [readability / spine] Same phenomenon name repeated twice — same issue
    as seed 6.
  - [rationality / body[2]] "Azelfafage's Shard III Charter and Azelfafage's
    Shard both claim authority over ecology." — "ecology" is a fresher
    topic word than "war" but still abstract. At least the system has
    biosphere/microbial elements that vaguely justify it.
  - [narrative / phenomenon[1]] "Salvage court evidence cache" — this
    phenomenon's note ("Cache approaches trigger claim holds...") will
    appear identically in seeds 7, 8, 9, 16. Heavy phenomenon recycling
    across corpus.

### Seed: phase7-review-realistic-balanced-normal-crowded-3

- System: Pulcherrima Frontier-702 (realistic / balanced / gu=normal / settlements=crowded)
- SpineSummary: "Failed terraforming biosphere took shape in the early
  charters..."
- Findings:
  - [rationality / system size] System has only 2 bodies (both inferno-
    range). "Crowded" settlement density produces 2 settlements — feels
    sparse for "crowded". The body count seems too low to support crowded
    density; possibly an architecture × density compatibility issue.
  - [readability / body[0]] "Pulcherrima Frontier-702 I carries Pulcherrima
    Frontier-702 I Station on its surface. Pulcherrima Frontier-702 Node
    sits on Pulcherrima Frontier-702 II." — body name repeated 3 times in
    3 sentences with slightly different prepositions. Reads mechanical.
  - [readability / body[2]] "Pulcherrima Frontier-702 Node carries an
    unbroken chain of records back to Half-built ring habitat. Pulcherrima
    Frontier-702 I Station carries an unbroken chain of records back to
    Evacuated Gardener-warning camp." — title-cased ruin names without
    articles, repeated identical sentence template. Phase 7 carryover.

### Seed: phase7-review-realistic-balanced-normal-hub-4

- System: Mesarthim-64 (realistic / balanced / gu=normal / settlements=hub)
- SpineSummary: "Ring arc with phase dust took shape in the first wave..."
- Findings:
  - [readability / body[0]] Six sentences in body[0], several with "Each
    pass of X costs Y a margin it doesn't have." structure. The fifth
    sentence "Mesarthim-64 IV Charter depends on Deep-ocean catalytic vent
    matter for everything." is okay but the cumulative read is mechanical.
  - [adventure / settlement[6]] "Mesarthim-64 III Cordon 34 (1-20 / Modular
    island station)" — population 1-20 with hub-density politics is an
    interesting micro-station. The tagHook "The shuttle schedule between
    modules is the real political weapon" is excellent. Bespoke and
    GM-actionable.
  - [rationality / settlement[4]] hiddenTruth "The AI is sane; the humans
    are not listening" — outstanding line. This is the kind of bespoke
    detail the corpus needs more of. Memorable.
  - [adventure / 8 settlements] 8 settlements but only 5 of 8 close with
    "Control of [function] decides who has leverage." The other 3 close
    with "Everything here turns on access to Deep-ocean catalytic vent
    matter." Slightly better closing variety than other hub systems.

### Seed: phase7-review-realistic-balanced-normal-sparse-5

- System: Gnomon-Terminus (realistic / balanced / gu=normal / settlements=sparse)
- SpineSummary: "Election-day metric storm cycle took shape in the iggygate
  dawn, Election-day metric storm cycle is rewriting the constants
  Gnomon-Terminus I was built around."
- Findings:
  - [narrative / phenomenon] "Election-day metric storm cycle" + "Public
    festival tied to safe transit windows" — these are distinctive,
    evocative phenomenon names. The corpus has good phenomenon naming
    even when phenomenon prose is templated.
  - [adventure / phenomenon[0]] "A polling station runs on emergency power
    beyond delayed ballot shuttles." — concrete sceneAnchor that an LLM
    or GM could open a table at. Strong.
  - [readability / body[2]] "What First-wave colony shell was, only
    Gnomon-Terminus I Charter can still describe." — title-cased ruin name
    "First-wave colony shell" mid-sentence. Article would help: "What the
    first-wave colony shell was..." But the sentence shape itself is
    actually elegant.

### Seed: phase7-review-frontier-astronomy-normal-normal-1

- System: Almach-Azha Picket (frontier / astronomy / gu=normal / settlements=normal)
- SpineSummary: "Sol-interdiction picket shadow took shape in the first
  ephemeris pass, the perturbation from sol-interdiction picket shadow now
  exceeds Spectral Census Bureau's tolerance margin."
- Findings:
  - [narrative / tone] **Astronomy tone is genuinely differentiated.** "first
    ephemeris pass" / "perturbation" / "tolerance margin" — measurement
    register. Spine reads like an observatory bulletin instead of a faction
    feud. Best-in-class for tone work.
  - [narrative / factions] Faction names: "Spectral Census Bureau",
    "Photometric Service", "Aperture Observatory", "Catalog Observatory".
    All bureaucratic-scientific. Tone-coherent. Big improvement over
    Kestrel/Red Vane re-use.
  - [readability / body[1]] "Photometric Service's observation cohort and
    Spectral Census Bureau's cohort cannot agree on the calibration
    record." — clean, evocative.
  - [narrative / settlement[0]] "Tether-tension reports are political
    theater here — town hall annex is where the bracing shows the truth."
    — bespoke. Strong.
  - [readability / phenomenon note] Same "But, [question]" conjunction bug.

### Seed: phase7-review-realistic-astronomy-normal-normal-2

- System: Tianyi-Conduit (realistic / astronomy / gu=normal / settlements=normal)
- SpineSummary: "Black-market route beacon lattice took shape in the
  long-baseline era, Black-market route beacon lattice is shifting the
  operating envelope Tianyi-Conduit IV was calibrated against."
- Findings:
  - [narrative / tone] Astronomy spine variant: "shifting the operating
    envelope... was calibrated against" — different astronomy template
    from seed 11. Astronomy tone has at least 2 working templates.
  - [readability / spine] Same phenomenon-name-repeated-twice issue.
  - [narrative / factions] "Aperture Observatory and Catalog Observatory"
    reuses seed 11's factions. Slight cross-system bleed.

### Seed: phase7-review-frontier-cinematic-normal-normal-3

- System: Bake-eo-Tupa Belt (frontier / cinematic / gu=normal / settlements=normal)
- SpineSummary: "Gardener warning beacon took shape after the keep was
  sealed, Gardener warning beacon is hunting Bake-eo-Tupa Belt II a degree
  at a time."
- Findings:
  - [narrative / tone] **Cinematic tone is the strongest of the three.**
    "after the keep was sealed" / "is hunting... a degree at a time" —
    fairy-tale gothic register. Distinctive.
  - [rationality / phenomenon BUG] **Phenomena[0] and [1] are both
    "Gardener warning beacon" with IDENTICAL note/travel/surveyQ/
    conflictHook/sceneAnchor.** Duplicate phenomenon. This is a generator
    bug, not a prose issue — the same phenomenon was selected twice for
    one system.
  - [narrative / body[0]] "Gardener warning beacon is hollowing
    Bake-eo-Tupa Belt II from underneath. Gardener warning beacon is
    closing on Bake-eo-Tupa Belt II like a tide." — both sentences use
    the same phenomenon as subject; "hollowing... from underneath" and
    "closing... like a tide" are both good cinematic verbs but the
    repetition is heavy.

### Seed: phase7-review-realistic-cinematic-normal-normal-4

- System: Sulafat-Choir (realistic / cinematic / gu=normal / settlements=normal)
- SpineSummary: "Debt-fleet anchor graveyard took shape after the crown
  fell, Debt-fleet anchor graveyard is hunting Sulafat-Choir Belt X a degree
  at a time."
- Findings:
  - [narrative / body[0]] "Something is wrong under Sulafat-Choir Belt X,
    and debt-fleet anchor graveyard is the name people whisper for it. So
    of course, Between Carrion Order and Gravewatch Compact the knife is
    already drawn." — very strong cinematic voice. "the name people
    whisper for it" is bespoke. "the knife is already drawn" is iconic
    for the tone but appears 3+ times in this corpus's cinematic systems.
  - [narrative / factions] "Carrion Order", "Gravewatch Compact", "Iron
    Crown Synod", "Widow Star Compact" — all dark/gothic. Tone-coherent
    and notably distinct from balanced-tone "Kestrel Free Compact" pool.
  - [adventure / phenomenon[1]] "Powered-down freighters sit chained to
    tax buoys, registry lights delinquent." — sceneAnchor of the corpus.
    A GM could open a session at this exact image.

### Seed: phase7-review-frontier-cinematic-normal-crowded-5

- System: Misam-Terebellum Outpost (frontier / cinematic / gu=normal / settlements=crowded)
- SpineSummary: "The compact between Carrion Choir and Crown of Dust
  Brotherhood broke after the crown fell, Between Carrion Choir and Crown
  of Dust Brotherhood the war is already lost; only the funerals remain."
- Findings:
  - [narrative / spine] **Best spine in the corpus.** "the war is already
    lost; only the funerals remain" — voice. Cinematic faction-driven
    spine has its own template distinct from balanced.
  - [readability / body[0]] "Carrion Choir keeps the receipts. Crown of
    Dust Brotherhood keeps the witnesses." — paired antithesis. Strong.
    But: body[1] reuses the same template ("Crown of Dust Brotherhood
    keeps the receipts. Widow Star Order keeps the witnesses.") with the
    factions just rotated. Reads as the same beat twice.
  - [readability / body[0-1]] "Between X and Y the knife is already drawn."
    appears 4 times across 2 paragraphs. Even with great voice, 4x is
    too much.
  - [adventure / settlement[2]] whyHere: "Misam-Terebellum Outpost VI -
    Moon I sits on something hungry, and everyone here has decided to
    feed it." — **best whyHere line in the corpus.** Bespoke, ominous,
    immediately GM-usable.
  - [adventure / settlement[1]] whyHere: "Misam-Terebellum Outpost III
    stays because what hides here is worth every grave on the manifest."
    — second best.
  - [rationality / settlement[3]] tagHook: "Privately, the ghosts are old
    human recordings." — perfectly fits the cinematic horror tone.

### Seed: phase7-review-frontier-balanced-low-normal-1

- System: Franz-69 (frontier / balanced / gu=low / settlements=normal)
- SpineSummary: "The compact between Ash Meridian Navy and Orison Route
  Authority broke in the long quiet..."
- Findings:
  - [narrative / cross-corpus] "in the long quiet" appears in spines 5, 18,
    20 — and the previous review noted it earlier. Era word recycling.
  - [rationality / gu=low] GU intensity "Useful bleed" for gu=low — feels
    too active for a "low" preference. The hazards/resources still read
    as a normal-bleed system. **Possibly a GU intensity calibration issue
    on the low end.**
  - [narrative / settlement[2]] whyHere: "Franz-69 traffic pattern runs
    quiet because interdiction sits one bad manifest away." — bespoke,
    excellent.
  - [adventure / settlement[2]] tagHook: "There is no gate, no route, and
    no rescue lane — shared mess that doubles as a hearing is the only
    place to corner anyone." — bespoke, GM-usable.

### Seed: phase7-review-realistic-balanced-low-normal-2

- System: Alasia-Proxima Line (realistic / balanced / gu=low / settlements=normal)
- SpineSummary: "Gas giant radiation maze took shape in the iggygate dawn..."
- Findings:
  - [rationality / phenomenon] Spine names "Gas giant radiation maze" — but
    the system has no gas giants; the outermost body is rocky/cryogenic
    Mars-like. The phenomenon name implies a body type that doesn't
    exist in the system. **Phenomenon-body coherence issue.**
  - [readability / body[0]] "Each pass of Gas giant radiation maze costs
    Glasshouse Biosafety Compact a margin it doesn't have." — title-cased
    phenomenon mid-sentence with no article.
  - [narrative / hooks] Only 3 hooks for 1-settlement system. Short, fine.

### Seed: phase7-review-frontier-balanced-high-normal-3

- System: Udkadua-Tupi Shelf (frontier / balanced / gu=high / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor
  Combine broke in the long quiet..."
- Findings:
  - [narrative] Kestrel/Red Vane again. "in the long quiet" again. **Highly
    recycled spine.** This is the 6th identical Kestrel/Red Vane pair.
  - [rationality / gu=high] GU intensity "Dangerous fracture system" — feels
    *too* extreme for gu=high (would expect that for gu=fracture). The
    next test (seed 20, gu=fracture) shows "Major observiverse shear
    zone" with "Systemic cascade" hazard. Compare to seed 18 (gu=high,
    "Dangerous fracture system") — **the gu=high and gu=fracture
    intensity bands may be miscalibrated or overlapping.**
  - [narrative / phenomenon] "Hot Neptune desert survivor" — striking name,
    well-tied to the system's super-Earth-heavy bodies.
  - [adventure / settlement[0]] tagHook: "Air Is Money makes meters law;
    Life-Support Union can shut those meters off, turning every strike
    into a hostage negotiation." — excellent, system-specific economic
    conflict.

### Seed: phase7-review-realistic-balanced-high-normal-4

- System: Ayeyarwady-99 (realistic / balanced / gu=high / settlements=normal)
- SpineSummary: "Programmed regolith growth took shape in the second wave,
  Programmed regolith growth is rewriting the constants Ayeyarwady-99 Belt
  VIII Center was built around."
- Findings:
  - [rationality / spine subject] Spine targets a *settlement*
    ("Ayeyarwady-99 Belt VIII Center") rather than a body or faction.
    Most other spines target bodies/factions. Either inconsistent or
    intentional, but worth checking that "what was built around" subject
    is settlement-aware.
  - [rationality / body[2]] "Ayeyarwady-99 Belt VIII Center says one thing
    about science; Ayeyarwady-99 says another." — "science" as the
    disputed-knowledge topic. Even more abstract than "war"/"trade".
    What about science is disputed?
  - [adventure / settlement[1]] tagHook + crisis combination: "An unknown
    native microbial hazard makes the GU work impossible to treat as
    routine. Privately, the settlement is insolvent." — strong setup.

### Seed: phase7-review-frontier-balanced-fracture-normal-5

- System: Cexing's Picket (frontier / balanced / gu=fracture / settlements=normal)
- SpineSummary: "The compact between Kestrel Free Compact and Red Vane Labor
  Combine broke in the long quiet..."
- Findings:
  - [narrative] **7th Kestrel/Red Vane spine.** "in the long quiet" 4th
    appearance. Pattern is now glaring.
  - [rationality / gu=fracture] GU hazard: "Systemic cascade: Matter phase
    instability; Programmed regolith growth" — appropriately ominous.
    GU=fracture intensity reads correctly here.
  - [adventure / settlement[2]] tagHook: "Privately, the Iggygate is
    misaligned on purpose." — strong hidden truth, ties directly to the
    Iggygate-anchor reachability.
  - [narrative / spine vs gu] Spine is a faction-feud spine despite
    gu=fracture. **A fracture-tier GU should arguably surface in the
    spine itself**, not just in body paragraphs and settlement details.
    The most destabilizing fact about the system isn't visible at the
    top.

---

## Corpus-level patterns

### Readability

1. **Phenomenon-note conjunction bug** — every phenomenon's `note` field
   joins `travelEffect + ", " + ("But" | "And" | "Meanwhile") + ", " +
   surveyQuestion`. The conjunction is grammatically wrong before a
   question. Either elide the conjunction when the next clause is a
   question, or rephrase the question into a declarative ("The open
   question is whether..."). **Affects ~44 phenomenon notes across the
   corpus — every single one.**

2. **Title-cased entity names mid-sentence without articles** — phenomena,
   ruins, and even GU resources appear capitalised mid-prose: "remembers
   Half-built ring habitat firsthand", "carries an unbroken chain of
   records back to Quarantine-era cemetery cylinder", "Each pass of Gas
   giant radiation maze costs...". Phase 7 flagged this; **unfixed**. The
   fix is either lowercase + article ("the half-built ring habitat") or
   quoted reference ("'Half-built ring habitat'").

3. **Spine summary repeats phenomenon name twice** — phenomenon-driven
   spines like "Trojan megaswarm took shape... Trojan megaswarm is
   rewriting...". Should pronominalize the second mention or rebuild as
   one sentence with a dash.

4. **body[0] predicate repetition** — "X and Y both want trade. A and B
   both want governance." or three "keeps shifting under" sentences in a
   row. The faction-relation generator picks similar predicates too
   often within the same paragraph.

### Rationality

5. **body[2] disputed-knowledge subject is arbitrary** — "X and Y both
   claim authority over [TOPIC]" where TOPIC is "war", "trade", "crime",
   "science", "ecology". The TOPIC has no referent in the rest of the
   system. Suggested fix: bind TOPIC to an actual narrative thread
   present in the system (a phenomenon, a faction conflict, a ruin's
   subject), or replace with a more concrete clause.

6. **GU intensity calibration overlap** — gu=high (seed 18) shows
   "Dangerous fracture system" intensity, gu=fracture (seed 20) shows
   "Major observiverse shear zone". The labels feel swapped — "fracture
   system" sounds like the higher tier. Worth auditing the
   GuPreference → intensity mapping and renaming if the bands have
   shifted.

7. **Phenomenon-body coherence** — seed 17 has "Gas giant radiation maze"
   in a system with no gas giants. The phenomenon-body compatibility
   filter may be missing some constraints.

8. **Anchor-as-subject confusion** — settlement whyHere uses the anchor
   name as grammatical subject: "Wattle-Echo Belt VII route geometry
   maintains its footprint on the body it occupies", "Rasalnaqa-86
   traffic pattern accepts the risk and the silence". A *route geometry*
   or *traffic pattern* can't have a footprint or accept risk. Should
   either re-subject to the settlement name, or rebuild the templates
   to make the anchor a prepositional phrase ("The settlement holds
   along this route geometry because...").

9. **Phenomenon duplication bug** — seed 13 (Bake-eo-Tupa Belt) generated
   "Gardener warning beacon" twice as separate phenomena[0] and [1] with
   identical text. Phenomenon selection lacks de-duplication.

### Narrative potential

10. **Faction pool dominance** — "Kestrel Free Compact" + "Red Vane Labor
    Combine" appears in 6 of 10 balanced-tone spines (seeds 2, 3, 4, 7,
    18, 20). Phase 7 flagged a similar pattern; **unfixed or worse**.
    Other balanced factions (Pale Choir Communion, Ash Meridian Navy,
    Glasshouse Biosafety Compact, Orison Route Authority, Helion Debt
    Synod, Veyra-Locke Concession, Sepulcher Archive Court, Ninth
    Ledger Office) exist in the pool but aren't promoted to the spine
    role often enough.

11. **Era word recycling** — "in the long quiet" in seeds 5, 16, 18, 20.
    "in the first wave" / "in the second wave" / "in the early
    charters" / "in the pinchdrive era" / "before the collapse". Pool
    is small (~7 era phrases) and "long quiet" is overweighted.

12. **Tone differentiation works** — astronomy (seeds 11, 12) and
    cinematic (seeds 13-15) have genuinely distinct prose registers.
    This is the corpus's strongest feature. Astronomy uses
    measurement/instrument language ("perturbation", "tolerance margin",
    "calibration record"); cinematic uses gothic/elegiac language ("the
    knife is already drawn", "what hides here is worth every grave on
    the manifest"). Balanced is the least-distinctive tone — its
    register is the default.

13. **System hooks are mostly generic templates** — 6-7 templates rotate
    ("A neutral broker between X and Y...", "Who profits if X and Y stay
    locked...", "Whose version of [topic]...", "Who edited the version
    everyone reads?"). Estimated 60-70% of hooks could apply to any
    system. The system-specific hooks ("Whose models predicted [named
    phenomenon] would behave?") are better — those reference a unique
    entity.

14. **Phenomenon prose is fully recycled across systems** — "Salvage
    court evidence cache" appears in seeds 7, 8, 9, 16 with identical
    travel/surveyQ/conflictHook/sceneAnchor text. Only the
    "destabilization centers on" anchor varies. Same for "Trojan
    megaswarm" (seeds 2, 6), "Black-market route beacon lattice"
    (seeds 1, 5, 12), "Sol-interdiction picket shadow" (seeds 1, 11,
    19). A GM running adjacent systems will recognize the prose
    immediately.

### Adventure potential

15. **tagHook closing template** — "Control of the [function] decides
    who has leverage." appears as the closing sentence of ~70% of
    settlement tagHooks. The "Everything here turns on access to
    [resource]." variant covers most of the rest. Only when both fail
    does the closing line vary. Phase 7 carryover-f. **The opening
    sentences of tagHooks are often excellent** (public-vs-private tag
    pairings); the closing dilutes the effect.

16. **Hidden truths are the corpus's strongest adventure surface** —
    "the AI is sane; the humans are not listening", "the maintenance
    logs were rewritten after the breach", "the ghosts are old human
    recordings", "the Iggygate is misaligned on purpose", "the
    Gardener has already intervened once". These read as system-
    specific, GM-actionable secrets. Recommend mining this surface for
    more variety; reduce template overhead elsewhere.

17. **Settlement crisis + hiddenTruth pairings work** — when both fire
    well together (e.g., "Mass shelter lottery riot" + "the clinic is
    hiding a second exposure syndrome"), they're the most session-
    ready material in the corpus.

18. **Sparse-density systems feel underdeveloped for adventure** — sparse
    systems get 1-2 settlements, often only 1 hook line per surface.
    They're geographically vivid (good body whyInteresting) but the
    political/social layer is thin. Consider whether sparse should
    still produce 3-5 hooks even with 1 settlement, by drawing more
    from phenomena and ruins.

19. **Architecture × density compatibility** — seed 8 (Pulcherrima
    Frontier-702, "crowded") has only 2 bodies and 2 settlements. The
    architecture (Sparse rocky) and the settlements density (crowded)
    feel mismatched. Either the body count should grow with crowded
    density, or crowded should be downgraded to normal when body count
    is low.

---

## Recommendations (priority order)

1. **Fix the phenomenon-note conjunction bug** (every note, easy regex).
2. **Fix title-cased entity references mid-sentence** (Phase 7 carryover;
   add article + lowercase pass).
3. **Fix tagHook closing template** ("Control of [function] decides who
   has leverage." → rotate among 3-4 closings, or omit when the rest of
   the tagHook covers leverage already).
4. **Audit faction promotion** — limit how often Kestrel/Red Vane can
   appear in the *spine* role across a corpus. Other anchor pairs exist;
   promote them.
5. **Bind body[2] disputed-knowledge topic** to an actual entity in the
   system (phenomenon name, ruin name, faction conflict subject) rather
   than abstract words.
6. **De-duplicate phenomena per system** — seed 13 has the same
   phenomenon twice.
7. **Audit GU intensity bands** — gu=high vs gu=fracture labels feel
   swapped.
8. **Diversify era words** — reduce "long quiet" weight.
9. **Improve system-hook system-specificity** — currently ~30% reference
   named entities; aim for 70%+.
10. **Variant rotation for phenomenon prose** — even 2 variants per
    phenomenon name (selected by seed-hash) would prevent the same text
    showing in adjacent systems.

## What's working — keep

- **Tone differentiation** is real. Astronomy and cinematic both have
  recognizable, distinct voices.
- **Cinematic faction names** (Carrion Order, Iron Crown Synod, Widow
  Star Compact) and the "the war is already lost; only the funerals
  remain" register are excellent.
- **Settlement hidden truths** are the corpus's strongest adventure
  output. Mine this surface more.
- **Some bespoke whyHere lines** ("sits on something hungry, and
  everyone here has decided to feed it", "Franz-69 traffic pattern runs
  quiet because interdiction sits one bad manifest away") show what the
  ceiling looks like. The templated ones look weak by comparison.
- **Phase 7 spine grammar fix held.** Mid-sentence faction
  capitalization works correctly.

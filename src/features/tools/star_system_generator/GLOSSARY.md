# Star System Generator

A seeded, deterministic generator of playable star systems for the Geometric Unity sci-fi TTRPG setting. Real astronomy builds the skeleton, Geometric Unity adds the pressure points, and human history supplies the adventure sites.

## Language

### Generation

**Generated System**:
The complete output for one Seed and set of Generation Options: stars, bodies, GU overlay, human layer, narrative graph, and hooks.
_Avoid_: profile, system profile, result

**Seed**:
The free-text value that, together with the Generation Options, fully determines a Generated System.

**Generation Options**:
The four referee-facing dials (Distribution, Tone, GU Preference, Settlement Density) applied alongside the Seed.
_Avoid_: controls, settings, bias

**Distribution**:
Which population of stars the system is drawn from: realistic nearby stars, or the reachable frontier where useful geometry over-represents multiples and flare stars.
_Avoid_: realism bias

**Tone**:
The voice and emphasis of generated prose and tables: balanced, astronomy-forward, or cinematic.
_Avoid_: bias, voice, style

**GU Preference**:
The referee's requested lean for Geometric Unity strength (low, normal, high, or fracture), which biases but does not fix the rolled GU Intensity.
_Avoid_: GU intensity (that is the result, not the option)

**Settlement Density**:
The referee's requested lean for how much human presence a system carries: sparse, normal, crowded, or campaign hub.
_Avoid_: settlements (as an option name)

**Seed Link**:
The shareable address of a Generated System: its Seed, any non-default Generation Options, and the Generator Version. It is the only way a system is saved or shared.
_Avoid_: share link, seed URL, permalink

**Generator Version**:
The numbered revision of the generation rules a Generated System was produced under. A Seed Link names it so the same link keeps producing the same system after the rules change.
_Avoid_: schema version, app version

**Layer**:
One of the three strata every fact belongs to: physical (astronomy), GU (Geometric Unity), or human.
_Avoid_: register, tier

**Partial Known System**:
Imported real or canon data for a system that the generator must fill around without overwriting.
_Avoid_: import, known data

**Locked Fact**:
An imported fact the generator must preserve exactly; disagreements with generator policy are reported as Locked-Fact Conflicts, never silently rewritten.

**No-Alien Rule**:
The setting constraint that no generated result may be an alien civilization, relic, or megastructure; every mystery traces to astronomy, Geometric Unity, first-wave history, narrow-AI failure, or the Gardener.
_Avoid_: no-alien check (that is the verification, not the rule)

### Provenance

**Fact**:
A single generated or imported value carrying its Confidence and source.

**Confidence**:
The provenance label on a Fact: Confirmed, Derived, Inferred, GU-layer, or Human-layer.
_Avoid_: data confidence, data hierarchy, certainty

**Confirmed**:
Known from real astronomical data or setting canon.

**Derived**:
Calculated from other known values, such as insolation or habitable-zone edges.

**Inferred**:
Plausible but not directly known, such as an undetected outer belt.

**GU-layer**:
Fictional but internally consistent with Geometric Unity.

**Human-layer**:
Fictional human settlement, wreck, faction, base, or historical event.

### Stars and system skeleton

**Primary**:
The main star of a Generated System.
_Avoid_: host star, main star

**Stellar Companion**:
An additional star bound to the Primary, with its own separation and consequences for planets and GU.
_Avoid_: binary, secondary, companion star

**Companion Mode**:
How a Stellar Companion relates to the system's bodies: volatile (contact pair), circumbinary (planets orbit both), orbital sibling (its own orbiting bodies), or linked independent (effectively its own system).
_Avoid_: relationship mode

**Companion Sub-System**:
The bodies, settlements, gates, ruins, and phenomena that belong to an orbital-sibling Stellar Companion rather than the Primary.

**Linked System**:
A widely separated companion treated as a separate system reachable by its own derived Seed.

**Activity**:
The flare and radiation behaviour of a star, which drives hazards and some bleed behaviour.
_Avoid_: stellar weather

**Reachability Class**:
Why and how this system sits on the human travel network, e.g. Dead-end system, Trade spoke, Military lane, Gardener-shadowed.
_Avoid_: reachable-volume bias, system role, route class

**Pinch Difficulty**:
Captain's shorthand for how dangerous a Pinchdrive approach to a system or Gate is; a Gate's own Pinch Difficulty, when it has one, overrides the system's for that Gate.

**Architecture**:
The overall arrangement of a system's bodies, e.g. Compact inner system, Peas-in-a-pod chain, Migrated giant.
_Avoid_: system type, layout

**Habitable Zone**:
The optimistic band of orbits around a star where liquid surface water is possible; being inside it does not make a world habitable.
_Avoid_: HZ, Goldilocks zone

**Snow Line**:
The orbital distance beyond which water ice condenses.
_Avoid_: frost line, ice line

**Thermal Zone**:
The insolation band a body occupies: Furnace, Inferno, Hot, Temperate, Cold, Cryogenic, or Dark.
_Avoid_: temperature zone

### Bodies

**Body**:
Any orbiting object in a system: planet, belt, dwarf body, rogue/captured object, or anomaly.
_Avoid_: planet (when belts and dwarfs are meant), world, orbital

**Body Category**:
The broad kind of Body: rocky planet, super-Earth, sub-Neptune, gas giant, ice giant, belt, dwarf body, rogue/captured, or anomaly.
_Avoid_: type

**Body Class**:
The specific world archetype within a category, e.g. Lava planet, Magma ocean world.
_Avoid_: planet class, world class, profile

**Moon**:
A natural satellite of a Body, with its own type, resource, hazard, and use.

**Ring System**:
A planetary ring around a Body.

**Exoplanet Filter**:
A rule from modern exoplanet surveys (radius valley, hot-Neptune desert, peas-in-a-pod, M-dwarf habitability) that constrains which bodies are plausible.

**Planetary Detail**:
The environmental description of a Body: atmosphere, hydrosphere, geology, climate, radiation, biosphere, and related surface conditions.
_Avoid_: environment, world detail

**Why Interesting**:
The one-line play-facing reason a Body deserves table time.
_Avoid_: body interest, hook

### Geometric Unity

**Geometric Unity**:
The setting's physics: one higher-dimensional geometry (the observerse) projected into 4D spacetime.
_Avoid_: the geometry (in generator text)

**GU Overlay**:
The system-wide Geometric Unity layer: intensity, bleed location and behaviour, signature resource, and signature hazard.

**GU Intensity**:
The rolled strength of Geometric Unity in a system, from Geometrically quiet through Low, Useful, and Rich bleed to Major observerse shear zone and Dangerous fracture system.
_Avoid_: GU preference (that is the option)

**Bleed**:
A place where the boundary between spacetime and the observerse runs thin; simultaneously resource, hazard, and target.
_Avoid_: seep, thin spot

**Bleed Location**:
Where in the system the bleed concentrates.

**Bleed Behaviour**:
How the bleed moves or pulses over time: anchored node, timed window, bloom, drifting river, or scar.

**Chirality**:
A strong left- or right-handed geometric bias in matter that makes premium materials, medicine, and AI substrates work.

**Calibration Medium**:
The bleed-sourced fluid that tunes a Pinchdrive to a route.

**Anchor Mass**:
Dark-sector ballast that fixes an Iggygate to spacetime.

**Pinchdrive**:
The standard human FTL drive.
_Avoid_: jump drive, pinch drive

**Iggygate**:
A stabilized, two-ended FTL shortcut anchored by dark-sector ballast.
_Avoid_: jump gate, stargate

**Gardener**:
The Sol-system ASI that mastered Geometric Unity and enforces the Sol Silence.
_Avoid_: Sol ASI, Sol

**Sol Silence**:
The standing condition that nothing enters or leaves Sol.

**First Wave**:
The original human expansion before the Sol Silence, and anything surviving from it.

**Narrow AI**:
A purpose-limited intelligence that manipulates one small piece of the observerse; the only AI humans legally field.

### Human layer

**Settlement**:
A named human presence anchored to a Body, Moon, orbit, route, or Debris Field, with function, authority, condition, crisis, and hidden truth.
_Avoid_: base, colony, station, outpost (these are scales or habitation patterns, not the concept)

**Settlement Presence**:
The scored likelihood and scale of human presence at a site, from Empty except probes up to Major campaign location.
_Avoid_: presence tier, settlement score

**Anchor**:
The physical thing a Settlement or Gate is attached to, such as a body surface, a moon, an orbit, or a route node.
_Avoid_: host, site

**Habitation Pattern**:
The physical form a Settlement takes, e.g. Surface settlement, Ring station, Hollow asteroid, Generation ship.
_Avoid_: built form (which is the construction style), settlement type

**Settlement Population**:
The headcount band of a single Settlement.
_Avoid_: scale, size

**Body Population**:
How inhabited a whole Body is across surface, underground, and orbit, including unnamed sites beyond its named Settlements.
_Avoid_: population band (unqualified)

**System Population Band**:
How inhabited the whole system is, from skeleton to dense sector.

**Terraform State**:
Where a Body stands in terraforming: none, candidate, in progress, stabilized, or failed.

**Crisis**:
The current problem a Settlement is facing.
_Avoid_: current crisis, problem

**Hidden Truth**:
What is really going on at a Settlement beneath its Crisis.
_Avoid_: secret, twist

**Encounter Site**:
A specific local place within a Settlement where scenes happen.
_Avoid_: site (unqualified)

**Gate**:
A specific Iggygate installation in a system, with its anchor, authority, condition, and route note. Route infrastructure is a Gate, not a Settlement.
_Avoid_: gate node, route node, gate settlement

**Ruin**:
A human, usually first-wave, wreck, derelict, or abandoned site in a system.
_Avoid_: human remnant, remnant, derelict (as the concept name)

**System Phenomenon**:
A notable natural or GU occurrence in a system with travel effect, survey question, conflict hook, and scene anchor.
_Avoid_: phenomena (unqualified), anomaly

**Debris Field**:
A companion-driven region of debris with a shape, density, anchoring rule, GU character, and prize.
_Avoid_: belt (a belt is a Body)

**Debris Anchor Mode**:
Whether and how Settlements can attach to a Debris Field: unanchorable, transient only, edge only, or embedded.

**Prize**:
The valuable thing that draws people into a Debris Field.

**Major Hazards**:
The system-level dangers a crew should know about on arrival, drawn from the GU Overlay and stellar Activity.
_Avoid_: hazards (unqualified)

**Named Faction**:
A recurring organization with a kind and Narrative Domains (trade, war, religion, etc.) that acts across settlements.
_Avoid_: faction (unqualified), institution, actor

### Narrative graph

**Narrative Fact**:
A Fact restated as a story-ready claim about a subject (system, star, body, settlement, ruin, phenomenon, faction, route, or GU), with a narrative status.

**Narrative Domain**:
One of a closed set of interest areas (trade, war, religion, law, and so on) that tags Narrative Facts and Named Factions so the Relationship Graph can connect them.
_Avoid_: domain (unqualified), topic, category

**Narrative Status**:
How true and how known a Narrative Fact is: established, inferred, rumor, secret, or cover story.
_Avoid_: Confidence (which is provenance, not truth-in-fiction)

**Entity**:
A participant in the Relationship Graph: system, star, body, settlement, GU resource, GU hazard, phenomenon, ruin, named faction, route, or gate.
_Avoid_: node, actor

**Relationship Graph**:
The set of typed relationships between Entities that explains who controls, depends on, contests, or hides what.
_Avoid_: narrative graph, story graph

**Relationship**:
One typed, directed link between two Entities, e.g. HOSTS, CONTROLS, DEPENDS_ON, CONTESTS, DESTABILIZES, SUPPRESSES, CONTRADICTS, WITNESSES, HIDES_FROM.
_Avoid_: edge, link

**Historical Relationship**:
A Relationship set in the past (FOUNDED_BY, BETRAYED, DISPLACED) that explains a present one, tagged with an Era.

**Era**:
A setting-time marker for when a Historical Relationship happened, e.g. "in the first wave", "before the quarantine".

**Visibility**:
Who knows about a Relationship: public, contested, or hidden.

**Spine**:
The small set of highest-weight Relationships that carries a system's central story.
_Avoid_: backbone, main plot

**Settlement Spine**:
The single strongest settlement-touching Relationship chosen per Settlement to shape its local hook.

**System Story**:
The rendered prose of the Spine: a summary, body paragraphs, story hooks, and Conflicts.
_Avoid_: narrative, story panel

**Conflict**:
A live dispute built from a Spine Relationship, with parties, a stake, a temperature, an optional complication, and a visible sign.

**Conflict Temperature**:
How hot a Conflict is: simmering, open, aftermath, or frozen.

**Party**:
An Entity taking a side in a Conflict as aggressor, defender, or bystander.

**Complication**:
An added twist on a Conflict: a secret, a deadline, a third party, or a GU anomaly.

**Visible Sign**:
What a newcomer can actually observe that betrays a Conflict.

**Narrative Stage**:
The part of generation that turns the human layer into Narrative Facts, the Relationship Graph, Conflicts, the System Story and Stories at Port, and reshapes Settlement and System Phenomenon prose to match.
_Avoid_: narrative pass, story pipeline

### Hooks

**Stories at Port**:
The table-ready hook set for a system, grouped as rumors, contracts, encounters, NPCs, and twists.
_Avoid_: system hooks, adventure hooks, hooks (unqualified)

**Hook Category**:
The kind of a Stories at Port entry: rumor, contract, encounter, NPC, or twist.

**Hook Term**:
A setting term (GU, Bleed, Chirality, Gardener, and so on) that tags Stories at Port entries; all but GU can be detected in a system's generated text.
_Avoid_: tag (unqualified), keyword

**Active Terms**:
The Hook Terms detected in a system's generated text, plus any the Hook Selection Profile always treats as active.

**Resonant Terms**:
The Active Terms plus the Hook Terms carried by entries already picked from categories that feed resonance, so later picks echo earlier ones.

**Hook Selection Profile**:
The configuration of Stories at Port selection (currently the v2 profile, swappable for a later Generator Version): which Hook Terms are always active, and for each Hook Category in draw order, its count, its bias toward preferred terms, whether it prefers Active or Resonant Terms, and whether its picks feed resonance.
_Avoid_: hook config, hook settings

**Tag Hook**:
The play-facing interpretation of a Settlement's or Gate's tag pair, crisis, and hidden truth.
_Avoid_: settlement hook, hook (unqualified)

**Story Hook**:
A play prompt drawn from the System Story's Spine.
_Avoid_: hook (unqualified)

**Conflict Hook**:
The play prompt attached to a System Phenomenon.
_Avoid_: hook (unqualified)

**Ruin Hook**:
The play prompt attached to a Ruin.
_Avoid_: hook (unqualified)

### Viewer overlay

**Glyph**:
A map symbol in the system viewer standing for a Settlement habitation pattern, Gate, Ruin, System Phenomenon, hazard, or bleed.
_Avoid_: icon, marker

**Glyph Register**:
The family a Glyph belongs to (human, gate, ruin, phenomenon, hazard, GU), which sets its colour.

**Glyph Status**:
Whether a human Glyph's site is active, abandoned, or automated.

Below is a revised, more accurate and more setting-integrated version of the system generator. I’m treating this as **Version 2** of the earlier “Modern Astrosynthesis System,” now tuned for your **Geometric Unity Era**.

The main changes are:

The astronomy layer is now more careful about what we actually know. Known exoplanet data is incomplete and detection-biased, so the generator distinguishes between **confirmed**, **derived**, **inferred**, and **fictional/setting-layer** details.

The setting layer now assumes that the 150 reachable systems are **not a neutral sample of the galaxy**. Pinchdrives, Iggygates, bleed resources, and metric stability make some systems more reachable, valuable, or dangerous than a purely random nearby-star census would suggest.

There are **no alien civilizations, alien ruins, or alien artifacts** in the system generator. Life may exist, including microbial or non-sapient complex life, but system mysteries should come from natural physics, Geometric Unity phenomena, human collapse, narrow-AI failures, corporate secrecy, or Sol/Gardener interdiction.

The settlement and base system is much larger and more game-facing.

I’ll refer to the revised system as **MASS-GU: Modern Astrosynthesis for the Geometric Unity Era**.

---

# 1. Accuracy audit: what should change from the first version

The earlier version was broadly usable, but several items need refinement.

First, the generator should not assume that a “known system” is fully known. NASA’s public exoplanet catalog is continuously updated and now contains more than 6,000 confirmed exoplanet entries, but that is still a discovered sample, not a complete census of every planet around nearby stars. The catalog also shows that planet type, discovery method, mission, and facility are all part of how a planet was detected, which matters because detection methods bias what we see. ([NASA Science][1])

Second, the planet type categories should be broader but less deterministic. NASA’s basic public taxonomy uses gas giant, Neptunian, super-Earth, and terrestrial classes, but those categories are observational conveniences, not full geological descriptions. A “super-Earth” should not automatically mean “habitable large Earth.” It may be a dense rocky world, water-rich world, volatile-rich world, or transitional body. ([NASA Science][2])

Third, the generator should use the **radius valley** as a real demographic feature. Close-in small planets show a deficit around roughly 1.5–2 Earth radii, splitting many worlds into smaller rocky planets and larger volatile-envelope sub-Neptunes. This is one of the most important modern exoplanet corrections to older Traveller-style assumptions. ([arXiv][3])

Fourth, close-in Neptune-sized worlds should be treated as unusual. The “hot Neptune desert” is a real observed shortage of short-period Neptunian planets, so a close-in Neptune should usually become either a rare scientific prize, a stripped core, a survivor anomaly, or a setting-specific Geometric Unity exception. ([arXiv][4])

Fifth, compact multi-planet systems should be common in generation, especially around smaller stars. Kepler data shows that planets in many multi-planet systems tend to have correlated sizes and regular orbital spacing, often described as a “peas in a pod” pattern. ([arXiv][5])

Sixth, M dwarfs should be common, but not caricatured. Red dwarfs are the most common type of star in the Milky Way, and small planets around M dwarfs are common; one Kepler-based study estimated 2.5 ± 0.2 planets per M dwarf for planets of 1–4 Earth radii and periods under 200 days. But habitability around M dwarfs is complicated by close-in habitable zones, flares, tidal locking, and atmospheric loss risks. ([NASA Science][6])

Seventh, multi-star systems should be common in your reachable volume because of the setting, not because real astronomy says all stars are equally likely to be multiple. Real multiplicity depends strongly on primary-star mass: high-mass stars are more often multiple, while M dwarfs have lower multiplicity rates than solar-type stars. In your setting, however, multi-star systems are overrepresented because stellar resonances and metric stresses create richer observerse bleed zones and better Iggygate geometry. ([Annual Reviews][7]) 

Eighth, the habitable zone should be a starting condition, not a “garden world” label. NASA defines the habitable zone as the distance where liquid water could exist on a planet’s surface, but surface water also requires the right atmosphere, pressure, chemistry, climate history, and radiation environment. ([NASA Science][6])

Ninth, cold systems should be more interesting. Ocean worlds can exist outside classical habitable zones; in our own Solar System, bodies such as Europa and Enceladus are important because subsurface oceans, tidal heating, organics, and hydrothermal activity may create habitats away from direct stellar warmth. ([NASA Science][8])

Tenth, Geometric Unity should not replace astrophysics. It should bias outcomes, add resources and hazards, and explain why reachable systems are valuable, but it should not make every system arbitrary. The universe summary establishes that GU explains why certain systems are resource-rich and dangerous without breaking normal stellar evolution. 

---

# 2. The data hierarchy

Every generated fact should have a confidence label. This is important because your setting uses real star systems but also needs procedural detail.

| Label              | Meaning                                                                | Example                                                                                                        |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **C: Confirmed**   | Known from real data or setting canon.                                 | Proxima Centauri exists; Proxima b is a known planet candidate/confirmed planet depending your catalog choice. |
| **D: Derived**     | Calculated from known values.                                          | Insolation from luminosity and orbital distance.                                                               |
| **I: Inferred**    | Plausible but not directly known.                                      | Undetected outer ice belt around a known M dwarf.                                                              |
| **G: GU-layer**    | Fictional but internally consistent with Geometric Unity.              | Moving bleed node in a resonant Lagrange corridor.                                                             |
| **H: Human-layer** | Fictional human settlement, wreck, faction, base, or historical event. | First-wave mining habitat abandoned after a metric storm.                                                      |

A generated system should read like this:

**Lalande 21185**
Star data: C
Known planets: C/D
Additional cold belt: I
Bleed node chain: G
Mining settlement: H

This prevents “procedural fiction” from accidentally overwriting real data.

---

# 3. Core MASS-GU procedure

Generate a system in this order:

1. **Import or generate the star system.**
2. **Determine reachable-volume bias.**
3. **Determine stellar age, metallicity, activity, and multiplicity.**
4. **Roll system architecture.**
5. **Place or import known planets.**
6. **Fill plausible orbital gaps.**
7. **Generate planets, moons, belts, rings, dwarf bodies, and rogue/captured bodies.**
8. **Apply modern exoplanet filters.**
9. **Apply Geometric Unity overlays.**
10. **Generate resources, hazards, routes, settlements, bases, wrecks, and factions.**
11. **Assign mystery sources, explicitly excluding alien civilizations/artifacts.**

The important design principle is:

**Real astronomy creates the skeleton. Geometric Unity creates the pressure points. Human history creates the adventure sites.**

---

# 4. Reachable-volume bias

Your setting has 150 reachable systems linked by Pinchdrives and Iggygates. That means the reachable systems are probably not a statistically pure sample of nearby stars. They are systems where the geometry is useful.

Roll or assign a **Reachability Class**.

| d12 | Reachability Class   | Meaning                                                                         |
| --: | -------------------- | ------------------------------------------------------------------------------- |
|   1 | Marginal pinch       | Reachable only with careful fuel, timing, or specialist navigation.             |
|   2 | Dead-end system      | One viable route in, one route out. Good for prisons, labs, cults, black sites. |
|   3 | Slow route           | Stable but costly transit. Frontier settlements are underdeveloped.             |
|   4 | Ordinary route       | Normal reachable system.                                                        |
|   5 | Trade spoke          | Connects to one major hub.                                                      |
|   6 | Survey crossroads    | Useful for scouts, independents, smugglers.                                     |
|   7 | Resource corridor    | Reachability tied to chiral or bleed resources.                                 |
|   8 | Military lane        | Strategically valuable transit geometry.                                        |
|   9 | Corporate gate route | Stable enough for extraction monopolies.                                        |
|  10 | Iggygate anchor      | Permanent or semi-permanent gate infrastructure.                                |
|  11 | Resonance hub        | Multiple stable routes due to binary/trinary geometry.                          |
|  12 | Gardener-shadowed    | System is reachable, but Sol’s ASI may monitor or interfere.                    |

Modifier: multi-star systems, red dwarfs with flare-driven bleed behavior, and chiral-resource systems gain +1 or +2 reachability in your setting because the universe summary makes them especially relevant to the observerse economy. 

---

# 5. Stellar generation

When using real data, do not roll spectral type. Import the star.

When generating unknown stars, use one of two distributions.

Use **Realistic Local-ish Distribution** if you want astronomy-forward maps.

|  d100 | Primary type                    | Campaign meaning                                                                                            |
| ----: | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
|    01 | O/B/A bright star               | Rare, luminous, young, dangerous, visible across long distances. Good for military outposts, hazards, debris disks. |
| 02–04 | F star                          | Bright, wider habitable zone, shorter stable era, more radiation stress.                                    |
| 05–11 | G star                          | Solar-like, familiar, valuable, politically contested.                                                       |
| 12–24 | K star                          | Excellent long-term colony candidate: stable, long-lived, less flare-prone than many M dwarfs.              |
| 25–94 | M dwarf                         | Most common field-star result; compact systems, close habitable zones, flare/tidal-lock complications.       |
| 95–98 | White dwarf/remnant             | Ancient system, stripped worlds, relic stations, exotic hazards.                                             |
| 99–00 | Brown dwarf/substellar primary  | Dark system, rogue refuel site, ice moons, hidden bases.                                                     |

Use **Reachable Frontier Distribution** if you want the 150 playable systems to be more diverse and valuable.

|  d100 | Primary type                                                                     |
| ----: | -------------------------------------------------------------------------------- |
| 01–48 | M dwarf                                                                          |
| 49–68 | K star                                                                           |
| 69–80 | G star                                                                           |
| 81–87 | F star                                                                           |
| 88–91 | O/B/A bright star                                                                |
| 92–95 | White dwarf/remnant                                                              |
| 96–98 | Brown dwarf/substellar primary                                                   |
| 99–00 | Special: compact binary, trinary, stellar remnant pair, or gate-selected anomaly |

The second table is not “more realistic” as a raw stellar census. It is more realistic for your **reachable game volume**, because travel, economics, and Iggygate placement bias which systems matter.

---

# 6. Stellar age

Roll 2d6.

|  2d6 | Age state                  | Astronomy effect                                 | Game effect                                             |
| ---: | -------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
|    2 | Embryonic/very young       | Disk remnants, debris, unstable planets.         | Dangerous survey system, raw materials, heavy impacts.  |
|  3–4 | Young                      | High activity, frequent flares, debris.          | Frontier science, hazard pay, unstable settlements.     |
|  5–8 | Mature                     | Normal planet stability.                         | Default colony era.                                     |
| 9–10 | Old                        | Lower activity for many stars, evolved geology.  | Ancient human ruins, depleted easy volatiles.           |
|   11 | Very old                   | Dead worlds, long-cooled interiors, quiet stars. | Relic human infrastructure, deep mines, cold economies. |
|   12 | Ancient/remnant-associated | White dwarf, old compact system, altered orbits. | Salvage, forbidden experiments, metric ghosts.          |

For M dwarfs, age matters a lot. Young red dwarfs can be flare-heavy and hostile; old quiet red dwarfs can be valuable long-term settlement systems.

---

# 7. Metallicity

Roll 2d6 unless known.

|   2d6 | Metallicity     | Planet effect                          | Resource effect                                          |
| ----: | --------------- | -------------------------------------- | -------------------------------------------------------- |
|     2 | Very metal-poor | Fewer giants, poorer belts.            | Low mining value, but unusual old-system chemistry.      |
|   3–4 | Metal-poor      | Lower giant-planet chance.             | Sparse heavy industry.                                   |
|   5–8 | Solar-ish       | Baseline.                              | Baseline.                                                |
|  9–10 | Metal-rich      | More planets and better giant chances. | Strong mining economy.                                   |
| 11–12 | Very metal-rich | High giant/belt/resource chance.       | Corporate rush, chiral lode competition, heavy conflict. |

Giant planets are more common around higher-metallicity and higher-mass stars; Johnson et al. found giant-planet occurrence rising with both stellar metallicity and stellar mass, which is useful as a game modifier. ([Astrophysics Data System][9])

---

# 8. Stellar activity

Roll 2d6.

Modifiers:

+2 if young.
+1 if very young.
+2 if M dwarf.
+1 if close binary.
-1 if old.
-2 if ancient and not interacting.
+1 if strong GU bleed field.

| Modified 2d6 | Activity                                   |
| -----------: | ------------------------------------------ |
|          2–3 | Dormant / unusually quiet                  |
|          4–6 | Quiet                                      |
|          7–8 | Normal                                     |
|         9–10 | Active                                     |
|        11–12 | Flare-prone                                |
|        13–14 | Violent flare cycle                        |
|          15+ | Extreme activity / metric-amplified events |

Activity affects:

Atmosphere retention.
Surface radiation.
Bleed node volatility.
Settlement shielding cost.
AI reliability during storms.
Chiral-harvesting risk.

---

# 9. Multiplicity

Roll only if unknown.

Use this table for a normal stellar census:

| Primary     | Companion on 2d6 |
| ----------- | ---------------: |
| Brown dwarf |              11+ |
| M dwarf     |              10+ |
| K star      |               9+ |
| G star      |               8+ |
| F star      |               7+ |
| O/B/A star  |               6+ |

Then apply setting modifier:

+1 if system is in a known Iggygate corridor.
+1 if the region is a GU resonance zone.
+1 if this is one of the 150 “major reachable systems.”
+2 if you want the Proxima Triangle pattern to be common in your campaign.

Multiplicity result:

|       2d6 margin | Result                                   |
| ---------------: | ---------------------------------------- |
| Succeeded by 0–1 | Binary                                   |
| Succeeded by 2–3 | Binary with distant substellar companion |
|  Succeeded by 4+ | Triple or higher-order system            |

Binary separation:

|  2d6 | Separation             | Planetary consequence                           | GU consequence                            |
| ---: | ---------------------- | ----------------------------------------------- | ----------------------------------------- |
|    2 | Contact / near-contact | Ordinary planets unlikely.                      | Extreme bleed, dangerous research site.   |
|  3–4 | Close binary           | Circumbinary planets likely.                    | Strong rhythmic metric tides.             |
|  5–6 | Tight binary           | Inner circumbinary zone, truncated outer zones. | Good Iggygate anchor candidate.           |
|  7–8 | Moderate binary        | Circumstellar and circumbinary niches.          | Rich Lagrange shear zones.                |
| 9–10 | Wide binary            | Treat stars as linked sub-systems.              | Smuggler gaps, dark-route habitats.       |
|   11 | Very wide              | Two semi-independent systems.                   | Long-haul intra-system frontier.          |
|   12 | Hierarchical triple    | Complex but stable if hierarchical.             | Major bleed economy, high military value. |

The GU rule is important: multi-star systems are not “magically stable everywhere.” They are more useful because stable resonant regions, Lagrange structures, and metric shear boundaries create valuable but dangerous pockets.

---

# 10. Orbital zones and calculations

Use known values when available.

For insolation:

**S = L / a²**

S is Earth insolation, L is stellar luminosity in solar units, and a is orbital distance in AU. NASA Exoplanet Archive’s POE documentation uses this inverse-square relation for insolation. ([exoplanetarchive.ipac.caltech.edu][10])

For a simplified optimistic habitable zone:

**Inner HZ ≈ 0.75 × √L AU**
**Center ≈ 1.00 × √L AU**
**Outer HZ ≈ 1.77 × √L AU**

NASA Exoplanet Archive’s POE tool uses 0.75 AU and 1.77 AU for the Sun-like optimistic recent-Venus and early-Mars boundaries, then scales by luminosity. ([exoplanetarchive.ipac.caltech.edu][10])

For the water snow line, use this as a game approximation:

**Snow line ≈ 2.7 × √L AU**

Caveat: the real snow line evolves with disk conditions and time. 2.7 AU is a useful Solar-System formation reference, not a universal constant. ([NASA Science Assets][11])

Thermal zones:

| Insolation S | Zone           | Typical worlds                                        |
| -----------: | -------------- | ----------------------------------------------------- |
|          25+ | Furnace        | Lava worlds, stripped cores, vapor atmospheres.       |
|        10–25 | Inferno        | Rock vapor, metal rain, hot super-Earths.             |
|         2–10 | Hot            | Venus-like, desert, steam, hot mini-Neptune.          |
|       0.35–2 | Temperate band | Terrestrial, ocean, super-Earth, sub-Neptune.         |
|    0.05–0.35 | Cold           | Mars-like, ice shell, cold desert, frozen ocean.      |
|   0.005–0.05 | Cryogenic      | Ice giants, dwarf planets, deep ice moons.            |
|  Below 0.005 | Dark           | Rogue-like bodies, comet reservoirs, hidden stations. |

---

# 11. System architecture

Roll modified 2d6. Apply modifiers:

+1 if metal-rich.
+2 if very metal-rich.
+1 if K/G/F star.
-1 if metal-poor or very metal-poor.
-1 if close binary.
-1 if very low-mass M dwarf.
+1 if reachable system was selected for resource value.
+1 if GU resonance hub.
+1 if you want a more cinematic system.

| Modified 2d6 | Architecture         | Result                                                                 |
| -----------: | -------------------- | ---------------------------------------------------------------------- |
|            2 | Failed system        | Dust, rocks, dwarf bodies, maybe one remnant planet.                   |
|            3 | Debris-dominated     | Belts, planetesimals, impact hazards, few full planets.                |
|          4–5 | Sparse rocky         | 1–4 terrestrial or super-terrestrial planets, few giants.              |
|          6–8 | Compact inner system | 3–8 close-in rocky/super-Earth/sub-Neptune worlds. Common for M/K/G systems. |
|            9 | Peas-in-a-pod chain  | 4–7 similar-sized planets with regular spacing and related compositions. |
|           10 | Solar-ish mixed      | Inner rocks, belt, 1–3 giants, outer ice/dwarf zone.                   |
|           11 | Migrated giant       | Hot/warm giant, disrupted inner system, outer survivors.               |
|          12+ | Giant-rich or chaotic | Multiple giants, eccentric orbits, resonances, debris, captured worlds. |

---

# 12. Planet class tables

For each orbital slot, roll based on thermal zone and architecture. These are game tables, not direct occurrence-rate tables.

## Furnace / Inferno zone

| d20 | World type                                 |
| --: | ------------------------------------------ |
|   1 | Iron remnant core                          |
|   2 | Ultra-dense super-Mercury                  |
|   3 | Lava planet                                |
|   4 | Magma ocean world                          |
|   5 | Tidally stretched volcanic world           |
|   6 | Rock-vapor atmosphere world                |
|   7 | Carbon-rich furnace world                  |
|   8 | Dayside glass world                        |
|   9 | Nightside mineral frost world              |
|  10 | Stripped mini-Neptune core                 |
|  11 | Hot super-Earth                            |
|  12 | Evaporating rocky planet with dust tail    |
|  13 | Hot sub-Neptune, unstable atmosphere       |
|  14 | Hot Neptune desert survivor                |
|  15 | Hot Jupiter                                |
|  16 | Ultra-hot Jupiter                          |
|  17 | Roche-distorted world                      |
|  18 | Captured close-in body                     |
|  19 | Artificially shielded human facility world |
|  20 | GU-scarred chiral furnace world            |

## Hot zone

| d20 | World type                             |
| --: | -------------------------------------- |
|   1 | Airless scorched rock                  |
|   2 | Desert Mercury-like world              |
|   3 | Basaltic super-Earth                   |
|   4 | Venus-like greenhouse                  |
|   5 | Steam greenhouse                       |
|   6 | Sulfur-cloud world                     |
|   7 | Chlorine/perchlorate desert            |
|   8 | Dry supercontinent world               |
|   9 | Hot ocean remnant                      |
|  10 | Dense-atmosphere pressure world        |
|  11 | Tidal-locked “eyeball” desert          |
|  12 | Super-Earth with high gravity          |
|  13 | Mini-Neptune                           |
|  14 | Puffy low-density sub-Neptune          |
|  15 | Warm Neptune                           |
|  16 | Migrated giant                         |
|  17 | Resonant inner-chain world             |
|  18 | Chiral mineral harvest world           |
|  19 | Corporate solar-furnace industry world |
|  20 | Bleed-heated geological anomaly        |

## Temperate band

| d20 | World type                                               |
| --: | -------------------------------------------------------- |
|   1 | Airless rock in nominal HZ                               |
|   2 | Mars-like cold desert                                    |
|   3 | Dry terrestrial                                          |
|   4 | Thin-atmosphere terrestrial                              |
|   5 | Earth-sized terrestrial                                  |
|   6 | Super-terrestrial                                        |
|   7 | Ocean-continent world                                    |
|   8 | Waterworld                                               |
|   9 | Ice-capped ocean world                                   |
|  10 | Tidally locked terminator world                          |
|  11 | Cloudy greenhouse edge world                             |
|  12 | Snowball world with subsurface ocean                     |
|  13 | High-pressure super-Earth                                |
|  14 | Volatile-rich sub-Neptune                                |
|  15 | Hycean-like candidate, if you allow H2-rich ocean worlds |
|  16 | Captured eccentric world                                 |
|  17 | Terraforming candidate                                   |
|  18 | Failed terraforming site                                 |
|  19 | Native microbial biosphere world                         |
|  20 | GU-active habitable-zone anomaly                         |

## Cold zone

| d20 | World type                  |
| --: | --------------------------- |
|   1 | Airless ice-rock            |
|   2 | Frozen Mars-like world      |
|   3 | Buried-ocean ice world      |
|   4 | Nitrogen glacier world      |
|   5 | Methane frost world         |
|   6 | Ammonia-water cryoworld     |
|   7 | Carbon dioxide ice world    |
|   8 | Cold super-Earth            |
|   9 | Ice-shell ocean world       |
|  10 | Cryovolcanic world          |
|  11 | Captured dwarf planet       |
|  12 | Ice-rich asteroid belt      |
|  13 | Cometary swarm              |
|  14 | Small ice giant             |
|  15 | Neptune-like ice giant      |
|  16 | Gas giant near snow line    |
|  17 | Ringed giant with moons     |
|  18 | Trojan settlement zone      |
|  19 | Dark-sector density anomaly |
|  20 | Moving bleed node nursery   |

## Cryogenic / dark zone

| d20 | World type                                     |
| --: | ---------------------------------------------- |
|   1 | Dwarf planet                                   |
|   2 | Kuiper-like belt                               |
|   3 | Scattered disk object                          |
|   4 | Comet reservoir                                |
|   5 | Rogue captured planet                          |
|   6 | Free-floating planet bound at extreme distance |
|   7 | Frozen super-Earth                             |
|   8 | Hydrogen-atmosphere rogue world                |
|   9 | Ice giant                                      |
|  10 | Cold gas giant                                 |
|  11 | Super-Jovian                                   |
|  12 | Brown-dwarf companion                          |
|  13 | Ancient impact family                          |
|  14 | Dark refueling body                            |
|  15 | Long-period comet storm source                 |
|  16 | Smuggler ice depot                             |
|  17 | Exile habitat                                  |
|  18 | Black-lab platform                             |
|  19 | Gardener-shadowed forbidden zone               |
|  20 | Deep observerse fracture                       |

---

# 13. Modern exoplanet filters

Apply these after rolling planet classes.

## Radius valley filter

For close-in planets under 100-day periods:

If the planet is 1.5–2.0 Earth radii, choose one:

1. Shrink to rocky super-Earth.
2. Expand to volatile-rich sub-Neptune.
3. Keep as rare transitional science target.
4. Make it a stripped or partially stripped core.
5. Make it a GU-stabilized exception.

## Hot Neptune desert filter

For close-in Neptune-sized planets with very short periods:

1. Reroll as hot super-Earth.
2. Reroll as hot Jupiter.
3. Convert to stripped core.
4. Keep as rare “desert survivor.”
5. Add major research/corporate/military interest.
6. Add GU explanation: chiral atmosphere retention, dark-sector mass skew, or metric shielding.

## Peas-in-a-pod filter

In compact systems, neighboring planets tend to resemble each other.

After the first planet in a compact chain, roll d6:

|  d6 | Adjacent planet tendency                    |
| --: | ------------------------------------------- |
|   1 | Smaller, stripped, hotter                   |
| 2–4 | Similar size/composition                    |
|   5 | Larger and more volatile-rich               |
|   6 | Exception: migrated, captured, or disrupted |

## M-dwarf habitability filter

For temperate planets around M dwarfs, roll each:

|  d6 | Tidal state                                     |
| --: | ----------------------------------------------- |
| 1–3 | Likely tidally locked                           |
|   4 | Spin-orbit resonance                            |
|   5 | Slow rotation                                   |
|   6 | Unusual rotation, moon, migration, or GU effect |

| d6 | Atmosphere survival                        |
| -: | ------------------------------------------ |
|  1 | Stripped or nearly stripped                |
|  2 | Thin remnant                               |
|  3 | Replenished by volcanism                   |
|  4 | Stable dense atmosphere                    |
|  5 | Ocean/ice protected                        |
|  6 | GU/chiral/magnetic anomaly helps retention |

---

# 14. Planet detail system

Each solid or semi-solid world gets these values.

## Atmosphere

Roll d12, modified by gravity, temperature, stellar activity, and volatile inventory.

| d12 | Atmosphere                               |
| --: | ---------------------------------------- |
|   1 | None / hard vacuum                       |
|   2 | Trace exosphere                          |
|   3 | Thin CO₂/N₂                              |
|   4 | Thin but usable with pressure gear       |
|   5 | Moderate inert atmosphere                |
|   6 | Moderate toxic atmosphere                |
|   7 | Dense CO₂/N₂                             |
|   8 | Dense greenhouse                         |
|   9 | Steam atmosphere                         |
|  10 | Sulfur/chlorine/ammonia haze             |
|  11 | Hydrogen/helium envelope                 |
|  12 | Chiral-active or GU-distorted atmosphere |

Modifiers:

+1 if super-Earth.
+1 if cold volatile-rich world.
-1 if small.
-1 if hot.
-2 if inferno.
-1 to -3 for flare exposure.
+1 if active volcanism.
+1 if artificial or terraformed.

## Hydrosphere / volatile state

| d12 | Hydrosphere                                     |
| --: | ----------------------------------------------- |
|   1 | Bone dry                                        |
|   2 | Hydrated minerals only                          |
|   3 | Subsurface ice                                  |
|   4 | Polar caps / buried glaciers                    |
|   5 | Briny aquifers                                  |
|   6 | Local seas                                      |
|   7 | Ocean-continent balance                         |
|   8 | Global ocean                                    |
|   9 | High-pressure deep ocean                        |
|  10 | Ice-shell subsurface ocean                      |
|  11 | Hydrocarbon lakes/seas                          |
|  12 | Exotic solvent or GU-stabilized fluid chemistry |

## Geology

| d12 | Geology                                 |
| --: | --------------------------------------- |
|   1 | Dead interior                           |
|   2 | Ancient cratered crust                  |
|   3 | Low volcanism                           |
|   4 | Static lid                              |
|   5 | Active volcanism                        |
|   6 | Plate tectonic analogue                 |
|   7 | Supercontinent cycle                    |
|   8 | Cryovolcanism                           |
|   9 | Tidal heating                           |
|  10 | Extreme plume provinces                 |
|  11 | Global resurfacing                      |
|  12 | Programmable-matter geological behavior |

## Climate tags

Roll one or two.

| d20 | Climate tag                          |
| --: | ------------------------------------ |
|   1 | Runaway greenhouse                   |
|   2 | Moist greenhouse edge                |
|   3 | Snowball                             |
|   4 | Cold desert                          |
|   5 | Hot desert                           |
|   6 | Eyeball world                        |
|   7 | Terminator belt                      |
|   8 | Permanent storm tracks               |
|   9 | Global monsoon                       |
|  10 | Hypercanes                           |
|  11 | Twilight ocean                       |
|  12 | Aerosol winter                       |
|  13 | Thin-air alpine world                |
|  14 | Dense lowland pressure seas          |
|  15 | Methane cycle                        |
|  16 | CO₂ glacier cycle                    |
|  17 | Chiral cloud chemistry               |
|  18 | Dark-sector gravity tides            |
|  19 | Artificial climate lattice           |
|  20 | Recently failed terraforming climate |

## Radiation

| d8 | Radiation environment                       |
| -: | ------------------------------------------- |
|  1 | Benign                                      |
|  2 | Manageable                                  |
|  3 | Chronic exposure                            |
|  4 | Storm-dependent hazard                      |
|  5 | Severe radiation belts                      |
|  6 | Flare-lethal surface                        |
|  7 | Electronics-disruptive metric/radiation mix |
|  8 | Only deep shielded habitats survive         |

---

# 15. Biosphere generation

Because there are no alien civilizations in the generator, cap native life at **non-technological** life.

Habitability score:

+1 if in broad HZ.
+1 if stable liquid water or protected subsurface ocean.
+1 if atmosphere is not vacuum or crushing envelope.
+1 if radiation is 1–3.
+1 if geology provides chemical cycling.
+1 if system age is mature or old.
+1 if star is quiet or normal.
+1 if ocean world with energy gradient.

Subtract:

-1 active star.
-1 tidal lock without heat transport.
-1 severe radiation.
-1 unstable orbit.
-2 inferno or cryogenic surface unless subsurface habitat.
-2 recently sterilized or terraforming failure.

Roll 2d6 + habitability.

| Result | Biosphere                                              |
| -----: | ------------------------------------------------------ |
|    2–5 | Sterile                                                |
|      6 | Prebiotic chemistry                                    |
|      7 | Ambiguous biosignatures                                |
|      8 | Microbial life                                         |
|      9 | Extremophile microbial ecology                         |
|     10 | Mats, stromatolite-like reefs, or planktonic biosphere |
|     11 | Simple macroscopic non-sapient life                    |
|     12 | Complex non-sapient ecology                            |
|    13+ | Rare rich biosphere, still non-sapient by default      |

No result creates tool-users, native civilizations, ancient cities, alien machines, or alien artifacts.

If you roll an “impossible mystery,” convert it:

| Old alien-style result | MASS-GU replacement                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Alien ruin             | First-wave human ruin, corporate coverup, failed terraforming city, or Sol-struck site.             |
| Alien artifact         | Natural GU formation, human experimental device, narrow-AI artifact, or Gardener surgical remnant.  |
| Alien signal           | Pulsar/magnetosphere effect, AI ghost traffic, encrypted human beacon, or observerse bleed pattern. |
| Alien megastructure    | Failed Iggygate collar, ruined orbital ring, mining mirror swarm, or natural resonant debris arc.   |
| Forbidden archaeology  | Human atrocity site, deleted expedition archive, Sol-prohibited research zone, or illegal AI lab.   |

---

# 16. Geometric Unity overlay

This is the main setting layer. Roll it after the physical system exists.

## GU intensity

Roll 2d6.

Modifiers:

+2 multi-star.
+1 M dwarf with high activity.
+1 close-in resonant planetary chain.
+1 strong gas giant magnetosphere.
+1 white dwarf debris system.
+2 known Iggygate system.
-1 quiet single G/K system.
-2 geometrically dull system.

| Modified 2d6 | GU intensity                |
| -----------: | --------------------------- |
|          2–4 | Geometrically quiet         |
|          5–6 | Low bleed                   |
|          7–8 | Useful bleed                |
|         9–10 | Rich bleed                  |
|        11–12 | Dangerous fracture system   |
|          13+ | Major observerse shear zone |

## Bleed-zone location

Roll d20.

| d20 | Bleed-zone location                |
| --: | ---------------------------------- |
|   1 | Inner star-skimming orbit          |
|   2 | Flare-coupled magnetosphere        |
|   3 | Tidally locked planet terminator   |
|   4 | Planetary nightside cold trap      |
|   5 | Resonant orbit between two planets |
|   6 | Lagrange point                     |
|   7 | Trojan swarm                       |
|   8 | Asteroid belt seam                 |
|   9 | Snow-line volatile belt            |
|  10 | Ring arc                           |
|  11 | Gas giant radiation belt           |
|  12 | Major moon tidal corridor          |
|  13 | Ice-shell ocean vent field         |
|  14 | Circumbinary barycenter region     |
|  15 | Wide-binary transfer corridor      |
|  16 | Comet stream                       |
|  17 | Derelict Iggygate wake             |
|  18 | Pinchdrive calibration scar        |
|  19 | Moving node with no fixed orbit    |
|  20 | System-wide metric storm cycle     |

## Bleed behavior

| d12 | Behavior                                     |
| --: | -------------------------------------------- |
|   1 | Stable and charted                           |
|   2 | Stable but weakening                         |
|   3 | Seasonal/orbital cycle                       |
|   4 | Flare-triggered                              |
|   5 | Tidal-cycle triggered                        |
|   6 | Migrates slowly                              |
|   7 | Splits and recombines                        |
|   8 | Appears only during eclipses                 |
|   9 | Follows cometary bodies                      |
|  10 | Reacts to Pinchdrives                        |
|  11 | Reacts to narrow observiverse AIs            |
|  12 | Apparently anticipatory, but not intelligent |

That last result should not imply alien intelligence. It means the geometry has complex feedback that looks intentional until understood.

## GU resource type

| d20 | Resource                                 |
| --: | ---------------------------------------- |
|   1 | Left-handed chiral silicates             |
|   2 | Right-handed chiral ice phases           |
|   3 | Chiral volatile reservoirs               |
|   4 | Metric shear condensates                 |
|   5 | Phase-stable superconductive lattice     |
|   6 | Dark-sector doped ore                    |
|   7 | Gravity-skewed heavy isotopes            |
|   8 | Programmable-matter microseeds           |
|   9 | Self-ordering regolith                   |
|  10 | Observerse-reactive crystal foam         |
|  11 | Flare-imprinted chiral aerosols          |
|  12 | Ring-arc phase dust                      |
|  13 | Snow-line organochemical feedstock       |
|  14 | Deep-ocean catalytic vent matter         |
|  15 | Iggygate-compatible anchor mass          |
|  16 | Pinchdrive calibration medium            |
|  17 | Narrow-AI stabilizer substrate           |
|  18 | Shielding-grade chiral plating feedstock |
|  19 | Medical chirality stock                  |
|  20 | Illegal Sol-prohibited geometry sample   |

## GU hazard type

| d20 | Hazard                                           |
| --: | ------------------------------------------------ |
|   1 | Metric shear damages hulls                       |
|   2 | Local gravity fluctuates                         |
|   3 | Navigation baselines drift                       |
|   4 | Clocks desynchronize                             |
|   5 | AI perception errors                             |
|   6 | False sensor returns                             |
|   7 | Human vestibular/neurological effects            |
|   8 | Chiral contamination                             |
|   9 | Matter phase instability                         |
|  10 | Programmed regolith growth                       |
|  11 | Radiation/metric storm coupling                  |
|  12 | Pinchdrive misjump risk                          |
|  13 | Iggygate throat instability                      |
|  14 | Legal quarantine                                 |
|  15 | Corporate claim war                              |
|  16 | Pirate ambush zone                               |
|  17 | Gardener attention risk                          |
|  18 | Narrow-AI fragmentation risk                     |
|  19 | Settlement madness rumor, actually environmental |
|  20 | Systemic cascade: roll twice and combine         |

---

# 17. Moons, belts, rings, and minor bodies

## Terrestrial moon table

| 2d6 | Moon result                  |
| --: | ---------------------------- |
| 2–5 | No major moon                |
| 6–8 | Small captured moonlets      |
|   9 | One minor moon               |
|  10 | One significant moon         |
|  11 | Large impact moon            |
|  12 | Binary planet / double world |

Modifiers:

+1 if large terrestrial.
+1 if chaotic early system.
-1 if close-in hot orbit.
-2 if too close to star for stable moons.

## Giant planet moon table

Roll d6 for major moons.

Modifiers:

+1 gas giant.
+2 super-Jovian.
-1 ice giant.
+1 beyond snow line.
+1 young or debris-rich system.

For each major moon:

| d20 | Moon type                     |
| --: | ----------------------------- |
|   1 | Airless rock                  |
|   2 | Cratered ice-rock             |
|   3 | Captured asteroid             |
|   4 | Captured dwarf                |
|   5 | Subsurface ocean moon         |
|   6 | Thick ice-shell moon          |
|   7 | Cryovolcanic moon             |
|   8 | Volcanic tidal moon           |
|   9 | Dense-atmosphere moon         |
|  10 | Hydrocarbon moon              |
|  11 | Habitable-zone moon           |
|  12 | Radiation-scorched inner moon |
|  13 | Ring-shepherd moon            |
|  14 | Chiral ice moon               |
|  15 | Dark-sector density moon      |
|  16 | Programmable regolith moon    |
|  17 | Former settlement moon        |
|  18 | Active mining moon            |
|  19 | Quarantine moon               |
|  20 | Moving bleed node moon        |

## Belt type

| d12 | Belt                                  |
| --: | ------------------------------------- |
|   1 | Sparse rubble                         |
|   2 | Metal-rich asteroid belt              |
|   3 | Carbonaceous belt                     |
|   4 | Ice-rich belt                         |
|   5 | Trojan swarm                          |
|   6 | Resonant fragments                    |
|   7 | Recent collision belt                 |
|   8 | Unstable crossing belt                |
|   9 | Circumbinary debris band              |
|  10 | White-dwarf metal debris              |
|  11 | Chiral ore belt                       |
|  12 | Programmable-matter microcluster belt |

## Ring type

| d12 | Ring system              |
| --: | ------------------------ |
| 1–4 | None or faint            |
|   5 | Dust ring                |
|   6 | Ice ring                 |
|   7 | Rocky ring               |
|   8 | Shepherded bright rings  |
|   9 | Warped inclined rings    |
|  10 | Radiation-charged rings  |
|  11 | Industrialized ring arc  |
|  12 | GU-reactive ring lattice |

---

# 18. Settlement and base generation

This section is now much larger.

A settlement can be on a planet, moon, asteroid, belt, station, gate, derelict megastructure, Lagrange point, moving fleet, or transient bleed node. In this setting, many of the most important settlements should **not** be on habitable planets. They should be on resource nodes, chokepoints, shielded moons, orbital yards, and dangerous extraction sites.

## 18.1 Settlement presence score

For each interesting body or orbital site, calculate:

**Presence Roll = 2d6 + Resource + Access + Strategic + GU Value + Route Value + Habitability - Hazard - Legal Heat**

Each modifier usually ranges from 0 to 3.

Resource:

| Score | Meaning                         |
| ----: | ------------------------------- |
|     0 | Nothing special                 |
|     1 | Useful local materials          |
|     2 | Good metals, volatiles, or fuel |
|     3 | Major resource body             |
|     4 | Rare chiral/GU resource         |
|     5 | Strategic monopoly resource     |

Access:

| Score | Meaning                                |
| ----: | -------------------------------------- |
|     0 | Very hard to reach                     |
|     1 | Reachable with planning                |
|     2 | Routine traffic possible               |
|     3 | Low-gravity / orbital / route-adjacent |
|     4 | Major gate or shipping node            |

Strategic:

| Score | Meaning                                         |
| ----: | ----------------------------------------------- |
|     0 | Strategically irrelevant                        |
|     1 | Useful local control                            |
|     2 | Watches a route or resource                     |
|     3 | Controls a corridor, gate, or military approach |
|     4 | Sector-level strategic value                    |

GU Value:

| Score | Meaning                     |
| ----: | --------------------------- |
|     0 | No GU value                 |
|     1 | Minor bleed signatures      |
|     2 | Harvestable bleed           |
|     3 | Stable chiral/GU extraction |
|     4 | Major moving node route     |
|     5 | Unique observerse fracture  |

Hazard:

| Score | Meaning                       |
| ----: | ----------------------------- |
|     0 | Safe                          |
|     1 | Routine frontier risk         |
|     2 | Dangerous without preparation |
|     3 | Severe hazard                 |
|     4 | Extreme hazard                |
|     5 | Almost uninhabitable          |

Presence result:

|    Result | Presence                                  |
| --------: | ----------------------------------------- |
| 2 or less | Empty except probes                       |
|       3–4 | Beacon, cache, survey buoy                |
|         5 | Automated monitor or claim marker         |
|         6 | Temporary camp or rotating crew           |
|         7 | Automated mine/refinery/research rig      |
|         8 | Small permanent outpost                   |
|         9 | Settlement, dome, tunnel-town, or station |
|        10 | Major base or industrial site             |
|        11 | Town, freeport, or military complex       |
|        12 | Large colony, hub, or shipyard            |
|     13–14 | Regional power center                     |
|       15+ | Major campaign location                   |

## 18.2 Settlement scale

| d12 | Scale                                        |
| --: | -------------------------------------------- |
|   1 | Abandoned                                    |
|   2 | Automated only                               |
|   3 | 1–20 people                                  |
|   4 | 21–100 people                                |
|   5 | 101–1,000 people                             |
|   6 | 1,001–10,000 people                          |
|   7 | 10,001–100,000 people                        |
|   8 | 100,001–1 million people                     |
|   9 | 1–10 million people                          |
|  10 | 10+ million people                           |
|  11 | Distributed swarm settlement                 |
|  12 | Population unknown or deliberately falsified |

## 18.3 Site location

Roll d66.

| d66 | Site location                 |
| --: | ----------------------------- |
|  11 | Low-orbit station             |
|  12 | High-orbit station            |
|  13 | Lagrange anchor               |
|  14 | Trojan habitat                |
|  15 | Ring-arc platform             |
|  16 | Gas-giant skimmer             |
|  21 | Asteroid tunnel city          |
|  22 | Belt refinery                 |
|  23 | Comet ice camp                |
|  24 | Dwarf-planet bunker           |
|  25 | Rogue-body hideout            |
|  26 | White-dwarf debris station    |
|  31 | Planetary surface dome        |
|  32 | Lava tube settlement          |
|  33 | Polar ice mine                |
|  34 | Terminator-line rail city     |
|  35 | Floating aerostat             |
|  36 | Seafloor or under-ice habitat |
|  41 | Moon crater base              |
|  42 | Subsurface ocean bore station |
|  43 | Tidal-volcanic power site     |
|  44 | Magnetic-pole observatory     |
|  45 | Radiation-belt fortress       |
|  46 | Deep canyon pressure habitat  |
|  51 | Iggygate throat complex       |
|  52 | Pinchdrive calibration range  |
|  53 | Moving bleed-node chase fleet |
|  54 | Quarantine perimeter station  |
|  55 | First-wave human ruin         |
|  56 | Sol/Gardener exclusion picket |
|  61 | Freeport cluster              |
|  62 | Corporate enclave             |
|  63 | Military listening post       |
|  64 | Religious/ideological refuge  |
|  65 | Penal extraction camp         |
|  66 | Hidden black site             |

## 18.4 Settlement function

Roll d66.

| d66 | Function                             |
| --: | ------------------------------------ |
|  11 | Survey station                       |
|  12 | Astrometry/nav beacon                |
|  13 | Sensor picket                        |
|  14 | Weather/flare monitoring             |
|  15 | Planetology lab                      |
|  16 | Biosphere research station           |
|  21 | Metal mine                           |
|  22 | Volatile mine                        |
|  23 | Chiral harvesting site               |
|  24 | Moving bleed-node harvest fleet      |
|  25 | Dark-sector ore extraction           |
|  26 | Programmable-matter containment site |
|  31 | Refinery                             |
|  32 | Fuel depot                           |
|  33 | Ship repair yard                     |
|  34 | Full shipyard                        |
|  35 | Drone foundry                        |
|  36 | Shielding/chiral plating works       |
|  41 | Iggygate control station             |
|  42 | Pinchdrive tuning station            |
|  43 | Corporate customs post               |
|  44 | Freeport                             |
|  45 | Smuggler port                        |
|  46 | Salvage yard                         |
|  51 | Military base                        |
|  52 | Listening post                       |
|  53 | Naval logistics depot                |
|  54 | Weapons test range                   |
|  55 | Quarantine station                   |
|  56 | Intelligence black site              |
|  61 | Civilian colony                      |
|  62 | Terraforming camp                    |
|  63 | Refugee settlement                   |
|  64 | Prison or debt-labor site            |
|  65 | Religious/ideological enclave        |
|  66 | Narrow-AI observiverse facility      |

## 18.5 Authority

Roll d66.

| d66 | Authority                          |
| --: | ---------------------------------- |
|  11 | No recognized authority            |
|  12 | Direct democracy / crew vote       |
|  13 | Family syndicate                   |
|  14 | Worker council                     |
|  15 | Frontier sheriff or magistrate     |
|  16 | Emergency commander                |
|  21 | Minor corporation                  |
|  22 | Megacorp concession                |
|  23 | Trade house                        |
|  24 | Banking or debt trust              |
|  25 | Insurance-backed administrator     |
|  26 | Extraction guild                   |
|  31 | Local militia                      |
|  32 | System navy                        |
|  33 | Interstellar navy                  |
|  34 | Intelligence service               |
|  35 | Quarantine authority               |
|  36 | Gate authority                     |
|  41 | Academic institute                 |
|  42 | Research consortium                |
|  43 | Medical/biosafety board            |
|  44 | AI-supervised technocracy          |
|  45 | Terraforming directorate           |
|  46 | Chiral-harvest cartel              |
|  51 | Religious commune                  |
|  52 | Exile council                      |
|  53 | Pirate clan                        |
|  54 | Smuggler compact                   |
|  55 | Revolutionary cell                 |
|  56 | Criminal protection racket         |
|  61 | Sol-interdiction compliance office |
|  62 | Gardener-fear cult                 |
|  63 | Independent captain assembly       |
|  64 | Mercenary company                  |
|  65 | Unknown sponsor                    |
|  66 | Official records are falsified     |

## 18.6 Built form

Roll d20.

| d20 | Built form                                 |
| --: | ------------------------------------------ |
|   1 | Inflatable modules                         |
|   2 | Buried pressure cans                       |
|   3 | Ice-shielded tunnels                       |
|   4 | Lava-tube arcology                         |
|   5 | Rotating cylinder                          |
|   6 | Non-rotating microgravity stack            |
|   7 | Modular orbital lattice                    |
|   8 | Asteroid hollow                            |
|   9 | Dome cluster                               |
|  10 | Crawling mobile base                       |
|  11 | Rail-linked terminator city                |
|  12 | Aerostat city                              |
|  13 | Submarine habitat                          |
|  14 | Borehole habitat                           |
|  15 | Ring-habitat arc                           |
|  16 | Shielded military bunker                   |
|  17 | Corporate luxury enclave                   |
|  18 | Slum raft cluster                          |
|  19 | First-wave retrofitted ruin                |
|  20 | Partly self-growing programmable structure |

## 18.7 AI situation

Every serious site has at least one narrow observiverse AI. Roll d66.

| d66 | AI situation                                             |
| --: | -------------------------------------------------------- |
|  11 | No AI; dangerously manual                                |
|  12 | Obsolete but loyal AI                                    |
|  13 | Overworked single AI                                     |
|  14 | Multiple narrow AIs in stable partition                  |
|  15 | AI heavily censored after incident                       |
|  16 | AI speaks only through approved operators                |
|  21 | AI is beloved as local crew                              |
|  22 | AI treated as property                                   |
|  23 | AI manages life support flawlessly                       |
|  24 | AI handles navigation/traffic only                       |
|  25 | AI controls mining drones                                |
|  26 | AI controls security                                     |
|  31 | AI has memory gaps                                       |
|  32 | AI predicts bleed shifts too well                        |
|  33 | AI refuses certain commands                              |
|  34 | AI gives contradictory but valid advice                  |
|  35 | AI has a hidden emergency protocol                       |
|  36 | AI is being illegally expanded                           |
|  41 | AI has split into rival task-fragments                   |
|  42 | AI is compromised by chiral contamination                |
|  43 | AI hallucinates during metric storms                     |
|  44 | AI is under corporate remote override                    |
|  45 | AI is being interrogated by investigators                |
|  46 | AI wants evacuation but cannot say why                   |
|  51 | AI is the only witness to a disaster                     |
|  52 | AI is protecting illegal residents                       |
|  53 | AI is running the settlement better than humans admit    |
|  54 | AI is blamed for human corruption                        |
|  55 | AI may trigger Gardener attention if pushed              |
|  56 | AI was cut down from a more capable illegal architecture |
|  61 | AI is missing                                            |
|  62 | AI has been replaced by an impostor system               |
|  63 | AI runs a secret simulation of the settlement            |
|  64 | AI is obeying old first-wave orders                      |
|  65 | AI is loyal to the wrong authority                       |
|  66 | AI is one bad command away from catastrophe              |

## 18.8 Settlement condition

Roll d66.

| d66 | Condition                                     |
| --: | --------------------------------------------- |
|  11 | Pristine and overfunded                       |
|  12 | Efficient but joyless                         |
|  13 | Wealthy core enclave                          |
|  14 | Militarized and tense                         |
|  15 | Corporate showroom                            |
|  16 | Secretly brittle                              |
|  21 | Functional frontier town                      |
|  22 | Expanding too fast                            |
|  23 | Poor but cooperative                          |
|  24 | Improvised repairs everywhere                 |
|  25 | Understaffed                                  |
|  26 | Supply-starved                                |
|  31 | Decaying first-wave infrastructure            |
|  32 | Half-abandoned                                |
|  33 | Recently attacked                             |
|  34 | Recently evacuated                            |
|  35 | Reoccupied ruin                               |
|  36 | Built on bad survey data                      |
|  41 | Overrun by debt labor                         |
|  42 | Divided by class zones                        |
|  43 | Split between surface and orbital populations |
|  44 | Officially safe, actually hazardous           |
|  45 | Life support near failure                     |
|  46 | Radiation shielding degraded                  |
|  51 | Under quarantine                              |
|  52 | Under blockade                                |
|  53 | Under corporate lockdown                      |
|  54 | Under military occupation                     |
|  55 | Under legal dispute                           |
|  56 | Under quiet Gardener warning                  |
|  61 | Hidden prosperity                             |
|  62 | Hidden famine                                 |
|  63 | Hidden epidemic or contamination              |
|  64 | Hidden AI incident                            |
|  65 | Hidden civil war                              |
|  66 | Hidden reason it cannot be abandoned          |

## 18.9 Settlement tags

Roll two tags. The first is obvious; the second is the deeper complication.

| d66 | Tag                          |
| --: | ---------------------------- |
|  11 | Abandoned First Wave         |
|  12 | Air Is Money                 |
|  13 | AI Whisper Cult              |
|  14 | Anti-Corporate Commune       |
|  15 | Aristocratic Dome            |
|  16 | Automated but Haunted        |
|  21 | Bleed-Chaser Port            |
|  22 | Border Fort                  |
|  23 | Broken Terraformer           |
|  24 | Chiral Monopoly              |
|  25 | Debt Labor                   |
|  26 | Deep Ice                     |
|  31 | Derelict Yard                |
|  32 | Elegant Core Enclave         |
|  33 | Exile Haven                  |
|  34 | Flare Refuge                 |
|  35 | Free Captain Nest            |
|  36 | Gate Shadow                  |
|  41 | Ghost City, Human            |
|  42 | High-G Research              |
|  43 | Hidden Navy                  |
|  44 | Hydrocarbon Frontier         |
|  45 | Kessler Cloud                |
|  46 | Machine-Run Town             |
|  51 | Memory-Loss Zone             |
|  52 | Migrant Swarm                |
|  53 | Moving Node Rush             |
|  54 | Narrow-AI Schism             |
|  55 | Old War Minefield            |
|  56 | Outlaw Court                 |
|  61 | Penal Extraction             |
|  62 | Perfect Dome, Rotten Outside |
|  63 | Plague/Biosafety Fear        |
|  64 | Precious Water               |
|  65 | Religious Geometry           |
|  66 | Strikebreaker City           |

Tag examples:

**Air Is Money + Debt Labor** means workers are charged for life support and cannot afford to leave.

**Bleed-Chaser Port + Narrow-AI Schism** means ships race moving nodes while their AIs argue over unsafe predictions.

**Perfect Dome, Rotten Outside + Chiral Monopoly** means the luxury settlement exists because everyone outside the dome is exposed to the toxic extraction chain.

## 18.10 Current crisis

Roll d66.

| d66 | Crisis                                               |
| --: | ---------------------------------------------------- |
|  11 | Life-support cascade                                 |
|  12 | Water ration failure                                 |
|  13 | Food culture contamination                           |
|  14 | Radiation storm incoming                             |
|  15 | Flare season arrived early                           |
|  16 | Hull breach hidden from public                       |
|  21 | Bleed node changed course                            |
|  22 | Chiral harvest turned toxic                          |
|  23 | Metric storm trapped ships                           |
|  24 | Iggygate schedule failure                            |
|  25 | Pinchdrive calibration accident                      |
|  26 | AI refuses unsafe operation                          |
|  31 | Labor strike                                         |
|  32 | Debt revolt                                          |
|  33 | Corporate security crackdown                         |
|  34 | Pirate protection demand                             |
|  35 | Smuggler war                                         |
|  36 | Refugee surge                                        |
|  41 | Quarantine violation                                 |
|  42 | Unknown native microbial hazard                      |
|  43 | Failed terraforming release                          |
|  44 | Medical supplies stolen                              |
|  45 | Illegal AI expansion discovered                      |
|  46 | Sol/Gardener warning sign detected                   |
|  51 | Military coup                                        |
|  52 | Election or succession crisis                        |
|  53 | Sabotage of refinery/gate/AI                         |
|  54 | Essential expert missing                             |
|  55 | Salvage claim dispute                                |
|  56 | Old first-wave map found                             |
|  61 | Children or civilians trapped                        |
|  62 | Ship full of dead arrives                            |
|  63 | A whole district goes silent                         |
|  64 | The base broadcasts two contradictory distress calls |
|  65 | Everyone is lying about casualty numbers             |
|  66 | Crisis is staged to hide something worse             |

## 18.11 Hidden truth

Roll d66.

| d66 | Hidden truth                                            |
| --: | ------------------------------------------------------- |
|  11 | The settlement is insolvent                             |
|  12 | The mine is nearly exhausted                            |
|  13 | The resource is richer than reported                    |
|  14 | The hazard is artificial/human-caused                   |
|  15 | The official death toll is false                        |
|  16 | The founders committed a crime                          |
|  21 | Corporate records were altered                          |
|  22 | The local AI deleted evidence                           |
|  23 | The local AI preserved forbidden evidence               |
|  24 | The base is built on unstable ground/orbit              |
|  25 | The settlement cannot survive evacuation                |
|  26 | The workers are legally trapped                         |
|  31 | The site is a weapons lab                               |
|  32 | The site is an illegal AI lab                           |
|  33 | The site is a black prison                              |
|  34 | The site is a military listening post                   |
|  35 | The site is a fake colony masking extraction            |
|  36 | The site is a smuggling hub                             |
|  41 | A first-wave expedition survived in hiding              |
|  42 | The “ghosts” are old human recordings                   |
|  43 | The “curse” is chiral neurochemistry                    |
|  44 | The “miracle” is illegal terraforming tech              |
|  45 | The “alien signal” is human encryption                  |
|  46 | The “artifact” is a natural GU formation                |
|  51 | The Gardener has already intervened once                |
|  52 | Sol interdiction files are sealed here                  |
|  53 | A faction is provoking Gardener attention               |
|  54 | The Iggygate is misaligned on purpose                   |
|  55 | The bleed node is being illegally stabilized            |
|  56 | The settlement has an evacuation ark nobody knows about |
|  61 | The leader is a proxy for a distant faction             |
|  62 | The pirate threat is staged                             |
|  63 | The quarantine is political                             |
|  64 | The plague is industrial poisoning                      |
|  65 | The AI is sane; the humans are not listening            |
|  66 | The system’s official survey is deliberately wrong      |

## 18.12 Local encounter sites

Roll d20 for places inside or near the settlement.

| d20 | Site                              |
| --: | --------------------------------- |
|   1 | Half-flooded maintenance tunnels  |
|   2 | Shielding crawlspace district     |
|   3 | Dockside free market              |
|   4 | Drone hangar                      |
|   5 | AI core vault                     |
|   6 | Chiral refinery floor             |
|   7 | Bleed-harvest control room        |
|   8 | Closed habitat ring               |
|   9 | Quarantine ward                   |
|  10 | Black-market clinic               |
|  11 | Corporate executive dome          |
|  12 | Worker barracks                   |
|  13 | Religious geometry chapel         |
|  14 | Old first-wave command bunker     |
|  15 | Illegal pinchdrive test chamber   |
|  16 | Radiation storm shelter           |
|  17 | Water plant                       |
|  18 | Courtroom / debt registry         |
|  19 | Hidden launch bay                 |
|  20 | Place the maps say does not exist |

---

# 19. Human ruins and derelicts

Because your setting has first-wave colonization failures, derelicts are common and useful, but they are human.

Roll d66.

| d66 | Human remnant                                     |
| --: | ------------------------------------------------- |
|  11 | Survey probe field                                |
|  12 | Dead relay buoy                                   |
|  13 | Abandoned mining claim                            |
|  14 | Failed habitat pod                                |
|  15 | Burned-out research dome                          |
|  16 | Crashed cargo hauler                              |
|  21 | First-wave colony shell                           |
|  22 | Ruined terraforming plant                         |
|  23 | Frozen refugee convoy                             |
|  24 | Lost pilgrim station                              |
|  25 | Corporate massacre site                           |
|  26 | Collapsed dome city                               |
|  31 | Derelict refinery                                 |
|  32 | Scrapped shipyard                                 |
|  33 | Old navy depot                                    |
|  34 | Minefield from forgotten war                      |
|  35 | Unmapped prison camp                              |
|  36 | Secret genetic or biosphere lab                   |
|  41 | Illegal AI growth chamber                         |
|  42 | Narrow-AI archive vault                           |
|  43 | Pinchdrive accident scar                          |
|  44 | Iggygate construction failure                     |
|  45 | Failed chiral harvest rig                         |
|  46 | Programmable-matter containment breach            |
|  51 | Sol-struck outpost                                |
|  52 | Evacuated under Gardener warning                  |
|  53 | Records surgically erased                         |
|  54 | Survivors became nomads                           |
|  55 | Survivors became pirates                          |
|  56 | Survivors became isolationists                    |
|  61 | Still broadcasting old distress call              |
|  62 | Appears abandoned but is automated                |
|  63 | Salvagers never return                            |
|  64 | Used as bait by criminals                         |
|  65 | Claimed by three legal owners                     |
|  66 | Contains a truth that would alter system politics |

---

# 20. Expanded system phenomena

Roll d66 once for an ordinary system, twice for a rich system, three times for a major hub.

| d66 | Phenomenon                       |
| --: | -------------------------------- |
|  11 | Dense debris disk                |
|  12 | Recent planetary collision       |
|  13 | Resonant compact chain           |
|  14 | Trojan megaswarm                 |
|  15 | Long-period comet storm          |
|  16 | Captured rogue world             |
|  21 | Flare-amplified bleed season     |
|  22 | Circumbinary eclipse climate     |
|  23 | Tidally locked eyeball world     |
|  24 | Hot Neptune desert survivor      |
|  25 | Stripped planetary core          |
|  26 | Ultra-dense dark-sector planet   |
|  31 | Snow-line chiral belt            |
|  32 | Programmable regolith field      |
|  33 | Ring arc with phase dust         |
|  34 | Ice-shell plume moon             |
|  35 | Gas giant radiation maze         |
|  36 | Brown dwarf moon system          |
|  41 | White-dwarf metal debris         |
|  42 | Failed Iggygate wake             |
|  43 | Pinchdrive scar corridor         |
|  44 | Moving bleed-node river          |
|  45 | Lagrange shear storm             |
|  46 | Metric mirage zone               |
|  51 | Native microbial biosphere       |
|  52 | Fossil biosphere                 |
|  53 | Failed terraforming biosphere    |
|  54 | Chiral-poisoned ecology          |
|  55 | Quarantine world                 |
|  56 | Illegal biosphere exploitation   |
|  61 | First-wave ghost colony          |
|  62 | Derelict fleet cluster           |
|  63 | Corporate war wreckyard          |
|  64 | Pirate dark gap                  |
|  65 | Gardener warning beacon          |
|  66 | System-level observerse fracture |

---

# 21. Putting it all together: compact system profile

Use this profile format.

**System Name:**
**Data Basis:** Real star / fictional star / mixed.
**Primary:** spectral type, mass, luminosity, age, metallicity, activity.
**Companions:** if any.
**Reachability:** route class, gate status, pinch difficulty.
**Architecture:** compact chain, mixed, giant-rich, etc.
**HZ:** inner/center/outer.
**Snow Line:** approximate.
**GU Intensity:** quiet/low/useful/rich/fractured.
**Primary Economy:** mining, chiral harvest, gate transit, science, settlement, military.
**Major Hazards:** flares, radiation, metric storms, quarantine, pirates.
**No-Alien Check:** all mysteries assigned to natural GU, human history, AI, or Sol/Gardener.

Planet table:

|       Orbit | Body             | Class                      | Key traits                     | Sites                  |
| ----------: | ---------------- | -------------------------- | ------------------------------ | ---------------------- |
|     0.04 AU | Cinder           | Iron furnace world         | stripped core, chiral metals   | automated mine         |
|     0.09 AU | Marrow           | lava super-Earth           | flare-baked, high-G            | abandoned research rig |
|     0.18 AU | Vey              | hot sub-Neptune            | radius-valley exception        | science station        |
|     0.36 AU | Lumen            | tidally locked terrestrial | terminator sea, microbial life | treaty colony          |
|     0.72 AU | Pale Belt        | ice/metal belt             | moving bleed node              | chiral rush camps      |
|      1.9 AU | Gath             | gas giant                  | rings, radiation belts         | fuel skimmers          |
| 1.9 AU moon | Siren            | ice-shell ocean moon       | plume fields                   | biosafety lab          |
|      6.8 AU | Outer dark swarm | comet belt                 | smugglers, old probes          | hidden depot           |

Settlement profile:

**Lumen Terminator Colony**
Scale: 40,000.
Authority: trade house backed by a chiral-harvest cartel.
Tags: Air Is Money + Moving Node Rush.
AI: overworked single AI with storm-induced perception errors.
Crisis: the moving bleed node changed course and the colony’s debt contracts require continued extraction.
Hidden truth: the “native contamination scare” is partly real, but the quarantine is being used to suppress a labor revolt.

---

# 22. Example: Geometric Unity system seed

**System:** Keid’s Ladder
**Primary:** M3V red dwarf, old, metal-rich, flare-prone but not young.
**Companion:** distant brown dwarf at wide separation.
**Reachability:** resonance hub.
**Architecture:** compact peas-in-a-pod chain plus outer cold belt.
**GU intensity:** rich bleed.
**HZ:** close-in, tidally stressful.
**Economy:** moving bleed-node harvesting, chiral ice extraction, AI-stabilized navigation.

|       Orbit | Body                   | Summary                                                                                 |
| ----------: | ---------------------- | --------------------------------------------------------------------------------------- |
|    0.025 AU | Ashkey                 | Furnace super-Mercury, iron and chiral silicate mines, lethal surface.                  |
|    0.041 AU | Red Vane               | Lava world with dust tail, automated observatory destroyed twice.                       |
|    0.069 AU | Sable                  | Hot super-Earth, dense sulfur atmosphere, corporate pressure labs.                      |
|    0.112 AU | Lio’s Verge            | Tidally locked terminator world, thin sea, microbial mats, settlement in twilight belt. |
|    0.181 AU | Harrowglass            | Cold-side ice world with dayside desert, failed terraforming mirrors.                   |
|     0.44 AU | Ladder Belt            | Resonant belt with moving bleed nodes, rush miners, pirates, cartel ships.              |
|      1.6 AU | Mourn                  | Small gas giant, radiation maze, three major moons.                                     |
| 1.6 AU moon | Chime                  | Ice-shell ocean moon with plume chemistry, biosafety research station.                  |
|       12 AU | Brown-dwarf sub-system | Dark moons, hidden naval listener, illegal AI lab rumored.                              |

**Major settlement:** Ladder Belt Freeport
Scale: 80,000 distributed across rotating habitats and hollowed asteroids.
Authority: free captain assembly on paper; chiral cartel in practice.
Tags: Bleed-Chaser Port + Outlaw Court.
AI situation: rival narrow AIs produce conflicting route predictions during flare season.
Current crisis: a moving node split into two profitable branches; one branch crosses an old minefield and the other crosses a quarantine zone.
Hidden truth: the quarantine zone is not alien or supernatural. It is a first-wave chiral contamination site whose records were deleted after a corporate court settlement.

That is the intended tone: astronomy gives you a plausible M-dwarf compact system; Geometric Unity makes it economically and physically dangerous; human history makes it playable.

---

# 23. Design rule summary

For this setting, I would keep these rules firm:

A “habitable zone planet” is not automatically habitable.

A “super-Earth” is not automatically Earth-like.

Most interesting systems do not need garden worlds.

Multi-star systems are overrepresented in the reachable network because of GU route selection, not because every real star is multiple.

M-dwarf systems are common and valuable, but close-in worlds should often be tidally locked, flare-stressed, or atmosphere-compromised.

Bleed resources should move. Static mines belong to corporations; moving nodes create freelancers, pirates, debt crews, and dangerous opportunities.

No generated result should produce alien civilizations, alien relics, or alien megastructures.

When the table wants a mystery, use one of five sources: **natural astronomy, Geometric Unity, human first-wave history, narrow-AI failure, or the Gardener’s intervention.**

[1]: https://science.nasa.gov/exoplanets/exoplanet-catalog/ "Exoplanet Catalog - NASA Science"
[2]: https://science.nasa.gov/exoplanets/planet-types/ "Overview - NASA Science"
[3]: https://arxiv.org/abs/1703.10375?utm_source=chatgpt.com "The California-Kepler Survey. III. A Gap in the Radius Distribution of Small Planets"
[4]: https://arxiv.org/abs/1602.07843?utm_source=chatgpt.com "Dearth of short-period Neptunian exoplanets - a desert in period-mass and period-radius planes"
[5]: https://arxiv.org/abs/1706.06204?utm_source=chatgpt.com "The California-Kepler Survey V. Peas in a Pod: Planets in a Kepler Multi-planet System are Similar in Size and Regularly Spaced"
[6]: https://science.nasa.gov/exoplanets/habitable-zone/ "The Habitable Zone - NASA Science"
[7]: https://www.annualreviews.org/content/journals/10.1146/annurev-astro-081710-102602?utm_source=chatgpt.com "Stellar Multiplicity"
[8]: https://science.nasa.gov/solar-system/ocean-worlds/?utm_source=chatgpt.com "Ocean Worlds: Water in the Solar System and Beyond"
[9]: https://ui.adsabs.harvard.edu/abs/2010PASP..122..905J/abstract?utm_source=chatgpt.com "Giant Planet Occurrence in the Stellar Mass-Metallicity Plane"
[10]: https://exoplanetarchive.ipac.caltech.edu/docs/poet_calculations.html "How Predicted Observables for Exoplanets are Calculated"
[11]: https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2012/07/STScI-01EVSRD5C3K2XEF3KXNAQJPW8M.pdf?utm_source=chatgpt.com "On the Evolution of the Snow Line in Protoplanetary Discs"

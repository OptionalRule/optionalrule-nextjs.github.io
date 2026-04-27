import type {
  BodyCategory,
  BodyPhysicalHints,
  Fact,
  GeneratedSystem,
  GenerationOptions,
  GuPreference,
  HumanRemnant,
  Moon,
  OrbitingBody,
  PlanetaryDetail,
  RingSystem,
  Settlement,
  Star,
  SystemPhenomenon,
} from '../../types'
import { calculateHabitableZone, calculateInsolation, calculateSnowLine, classifyThermalZone, roundTo } from './calculations'
import { d12, d100, pickOne, pickTable, twoD6 } from './dice'
import { createSeededRng, type SeededRng } from './rng'
import {
  ageStates,
  architectures,
  bleedLocations,
  frontierStarTypes,
  guHazards,
  guIntensities,
  guResources,
  metallicities,
  reachabilityClasses,
  realisticStarTypes,
  settlementScales,
  siteOptions,
} from './tables'

const systemPrefixes = ['Keid', 'Vesper', 'Lumen', 'Harrow', 'Sable', 'Marrow', 'Orison', 'Nadir', 'Calder', 'Pale']
const systemSuffixes = ['Ladder', 'Verge', 'Crown', 'Breach', 'Harbor', 'Glass', 'Wake', 'Cairn', 'Tide', 'Gate']
const bodyNames = ['Ashkey', 'Red Vane', 'Sable', 'Harrowglass', 'Cinder', 'Pale Belt', 'Mourn', 'Chime', 'Vey', 'Dross', 'Siren', 'Gath']
const moonNames = ['Silt', 'Brine', 'Kettle', 'Palehook', 'Vigil', 'Thresh', 'Low Bell', 'Cairnlet']

interface WorldClassOption {
  className: string
  category: BodyCategory
  massClass: string
}

interface FilteredWorldClass {
  bodyClass: WorldClassOption
  physical: BodyPhysicalHints
  filterNotes: Array<Fact<string>>
}

type SettlementSiteCategory =
  | 'Surface settlement'
  | 'Orbital station'
  | 'Asteroid or belt base'
  | 'Moon base'
  | 'Deep-space platform'
  | 'Gate or route node'
  | 'Mobile site'
  | 'Derelict or restricted site'

interface SettlementLocationOption {
  label: string
  category: SettlementSiteCategory
}

interface SettlementAnchor {
  kind: string
  name: string
  detail: string
  moonId?: string
}

const worldClassesByThermalZone: Record<string, readonly WorldClassOption[]> = {
  Furnace: [
    { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' },
    { className: 'Lava planet', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Magma ocean world', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
  ],
  Inferno: [
    { className: 'Rock-vapor atmosphere world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ultra-dense super-Mercury', category: 'rocky-planet', massClass: 'Dense terrestrial' },
    { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' },
  ],
  Hot: [
    { className: 'Venus-like greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Dry supercontinent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot ocean remnant', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Mini-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
  ],
  'Temperate band': [
    { className: 'Thin-atmosphere terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Ocean-continent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Tidally locked terminator world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Terraforming candidate', category: 'super-earth', massClass: 'Super-Earth' },
  ],
  Cold: [
    { className: 'Buried-ocean ice world', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Nitrogen glacier world', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Cold super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ice-rich asteroid belt', category: 'belt', massClass: 'Minor-body belt' },
    { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
  ],
  Cryogenic: [
    { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    { className: 'Ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
  ],
  Dark: [
    { className: 'Comet reservoir', category: 'belt', massClass: 'Outer comet cloud' },
    { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
    { className: 'Dark refueling body', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Deep observerse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
  ],
}

const forcedWorldClasses = {
  rocky: { className: 'Rocky terrestrial world', category: 'rocky-planet', massClass: 'Terrestrial' },
  superEarth: { className: 'Super-terrestrial world', category: 'super-earth', massClass: 'Super-Earth' },
  subNeptune: { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
  belt: { className: 'Main debris belt', category: 'belt', massClass: 'Minor-body belt' },
  iceBelt: { className: 'Outer ice belt', category: 'belt', massClass: 'Outer debris belt' },
  gasGiant: { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
  iceGiant: { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
  dwarf: { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
} satisfies Record<string, WorldClassOption>

const traitOptions = [
  'tidal stress',
  'flare pressure',
  'thin volatile inventory',
  'subsurface ocean candidate',
  'metric survey anomaly',
  'resource-rich regolith',
  'unstable crossing orbit',
  'old first-wave traffic',
] as const

const atmospheres = ['None / hard vacuum', 'Trace exosphere', 'Thin CO2/N2', 'Moderate inert atmosphere', 'Moderate toxic atmosphere', 'Dense greenhouse', 'Hydrogen/helium envelope', 'Chiral-active atmosphere'] as const
const extremeHotAtmospheres = ['None / hard vacuum', 'Trace exosphere', 'Rock-vapor atmosphere', 'Metal vapor atmosphere', 'Chiral-active atmosphere'] as const
const hotAtmospheres = ['Trace exosphere', 'Thin CO2/N2', 'Moderate toxic atmosphere', 'Dense greenhouse', 'Steam atmosphere', 'Sulfur/chlorine haze'] as const
const coldAtmospheres = ['None / hard vacuum', 'Trace exosphere', 'Thin CO2/N2', 'Moderate inert atmosphere', 'Nitrogen/methane haze', 'Chiral-active atmosphere'] as const
const hydrospheres = ['Bone dry', 'Subsurface ice', 'Polar caps / buried glaciers', 'Briny aquifers', 'Local seas', 'Ocean-continent balance', 'Ice-shell subsurface ocean', 'Hydrocarbon lakes/seas'] as const
const extremeHotVolatiles = ['Bone dry', 'Hydrated minerals only', 'Vaporized volatile traces', 'Nightside mineral frost'] as const
const hotVolatiles = ['Bone dry', 'Hydrated minerals only', 'Deep briny aquifers', 'Steam-locked volatile cycle', 'Polar remnant ice'] as const
const geologies = ['Dead interior', 'Ancient cratered crust', 'Low volcanism', 'Static lid', 'Active volcanism', 'Plate tectonic analogue', 'Cryovolcanism', 'Tidal heating'] as const
const envelopeGeologies = ['Deep atmospheric circulation', 'Metallic hydrogen interior', 'Layered volatile mantle', 'Magnetosphere-driven weather'] as const
const extremeHotClimateTags = ['Runaway greenhouse', 'Hot desert', 'Dayside glass fields', 'Nightside mineral frost', 'Hypercanes', 'Chiral cloud chemistry'] as const
const hotClimateTags = ['Runaway greenhouse', 'Moist greenhouse edge', 'Hot desert', 'Permanent storm tracks', 'Hypercanes', 'Aerosol winter'] as const
const temperateClimateTags = ['Cold desert', 'Hot desert', 'Eyeball world', 'Terminator belt', 'Permanent storm tracks', 'Global monsoon', 'Twilight ocean', 'Recently failed terraforming climate'] as const
const coldClimateTags = ['Snowball', 'Cold desert', 'Aerosol winter', 'Methane cycle', 'CO2 glacier cycle', 'Dark-sector gravity tides'] as const
const extremeHotEnvelopeClimateTags = ['Permanent storm tracks', 'Hypercanes', 'Chiral cloud chemistry', 'Dark-sector gravity tides'] as const
const envelopeClimateTags = ['Permanent storm tracks', 'Hypercanes', 'Methane cycle', 'Chiral cloud chemistry', 'Dark-sector gravity tides'] as const
const radiationEnvironments = ['Benign', 'Manageable', 'Chronic exposure', 'Storm-dependent hazard', 'Severe radiation belts', 'Flare-lethal surface', 'Electronics-disruptive metric/radiation mix'] as const
const highRadiationEnvironments = ['Chronic exposure', 'Storm-dependent hazard', 'Severe radiation belts', 'Flare-lethal surface', 'Electronics-disruptive metric/radiation mix', 'Only deep shielded habitats survive'] as const
const biospheres = ['Sterile', 'Prebiotic chemistry', 'Ambiguous biosignatures', 'Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'] as const
const moonTypes = ['Airless rock', 'Cratered ice-rock', 'Captured asteroid', 'Subsurface ocean moon', 'Cryovolcanic moon', 'Radiation-scorched inner moon', 'Active mining moon', 'Moving bleed node moon'] as const
const ringTypes = ['None or faint', 'Dust ring', 'Ice ring', 'Rocky ring', 'Shepherded bright rings', 'Radiation-charged rings', 'GU-reactive ring lattice'] as const
const surveyFunctions = ['Survey station', 'Astrometry/nav beacon', 'Sensor picket', 'Weather/flare monitoring', 'Planetology lab'] as const
const extractionFunctions = ['Metal mine', 'Volatile mine', 'Chiral harvesting site', 'Dark-sector ore extraction', 'Refinery'] as const
const orbitalFunctions = ['Fuel depot', 'Ship repair yard', 'Full shipyard', 'Drone foundry', 'Shielding/chiral plating works', 'Freeport', 'Smuggler port'] as const
const routeFunctions = ['Iggygate control station', 'Pinchdrive tuning station', 'Corporate customs post', 'Freeport', 'Astrometry/nav beacon', 'Quarantine station'] as const
const securityFunctions = ['Military base', 'Listening post', 'Naval logistics depot', 'Weapons test range', 'Quarantine station', 'Intelligence black site'] as const
const civilFunctions = ['Civilian colony', 'Terraforming camp', 'Refugee settlement', 'Prison or debt-labor site', 'Religious/ideological enclave', 'Narrow-AI observiverse facility'] as const
const orbitalBuiltForms = ['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster'] as const
const asteroidBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Asteroid hollow', 'Modular orbital lattice', 'Shielded military bunker', 'First-wave retrofitted ruin'] as const
const moonBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Dome cluster', 'Borehole habitat', 'Shielded military bunker', 'First-wave retrofitted ruin'] as const
const surfaceBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster', 'Rail-linked terminator city', 'Aerostat city', 'Submarine habitat', 'Borehole habitat', 'Shielded military bunker', 'Corporate luxury enclave', 'First-wave retrofitted ruin'] as const
const gateBuiltForms = ['Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Shielded military bunker', 'Partly self-growing programmable structure'] as const
const mobileBuiltForms = ['Inflatable modules', 'Crawling mobile base', 'Modular orbital lattice', 'Rotating cylinder', 'Shielded military bunker'] as const
const derelictBuiltForms = ['Asteroid hollow', 'Shielded military bunker', 'First-wave retrofitted ruin', 'Partly self-growing programmable structure'] as const
const settlementAuthorities = ['No recognized authority', 'Direct democracy / crew vote', 'Family syndicate', 'Worker council', 'Frontier sheriff or magistrate', 'Emergency commander', 'Minor corporation', 'Megacorp concession', 'Trade house', 'Banking or debt trust', 'Insurance-backed administrator', 'Extraction guild', 'Local militia', 'System navy', 'Interstellar navy', 'Intelligence service', 'Quarantine authority', 'Gate authority', 'Academic institute', 'Research consortium', 'Medical/biosafety board', 'AI-supervised technocracy', 'Terraforming directorate', 'Chiral-harvest cartel', 'Religious commune', 'Exile council', 'Pirate clan', 'Smuggler compact', 'Revolutionary cell', 'Criminal protection racket', 'Sol-interdiction compliance office', 'Gardener-fear cult', 'Independent captain assembly', 'Mercenary company', 'Unknown sponsor', 'Official records are falsified'] as const
const aiSituations = ['No AI; dangerously manual', 'Obsolete but loyal AI', 'Overworked single AI', 'Multiple narrow AIs in stable partition', 'AI heavily censored after incident', 'AI speaks only through approved operators', 'AI is beloved as local crew', 'AI treated as property', 'AI manages life support flawlessly', 'AI handles navigation/traffic only', 'AI controls mining drones', 'AI controls security', 'AI has memory gaps', 'AI predicts bleed shifts too well', 'AI refuses certain commands', 'AI gives contradictory but valid advice', 'AI has a hidden emergency protocol', 'AI is being illegally expanded', 'AI has split into rival task-fragments', 'AI is compromised by chiral contamination', 'AI hallucinates during metric storms', 'AI is under corporate remote override', 'AI is being interrogated by investigators', 'AI wants evacuation but cannot say why', 'AI is the only witness to a disaster', 'AI is protecting illegal residents', 'AI is running the settlement better than humans admit', 'AI is blamed for human corruption', 'AI may trigger Gardener attention if pushed', 'AI was cut down from a more capable illegal architecture', 'AI is missing', 'AI has been replaced by an impostor system', 'AI runs a secret simulation of the settlement', 'AI is obeying old first-wave orders', 'AI is loyal to the wrong authority', 'AI is one bad command away from catastrophe'] as const
const settlementConditions = ['Pristine and overfunded', 'Efficient but joyless', 'Wealthy core enclave', 'Militarized and tense', 'Corporate showroom', 'Secretly brittle', 'Functional frontier town', 'Expanding too fast', 'Poor but cooperative', 'Improvised repairs everywhere', 'Understaffed', 'Supply-starved', 'Decaying first-wave infrastructure', 'Half-abandoned', 'Recently attacked', 'Recently evacuated', 'Reoccupied ruin', 'Built on bad survey data', 'Overrun by debt labor', 'Divided by class zones', 'Split between surface and orbital populations', 'Officially safe, actually hazardous', 'Life support near failure', 'Radiation shielding degraded', 'Under quarantine', 'Under blockade', 'Under corporate lockdown', 'Under military occupation', 'Under legal dispute', 'Under quiet Gardener warning', 'Hidden prosperity', 'Hidden famine', 'Hidden epidemic or contamination', 'Hidden AI incident', 'Hidden civil war', 'Hidden reason it cannot be abandoned'] as const
const settlementTags = ['Abandoned First Wave', 'Air Is Money', 'AI Whisper Cult', 'Anti-Corporate Commune', 'Aristocratic Dome', 'Automated but Haunted', 'Bleed-Chaser Port', 'Border Fort', 'Broken Terraformer', 'Chiral Monopoly', 'Debt Labor', 'Deep Ice', 'Derelict Yard', 'Elegant Core Enclave', 'Exile Haven', 'Flare Refuge', 'Free Captain Nest', 'Gate Shadow', 'Ghost City, Human', 'High-G Research', 'Hidden Navy', 'Hydrocarbon Frontier', 'Kessler Cloud', 'Machine-Run Town', 'Memory-Loss Zone', 'Migrant Swarm', 'Moving Node Rush', 'Narrow-AI Schism', 'Old War Minefield', 'Outlaw Court', 'Penal Extraction', 'Perfect Dome, Rotten Outside', 'Plague/Biosafety Fear', 'Precious Water', 'Religious Geometry', 'Strikebreaker City'] as const
const settlementCrises = ['Life-support cascade', 'Water ration failure', 'Food culture contamination', 'Radiation storm incoming', 'Flare season arrived early', 'Hull breach hidden from public', 'Bleed node changed course', 'Chiral harvest turned toxic', 'Metric storm trapped ships', 'Iggygate schedule failure', 'Pinchdrive calibration accident', 'AI refuses unsafe operation', 'Labor strike', 'Debt revolt', 'Corporate security crackdown', 'Pirate protection demand', 'Smuggler war', 'Refugee surge', 'Quarantine violation', 'Unknown native microbial hazard', 'Failed terraforming release', 'Medical supplies stolen', 'Illegal AI expansion discovered', 'Sol/Gardener warning sign detected', 'Military coup', 'Election or succession crisis', 'Sabotage of refinery/gate/AI', 'Essential expert missing', 'Salvage claim dispute', 'Old first-wave map found', 'Children or civilians trapped', 'Ship full of dead arrives', 'A whole district goes silent', 'The base broadcasts two contradictory distress calls', 'Everyone is lying about casualty numbers', 'Crisis is staged to hide something worse'] as const
const hiddenTruths = ['The settlement is insolvent', 'The mine is nearly exhausted', 'The resource is richer than reported', 'The hazard is artificial/human-caused', 'The official death toll is false', 'The founders committed a crime', 'Corporate records were altered', 'The local AI deleted evidence', 'The local AI preserved forbidden evidence', 'The base is built on unstable ground/orbit', 'The settlement cannot survive evacuation', 'The workers are legally trapped', 'The site is a weapons lab', 'The site is an illegal AI lab', 'The site is a black prison', 'The site is a military listening post', 'The site is a fake colony masking extraction', 'The site is a smuggling hub', 'A first-wave expedition survived in hiding', 'The ghosts are old human recordings', 'The curse is chiral neurochemistry', 'The miracle is illegal terraforming tech', 'The supposed nonhuman signal is human encryption', 'The artifact rumor is a natural GU formation', 'The Gardener has already intervened once', 'Sol interdiction files are sealed here', 'A faction is provoking Gardener attention', 'The Iggygate is misaligned on purpose', 'The bleed node is being illegally stabilized', 'The settlement has an evacuation ark nobody knows about', 'The leader is a proxy for a distant faction', 'The pirate threat is staged', 'The quarantine is political', 'The plague is industrial poisoning', 'The AI is sane; the humans are not listening', 'The system official survey is deliberately wrong'] as const
const encounterSites = ['Half-flooded maintenance tunnels', 'Shielding crawlspace district', 'Dockside free market', 'Drone hangar', 'AI core vault', 'Chiral refinery floor', 'Bleed-harvest control room', 'Closed habitat ring', 'Quarantine ward', 'Black-market clinic', 'Corporate executive dome', 'Worker barracks', 'Religious geometry chapel', 'Old first-wave command bunker', 'Illegal pinchdrive test chamber', 'Radiation storm shelter', 'Water plant', 'Courtroom / debt registry', 'Hidden launch bay', 'Place the maps say does not exist'] as const
const humanRemnants = ['Survey probe field', 'Dead relay buoy', 'Abandoned mining claim', 'Burned-out research dome', 'First-wave colony shell', 'Ruined terraforming plant', 'Frozen refugee convoy', 'Derelict refinery', 'Old navy depot', 'Illegal AI growth chamber', 'Pinchdrive accident scar', 'Iggygate construction failure', 'Sol-struck outpost', 'Records surgically erased', 'Still broadcasting old distress call'] as const
const remnantHooks = ['claimed by three legal owners', 'contains deleted survey records', 'appears abandoned but still runs automated routines', 'sits inside a drifting hazard zone', 'was erased from corporate maps', 'is used as bait by criminals', 'contains evidence that would alter local politics'] as const
const phenomena = ['Dense debris disk', 'Recent planetary collision', 'Resonant compact chain', 'Trojan megaswarm', 'Long-period comet storm', 'Captured rogue world', 'Flare-amplified bleed season', 'Hot Neptune desert survivor', 'Snow-line chiral belt', 'Ring arc with phase dust', 'Ice-shell plume moon', 'Gas giant radiation maze', 'Failed Iggygate wake', 'Moving bleed-node river', 'Metric mirage zone', 'Native microbial biosphere', 'Failed terraforming biosphere', 'First-wave ghost colony', 'Derelict fleet cluster', 'Gardener warning beacon'] as const

function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
  return { value, confidence, source }
}

function generateSystemName(rng: SeededRng): string {
  return `${pickOne(rng, systemPrefixes)}'s ${pickOne(rng, systemSuffixes)}`
}

function generatePrimaryStar(rng: SeededRng, options: GenerationOptions, systemName: string): Star {
  const profile = pickTable(
    rng,
    d100(rng),
    options.distribution === 'realistic' ? realisticStarTypes : frontierStarTypes
  )
  const massSolar = roundTo(rng.float(profile.massRange[0], profile.massRange[1]), 3)
  const luminositySolar = roundTo(rng.float(profile.luminosityRange[0], profile.luminosityRange[1]), 4)
  const ageState = pickTable(rng, twoD6(rng), ageStates)
  const metallicity = pickTable(rng, twoD6(rng), metallicities)

  let activityRoll = twoD6(rng)
  if (ageState === 'Young') activityRoll += 2
  if (ageState === 'Embryonic/very young') activityRoll += 3
  if (profile.type === 'M dwarf') activityRoll += 2
  if (ageState === 'Old') activityRoll -= 1
  if (ageState === 'Very old' || ageState === 'Ancient/remnant-associated') activityRoll -= 2

  const activity =
    activityRoll <= 3 ? 'Dormant / unusually quiet' :
    activityRoll <= 6 ? 'Quiet' :
    activityRoll <= 8 ? 'Normal' :
    activityRoll <= 10 ? 'Active' :
    activityRoll <= 12 ? 'Flare-prone' :
    activityRoll <= 14 ? 'Violent flare cycle' :
    'Extreme activity / metric-amplified events'

  return {
    id: 'primary',
    name: fact(`${systemName} Primary`, 'inferred', 'Generated fictional star'),
    spectralType: fact(profile.type, 'inferred', 'MASS-GU stellar distribution'),
    massSolar: fact(massSolar, 'inferred', 'Generated stellar profile'),
    luminositySolar: fact(luminositySolar, 'inferred', 'Generated stellar profile'),
    ageState: fact(ageState, 'inferred', 'MASS-GU stellar age table'),
    metallicity: fact(metallicity, 'inferred', 'MASS-GU metallicity table'),
    activity: fact(activity, 'inferred', 'MASS-GU activity modifiers'),
  }
}

function generateReachability(rng: SeededRng) {
  const roll = d12(rng)
  const result = pickTable(rng, roll, reachabilityClasses)
  return {
    className: fact(result.className, 'gu-layer', 'MASS-GU reachability class'),
    routeNote: fact(result.routeNote, 'gu-layer', 'Reachable-volume bias'),
    pinchDifficulty: fact(result.pinchDifficulty, 'gu-layer', 'Route geometry'),
  }
}

function generateArchitecture(rng: SeededRng, options: GenerationOptions, primary: Star, reachabilityClass: string) {
  let roll = d100(rng)
  if (options.tone === 'cinematic') roll = Math.min(100, roll + 12)
  if (options.tone === 'astronomy') roll = Math.max(1, roll - 6)
  if (primary.metallicity.value === 'Metal-rich') roll += 10
  if (primary.metallicity.value === 'Very metal-rich') roll += 20
  if (['K dwarf', 'G dwarf', 'F dwarf'].includes(primary.spectralType.value)) roll += 5
  if (primary.metallicity.value === 'Metal-poor') roll -= 10
  if (primary.massSolar.value < 0.18 && primary.spectralType.value === 'M dwarf') roll -= 10
  if (reachabilityClass === 'Resource corridor' || reachabilityClass === 'Resonance hub') roll += 10
  roll = Math.max(1, Math.min(100, roll))
  const result = pickTable(rng, roll, architectures)
  return {
    architecture: {
      name: fact(result.name, 'inferred', 'MASS-GU architecture table'),
      description: fact(result.description, 'inferred', 'System architecture roll'),
    },
    bodyCount: rng.int(result.bodyCount[0], result.bodyCount[1]),
  }
}

function generateOrbitSeries(rng: SeededRng, luminositySolar: number, count: number): number[] {
  const start = Math.max(0.025, Math.sqrt(Math.max(luminositySolar, 0.0001)) * rng.float(0.16, 0.34))
  const spacing = rng.float(1.55, 2.05)
  return Array.from({ length: count }, (_, index) => roundTo(start * spacing ** index, 3))
}

function estimateOrbitalPeriodDays(orbitAu: number, stellarMassSolar: number): number {
  return roundTo(365.25 * Math.sqrt(orbitAu ** 3 / Math.max(stellarMassSolar, 0.01)), 1)
}

function estimateRadiusEarth(rng: SeededRng, category: BodyCategory): number {
  const range: Record<BodyCategory, [number, number]> = {
    'rocky-planet': [0.45, 1.35],
    'super-earth': [1.25, 1.95],
    'sub-neptune': [2.05, 3.8],
    'gas-giant': [8.0, 13.0],
    'ice-giant': [3.5, 5.5],
    belt: [0.01, 0.25],
    'dwarf-body': [0.08, 0.45],
    'rogue-captured': [0.7, 2.5],
    anomaly: [0.5, 4.0],
  }
  const [min, max] = range[category]
  return roundTo(rng.float(min, max), 2)
}

function hasVolatileEnvelope(category: BodyCategory): boolean {
  return category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
}

function buildPhysicalHints(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  orbitAu: number,
  primary: Star
): BodyPhysicalHints {
  const periodDays = estimateOrbitalPeriodDays(orbitAu, primary.massSolar.value)
  return {
    radiusEarth: fact(estimateRadiusEarth(rng, bodyClass.category), 'inferred', 'Category-based radius estimate'),
    periodDays: fact(periodDays, 'derived', 'Kepler approximation from orbit and stellar mass'),
    closeIn: fact(periodDays < 100, 'derived', 'Period under 100 days'),
    volatileEnvelope: fact(hasVolatileEnvelope(bodyClass.category), 'inferred', 'Category-based volatile envelope flag'),
  }
}

function applyRadiusValleyFilter(rng: SeededRng, input: FilteredWorldClass): FilteredWorldClass {
  const { bodyClass, physical, filterNotes } = input
  if (!physical.closeIn.value || physical.radiusEarth.value < 1.5 || physical.radiusEarth.value > 2.0) return input
  if (bodyClass.category !== 'super-earth' && bodyClass.category !== 'sub-neptune') return input

  const roll = rng.int(1, 5)
  if (roll === 1 || roll === 4) {
    return {
      bodyClass: { className: 'Stripped rocky super-Earth', category: 'super-earth', massClass: 'Stripped super-Earth' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(Math.min(1.45, physical.radiusEarth.value - 0.15), 2), 'inferred', 'Radius valley filter'),
        volatileEnvelope: fact(false, 'inferred', 'Radius valley filter'),
      },
      filterNotes: [...filterNotes, fact('Radius valley: volatile envelope stripped or reduced.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 2) {
    return {
      bodyClass: { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(Math.max(2.05, physical.radiusEarth.value + 0.25), 2), 'inferred', 'Radius valley filter'),
        volatileEnvelope: fact(true, 'inferred', 'Radius valley filter'),
      },
      filterNotes: [...filterNotes, fact('Radius valley: expanded into volatile-rich sub-Neptune regime.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 3) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Radius valley: rare transitional science target.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...filterNotes, fact('Radius valley: GU-stabilized exception.', 'gu-layer', 'Modern exoplanet filter')],
  }
}

function applyHotNeptuneDesertFilter(rng: SeededRng, thermalZone: string, input: FilteredWorldClass): FilteredWorldClass {
  const { bodyClass, physical, filterNotes } = input
  const isNeptuneLike = bodyClass.category === 'sub-neptune' || bodyClass.category === 'ice-giant'
  if (!isNeptuneLike || !physical.closeIn.value || !['Furnace', 'Inferno', 'Hot'].includes(thermalZone)) return input

  const roll = rng.int(1, 6)
  if (roll <= 2) {
    return {
      bodyClass: { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(rng.float(1.25, 1.9), 2), 'inferred', 'Hot Neptune desert filter'),
        volatileEnvelope: fact(false, 'inferred', 'Hot Neptune desert filter'),
      },
      filterNotes: [...filterNotes, fact('Hot Neptune desert: rerolled as hot super-Earth.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 3) {
    return {
      bodyClass: { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(rng.float(1.1, 1.65), 2), 'inferred', 'Hot Neptune desert filter'),
        volatileEnvelope: fact(false, 'inferred', 'Hot Neptune desert filter'),
      },
      filterNotes: [...filterNotes, fact('Hot Neptune desert: converted to stripped core.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 4) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Hot Neptune desert survivor: rare high-interest world.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 5) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Hot Neptune desert: major corporate/military research interest.', 'human-layer', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...filterNotes, fact('Hot Neptune desert: GU-assisted atmosphere retention.', 'gu-layer', 'Modern exoplanet filter')],
  }
}

function applyPeasInPodFilter(
  rng: SeededRng,
  architectureName: string,
  previous: FilteredWorldClass | null,
  input: FilteredWorldClass
): FilteredWorldClass {
  if (!architectureName.includes('Compact') || !previous) return input
  if (input.bodyClass.category === 'belt' || previous.bodyClass.category === 'belt') return input

  const roll = rng.int(1, 6)
  if (roll >= 2 && roll <= 4) {
    const radius = roundTo(previous.physical.radiusEarth.value * rng.float(0.85, 1.18), 2)
    return {
      bodyClass: input.bodyClass.category === 'gas-giant' || input.bodyClass.category === 'ice-giant'
        ? input.bodyClass
        : previous.bodyClass,
      physical: {
        ...input.physical,
        radiusEarth: fact(radius, 'inferred', 'Peas-in-a-pod filter'),
        volatileEnvelope: fact(previous.physical.volatileEnvelope.value, 'inferred', 'Peas-in-a-pod filter'),
      },
      filterNotes: [...input.filterNotes, fact('Peas-in-a-pod: adjacent planet made similar in size/composition.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 1) {
    return {
      ...input,
      filterNotes: [...input.filterNotes, fact('Peas-in-a-pod: inner neighbor trend breaks smaller/stripped.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 5) {
    return {
      ...input,
      filterNotes: [...input.filterNotes, fact('Peas-in-a-pod: outer neighbor trends larger or more volatile-rich.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...input.filterNotes, fact('Peas-in-a-pod exception: migrated, captured, or disrupted body.', 'inferred', 'Modern exoplanet filter')],
  }
}

function mDwarfHabitabilityNotes(rng: SeededRng, primary: Star, thermalZone: string, category: BodyCategory): Array<Fact<string>> {
  if (primary.spectralType.value !== 'M dwarf' || thermalZone !== 'Temperate band') return []
  if (category !== 'rocky-planet' && category !== 'super-earth') return []

  const tidalRoll = rng.int(1, 6)
  const atmosphereRoll = rng.int(1, 6)
  const tidalState =
    tidalRoll <= 3 ? 'likely tidally locked' :
    tidalRoll === 4 ? 'spin-orbit resonance' :
    tidalRoll === 5 ? 'slow rotation' :
    'unusual rotation, moon, migration, or GU effect'
  const atmosphereState =
    atmosphereRoll === 1 ? 'stripped or nearly stripped atmosphere risk' :
    atmosphereRoll === 2 ? 'thin remnant atmosphere' :
    atmosphereRoll === 3 ? 'atmosphere replenished by volcanism' :
    atmosphereRoll === 4 ? 'stable dense atmosphere candidate' :
    atmosphereRoll === 5 ? 'ocean/ice protected volatiles' :
    'GU/chiral/magnetic anomaly helps retention'

  return [
    fact(`M-dwarf habitability: ${tidalState}.`, 'inferred', 'Modern exoplanet filter'),
    fact(`M-dwarf atmosphere survival: ${atmosphereState}.`, atmosphereRoll === 6 ? 'gu-layer' : 'inferred', 'Modern exoplanet filter'),
  ]
}

function applyModernExoplanetFilters(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  thermalZone: string,
  architectureName: string,
  previous: FilteredWorldClass | null
): FilteredWorldClass {
  let current: FilteredWorldClass = { bodyClass, physical, filterNotes: [] }
  current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  current = applyPeasInPodFilter(rng, architectureName, previous, current)
  current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  return current
}


function hasLiquidOrProtectedWater(hydrosphere: string): boolean {
  return [
    'Briny aquifers',
    'Deep briny aquifers',
    'Local seas',
    'Ocean-continent balance',
    'Ice-shell subsurface ocean',
    'High-pressure condensate decks',
  ].includes(hydrosphere)
}

function supportsComplexSurfaceEnvironment(category: BodyCategory): boolean {
  return category === 'rocky-planet' || category === 'super-earth'
}

function generateClimate(rng: SeededRng, category: BodyCategory, thermalZone: string, count: number) {
  const climateTable =
    thermalZone === 'Furnace' || thermalZone === 'Inferno'
      ? category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
        ? extremeHotEnvelopeClimateTags
        : extremeHotClimateTags
      : category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
        ? envelopeClimateTags
        : thermalZone === 'Hot'
          ? hotClimateTags
          : thermalZone === 'Temperate band'
            ? temperateClimateTags
            : coldClimateTags

  return Array.from({ length: count }, () => fact(pickOne(rng, climateTable), 'inferred', 'MASS-GU climate tag table'))
}

function generateRadiation(rng: SeededRng, category: BodyCategory, thermalZone: string, primary: Star): string {
  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  const isHighActivity = ['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)
  if (isEnvelopeWorld) return pickOne(rng, ['Severe radiation belts', 'Storm-dependent hazard', 'Electronics-disruptive metric/radiation mix'])
  if (isHighActivity || thermalZone === 'Furnace' || thermalZone === 'Inferno') return pickOne(rng, highRadiationEnvironments)
  return pickOne(rng, radiationEnvironments)
}

function generateBiosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, detail: Omit<PlanetaryDetail, 'biosphere'>, primary: Star): string {
  if (!supportsComplexSurfaceEnvironment(category)) return 'Sterile'
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return 'Sterile'
  if (detail.atmosphere.value === 'None / hard vacuum' || detail.atmosphere.value === 'Trace exosphere') return 'Sterile'

  let score = twoD6(rng)
  if (thermalZone === 'Temperate band') score += 1
  if (hasLiquidOrProtectedWater(detail.hydrosphere.value)) score += 1
  if (['Benign', 'Manageable', 'Chronic exposure'].includes(detail.radiation.value)) score += 1
  if (['Active volcanism', 'Plate tectonic analogue', 'Cryovolcanism', 'Tidal heating'].includes(detail.geology.value)) score += 1
  if (primary.ageState.value === 'Mature' || primary.ageState.value === 'Old') score += 1
  if (primary.activity.value === 'Quiet' || primary.activity.value === 'Normal') score += 1
  if (primary.activity.value === 'Active') score -= 1
  if (['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)) score -= 2
  if (['Severe radiation belts', 'Flare-lethal surface', 'Only deep shielded habitats survive'].includes(detail.radiation.value)) score -= 1
  if (thermalZone === 'Cryogenic' || thermalZone === 'Dark') score -= 2
  if (detail.climate.some((tag) => tag.value === 'Recently failed terraforming climate')) score -= 2

  if (score <= 5) return 'Sterile'
  if (score === 6) return 'Prebiotic chemistry'
  if (score === 7) return 'Ambiguous biosignatures'
  if (score === 8) return 'Microbial life'
  if (score === 9) return 'Extremophile microbial ecology'
  if (score === 10) return 'Mats or planktonic biosphere'
  return pickOne(rng, biospheres.filter((value) => value !== 'Sterile' && value !== 'Prebiotic chemistry'))
}

function generateDetail(rng: SeededRng, category: BodyCategory, thermalZone: string, primary: Star): PlanetaryDetail {
  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  const isBelt = category === 'belt'
  const isExtremeHot = thermalZone === 'Furnace' || thermalZone === 'Inferno'
  const isHot = thermalZone === 'Hot'
  const isCold = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark'
  const climateCount = rng.chance(0.4) ? 2 : 1
  const atmosphere = isBelt
    ? 'None / dispersed volatiles'
    : isEnvelopeWorld
      ? pickOne(rng, ['Hydrogen/helium envelope', 'Dense greenhouse', 'Chiral-active atmosphere'])
      : isExtremeHot
        ? pickOne(rng, extremeHotAtmospheres)
        : isHot
          ? pickOne(rng, hotAtmospheres)
          : isCold
            ? pickOne(rng, coldAtmospheres)
            : pickOne(rng, atmospheres)
  const hydrosphere = isBelt
    ? pickOne(rng, ['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])
    : isEnvelopeWorld
      ? pickOne(rng, ['Deep atmospheric volatile layers', 'High-pressure condensate decks', 'No accessible surface volatiles'])
      : isExtremeHot
        ? pickOne(rng, extremeHotVolatiles)
        : isHot
          ? pickOne(rng, hotVolatiles)
          : isCold
            ? pickOne(rng, ['Subsurface ice', 'Ice-shell subsurface ocean', 'Hydrocarbon lakes/seas'])
            : pickOne(rng, hydrospheres)

  const detailWithoutBiosphere = {
    atmosphere: fact(
      atmosphere,
      'inferred',
      'MASS-GU atmosphere table'
    ),
    hydrosphere: fact(
      hydrosphere,
      'inferred',
      'MASS-GU hydrosphere table'
    ),
    geology: fact(
      isBelt ? 'Minor-body rubble and collision families' : isEnvelopeWorld ? pickOne(rng, envelopeGeologies) : pickOne(rng, geologies),
      'inferred',
      'MASS-GU geology table'
    ),
    climate: generateClimate(rng, category, thermalZone, climateCount),
    radiation: fact(
      generateRadiation(rng, category, thermalZone, primary),
      'inferred',
      'MASS-GU radiation table'
    ),
  }

  return {
    ...detailWithoutBiosphere,
    biosphere: fact(
      generateBiosphere(rng, category, thermalZone, detailWithoutBiosphere, primary),
      'inferred',
      'MASS-GU biosphere score'
    ),
  }
}

function generateMoons(rng: SeededRng, category: BodyCategory, bodyIndex: number, thermalZone: string): Moon[] {
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return []
  const moonCount =
    category === 'gas-giant' ? rng.int(4, 8) :
    category === 'ice-giant' ? rng.int(2, 5) :
    category === 'super-earth' && rng.chance(0.55) ? rng.int(1, 3) :
    category === 'rocky-planet' && rng.chance(0.35) ? 1 :
    (category === 'dwarf-body' || category === 'rogue-captured') && rng.chance(0.2) ? 1 :
    0

  return Array.from({ length: moonCount }, (_, index) => ({
    id: `body-${bodyIndex + 1}-moon-${index + 1}`,
    name: fact(moonNames[(bodyIndex + index) % moonNames.length], 'human-layer', 'Generated moon name'),
    moonType: fact(pickOne(rng, moonTypes), 'inferred', 'MASS-GU moon table'),
  }))
}

function generateRingSystem(rng: SeededRng, category: BodyCategory): RingSystem | undefined {
  if (category !== 'gas-giant' && category !== 'ice-giant' && category !== 'anomaly') return undefined
  const type = pickOne(rng, ringTypes)
  if (type === 'None or faint') return undefined
  return { type: fact(type, 'inferred', 'MASS-GU ring table') }
}

function selectWorldClassForArchitecture(
  rng: SeededRng,
  thermalZone: string,
  architectureName: string,
  index: number,
  bodyCount: number
): WorldClassOption {
  const isOuter = index >= bodyCount - 2
  const isFinal = index === bodyCount - 1
  const isMid = index === Math.floor(bodyCount / 2)

  if (architectureName === 'Debris-dominated') {
    if (index === 0 && thermalZone !== 'Furnace' && thermalZone !== 'Inferno') return forcedWorldClasses.rocky
    if (thermalZone === 'Cold') return rng.chance(0.7) ? forcedWorldClasses.belt : forcedWorldClasses.dwarf
    if (thermalZone === 'Cryogenic' || thermalZone === 'Dark') return rng.chance(0.75) ? forcedWorldClasses.iceBelt : forcedWorldClasses.dwarf
  }

  if (architectureName === 'Compact rocky chain') {
    if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return pickOne(rng, worldClassesByThermalZone[thermalZone])
    return rng.chance(0.65) ? forcedWorldClasses.rocky : forcedWorldClasses.superEarth
  }

  if (architectureName === 'Compact mixed chain') {
    if (isOuter && thermalZone !== 'Furnace' && thermalZone !== 'Inferno') return rng.chance(0.55) ? forcedWorldClasses.subNeptune : forcedWorldClasses.superEarth
    return rng.chance(0.55) ? forcedWorldClasses.rocky : forcedWorldClasses.superEarth
  }

  if (architectureName === 'Solar-ish mixed') {
    if (isMid) return forcedWorldClasses.belt
    if (isOuter) return isFinal ? forcedWorldClasses.iceGiant : forcedWorldClasses.gasGiant
  }

  if (architectureName === 'Giant-bearing system') {
    if (isOuter) return rng.chance(0.65) ? forcedWorldClasses.gasGiant : forcedWorldClasses.iceGiant
  }

  if (architectureName === 'Major GU fracture system') {
    if (isMid) return forcedWorldClasses.belt
    if (isOuter && rng.chance(0.6)) return rng.chance(0.5) ? forcedWorldClasses.gasGiant : forcedWorldClasses.iceGiant
  }

  if (architectureName === 'Relic or dark-sector system') {
    if (isOuter) return rng.chance(0.5) ? forcedWorldClasses.iceBelt : forcedWorldClasses.dwarf
  }

  return pickOne(rng, worldClassesByThermalZone[thermalZone])
}

function generateBodies(rng: SeededRng, primary: Star, bodyCount: number, architectureName: string): OrbitingBody[] {
  const orbits = generateOrbitSeries(rng, primary.luminositySolar.value, bodyCount)
  const bodies: OrbitingBody[] = []
  let previousFiltered: FilteredWorldClass | null = null

  for (let index = 0; index < orbits.length; index++) {
    const orbitAu = orbits[index]
    const insolation = calculateInsolation(primary.luminositySolar.value, orbitAu)
    const thermalZone = classifyThermalZone(insolation)
    const baseBodyClass = selectWorldClassForArchitecture(rng, thermalZone, architectureName, index, bodyCount)
    const basePhysical = buildPhysicalHints(rng, baseBodyClass, orbitAu, primary)
    const filtered = applyModernExoplanetFilters(rng, baseBodyClass, basePhysical, thermalZone, architectureName, previousFiltered)
    const habitabilityNotes = mDwarfHabitabilityNotes(rng, primary, thermalZone, filtered.bodyClass.category)
    const siteCount = rng.chance(0.55) ? 1 : 0
    const detail = generateDetail(rng, filtered.bodyClass.category, thermalZone, primary)
    const moons = generateMoons(rng, filtered.bodyClass.category, index, thermalZone)
    const rings = generateRingSystem(rng, filtered.bodyClass.category)
    bodies.push({
      id: `body-${index + 1}`,
      orbitAu: fact(orbitAu, 'derived', 'Generated orbital spacing'),
      name: fact(bodyNames[index % bodyNames.length], 'human-layer', 'Generated system nomenclature'),
      category: fact(filtered.bodyClass.category, 'inferred', 'Thermal-zone body class table'),
      massClass: fact(filtered.bodyClass.massClass, 'inferred', 'Thermal-zone body class table'),
      bodyClass: fact(filtered.bodyClass.className, 'inferred', 'Thermal-zone, architecture, and exoplanet filters'),
      thermalZone: fact(thermalZone, 'derived', `Insolation ${roundTo(insolation, 3)} S`),
      physical: filtered.physical,
      detail,
      moons,
      rings,
      filterNotes: [...filtered.filterNotes, ...habitabilityNotes],
      traits: [fact(pickOne(rng, traitOptions), 'inferred', 'Generated world trait')],
      sites: Array.from({ length: siteCount }, () => fact(pickOne(rng, siteOptions), 'human-layer', 'Generated site')),
    })
    previousFiltered = filtered
  }

  return bodies
}

function generateGuOverlay(rng: SeededRng, preference: GuPreference, primary: Star, bodies: OrbitingBody[], architectureName: string) {
  let baseIndex = preference === 'low' ? rng.int(0, 2) : preference === 'high' ? rng.int(2, 4) : preference === 'fracture' ? rng.int(4, 5) : rng.int(1, 4)
  if (primary.spectralType.value === 'M dwarf' && ['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)) baseIndex += 1
  if (bodies.some((body) => body.category.value === 'gas-giant')) baseIndex += 1
  if (architectureName.includes('Compact')) baseIndex += 1
  if (primary.spectralType.value === 'G dwarf' || primary.spectralType.value === 'K dwarf') {
    if (primary.activity.value === 'Quiet') baseIndex -= 1
  }
  baseIndex = Math.max(0, Math.min(guIntensities.length - 1, baseIndex))
  return {
    intensity: fact(guIntensities[baseIndex], 'gu-layer', 'MASS-GU GU intensity'),
    bleedLocation: fact(pickOne(rng, bleedLocations), 'gu-layer', 'MASS-GU bleed-zone table'),
    resource: fact(pickOne(rng, guResources), 'gu-layer', 'MASS-GU resource table'),
    hazard: fact(pickOne(rng, guHazards), 'gu-layer', 'MASS-GU hazard table'),
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, value))
}

function assertNever(value: never): never {
  throw new Error(`Unhandled settlement category: ${value}`)
}

function settlementTagHook(obviousTag: string, deeperTag: string): string {
  const exactPair = `${obviousTag} + ${deeperTag}`
  if (exactPair === 'Air Is Money + Debt Labor') {
    return 'Air Is Money is visible in every meter and airlock; Debt Labor means workers cannot afford passage out.'
  }
  if (exactPair === 'Bleed-Chaser Port + Narrow-AI Schism') {
    return 'Bleed-Chaser Port draws ships racing moving nodes; Narrow-AI Schism means local AIs disagree over which predictions are safe.'
  }
  if (exactPair === 'Perfect Dome, Rotten Outside + Chiral Monopoly') {
    return 'Perfect Dome, Rotten Outside is the public shape; Chiral Monopoly is the toxic extraction chain everyone outside the dome must endure.'
  }

  const deeperPressures: Record<string, string> = {
    'Abandoned First Wave': 'old first-wave decisions still decide who has shelter, air, and legal standing.',
    'Air Is Money': 'life support has become the settlement currency and the main lever of control.',
    'AI Whisper Cult': 'residents read spiritual or political meaning into narrow-AI behavior.',
    'Anti-Corporate Commune': 'the public story hides a working political break with corporate control.',
    'Aristocratic Dome': 'elite protection and outside deprivation are tied together.',
    'Automated but Haunted': 'old automation keeps producing patterns locals treat as messages.',
    'Bleed-Chaser Port': 'travel, debt, and risk all orbit the next moving bleed opportunity.',
    'Border Fort': 'military necessity is being used to justify civilian restrictions.',
    'Broken Terraformer': 'a failed environmental project is still shaping the crisis.',
    'Chiral Monopoly': 'one faction controls access to the resource everyone needs.',
    'Debt Labor': 'contracts and life-support fees make departure functionally impossible.',
    'Deep Ice': 'buried volatiles or under-ice habitats conceal the real value of the site.',
    'Derelict Yard': 'salvage law and old wreckage hide the deeper conflict.',
    'Elegant Core Enclave': 'polished public spaces mask a harsher dependent economy.',
    'Exile Haven': 'people with incompatible pasts are forced to rely on each other.',
    'Flare Refuge': 'survival protocols double as social control.',
    'Free Captain Nest': 'independent crews set the local law when formal authority fails.',
    'Gate Shadow': 'route access determines who prospers and who is trapped.',
    'Ghost City, Human': 'the haunting is human history, not the supernatural.',
    'High-G Research': 'dangerous science is being treated as necessary infrastructure.',
    'Hidden Navy': 'military presence is deeper than the public registry admits.',
    'Hydrocarbon Frontier': 'volatile extraction keeps everyone solvent and vulnerable.',
    'Kessler Cloud': 'debris hazards make movement, rescue, and evacuation political.',
    'Machine-Run Town': 'humans depend on systems they do not fully control.',
    'Memory-Loss Zone': 'missing records and altered recollections decide the dispute.',
    'Migrant Swarm': 'temporary populations outnumber the institutions meant to govern them.',
    'Moving Node Rush': 'short-lived opportunity is pushing people into unsafe choices.',
    'Narrow-AI Schism': 'AIs agree on facts but not on which human orders can be obeyed.',
    'Old War Minefield': 'legacy weapons make ordinary operations into negotiations.',
    'Outlaw Court': 'local justice answers to power before law.',
    'Penal Extraction': 'punishment and resource production are the same system.',
    'Perfect Dome, Rotten Outside': 'comfort inside depends on sacrifice outside.',
    'Plague/Biosafety Fear': 'containment policy is shaping every personal choice.',
    'Precious Water': 'water ownership is the settlement constitution.',
    'Religious Geometry': 'belief and GU observation are tangled in local politics.',
    'Strikebreaker City': 'labor peace is being maintained by coercion.',
  }

  return `${obviousTag} is what visitors notice first; ${deeperPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`}`
}

function scoreSettlementPresence(body: OrbitingBody, guOverlay: ReturnType<typeof generateGuOverlay>, reachability: ReturnType<typeof generateReachability>) {
  const resource = clampScore(
    (body.category.value === 'belt' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant' ? 2 : 0) +
    (body.sites.length ? 1 : 0) +
    (body.traits.some((trait) => trait.value.includes('resource')) ? 1 : 0) +
    (guOverlay.resource.value ? 1 : 0)
  )
  const access = clampScore(
    (body.category.value === 'belt' || body.category.value === 'dwarf-body' ? 2 : 1) +
    (reachability.className.value.includes('hub') || reachability.className.value.includes('Iggygate') ? 2 : 0) +
    (reachability.className.value.includes('Trade') || reachability.className.value.includes('Corporate') ? 1 : 0)
  )
  const strategic = clampScore(
    (reachability.className.value.includes('Military') || reachability.className.value.includes('Iggygate') ? 3 : 0) +
    (reachability.className.value.includes('crossroads') || reachability.className.value.includes('hub') ? 2 : 0) +
    (body.rings ? 1 : 0)
  )
  const guValue = clampScore(
    (guOverlay.intensity.value.includes('Rich') ? 2 : 0) +
    (guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear') ? 3 : 0) +
    (body.traits.some((trait) => trait.value.includes('metric')) ? 1 : 0)
  )
  const habitability = clampScore(
    (body.thermalZone.value === 'Temperate band' ? 2 : 0) +
    (body.detail.biosphere.value !== 'Sterile' ? 1 : 0) +
    (body.detail.radiation.value === 'Benign' || body.detail.radiation.value === 'Manageable' ? 1 : 0)
  )
  const hazard = clampScore(
    (body.detail.radiation.value.includes('Severe') || body.detail.radiation.value.includes('Flare-lethal') ? 2 : 0) +
    (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno' ? 2 : 0) +
    (guOverlay.hazard.value ? 1 : 0)
  )
  const legalHeat = clampScore(
    (reachability.className.value.includes('Gardener') ? 3 : 0) +
    (guOverlay.hazard.value.includes('quarantine') ? 2 : 0) +
    (guOverlay.resource.value.includes('Illegal') ? 3 : 0)
  )
  const routeValue = reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub') ? 2 : 1
  const score = 7 + resource + access + strategic + guValue + routeValue + habitability - hazard - legalHeat

  return { score, resource, access, strategic, guValue, habitability, hazard, legalHeat }
}

function targetSettlementCount(options: GenerationOptions): number {
  if (options.settlements === 'sparse') return 1
  if (options.settlements === 'crowded') return 4
  if (options.settlements === 'hub') return 5
  return 3
}

function settlementScaleFromScore(score: number, rng: SeededRng): string {
  if (score >= 15) return 'major campaign location'
  if (score >= 13) return 'regional power center'
  if (score >= 12) return 'large colony, hub, or shipyard'
  if (score >= 11) return 'town, freeport, or military complex'
  if (score >= 10) return 'major base or industrial site'
  if (score >= 9) return 'settlement, dome, tunnel-town, or station'
  if (score >= 8) return 'small permanent outpost'
  if (score >= 7) return 'automated mine/refinery/research rig'
  return pickOne(rng, settlementScales)
}

function location(label: string, category: SettlementSiteCategory): SettlementLocationOption {
  return { label, category }
}

function chooseSettlementLocation(rng: SeededRng, body: OrbitingBody, reachability: ReturnType<typeof generateReachability>): SettlementLocationOption {
  const orbitalOptions = [
    location('Low-orbit station', 'Orbital station'),
    location('High-orbit station', 'Orbital station'),
    location('Lagrange anchor', 'Deep-space platform'),
    location('Trojan habitat', 'Deep-space platform'),
    location('Ring-arc platform', 'Orbital station'),
  ] satisfies SettlementLocationOption[]
  const routeOptions = [
    location('Iggygate throat complex', 'Gate or route node'),
    location('Pinchdrive calibration range', 'Gate or route node'),
    location('Quarantine perimeter station', 'Gate or route node'),
    location('Sol/Gardener exclusion picket', 'Gate or route node'),
    location('Military listening post', 'Gate or route node'),
  ] satisfies SettlementLocationOption[]
  const asteroidOptions = [
    location('Asteroid tunnel city', 'Asteroid or belt base'),
    location('Belt refinery', 'Asteroid or belt base'),
    location('Comet ice camp', 'Asteroid or belt base'),
    location('Dwarf-planet bunker', 'Asteroid or belt base'),
    location('Rogue-body hideout', 'Asteroid or belt base'),
    location('White-dwarf debris station', 'Asteroid or belt base'),
  ] satisfies SettlementLocationOption[]
  const surfaceOptions = [
    location('Planetary surface dome', 'Surface settlement'),
    location('Lava tube settlement', 'Surface settlement'),
    location('Polar ice mine', 'Surface settlement'),
    location('Terminator-line rail city', 'Surface settlement'),
    location('Floating aerostat', 'Surface settlement'),
    location('Seafloor or under-ice habitat', 'Surface settlement'),
    location('Deep canyon pressure habitat', 'Surface settlement'),
  ] satisfies SettlementLocationOption[]
  const moonOptions = [
    location('Moon crater base', 'Moon base'),
    location('Subsurface ocean bore station', 'Moon base'),
    location('Tidal-volcanic power site', 'Moon base'),
    location('Magnetic-pole observatory', 'Moon base'),
    location('Radiation-belt fortress', 'Moon base'),
  ] satisfies SettlementLocationOption[]
  const mobileOptions = [
    location('Moving bleed-node chase fleet', 'Mobile site'),
    location('Freeport cluster', 'Mobile site'),
  ] satisfies SettlementLocationOption[]
  const restrictedOptions = [
    location('First-wave human ruin', 'Derelict or restricted site'),
    location('Hidden black site', 'Derelict or restricted site'),
    location('Corporate enclave', 'Derelict or restricted site'),
    location('Penal extraction camp', 'Derelict or restricted site'),
    location('Religious/ideological refuge', 'Derelict or restricted site'),
  ] satisfies SettlementLocationOption[]

  if (reachability.className.value.includes('Iggygate') && rng.chance(0.6)) return pickOne(rng, routeOptions)
  if (body.category.value === 'belt') return pickOne(rng, [...asteroidOptions, ...orbitalOptions])
  if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') {
    return pickOne(rng, [
      location('Gas-giant skimmer', 'Orbital station'),
      ...orbitalOptions,
      ...(body.moons.length > 0 ? moonOptions : []),
      ...routeOptions.slice(1),
    ])
  }
  if (body.moons.length > 0 && rng.chance(0.35)) return pickOne(rng, moonOptions)
  if (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno') return pickOne(rng, [...orbitalOptions, ...routeOptions])
  if (body.thermalZone.value === 'Cold' || body.thermalZone.value === 'Cryogenic' || body.thermalZone.value === 'Dark') {
    return pickOne(rng, [...asteroidOptions, ...(body.moons.length > 0 ? moonOptions : []), ...restrictedOptions, ...mobileOptions])
  }
  if (rng.chance(0.2)) return pickOne(rng, [...routeOptions, ...mobileOptions, ...restrictedOptions])
  return pickOne(rng, [...surfaceOptions, ...(body.moons.length > 0 ? moonOptions : []), ...orbitalOptions])
}

function chooseSettlementFunction(
  rng: SeededRng,
  body: OrbitingBody,
  locationOption: SettlementLocationOption,
  guOverlay: ReturnType<typeof generateGuOverlay>
): string {
  if (guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) {
    return pickOne(rng, ['Chiral harvesting site', 'Moving bleed-node harvest fleet', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station'])
  }
  if (body.detail.biosphere.value !== 'Sterile') return pickOne(rng, ['Biosphere research station', 'Quarantine station', 'Civilian colony', 'Planetology lab'])

  switch (locationOption.category) {
    case 'Surface settlement':
      if (locationOption.label.includes('ice') || locationOption.label.includes('under-ice')) return pickOne(rng, ['Volatile mine', 'Biosphere research station', 'Civilian colony', 'Refugee settlement'])
      if (locationOption.label.includes('Lava') || locationOption.label.includes('Polar')) return pickOne(rng, [...extractionFunctions, ...surveyFunctions])
      return pickOne(rng, [...civilFunctions, ...surveyFunctions, ...extractionFunctions])
    case 'Orbital station':
      if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') return pickOne(rng, ['Fuel depot', 'Ship repair yard', 'Survey station', 'Naval logistics depot'])
      return pickOne(rng, [...orbitalFunctions, ...surveyFunctions, ...securityFunctions])
    case 'Asteroid or belt base':
      return pickOne(rng, [...extractionFunctions, 'Fuel depot', 'Salvage yard', 'Smuggler port'])
    case 'Moon base':
      return pickOne(rng, [...extractionFunctions, ...surveyFunctions, 'Military base', 'Biosphere research station', 'Quarantine station'])
    case 'Deep-space platform':
      return pickOne(rng, [...orbitalFunctions, ...surveyFunctions, 'Listening post', 'Corporate customs post'])
    case 'Gate or route node':
      return pickOne(rng, [...routeFunctions, ...securityFunctions])
    case 'Mobile site':
      return pickOne(rng, ['Moving bleed-node harvest fleet', 'Freeport', 'Smuggler port', 'Refugee settlement', 'Naval logistics depot'])
    case 'Derelict or restricted site':
      return pickOne(rng, ['Survey station', 'Salvage yard', 'Intelligence black site', 'Prison or debt-labor site', 'Quarantine station', 'Weapons test range'])
    default:
      return assertNever(locationOption.category)
  }
}

function chooseBuiltForm(rng: SeededRng, locationOption: SettlementLocationOption, settlementFunction: string): string {
  if (locationOption.label === 'Terminator-line rail city') return 'Rail-linked terminator city'
  if (locationOption.label === 'Floating aerostat') return 'Aerostat city'
  if (locationOption.label === 'Seafloor or under-ice habitat') return 'Submarine habitat'
  if (locationOption.label === 'Subsurface ocean bore station') return 'Borehole habitat'
  if (locationOption.label === 'Lava tube settlement') return 'Lava-tube arcology'
  if (locationOption.label === 'First-wave human ruin') return 'First-wave retrofitted ruin'
  if (locationOption.label === 'Asteroid tunnel city') return 'Asteroid hollow'
  if (locationOption.label === 'Moving bleed-node chase fleet') return pickOne(rng, mobileBuiltForms)
  if (settlementFunction.includes('mine') || settlementFunction.includes('extraction')) {
    if (locationOption.category === 'Asteroid or belt base') return pickOne(rng, ['Asteroid hollow', 'Buried pressure cans', 'Ice-shielded tunnels'])
    if (locationOption.category === 'Moon base') return pickOne(rng, ['Buried pressure cans', 'Ice-shielded tunnels', 'Borehole habitat', 'Shielded military bunker'])
    if (locationOption.category === 'Surface settlement') return pickOne(rng, ['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster'])
    return pickOne(rng, ['Modular orbital lattice', 'Shielded military bunker'])
  }

  switch (locationOption.category) {
    case 'Orbital station':
      return pickOne(rng, orbitalBuiltForms)
    case 'Asteroid or belt base':
      return pickOne(rng, asteroidBuiltForms)
    case 'Surface settlement':
      return pickOne(rng, surfaceBuiltForms)
    case 'Moon base':
      return pickOne(rng, moonBuiltForms)
    case 'Gate or route node':
      return pickOne(rng, gateBuiltForms)
    case 'Mobile site':
      return pickOne(rng, mobileBuiltForms)
    case 'Deep-space platform':
      return pickOne(rng, orbitalBuiltForms)
    case 'Derelict or restricted site':
      return pickOne(rng, derelictBuiltForms)
    default:
      return assertNever(locationOption.category)
  }
}

function chooseSettlementAnchor(
  rng: SeededRng,
  systemName: string,
  body: OrbitingBody,
  locationOption: SettlementLocationOption
): SettlementAnchor {
  const bodyName = body.name.value

  if (locationOption.category === 'Moon base') {
    const moon = body.moons.length > 0 ? pickOne(rng, body.moons) : undefined
    if (moon) {
      return {
        kind: 'major moon',
        name: `${moon.name.value}, moon of ${bodyName}`,
        detail: `${locationOption.label} on a ${moon.moonType.value.toLowerCase()} orbiting ${bodyName}.`,
        moonId: moon.id,
      }
    }
    return {
      kind: 'minor moonlet',
      name: `minor moonlet of ${bodyName}`,
      detail: `${locationOption.label} on a minor moonlet not otherwise detailed in the orbital profile.`,
    }
  }

  if (locationOption.category === 'Surface settlement') {
    return {
      kind: 'body surface',
      name: bodyName,
      detail: `${locationOption.label} on ${bodyName}, a ${body.bodyClass.value.toLowerCase()} in the ${body.thermalZone.value.toLowerCase()} zone.`,
    }
  }

  if (locationOption.category === 'Orbital station') {
    return {
      kind: 'orbit',
      name: `${bodyName} orbital space`,
      detail: `${locationOption.label} in operational orbit around ${bodyName}.`,
    }
  }

  if (locationOption.category === 'Asteroid or belt base') {
    const anchorName = body.category.value === 'belt' ? bodyName : `${bodyName} minor-body complex`
    return {
      kind: body.category.value === 'belt' ? 'belt' : 'nearby minor bodies',
      name: anchorName,
      detail: `${locationOption.label} tied to ${anchorName}.`,
    }
  }

  if (locationOption.category === 'Deep-space platform') {
    return {
      kind: 'orbital point',
      name: `${bodyName} route geometry`,
      detail: `${locationOption.label} at a stable traffic, Trojan, or Lagrange-adjacent point associated with ${bodyName}.`,
    }
  }

  if (locationOption.category === 'Gate or route node') {
    return {
      kind: 'route node',
      name: `${systemName} transit geometry`,
      detail: `${locationOption.label} positioned where system traffic, interdiction, or pinchdrive calibration passes through ${bodyName}'s region.`,
    }
  }

  if (locationOption.category === 'Mobile site') {
    return {
      kind: 'mobile route presence',
      name: `${systemName} traffic pattern`,
      detail: `${locationOption.label} operating across a moving resource, refugee, or freeport route near ${bodyName}.`,
    }
  }

  return {
    kind: 'restricted site',
    name: bodyName,
    detail: `${locationOption.label} associated with ${bodyName}, but its exact footprint is politically or legally obscured.`,
  }
}

function settlementWhyHere(
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

  return `${anchor.name}: ${selected.join('; ')}.`
}

function generateSettlements(
  rng: SeededRng,
  options: GenerationOptions,
  systemName: string,
  bodies: OrbitingBody[],
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>
): Settlement[] {
  const scored = bodies
    .map((body) => ({ body, presence: scoreSettlementPresence(body, guOverlay, reachability) }))
    .sort((a, b) => b.presence.score - a.presence.score)
    .slice(0, targetSettlementCount(options))
    .filter((entry) => options.settlements !== 'sparse' || entry.presence.score >= 8)

  return scored.map(({ body, presence }, index) => {
    const locationOption = chooseSettlementLocation(rng, body, reachability)
    const settlementFunction = chooseSettlementFunction(rng, body, locationOption, guOverlay)
    const builtForm = chooseBuiltForm(rng, locationOption, settlementFunction)
    const anchor = chooseSettlementAnchor(rng, systemName, body, locationOption)
    const whyHere = settlementWhyHere(body, presence, guOverlay, reachability, anchor)
    const tags = [pickOne(rng, settlementTags), pickOne(rng, settlementTags)]
    const tagHook = settlementTagHook(tags[0], tags[1])
    return {
      id: `settlement-${index + 1}`,
      bodyId: body.id,
      moonId: anchor.moonId,
      name: fact(`${body.name.value} ${pickOne(rng, ['Freeport', 'Anchor', 'Bore', 'Picket', 'Yard', 'Station'])}`, 'human-layer', 'Generated settlement name'),
      anchorKind: fact(anchor.kind, 'human-layer', 'Generated site-to-body relationship'),
      anchorName: fact(anchor.name, 'human-layer', 'Generated site-to-body relationship'),
      anchorDetail: fact(anchor.detail, 'human-layer', 'Generated site-to-body relationship'),
      siteCategory: fact(locationOption.category, 'human-layer', 'MASS-GU section 18 constrained site category'),
      location: fact(locationOption.label, 'human-layer', 'MASS-GU 18.3 site location table with body constraints'),
      function: fact(settlementFunction, 'human-layer', 'MASS-GU settlement function table with body constraints'),
      scale: fact(settlementScaleFromScore(presence.score, rng), 'human-layer', 'MASS-GU settlement presence score'),
      authority: fact(pickOne(rng, settlementAuthorities), 'human-layer', 'MASS-GU 18.5 authority table'),
      builtForm: fact(builtForm, 'human-layer', 'MASS-GU built form table with location/function constraints'),
      aiSituation: fact(pickOne(rng, aiSituations), 'human-layer', 'MASS-GU AI situation table'),
      condition: fact(pickOne(rng, settlementConditions), 'human-layer', 'MASS-GU settlement condition table'),
      tags: tags.map((tag, tagIndex) => fact(tag, 'human-layer', tagIndex === 0 ? 'MASS-GU 18.9 obvious settlement tag' : 'MASS-GU 18.9 deeper settlement tag')),
      tagHook: fact(tagHook, 'human-layer', 'Generated interpretation of MASS-GU 18.9 tag pair'),
      crisis: fact(pickOne(rng, settlementCrises), 'human-layer', 'MASS-GU 18.10 crisis table'),
      hiddenTruth: fact(pickOne(rng, hiddenTruths), 'human-layer', 'MASS-GU 18.11 hidden truth table; no-alien conversion applied where needed'),
      encounterSites: Array.from({ length: 2 }, () => fact(pickOne(rng, encounterSites), 'human-layer', 'MASS-GU 18.12 local encounter site table')),
      whyHere: fact(whyHere, 'human-layer', 'Generated from MASS-GU 18.1 presence score components'),
      methodNotes: [
        fact('Source-derived from MASS-GU section 18; current implementation adds compatibility constraints between body, site category, function, built form, and physical anchor.', 'human-layer', 'Implementation note'),
      ],
      presence: {
        score: fact(presence.score, 'human-layer', 'MASS-GU settlement presence score'),
        resource: fact(presence.resource, 'human-layer', 'Presence score component'),
        access: fact(presence.access, 'human-layer', 'Presence score component'),
        strategic: fact(presence.strategic, 'human-layer', 'Presence score component'),
        guValue: fact(presence.guValue, 'gu-layer', 'Presence score component'),
        habitability: fact(presence.habitability, 'inferred', 'Presence score component'),
        hazard: fact(presence.hazard, 'inferred', 'Presence score component'),
        legalHeat: fact(presence.legalHeat, 'human-layer', 'Presence score component'),
      },
    }
  })
}

function generateHumanRemnants(rng: SeededRng, bodies: OrbitingBody[], guOverlay: ReturnType<typeof generateGuOverlay>): HumanRemnant[] {
  const count = guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear') ? 3 : 2
  return Array.from({ length: count }, (_, index) => {
    const body = pickOne(rng, bodies)
    return {
      id: `remnant-${index + 1}`,
      location: fact(body.name.value, 'human-layer', 'Generated remnant location'),
      remnantType: fact(pickOne(rng, humanRemnants), 'human-layer', 'MASS-GU human remnant table'),
      hook: fact(pickOne(rng, remnantHooks), 'human-layer', 'Generated remnant hook'),
    }
  })
}

function generatePhenomena(rng: SeededRng, architectureName: string, guOverlay: ReturnType<typeof generateGuOverlay>): SystemPhenomenon[] {
  const count = guOverlay.intensity.value.includes('Rich') || architectureName.includes('Major') ? 3 : 2
  return Array.from({ length: count }, (_, index) => {
    const phenomenon = pickOne(rng, phenomena)
    return {
      id: `phenomenon-${index + 1}`,
      phenomenon: fact(phenomenon, phenomenon.includes('bleed') || phenomenon.includes('chiral') || phenomenon.includes('Iggygate') ? 'gu-layer' : 'inferred', 'MASS-GU expanded phenomena table'),
      note: fact(`${phenomenon} shapes travel, survey priorities, or local conflict.`, 'inferred', 'Generated phenomenon note'),
    }
  })
}

export function generateSystem(options: GenerationOptions): GeneratedSystem {
  const rootRng = createSeededRng(options.seed)
  const name = generateSystemName(rootRng.fork('name'))
  const primary = generatePrimaryStar(rootRng.fork('star'), options, name)
  const reachability = generateReachability(rootRng.fork('reachability'))
  const architectureResult = generateArchitecture(rootRng.fork('architecture'), options, primary, reachability.className.value)
  const hz = calculateHabitableZone(primary.luminositySolar.value)
  const snowLine = calculateSnowLine(primary.luminositySolar.value)
  const bodies = generateBodies(rootRng.fork('bodies'), primary, architectureResult.bodyCount, architectureResult.architecture.name.value)
  const guOverlay = generateGuOverlay(rootRng.fork('gu'), options.gu, primary, bodies, architectureResult.architecture.name.value)
  const settlements = generateSettlements(rootRng.fork('settlements'), options, name, bodies, guOverlay, reachability)
  const ruins = generateHumanRemnants(rootRng.fork('ruins'), bodies, guOverlay)
  const phenomena = generatePhenomena(rootRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)

  return {
    id: `system-${options.seed}`,
    seed: options.seed,
    options,
    name: fact(name, 'human-layer', 'Generated system name'),
    dataBasis: fact('Fictional generated system', 'human-layer', 'MVP fictional generation'),
    primary,
    reachability,
    architecture: architectureResult.architecture,
    zones: {
      habitableInnerAu: fact(hz.inner, 'derived', '0.75 * sqrt(L)'),
      habitableCenterAu: fact(hz.center, 'derived', 'sqrt(L)'),
      habitableOuterAu: fact(hz.outer, 'derived', '1.77 * sqrt(L)'),
      snowLineAu: fact(snowLine, 'derived', '2.7 * sqrt(L)'),
    },
    bodies,
    guOverlay,
    settlements,
    ruins,
    phenomena,
    majorHazards: [guOverlay.hazard, fact(primary.activity.value, 'inferred', 'Stellar activity hazard')],
    noAlienCheck: {
      passed: true,
      note: 'No alien civilizations, alien ruins, alien artifacts, or alien megastructures generated.',
    },
  }
}

import type {
  BodyCategory,
  BodyPhysicalHints,
  Fact,
  Gate,
  GeneratedSystem,
  GenerationOptions,
  GeneratorTone,
  GuPreference,
  HumanRemnant,
  Moon,
  NarrativeFact,
  OrbitingBody,
  PlanetaryDetail,
  PartialKnownBody,
  PartialKnownStar,
  PartialKnownSystem,
  RingSystem,
  Settlement,
  SettlementHabitationPattern,
  SettlementPopulation,
  Star,
  StellarCompanion,
  SystemPhenomenon,
} from '../../types'
import {
  buildArchitectureSlots,
  createKnownImportSlot,
  evaluateArchitectureSatisfaction,
  replacementSlotsForUnsatisfiedRequirements,
  type ArchitectureSlot,
  type OrbitBand,
} from './architecture'
import { generateBodyInterest, generateBodyProfile, generateGiantEconomy } from './bodyInterest'
import { calculateHabitableZone, calculateInsolation, calculateSnowLine, classifyThermalZone, roundTo } from './calculations'
import { d8, d10, d12, d20, d100, pickOne, pickTable, twoD6 } from './dice'
import { bodyDesignation, moonDesignation } from './designations'
import { extremeHotThermalZones, hotThermalZones, type BodyPlanKind, type WorldClassOption } from './domain'
import { deriveEnvironmentPolicy, normalizeDetailForEnvironment } from './environmentPolicy'
import {
  settlementNameDescriptors,
  systemCatalogLabels,
  systemNameCores,
  systemNameForms,
  systemNamePatterns,
  type RuleBackedDescriptorSet,
} from './data/names'
import {
  bleedBehaviorTable,
  bleedLocationTable,
  domainsForGuValue,
  guHazardTable,
  guIntensityTable,
  guResourceTable,
} from './data/gu'
import {
  acousticEnvironmentTable,
  activityLabels,
  atmosphereTable,
  atmosphericTracesTable,
  axialTiltTable,
  biospheres,
  biosphereDistributionTable,
  climateSourceTable,
  coldClimateTags,
  coldEnvelopeClimateTags,
  dayLengthTable,
  envelopeGeologies,
  extremeHotAtmospheres,
  extremeHotClimateTags,
  extremeHotEnvelopeClimateTags,
  extremeHotVolatiles,
  geologyTable,
  hotClimateTags,
  hotEnvelopeClimateTags,
  hydrologyTable,
  hydrosphereTable,
  magneticFieldTable,
  mineralCompositionTable,
  rotationProfileTable,
  seismicActivityTable,
  skyPhenomenaTable,
  surfaceHazardsTable,
  surfaceLightTable,
  topographyTable,
  moonScales,
  moonTypes,
  radiationTable,
  resourceAccessTable,
  ringTypeTable,
  bodySites,
  type BodySiteGroup,
  temperateClimateTags,
  temperateEnvelopeClimateTags,
  tidalRegimeTable,
  windRegimeTable,
} from './data/mechanics'
import { humanRemnants, phenomena, remnantHooks } from './data/narrative'
import { generateFactions } from './factions'
import {
  aiSituations,
  asteroidBaseFunctions,
  biosphereFunctions,
  builtForms,
  civilFunctions,
  deepSpaceFunctions,
  encounterSites,
  encounterSitesByFunctionKeyword,
  encounterSitesByHabitationPattern,
  encounterSitesByPopulationBand,
  GENERATION_SHIP_POPULATION_BAND,
  HABITATION_POPULATION_FLOORS,
  POPULATION_BAND_INDEX,
  populationBandFor,
  extractionFunctions,
  giantOrbitalFunctions,
  guFractureFunctionsBySiteCategory,
  habitationPatternDefaults,
  hiddenTruthByHabitationPattern,
  hiddenTruths,
  mobileFunctions,
  moonBaseFunctions,
  orbitalFunctions,
  restrictedFunctions,
  routeFunctions,
  securityFunctions,
  settlementAuthorities,
  settlementAuthorityByHabitationPattern,
  settlementConditionByHabitationPattern,
  settlementConditions,
  settlementCrisisByHabitationPattern,
  settlementCrisisByPopulationBand,
  settlementCrises,
  settlementLocations,
  settlementPopulationTable,
  settlementTagOptions,
  surveyFunctions,
  surfaceIceFunctions,
  type SettlementLocationOption,
  type SettlementSiteCategory,
} from './data/settlements'
import {
  ageStates,
  architectures,
  frontierStarTypes,
  metallicities,
  reachabilityClasses,
  realisticStarTypes,
} from './data/stellar'
import { NameRegistry } from './nameRegistry'
import { lowerFirst, sentenceFragment } from './prose/helpers'
import { settlementHookSynthesis } from './prose/settlementProse'
import { phenomenonNote } from './prose/phenomenonProse'
import { buildRelationshipGraph, renderSystemStory } from './graph'
import { graphAwareReshape } from './prose'
import { selectSystemHooks } from './hooks'
import { createSeededRng, type SeededRng } from './rng'

export { architectureBodyPlanRules } from './architecture'

interface FilteredWorldClass {
  bodyClass: WorldClassOption
  physical: BodyPhysicalHints
  filterNotes: Array<Fact<string>>
}

export interface SettlementAnchor {
  kind: string
  name: string
  detail: string
  moonId?: string
}

export const worldClassesByThermalZone: Record<string, readonly WorldClassOption[]> = {
  Furnace: [
    { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' },
    { className: 'Ultra-dense super-Mercury', category: 'rocky-planet', massClass: 'Dense terrestrial' },
    { className: 'Lava planet', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Magma ocean world', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Carbon-rich furnace world', category: 'rocky-planet', massClass: 'Carbon-rich terrestrial' },
    { className: 'Dayside glass world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Nightside mineral frost world', category: 'rocky-planet', massClass: 'Tide-locked terrestrial' },
    { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
    { className: 'Hot Neptune desert survivor', category: 'sub-neptune', massClass: 'Rare close-in Neptunian' },
    { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' },
    { className: 'Ultra-hot Jupiter', category: 'gas-giant', massClass: 'Ultra-hot gas giant' },
    { className: 'Captured close-in body', category: 'rogue-captured', massClass: 'Captured close-in body' },
    { className: 'Artificially shielded human facility world', category: 'anomaly', massClass: 'Shielded facility world' },
    { className: 'GU-scarred chiral furnace world', category: 'anomaly', massClass: 'Chiral furnace anomaly' },
  ],
  Inferno: [
    { className: 'Rock-vapor atmosphere world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Carbon-rich furnace world', category: 'rocky-planet', massClass: 'Carbon-rich terrestrial' },
    { className: 'Ultra-dense super-Mercury', category: 'rocky-planet', massClass: 'Dense terrestrial' },
    { className: 'Tidally stretched volcanic world', category: 'rocky-planet', massClass: 'Tidal volcanic terrestrial' },
    { className: 'Evaporating rocky planet with dust tail', category: 'rocky-planet', massClass: 'Ablating terrestrial' },
    { className: 'Hot sub-Neptune, unstable atmosphere', category: 'sub-neptune', massClass: 'Unstable sub-Neptune' },
    { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' },
    { className: 'Ultra-hot Jupiter', category: 'gas-giant', massClass: 'Ultra-hot gas giant' },
    { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' },
    { className: 'Captured close-in body', category: 'rogue-captured', massClass: 'Captured close-in body' },
  ],
  Hot: [
    { className: 'Airless scorched rock', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Desert Mercury-like world', category: 'rocky-planet', massClass: 'Mercury-like terrestrial' },
    { className: 'Basaltic super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Venus-like greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Steam greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Sulfur-cloud world', category: 'rocky-planet', massClass: 'Toxic terrestrial' },
    { className: 'Chlorine/perchlorate desert', category: 'rocky-planet', massClass: 'Reactive-chemistry terrestrial' },
    { className: 'Dry supercontinent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot ocean remnant', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Dense-atmosphere pressure world', category: 'super-earth', massClass: 'High-pressure super-Earth' },
    { className: 'Tidal-locked eyeball desert', category: 'rocky-planet', massClass: 'Tide-locked terrestrial' },
    { className: 'Super-Earth with high gravity', category: 'super-earth', massClass: 'High-gravity super-Earth' },
    { className: 'Mini-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
    { className: 'Puffy low-density sub-Neptune', category: 'sub-neptune', massClass: 'Low-density sub-Neptune' },
    { className: 'Warm Neptune', category: 'ice-giant', massClass: 'Warm Neptunian' },
    { className: 'Migrated giant', category: 'gas-giant', massClass: 'Migrated gas giant' },
    { className: 'Resonant inner-chain world', category: 'super-earth', massClass: 'Resonant chain world' },
    { className: 'Chiral mineral harvest world', category: 'anomaly', massClass: 'Chiral resource world' },
    { className: 'Corporate solar-furnace industry world', category: 'anomaly', massClass: 'Industrial facility world' },
    { className: 'Bleed-heated geological anomaly', category: 'anomaly', massClass: 'GU geological anomaly' },
  ],
  'Temperate band': [
    { className: 'Airless rock in nominal HZ', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Mars-like cold desert', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Dry terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Thin-atmosphere terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Earth-sized terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Super-terrestrial', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ocean-continent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Waterworld', category: 'rocky-planet', massClass: 'Ocean terrestrial' },
    { className: 'Ice-capped ocean world', category: 'rocky-planet', massClass: 'Ocean terrestrial' },
    { className: 'Tidally locked terminator world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Cloudy greenhouse edge world', category: 'rocky-planet', massClass: 'Greenhouse-edge terrestrial' },
    { className: 'Snowball world with subsurface ocean', category: 'rocky-planet', massClass: 'Snowball ocean world' },
    { className: 'High-pressure super-Earth', category: 'super-earth', massClass: 'High-pressure super-Earth' },
    { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
    { className: 'Hycean-like candidate', category: 'sub-neptune', massClass: 'H2-rich ocean candidate' },
    { className: 'Captured eccentric world', category: 'rogue-captured', massClass: 'Captured eccentric planet' },
    { className: 'Terraforming candidate', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Failed terraforming site', category: 'rocky-planet', massClass: 'Human-altered terrestrial' },
    { className: 'Native microbial biosphere world', category: 'rocky-planet', massClass: 'Biosphere terrestrial' },
    { className: 'GU-active habitable-zone anomaly', category: 'anomaly', massClass: 'GU habitable-zone anomaly' },
  ],
  Cold: [
    { className: 'Airless ice-rock', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Frozen Mars-like world', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Buried-ocean ice world', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Nitrogen glacier world', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Methane frost world', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Ammonia-water cryoworld', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Carbon dioxide ice world', category: 'dwarf-body', massClass: 'CO2 ice dwarf' },
    { className: 'Ice-shell ocean world', category: 'rocky-planet', massClass: 'Ice-shell world' },
    { className: 'Cryovolcanic world', category: 'rocky-planet', massClass: 'Cryovolcanic terrestrial' },
    { className: 'Captured dwarf planet', category: 'dwarf-body', massClass: 'Captured dwarf planet' },
    { className: 'Cold super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ice-rich asteroid belt', category: 'belt', massClass: 'Minor-body belt' },
    { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
    { className: 'Small ice giant', category: 'ice-giant', massClass: 'Small ice giant' },
    { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Gas giant near snow line', category: 'gas-giant', massClass: 'Snow-line gas giant' },
    { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
    { className: 'Trojan settlement zone', category: 'belt', massClass: 'Trojan swarm' },
    { className: 'Dark-sector density anomaly', category: 'anomaly', massClass: 'Dark-sector anomaly' },
    { className: 'Moving bleed node nursery', category: 'anomaly', massClass: 'Moving GU node' },
  ],
  Cryogenic: [
    { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    { className: 'Scattered disk object', category: 'dwarf-body', massClass: 'Scattered disk object' },
    { className: 'Ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
    { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
    { className: 'Free-floating planet bound at extreme distance', category: 'rogue-captured', massClass: 'Distant bound rogue' },
    { className: 'Frozen super-Earth', category: 'super-earth', massClass: 'Frozen super-Earth' },
    { className: 'Hydrogen-atmosphere rogue world', category: 'rogue-captured', massClass: 'Hydrogen rogue world' },
    { className: 'Cold gas giant', category: 'gas-giant', massClass: 'Cold gas giant' },
    { className: 'Super-Jovian', category: 'gas-giant', massClass: 'Super-Jovian' },
    { className: 'Brown-dwarf companion', category: 'anomaly', massClass: 'Brown-dwarf companion' },
    { className: 'Ancient impact family', category: 'belt', massClass: 'Impact-family debris' },
    { className: 'Dark refueling body', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Long-period comet storm source', category: 'belt', massClass: 'Comet storm source' },
    { className: 'Smuggler ice depot', category: 'dwarf-body', massClass: 'Hidden depot body' },
    { className: 'Exile habitat', category: 'dwarf-body', massClass: 'Hidden habitat body' },
    { className: 'Black-lab platform', category: 'anomaly', massClass: 'Hidden facility platform' },
    { className: 'Gardener-shadowed forbidden zone', category: 'anomaly', massClass: 'Interdicted zone' },
    { className: 'Deep observerse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
  ],
  Dark: [
    { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    { className: 'Scattered disk object', category: 'dwarf-body', massClass: 'Scattered disk object' },
    { className: 'Comet reservoir', category: 'belt', massClass: 'Outer comet cloud' },
    { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
    { className: 'Free-floating planet bound at extreme distance', category: 'rogue-captured', massClass: 'Distant bound rogue' },
    { className: 'Frozen super-Earth', category: 'super-earth', massClass: 'Frozen super-Earth' },
    { className: 'Hydrogen-atmosphere rogue world', category: 'rogue-captured', massClass: 'Hydrogen rogue world' },
    { className: 'Ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Cold gas giant', category: 'gas-giant', massClass: 'Cold gas giant' },
    { className: 'Super-Jovian', category: 'gas-giant', massClass: 'Super-Jovian' },
    { className: 'Brown-dwarf companion', category: 'anomaly', massClass: 'Brown-dwarf companion' },
    { className: 'Ancient impact family', category: 'belt', massClass: 'Impact-family debris' },
    { className: 'Dark refueling body', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Long-period comet storm source', category: 'belt', massClass: 'Comet storm source' },
    { className: 'Exile habitat', category: 'dwarf-body', massClass: 'Hidden habitat body' },
    { className: 'Black-lab platform', category: 'anomaly', massClass: 'Hidden facility platform' },
    { className: 'Gardener-shadowed forbidden zone', category: 'anomaly', massClass: 'Interdicted zone' },
    { className: 'Deep observerse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
  ],
}

export const forcedWorldClasses = {
  rocky: { className: 'Rocky terrestrial world', category: 'rocky-planet', massClass: 'Terrestrial' },
  superEarth: { className: 'Super-terrestrial world', category: 'super-earth', massClass: 'Super-Earth' },
  subNeptune: { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
  belt: { className: 'Main debris belt', category: 'belt', massClass: 'Minor-body belt' },
  iceBelt: { className: 'Outer ice belt', category: 'belt', massClass: 'Outer debris belt' },
  gasGiant: { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
  iceGiant: { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
  dwarf: { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
  rogue: { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
} satisfies Record<string, WorldClassOption>

export const beltClassTable: Array<{ min: number; max: number; value: WorldClassOption }> = [
  { min: 1, max: 1, value: { className: 'Sparse rubble', category: 'belt', massClass: 'Minor-body belt' } },
  { min: 2, max: 2, value: { className: 'Metal-rich asteroid belt', category: 'belt', massClass: 'Metal-rich belt' } },
  { min: 3, max: 3, value: { className: 'Carbonaceous belt', category: 'belt', massClass: 'Carbonaceous belt' } },
  { min: 4, max: 4, value: { className: 'Ice-rich belt', category: 'belt', massClass: 'Ice-rich belt' } },
  { min: 5, max: 5, value: { className: 'Trojan swarm', category: 'belt', massClass: 'Trojan swarm' } },
  { min: 6, max: 6, value: { className: 'Resonant fragments', category: 'belt', massClass: 'Resonant debris belt' } },
  { min: 7, max: 7, value: { className: 'Recent collision belt', category: 'belt', massClass: 'Collision debris belt' } },
  { min: 8, max: 8, value: { className: 'Unstable crossing belt', category: 'belt', massClass: 'Crossing-orbit debris' } },
  { min: 9, max: 9, value: { className: 'Circumbinary debris band', category: 'belt', massClass: 'Circumbinary debris band' } },
  { min: 10, max: 10, value: { className: 'White-dwarf metal debris', category: 'belt', massClass: 'Remnant metal debris' } },
  { min: 11, max: 11, value: { className: 'Chiral ore belt', category: 'belt', massClass: 'Chiral ore belt' } },
  { min: 12, max: 12, value: { className: 'Programmable-matter microcluster belt', category: 'belt', massClass: 'Programmable-matter debris' } },
]

export const allWorldClassOptions: readonly WorldClassOption[] = [
  ...Object.values(worldClassesByThermalZone).flat(),
  ...Object.values(forcedWorldClasses),
  ...beltClassTable.map((entry) => entry.value),
]

function isClassAvailableInThermalZone(thermalZone: string, bodyClass: WorldClassOption): boolean {
  return worldClassesByThermalZone[thermalZone]?.some((option) =>
    option.className === bodyClass.className && option.category === bodyClass.category
  ) ?? false
}

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

const bodySiteGroupByCategory: Record<BodyCategory, BodySiteGroup> = {
  'rocky-planet': 'terrestrial',
  'super-earth': 'terrestrial',
  'sub-neptune': 'envelope',
  'gas-giant': 'envelope',
  'ice-giant': 'envelope',
  belt: 'minor',
  'dwarf-body': 'minor',
  'rogue-captured': 'rogueCaptured',
  anomaly: 'anomaly',
}

function pickBodySite(rng: SeededRng, category: BodyCategory): string {
  const group = bodySiteGroupByCategory[category]
  const pool = [...bodySites.any, ...bodySites[group]]
  return pickOne(rng, pool)
}

export function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
  return { value, confidence, source }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function mergeLockedFact<T>(generated: Fact<T>, known?: Fact<T>): Fact<T> {
  return known?.locked ? known : generated
}

function generateSystemName(rng: SeededRng): string {
  const pattern = pickOne(rng, systemNamePatterns)
  const corePool = pattern === 'possessive' ? systemNameCores.filter((candidate) => !candidate.includes("'")) : systemNameCores
  const core = pickOne(rng, corePool)
  const form = pickOne(rng, systemNameForms)
  const secondCore = pickOne(rng, systemNameCores.filter((candidate) => candidate !== core))

  if (pattern === 'compound') return `${core}-${form}`
  if (pattern === 'numeric') return `${core}-${rng.int(2, 99).toString().padStart(2, '0')}`
  if (pattern === 'catalog') return `${core} ${pickOne(rng, systemCatalogLabels)}-${rng.int(10, 999)}`
  if (pattern === 'route') return `${core}-${secondCore} ${form}`
  return `${core}'s ${form}`
}

function activityFromRoll(roll: number): string {
  return activityLabels.find((entry) => roll <= entry.max)?.value ?? activityLabels[activityLabels.length - 1].value
}

function knownStarProfile(knownPrimary?: PartialKnownStar) {
  if (!knownPrimary?.spectralType?.locked) return undefined
  const knownType = knownPrimary.spectralType.value.trim().toUpperCase()
  const normalizedType =
    /^[OBA]/.test(knownType) ? 'O/B/A bright star' :
    knownType.startsWith('F') ? 'F star' :
    knownType.startsWith('G') ? 'G star' :
    knownType.startsWith('K') ? 'K star' :
    knownType.startsWith('M') ? 'M dwarf' :
    knownType.includes('WHITE') || knownType.startsWith('WD') ? 'White dwarf/remnant' :
    knownType.includes('BROWN') || /^[LTY]/.test(knownType) ? 'Brown dwarf/substellar primary' :
    knownPrimary.spectralType.value
  const tables = [...realisticStarTypes, ...frontierStarTypes]
  return tables.find((entry) => entry.value.type === normalizedType)?.value
}

function generatePrimaryStar(rng: SeededRng, options: GenerationOptions, systemName: string, knownPrimary?: PartialKnownStar): Star {
  const profile = knownStarProfile(knownPrimary) ?? pickTable(
    rng,
    d100(rng),
    options.distribution === 'realistic' ? realisticStarTypes : frontierStarTypes
  )
  const massSolar = roundTo(rng.float(profile.massRange[0], profile.massRange[1]), 3)
  const luminositySolar = roundStellarLuminosity(rng.float(profile.luminosityRange[0], profile.luminosityRange[1]))
  const ageState = pickTable(rng, twoD6(rng), ageStates)
  const metallicity = pickTable(rng, twoD6(rng), metallicities)

  let activityRoll = twoD6(rng)
  const activityModifiers: Array<Fact<string>> = []
  if (ageState === 'Young') {
    activityRoll += 2
    activityModifiers.push(fact('+2 young star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Embryonic/very young') {
    activityRoll += 1
    activityModifiers.push(fact('+1 very young star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (profile.type === 'M dwarf') {
    activityRoll += 2
    activityModifiers.push(fact('+2 M dwarf', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Old') {
    activityRoll -= 1
    activityModifiers.push(fact('-1 old star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Very old' || ageState === 'Ancient/remnant-associated') {
    activityRoll -= 2
    activityModifiers.push(fact('-2 ancient or remnant-associated star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (options.gu === 'high' || options.gu === 'fracture') {
    activityRoll += 1
    activityModifiers.push(fact('+1 strong GU bleed preference', 'gu-layer', 'MASS-GU stellar activity modifiers'))
  }

  const activity = activityFromRoll(activityRoll)

  return {
    id: 'primary',
    name: mergeLockedFact(fact(`${systemName} Primary`, 'inferred', 'Generated fictional star'), knownPrimary?.name),
    spectralType: mergeLockedFact(fact(profile.type, knownPrimary?.spectralType?.locked ? 'confirmed' : 'inferred', knownPrimary?.spectralType?.locked ? 'Known-system import locked stellar type' : 'MASS-GU stellar distribution'), knownPrimary?.spectralType),
    massSolar: mergeLockedFact(fact(massSolar, knownPrimary?.massSolar?.locked ? 'confirmed' : 'inferred', knownPrimary?.massSolar?.locked ? 'Known-system import locked stellar mass' : 'Generated stellar profile'), knownPrimary?.massSolar),
    luminositySolar: mergeLockedFact(fact(luminositySolar, knownPrimary?.luminositySolar?.locked ? 'confirmed' : 'inferred', knownPrimary?.luminositySolar?.locked ? 'Known-system import locked stellar luminosity' : 'Generated stellar profile'), knownPrimary?.luminositySolar),
    ageState: mergeLockedFact(fact(ageState, 'inferred', 'MASS-GU stellar age table'), knownPrimary?.ageState),
    metallicity: mergeLockedFact(fact(metallicity, 'inferred', 'MASS-GU metallicity table'), knownPrimary?.metallicity),
    activity: mergeLockedFact(fact(activity, 'inferred', 'MASS-GU activity modifiers'), knownPrimary?.activity),
    activityRoll: mergeLockedFact(fact(activityRoll, 'derived', 'Modified 2d6 stellar activity roll'), knownPrimary?.activityRoll),
    activityModifiers,
  }
}

function roundStellarLuminosity(luminositySolar: number): number {
  if (luminositySolar <= 0) return 0
  if (luminositySolar < 0.0001) return roundTo(luminositySolar, 6)
  return roundTo(luminositySolar, 4)
}

function isHighActivity(activity: string): boolean {
  return activity === 'Flare-prone' || activity === 'Violent flare cycle' || activity === 'Extreme activity / metric-amplified events'
}

function hasCloseBinary(companions: StellarCompanion[]): boolean {
  return companions.some((companion) =>
    companion.separation.value === 'Contact / near-contact' ||
    companion.separation.value === 'Close binary' ||
    companion.separation.value === 'Tight binary'
  )
}

function applyCompanionActivityModifier(primary: Star, companions: StellarCompanion[]): Star {
  if (!hasCloseBinary(companions)) return primary
  if (primary.activity.locked || primary.activityRoll.locked) return primary

  const activityRoll = primary.activityRoll.value + 1
  return {
    ...primary,
    activity: fact(activityFromRoll(activityRoll), 'inferred', 'MASS-GU activity modifiers'),
    activityRoll: fact(activityRoll, 'derived', 'Modified 2d6 stellar activity roll'),
    activityModifiers: [
      ...primary.activityModifiers,
      fact('+1 close binary', 'inferred', 'MASS-GU stellar activity modifiers'),
    ],
  }
}

function generateReachability(rng: SeededRng, options: GenerationOptions, primary: Star, companions: StellarCompanion[]) {
  let roll = d12(rng)
  const modifiers: Array<Fact<string>> = []

  if (companions.length > 0) {
    roll += 1
    modifiers.push(fact('+1 multi-star resonance geometry', 'gu-layer', 'MASS-GU reachability modifiers'))
  }
  if (primary.spectralType.value === 'M dwarf' && isHighActivity(primary.activity.value)) {
    roll += 1
    modifiers.push(fact('+1 flare-driven M-dwarf bleed behavior', 'gu-layer', 'MASS-GU reachability modifiers'))
  }
  if (options.gu === 'high' || options.gu === 'fracture') {
    roll += 1
    modifiers.push(fact('+1 chiral or high-bleed resource bias', 'gu-layer', 'MASS-GU reachability modifiers'))
  }

  roll = Math.max(1, Math.min(12, roll))
  const result = pickTable(rng, roll, reachabilityClasses)
  return {
    className: fact(result.className, 'gu-layer', 'MASS-GU reachability class'),
    routeNote: fact(result.routeNote, 'gu-layer', 'Reachable-volume bias'),
    pinchDifficulty: fact(result.pinchDifficulty, 'gu-layer', 'Route geometry'),
    roll: fact(roll, 'derived', 'Modified d12 reachability roll'),
    modifiers,
  }
}
export type Reachability = ReturnType<typeof generateReachability>

function companionThreshold(spectralType: string): number {
  if (spectralType === 'Brown dwarf/substellar primary') return 11
  if (spectralType === 'M dwarf') return 10
  if (spectralType === 'K star') return 9
  if (spectralType === 'G star') return 8
  if (spectralType === 'F star') return 7
  if (spectralType === 'O/B/A bright star') return 6
  if (spectralType === 'White dwarf/remnant') return 9
  return 8
}

function companionTypeFromMargin(margin: number): string {
  if (margin >= 4) return 'Triple or higher-order system'
  if (margin >= 2) return 'Binary with distant substellar companion'
  return 'Binary'
}

function binarySeparationProfile(roll: number): Pick<StellarCompanion, 'separation' | 'planetaryConsequence' | 'guConsequence'> {
  const profile =
    roll <= 2 ? {
      separation: 'Contact / near-contact',
      planetaryConsequence: 'Ordinary planets unlikely.',
      guConsequence: 'Extreme bleed, dangerous research site.',
    } :
    roll <= 4 ? {
      separation: 'Close binary',
      planetaryConsequence: 'Circumbinary planets likely.',
      guConsequence: 'Strong rhythmic metric tides.',
    } :
    roll <= 6 ? {
      separation: 'Tight binary',
      planetaryConsequence: 'Inner circumbinary zone, truncated outer zones.',
      guConsequence: 'Good Iggygate anchor candidate.',
    } :
    roll <= 8 ? {
      separation: 'Moderate binary',
      planetaryConsequence: 'Circumstellar and circumbinary niches.',
      guConsequence: 'Rich Lagrange shear zones.',
    } :
    roll <= 10 ? {
      separation: 'Wide binary',
      planetaryConsequence: 'Treat stars as linked sub-systems.',
      guConsequence: 'Smuggler gaps, dark-route habitats.',
    } :
    roll === 11 ? {
      separation: 'Very wide',
      planetaryConsequence: 'Two semi-independent systems.',
      guConsequence: 'Long-haul intra-system frontier.',
    } : {
      separation: 'Hierarchical triple',
      planetaryConsequence: 'Complex but stable if hierarchical.',
      guConsequence: 'Major bleed economy, high military value.',
    }

  return {
    separation: fact(profile.separation, 'inferred', `MASS-GU binary separation roll ${roll}`),
    planetaryConsequence: fact(profile.planetaryConsequence, 'inferred', 'MASS-GU binary separation table'),
    guConsequence: fact(profile.guConsequence, 'gu-layer', 'MASS-GU binary separation table'),
  }
}

function generateStellarCompanions(rng: SeededRng, primary: Star): StellarCompanion[] {
  const threshold = companionThreshold(primary.spectralType.value)
  let roll = twoD6(rng)
  const modifiers: string[] = ['+1 major reachable system']
  roll += 1

  const margin = roll - threshold
  if (margin < 0) return []

  const separationRoll = twoD6(rng)
  const separationProfile = binarySeparationProfile(separationRoll)

  return [
    {
      id: 'companion-1',
      companionType: fact(companionTypeFromMargin(margin), 'inferred', `MASS-GU companion threshold ${threshold}; modifiers ${modifiers.join(', ')}`),
      ...separationProfile,
      rollMargin: fact(margin, 'derived', `Modified 2d6 companion roll ${roll} vs threshold ${threshold}`),
    },
  ]
}

function generateArchitecture(rng: SeededRng, options: GenerationOptions, primary: Star, reachabilityClass: string) {
  let roll = twoD6(rng)
  if (options.tone === 'cinematic') roll += 1
  if (options.tone === 'astronomy') roll -= 1
  if (primary.metallicity.value === 'Metal-rich') roll += 1
  if (primary.metallicity.value === 'Very metal-rich') roll += 2
  if (['K star', 'G star', 'F star'].includes(primary.spectralType.value)) roll += 1
  if (primary.metallicity.value === 'Metal-poor' || primary.metallicity.value === 'Very metal-poor') roll -= 1
  if (primary.massSolar.value < 0.18 && primary.spectralType.value === 'M dwarf') roll -= 1
  if (reachabilityClass === 'Resource corridor' || reachabilityClass === 'Resonance hub') roll += 1
  roll = Math.max(2, Math.min(13, roll))
  const result = pickTable(rng, roll, architectures)
  return {
    architecture: {
      name: fact(result.name, 'inferred', 'MASS-GU architecture table'),
      description: fact(result.description, 'inferred', `Modified 2d6 architecture roll ${roll}`),
    },
  }
}

interface OrbitRange {
  min: number
  max: number
}

interface OrbitAssignment {
  slot: ArchitectureSlot
  orbitAu: number
  known?: PartialKnownBody
  outOfBandKnown?: boolean
}

interface OccupiedOrbit {
  orbitAu: number
  massEarth: number
}

const orbitBands: OrbitBand[] = ['inner', 'habitable', 'snowline', 'outer', 'deepOuter', 'extremeOuter']
const earthMassesPerSolarMass = 332946

function defaultOrbitBand(planKind: BodyPlanKind): OrbitBand {
  if (planKind === 'gas-giant' || planKind === 'ice-giant') return 'snowline'
  if (planKind === 'belt' || planKind === 'ice-belt') return 'outer'
  if (planKind === 'dwarf' || planKind === 'rogue') return 'deepOuter'
  return 'habitable'
}

function orbitRangeForBand(luminositySolar: number, band: OrbitBand): OrbitRange {
  const root = Math.sqrt(Math.max(luminositySolar, 0.00001))
  const hzCenter = Math.max(root, 0.02)
  const snowLine = Math.max(2.7 * root, 0.06)
  const ranges: Record<OrbitBand, OrbitRange> = {
    inner: {
      min: Math.max(0.02, 0.08 * hzCenter),
      max: Math.max(0.05, 0.7 * hzCenter),
    },
    habitable: {
      min: Math.max(0.04, 0.75 * hzCenter),
      max: Math.max(0.08, 1.8 * hzCenter),
    },
    snowline: {
      min: Math.max(0.08, 0.7 * snowLine),
      max: Math.max(0.25, 1.8 * snowLine),
    },
    outer: {
      min: Math.max(0.3, 1.8 * snowLine),
      max: Math.max(1.2, 6 * snowLine),
    },
    deepOuter: {
      min: Math.max(1.2, 6 * snowLine),
      max: Math.max(8, 30 * snowLine),
    },
    extremeOuter: {
      min: Math.max(8, 30 * snowLine),
      max: Math.max(40, 200 * snowLine),
    },
  }

  return ranges[band]
}

function sampleOrbitInBand(rng: SeededRng, luminositySolar: number, band: OrbitBand): number {
  const range = orbitRangeForBand(luminositySolar, band)
  const logMin = Math.log(range.min)
  const logMax = Math.log(range.max)
  return Math.exp(rng.float(logMin, logMax))
}

function orbitSeparation(orbitAu: number): number {
  return Math.max(0.06, orbitAu * 0.07)
}

function estimatedPlanMassEarth(planKind: BodyPlanKind, known?: PartialKnownBody, slot?: ArchitectureSlot): number {
  const knownMass = known?.physical?.massEarth?.value
  if (typeof knownMass === 'number' && knownMass > 0) return knownMass

  const compactChainSlot = slot?.id.startsWith('compact-') || slot?.id.startsWith('peas-')
  if (compactChainSlot && planKind === 'sub-neptune') return 8
  if (compactChainSlot && planKind === 'super-earth') return 4

  if (known?.category?.value === 'rocky-planet') return 1.5
  if (known?.category?.value === 'super-earth') return 6
  if (known?.category?.value === 'sub-neptune') return 14
  if (known?.category?.value === 'gas-giant') return 32
  if (known?.category?.value === 'ice-giant') return 17
  if (known?.category?.value === 'belt') return 0.001
  if (known?.category?.value === 'dwarf-body') return 0.05
  if (known?.category?.value === 'rogue-captured') return 2

  const masses: Record<BodyPlanKind, number> = {
    rocky: 1.5,
    'super-earth': 6,
    'sub-neptune': 14,
    belt: 0.001,
    'ice-belt': 0.001,
    'gas-giant': 32,
    'ice-giant': 17,
    dwarf: 0.05,
    rogue: 2,
    anomaly: 0.01,
    thermal: 1,
  }
  return masses[planKind]
}

function mutualHillRadius(orbitAu: number, massEarth: number, otherOrbitAu: number, otherMassEarth: number, stellarMassSolar: number): number {
  const stellarMassEarth = Math.max(stellarMassSolar * earthMassesPerSolarMass, 1)
  const averageOrbit = (orbitAu + otherOrbitAu) / 2
  return averageOrbit * ((massEarth + otherMassEarth) / (3 * stellarMassEarth)) ** (1 / 3)
}

function massAwareSeparation(orbitAu: number, massEarth: number, otherOrbitAu: number, otherMassEarth: number, stellarMassSolar: number): number {
  if (massEarth <= 0.1 || otherMassEarth <= 0.1) return Math.max(orbitSeparation(orbitAu), orbitSeparation(otherOrbitAu))
  const hillSpacing = targetMutualHillRadii(massEarth, otherMassEarth) * mutualHillRadius(orbitAu, massEarth, otherOrbitAu, otherMassEarth, stellarMassSolar)
  return Math.max(orbitSeparation(orbitAu), orbitSeparation(otherOrbitAu), hillSpacing)
}

function targetMutualHillRadii(massEarth: number, otherMassEarth: number): number {
  if (massEarth >= 40 && otherMassEarth >= 40) return 6
  if (massEarth >= 40 || otherMassEarth >= 40) return 8
  return 15
}

function collidesWithOccupied(orbitAu: number, massEarth: number, occupied: OccupiedOrbit[], stellarMassSolar: number): boolean {
  return occupied.some((existing) =>
    Math.abs(existing.orbitAu - orbitAu) < massAwareSeparation(orbitAu, massEarth, existing.orbitAu, existing.massEarth, stellarMassSolar)
  )
}

function pushPastCollision(candidate: number, massEarth: number, occupied: OccupiedOrbit[], stellarMassSolar: number): number {
  let pushed = candidate
  for (const existing of occupied) {
    const separation = massAwareSeparation(pushed, massEarth, existing.orbitAu, existing.massEarth, stellarMassSolar)
    if (Math.abs(existing.orbitAu - pushed) < separation) {
      pushed = Math.max(pushed, existing.orbitAu + separation)
    }
  }
  return pushed
}

function fitOrbitInBand(preferred: number, range: OrbitRange, massEarth: number, occupied: OccupiedOrbit[], stellarMassSolar: number): number | undefined {
  let candidate = Math.max(preferred, range.min)
  for (let attempt = 0; attempt < 64; attempt += 1) {
    if (candidate > range.max) return undefined
    if (!collidesWithOccupied(candidate, massEarth, occupied, stellarMassSolar)) return roundTo(candidate, 3)
    const pushed = pushPastCollision(candidate, massEarth, occupied, stellarMassSolar)
    if (pushed <= candidate) return undefined
    candidate = pushed
  }
  return undefined
}

function widerOrbitBands(band: OrbitBand): OrbitBand[] {
  const index = orbitBands.indexOf(band)
  return orbitBands.slice(Math.max(0, index))
}

function placeGeneratedOrbit(
  rng: SeededRng,
  luminositySolar: number,
  stellarMassSolar: number,
  preferredBand: OrbitBand,
  preferredOrbit: number,
  massEarth: number,
  occupied: OccupiedOrbit[]
): number {
  for (const band of widerOrbitBands(preferredBand)) {
    const range = orbitRangeForBand(luminositySolar, band)
    const preferred = band === preferredBand ? preferredOrbit : sampleOrbitInBand(rng, luminositySolar, band)
    const fitted = fitOrbitInBand(preferred, range, massEarth, occupied, stellarMassSolar)
    if (fitted !== undefined) return fitted
  }

  const outermost = occupied.at(-1)?.orbitAu ?? sampleOrbitInBand(rng, luminositySolar, preferredBand)
  return roundTo(outermost + orbitSeparation(outermost) * rng.float(1.1, 2.2), 3)
}

function isOrbitInBand(luminositySolar: number, band: OrbitBand, orbitAu: number): boolean {
  const range = orbitRangeForBand(luminositySolar, band)
  return orbitAu >= range.min && orbitAu <= range.max
}

function generateOrbitAssignments(
  rng: SeededRng,
  luminositySolar: number,
  stellarMassSolar: number,
  slots: ArchitectureSlot[],
  knownBodies: PartialKnownBody[]
): OrbitAssignment[] {
  const preferredOrbits = slots.map((slot) =>
    sampleOrbitInBand(rng.fork(`slot-${slot.id}:preferred-orbit`), luminositySolar, slot.orbitBand ?? defaultOrbitBand(slot.planKind))
  )
  const knownSlots = reservedKnownSlots(preferredOrbits, knownBodies)
  const rawAssignments = slots.map((slot, index) => {
    const known = knownSlots.get(index)
    return {
      slot,
      known,
      preferredOrbit: known?.orbitAu.value ?? preferredOrbits[index],
    }
  })

  rawAssignments.sort((left, right) => left.preferredOrbit - right.preferredOrbit)

  const occupied: OccupiedOrbit[] = []
  const assignments: OrbitAssignment[] = []

  for (const assignment of rawAssignments) {
    const band = assignment.slot.orbitBand ?? defaultOrbitBand(assignment.slot.planKind)
    const massEarth = estimatedPlanMassEarth(assignment.slot.planKind, assignment.known, assignment.slot)
    const orbitAu = assignment.known
      ? assignment.known.orbitAu.value
      : placeGeneratedOrbit(
          rng.fork(`slot-${assignment.slot.id}:place-orbit`),
          luminositySolar,
          stellarMassSolar,
          band,
          assignment.preferredOrbit,
          massEarth,
          occupied
        )

    occupied.push({ orbitAu, massEarth })
    occupied.sort((left, right) => left.orbitAu - right.orbitAu)
    assignments.push({
      slot: assignment.slot,
      orbitAu,
      known: assignment.known,
      outOfBandKnown: Boolean(assignment.known && !isOrbitInBand(luminositySolar, band, orbitAu)),
    })
  }

  return assignments.sort((left, right) => left.orbitAu - right.orbitAu)
}

function estimateOrbitalPeriodDays(orbitAu: number, stellarMassSolar: number): number {
  return roundTo(365.25 * Math.sqrt(orbitAu ** 3 / Math.max(stellarMassSolar, 0.01)), 1)
}

function estimateRadiusEarth(rng: SeededRng, category: BodyCategory, architectureName?: string): number {
  const range: Record<BodyCategory, [number, number]> = {
    'rocky-planet': [0.45, 1.35],
    'super-earth': [1.25, 1.95],
    'sub-neptune': architectureName === 'Compact inner system' || architectureName === 'Peas-in-a-pod chain' ? [2.05, 2.75] : [2.05, 3.8],
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

function estimateMassEarth(radiusEarth: number, category: BodyCategory): number | null {
  if (category === 'belt') return null
  if (category === 'rocky-planet') return roundTo(radiusEarth ** 3.7, 2)
  if (category === 'super-earth') return roundTo(Math.min(12, radiusEarth ** 3.4), 2)
  if (category === 'dwarf-body') return roundTo(Math.max(0.001, radiusEarth ** 3 * 0.2), 3)
  if (category === 'rogue-captured') return roundTo(Math.max(0.05, radiusEarth ** 2.7), 2)
  if (category === 'sub-neptune') return roundTo(Math.max(2, radiusEarth ** 2.1), 2)
  if (category === 'ice-giant') return roundTo(radiusEarth ** 1.85, 2)
  if (category === 'gas-giant') return roundTo(radiusEarth ** 1.4, 2)
  if (category === 'anomaly') return null
  return null
}

function gravityLabel(category: BodyCategory, gravityG: number | null): string {
  if (category === 'belt') return 'Not applicable: distributed belt or swarm.'
  if (category === 'anomaly' || gravityG === null) return 'Unreliable: anomaly or artificial structure.'
  const prefix =
    category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
      ? 'Cloud-top/envelope estimate'
      : 'Estimated surface gravity'
  return `${prefix}: ${gravityG}g`
}

function hasVolatileEnvelope(category: BodyCategory): boolean {
  return category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
}

function buildPhysicalHints(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  orbitAu: number,
  primary: Star,
  architectureName?: string
): BodyPhysicalHints {
  const periodDays = estimateOrbitalPeriodDays(orbitAu, primary.massSolar.value)
  const radiusEarth = estimateRadiusEarth(rng, bodyClass.category, architectureName)
  const massEarth = estimateMassEarth(radiusEarth, bodyClass.category)
  const surfaceGravityG = massEarth === null ? null : roundTo(massEarth / radiusEarth ** 2, 2)
  return {
    radiusEarth: fact(radiusEarth, 'inferred', bodyClass.category === 'anomaly' ? 'Operational scale estimate for anomaly' : 'Category-based radius estimate'),
    massEarth: fact(massEarth, 'inferred', 'Mass estimate from category and radius'),
    surfaceGravityG: fact(surfaceGravityG, massEarth === null ? 'inferred' : 'derived', 'Estimated mass divided by radius squared'),
    gravityLabel: fact(gravityLabel(bodyClass.category, surfaceGravityG), 'derived', 'Surface gravity estimate'),
    periodDays: fact(periodDays, 'derived', 'Kepler approximation from orbit and stellar mass'),
    closeIn: fact(periodDays < 100, 'derived', 'Period under 100 days'),
    volatileEnvelope: fact(hasVolatileEnvelope(bodyClass.category), 'inferred', 'Category-based volatile envelope flag'),
  }
}

function mergeKnownPhysicalHints(
  generated: BodyPhysicalHints,
  known: PartialKnownBody['physical'] | undefined,
  category: BodyCategory
): BodyPhysicalHints {
  const merged = {
    radiusEarth: mergeLockedFact(generated.radiusEarth, known?.radiusEarth),
    massEarth: mergeLockedFact(generated.massEarth, known?.massEarth),
    surfaceGravityG: mergeLockedFact(generated.surfaceGravityG, known?.surfaceGravityG),
    gravityLabel: mergeLockedFact(generated.gravityLabel, known?.gravityLabel),
    periodDays: mergeLockedFact(generated.periodDays, known?.periodDays),
    closeIn: mergeLockedFact(generated.closeIn, known?.closeIn),
    volatileEnvelope: mergeLockedFact(generated.volatileEnvelope, known?.volatileEnvelope),
  }

  if (!known?.surfaceGravityG?.locked && merged.massEarth.value !== null) {
    merged.surfaceGravityG = fact(roundTo(merged.massEarth.value / merged.radiusEarth.value ** 2, 2), 'derived', 'Estimated mass divided by radius squared')
  }
  if (!known?.gravityLabel?.locked) {
    merged.gravityLabel = fact(gravityLabel(category, merged.surfaceGravityG.value), 'derived', 'Surface gravity estimate')
  }

  return merged
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
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
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
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
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
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
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
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
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

function annotatePreservedHotNeptuneDesert(thermalZone: string, input: FilteredWorldClass): FilteredWorldClass {
  const isNeptuneLike = input.bodyClass.category === 'sub-neptune' || input.bodyClass.category === 'ice-giant'
  if (!isNeptuneLike || !input.physical.closeIn.value || !['Furnace', 'Inferno', 'Hot'].includes(thermalZone)) return input
  if (input.filterNotes.some((note) => note.value.includes('Hot Neptune desert'))) return input

  return {
    ...input,
    filterNotes: [
      ...input.filterNotes,
      fact('Hot Neptune desert: architecture-preserved close-in giant, flagged as rare high-interest survivor.', 'inferred', 'Modern exoplanet filter'),
    ],
  }
}

function applyPeasInPodFilter(
  rng: SeededRng,
  architectureName: string,
  thermalZone: string,
  previous: FilteredWorldClass | null,
  input: FilteredWorldClass
): FilteredWorldClass {
  if (!(architectureName === 'Compact inner system' || architectureName === 'Peas-in-a-pod chain') || !previous) return input
  if (input.bodyClass.category === 'belt' || previous.bodyClass.category === 'belt') return input
  if (input.bodyClass.category === 'anomaly' || previous.bodyClass.category === 'anomaly') return input
  if (
    input.bodyClass.category === 'gas-giant' ||
    input.bodyClass.category === 'ice-giant' ||
    previous.bodyClass.category === 'gas-giant' ||
    previous.bodyClass.category === 'ice-giant'
  ) return input

  const roll = rng.int(1, 6)
  if (roll >= 2 && roll <= 4) {
    const canReusePreviousClass = isClassAvailableInThermalZone(thermalZone, previous.bodyClass)
    const bodyClass = canReusePreviousClass ? previous.bodyClass : input.bodyClass
    const rawRadius = previous.physical.radiusEarth.value * rng.float(0.85, 1.18)
    const radius = roundTo(bodyClass.category === 'sub-neptune' ? Math.min(rawRadius, 2.75) : rawRadius, 2)

    return {
      bodyClass,
      physical: {
        ...input.physical,
        radiusEarth: fact(radius, 'inferred', 'Peas-in-a-pod filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(canReusePreviousClass ? previous.physical.volatileEnvelope.value : input.physical.volatileEnvelope.value, 'inferred', 'Peas-in-a-pod filter'),
      },
      filterNotes: [
        ...input.filterNotes,
        fact(
          canReusePreviousClass
            ? 'Peas-in-a-pod: adjacent planet made similar in size/composition.'
            : 'Peas-in-a-pod: adjacent planet made similar in size, but class was revalidated against its thermal zone.',
          'inferred',
          'Modern exoplanet filter'
        ),
      ],
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
  const preservePlannedGiant = architectureName === 'Giant-rich or chaotic' && (bodyClass.category === 'gas-giant' || bodyClass.category === 'ice-giant')
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  current = applyPeasInPodFilter(rng, architectureName, thermalZone, previous, current)
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  if (preservePlannedGiant) current = annotatePreservedHotNeptuneDesert(thermalZone, current)
  return current
}

function withRecomputedGravity(input: FilteredWorldClass): FilteredWorldClass {
  const massEarth = estimateMassEarth(input.physical.radiusEarth.value, input.bodyClass.category)
  const surfaceGravityG = massEarth === null ? null : roundTo(massEarth / input.physical.radiusEarth.value ** 2, 2)

  return {
    ...input,
    physical: {
      ...input.physical,
      massEarth: fact(massEarth, 'inferred', 'Mass estimate from category and filtered radius'),
      surfaceGravityG: fact(surfaceGravityG, massEarth === null ? 'inferred' : 'derived', 'Estimated mass divided by radius squared'),
      gravityLabel: fact(gravityLabel(input.bodyClass.category, surfaceGravityG), 'derived', 'Surface gravity estimate'),
    },
  }
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

function clampTableRoll(roll: number, max: number): number {
  return Math.max(1, Math.min(max, roll))
}

function isHighActivityStar(primary: Star): boolean {
  return ['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)
}

function isVolatileRichWorld(bodyClass: WorldClassOption, category: BodyCategory, thermalZone: string): boolean {
  return (
    category === 'sub-neptune' ||
    category === 'gas-giant' ||
    category === 'ice-giant' ||
    thermalZone === 'Cold' ||
    thermalZone === 'Cryogenic' ||
    thermalZone === 'Dark' ||
    bodyClass.className.includes('ocean') ||
    bodyClass.className.includes('Ocean') ||
    bodyClass.className.includes('Hycean') ||
    bodyClass.className.includes('Ice') ||
    bodyClass.className.includes('Hydrogen')
  )
}

function isArtificialOrTerraformed(bodyClass: WorldClassOption): boolean {
  return (
    bodyClass.className.includes('Artificial') ||
    bodyClass.className.includes('Terraforming') ||
    bodyClass.className.includes('terraformed') ||
    bodyClass.className.includes('facility') ||
    bodyClass.className.includes('platform')
  )
}

function rollGeology(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return 'Minor-body rubble and collision families'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return pickOne(rng, envelopeGeologies)

  let roll = d12(rng)
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno' || thermalZone === 'Hot') roll += 1
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 1
  if (bodyClass.className.includes('Tidal') || bodyClass.className.includes('Volcanic') || bodyClass.className.includes('Cryovolcanic')) roll += 2
  if (bodyClass.className.includes('Programmable') || bodyClass.className.includes('GU')) roll += 2
  // Super-Earth mass retains internal heat, biasing away from Dead interior / Ancient cratered crust.
  if (category === 'super-earth' || /high-gravity|super-earth|super-terrestrial/i.test(bodyClass.className)) roll += 2
  // Water-rich and karst-eligible classes get an occasional +1 to reach Karst / Magnetic dynamo flicker (13-14).
  if (/karst|aquifer|carbonate|ocean|biosphere/i.test(bodyClass.className)) roll += 1
  // Glassy / vitrified surface (15): heavy impact or extreme heat
  if (/dayside glass|glass world|ablating|carbon-rich furnace/i.test(bodyClass.className)) roll += 4
  // Subglacial volcanism (16): tidally heated ice-shell worlds
  if (/ice-shell|buried-ocean|tidally heated/i.test(bodyClass.className)) roll += 5
  // Recurrent flood plains (17): volatile-rich rocky bodies with thermal cycling (Mars Tharsis-style)
  if (/mars-like|tharsis|flood|outburst|catastrophic/i.test(bodyClass.className)) roll += 5

  return pickTable(rng, clampTableRoll(roll, 17), geologyTable)
}

function classAtmosphereFlavor(className: string): string | undefined {
  if (/dense-atmosphere pressure world/i.test(className)) return 'Dense CO2/N2'
  return undefined
}

function rollAtmosphere(
  rng: SeededRng,
  category: BodyCategory,
  thermalZone: string,
  primary: Star,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  geology: string
): string {
  if (category === 'belt') return 'None / dispersed volatiles'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return pickTable(rng, clampTableRoll(d12(rng) + 3, 16), atmosphereTable)
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotAtmospheres)
  const flavored = classAtmosphereFlavor(bodyClass.className)
  if (flavored) return flavored

  let roll = d12(rng)
  if (category === 'super-earth') roll += 1
  if (isVolatileRichWorld(bodyClass, category, thermalZone)) roll += 1
  if (physical.radiusEarth.value < 0.8 || category === 'dwarf-body') roll -= 1
  if (thermalZone === 'Hot') roll -= 1
  if (isHighActivityStar(primary)) roll -= primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces' || geology === 'Global resurfacing') roll += 1
  if (isArtificialOrTerraformed(bodyClass)) roll += 1
  // Native biosphere / terraforming / Earth-like classes can roll Oxygen-rich pre-industrial (13).
  if (/biosphere|terraforming|earth-like|earth-sized terrestrial/i.test(bodyClass.className)) roll += 2
  // Cold cryo-haze classes can roll Aerosol veil (14).
  if ((thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') && /methane|nitrogen|titan|cryo|frost|haze/i.test(bodyClass.className)) roll += 3
  // Industrial/facility/abandoned classes can roll Halocarbon greenhouse (15) or Photochemical smog (16).
  if (/industry|industrial|black-lab|facility|failed terraform|abandoned/i.test(bodyClass.className)) roll += 4
  // Tidally heated sulfur worlds reach Hydrogen sulfide rich (17).
  if (/sulfur|volcanic|tidally stretched/i.test(bodyClass.className)) roll += 5

  return pickTable(rng, clampTableRoll(roll, 17), atmosphereTable)
}

function classHydrosphereFlavor(className: string): string | undefined {
  if (/cryovolcanic/i.test(className)) return 'Cryovolcanic vents'
  if (/nitrogen\s+glacier/i.test(className)) return 'Cryogenic nitrogen reservoirs'
  if (/perchlorate/i.test(className)) return 'Salt / perchlorate flats'
  if (/tidally stretched volcanic|carbon-rich furnace/i.test(className)) return 'Magma seas / lava lakes'
  if (/methane frost world/i.test(className)) return 'Methane permafrost cycle'
  return undefined
}

function rollHydrosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return pickOne(rng, ['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return pickOne(rng, ['Deep atmospheric volatile layers', 'High-pressure condensate decks', 'No accessible surface volatiles'])
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotVolatiles)

  const flavored = classHydrosphereFlavor(bodyClass.className)
  if (flavored) return flavored

  let roll = d12(rng)
  if (thermalZone === 'Hot') roll -= 2
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 2
  if (bodyClass.className.includes('Ocean') || bodyClass.className.includes('Waterworld') || bodyClass.className.includes('Hycean')) roll += 3
  if (bodyClass.className.includes('Dry') || bodyClass.className.includes('desert') || bodyClass.className.includes('Airless')) roll -= 3
  if (bodyClass.className.includes('Hydrogen') || bodyClass.className.includes('Exotic')) roll += 1
  // Cold ammonia / cryo-active classes can reach Ammonia-water antifreeze ocean (13) and Cryo-geyser fields (14).
  if ((thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') && /ammonia|cryo|buried-ocean|ice-shell/i.test(bodyClass.className)) roll += 3
  // Tidally heated sulfur-rich worlds reach Liquid sulfur seas (15) — Io-style.
  if (/sulfur|tidally stretched volcanic|volcanic moon/i.test(bodyClass.className) && thermalZone === 'Hot') roll += 5
  // Mars-like dry classes can roll Continental water tables (16) — subsurface aquifers without surface seas.
  if (/mars-like|dry terrestrial|cold desert|frozen mars-like/i.test(bodyClass.className)) roll += 4
  // Airless dwarf-body classes can roll Dust seas / fluidized regolith (17).
  if (category === 'dwarf-body' && /airless|dust|regolith|charged/i.test(bodyClass.className)) roll += 5
  // Cold methane-cycling classes can roll Methane permafrost cycle (18).
  if ((thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') && /methane|hydrocarbon|titan|frost/i.test(bodyClass.className)) roll += 6

  return pickTable(rng, clampTableRoll(roll, 18), hydrosphereTable)
}

function generateClimate(rng: SeededRng, category: BodyCategory, thermalZone: string, count: number) {
  const isEnvelope = category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
  const climateOptions: readonly string[] =
    thermalZone === 'Furnace' || thermalZone === 'Inferno'
      ? isEnvelope
        ? extremeHotEnvelopeClimateTags
        : extremeHotClimateTags
      : isEnvelope
        ? thermalZone === 'Hot'
          ? hotEnvelopeClimateTags
          : thermalZone === 'Temperate band'
            ? temperateEnvelopeClimateTags
            : coldEnvelopeClimateTags
        : thermalZone === 'Hot'
          ? hotClimateTags
          : thermalZone === 'Temperate band'
            ? temperateClimateTags
            : coldClimateTags

  return Array.from({ length: count }, () => {
    const sourceClimate = pickTable(rng, d20(rng), climateSourceTable)
    const value = (climateOptions as readonly string[]).includes(sourceClimate) ? sourceClimate : pickOne(rng, climateOptions)
    return fact(value, 'inferred', 'MASS-GU climate tag d20 table with thermal-zone constraints')
  })
}

function generateRadiation(rng: SeededRng, category: BodyCategory, thermalZone: string, primary: Star, bodyClass?: WorldClassOption): string {
  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  const isFlaring = isHighActivityStar(primary)
  const isActiveOrFlaring = isFlaring || primary.activity.value === 'Active'
  // GU-tagged classes have a chance to land on the metric-driven GU-quantum decoherence band — radiation
  // from metric distortion rather than stellar photons.
  const className = bodyClass?.className ?? ''
  const isGuTagged = /\bgu\b|chiral|observerse|bleed|programmable|metric/i.test(className)
  if (isGuTagged && rng.chance(0.4)) return 'GU-quantum decoherence band'
  // Extreme stellar activity around a compact-object companion (or magnetar-flavored anomaly) produces
  // pulsed electromagnetic radiation distinct from flares.
  if (primary.activity.value === 'Extreme activity / metric-amplified events' && rng.chance(0.18)) return 'Pulsar/magnetar EM'
  if (/dark-sector|magnetar|pulsar|gardener-shadowed/i.test(className) && rng.chance(0.3)) return 'Pulsar/magnetar EM'
  // M-dwarf systems and other variable stars commonly produce cyclical radiation patterns —
  // periodic flare/quiescence cycles rather than continuous danger.
  const isMDwarfFlaring = primary.spectralType.value.includes('M dwarf') && isFlaring
  if (isMDwarfFlaring && rng.chance(0.35)) return 'Cyclical / seasonal radiation'

  let roll = d8(rng)
  if (isEnvelopeWorld) roll += 2
  if (isFlaring) roll += primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') roll += 2
  if (thermalZone === 'Hot') roll += 1

  // Cap by stellar activity: only flaring stars produce flare-lethal radiation;
  // only active-or-flaring stars produce electronics-disruptive metric mixes.
  const ceiling = isFlaring ? 8 : isActiveOrFlaring ? 7 : 5

  return pickTable(rng, clampTableRoll(roll, ceiling), radiationTable)
}

function generateBiosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, detail: Omit<PlanetaryDetail, 'biosphere' | 'biosphereDistribution'>, primary: Star, bodyClass?: WorldClassOption): string {
  if (!supportsComplexSurfaceEnvironment(category)) return 'Sterile'
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return 'Sterile'
  // Vacuum atmospheres usually mean sterile — but if subsurface volatiles exist, a cryptic biosphere
  // can hide below the surface (Mars-style deep brines, no orbital signature).
  const subsurfaceVolatiles = new Set(['Subsurface ice', 'Polar caps / buried glaciers', 'Briny aquifers', 'Continental water tables', 'Ice-shell subsurface ocean', 'Cryo-geyser fields'])
  if (detail.atmosphere.value === 'None / hard vacuum' || detail.atmosphere.value === 'Trace exosphere') {
    if (subsurfaceVolatiles.has(detail.hydrosphere.value) && (thermalZone === 'Temperate band' || thermalZone === 'Cold') && rng.chance(0.18)) {
      return 'Cryptic subsurface biosphere'
    }
    return 'Sterile'
  }

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

  // Engineered remnant biosphere: terraforming-derived microbial life on failed/in-progress terraform sites.
  const isTerraformClass = bodyClass ? /terraforming|failed-terraform|relict garden/i.test(bodyClass.className) : false
  if (isTerraformClass && score >= 6 && score <= 9) return 'Engineered remnant biosphere'

  // Chimeric chiral biosphere: GU-tagged classes with high biosphere score get mixed-handed biochemistry.
  const isGuClass = bodyClass ? /\bgu\b|chiral|observerse|bleed/i.test(bodyClass.className) : false
  if (isGuClass && score >= 7 && rng.chance(0.55)) return 'Chimeric chiral biosphere'

  // Free-oxygen atmosphere strongly suggests photosynthetic life: upgrade microbial-tier hits to mats.
  const hasOxygenAtm = detail.atmosphere.value === 'Oxygen-rich pre-industrial atmosphere'
  if (hasOxygenAtm && score >= 7) return 'Photosynthetic microbial mats'

  if (score <= 5) return 'Sterile'
  if (score === 6) return 'Prebiotic chemistry'
  if (score === 7) return 'Ambiguous biosignatures'
  if (score === 8) return 'Microbial life'
  if (score === 9) return 'Extremophile microbial ecology'
  if (score === 10) return 'Photosynthetic microbial mats'
  return pickOne(rng, biospheres.filter((value) => value !== 'Sterile' && value !== 'Prebiotic chemistry'))
}

function generateResourceAccess(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, atm: string, mineralComposition: string): string {
  if (category === 'belt') return 'Surface-easy (open-pit accessible)'
  if (category === 'gas-giant' || category === 'ice-giant') return 'Orbital-only (atmosphere or moonlet skim)'
  if (category === 'sub-neptune') return 'Deep-pressure inaccessible (core extraction)'

  // GU classes get bleed-fluxed
  if (/\bgu\b|chiral|observerse|bleed/i.test(bodyClass.className) && rng.chance(0.45)) return 'Bleed-fluxed concentration zones'

  // Class hints
  if (/stripped|exhausted|remnant/i.test(bodyClass.className)) return 'Stripped / exhausted economy'
  if (/airless|stripped/i.test(bodyClass.className)) return rng.chance(0.5) ? 'Surface-easy (open-pit accessible)' : 'Subsurface (deep drill required)'
  if (/failed terraform|abandoned|black-lab|exile|quarantine/i.test(bodyClass.className)) return 'Hazard-restricted (legal or environmental lock)'
  if (/dense|crushing|supercritical/i.test(atm)) return 'Deep-pressure inaccessible (core extraction)'

  // Mineral wealth hints
  if (mineralComposition === 'Heavy element enrichment' || mineralComposition === 'Sulfide ore-dominant' || mineralComposition === 'Iron-rich (red oxide)' || mineralComposition === 'Carbon-rich (diamond precursor)') {
    return rng.chance(0.6) ? 'Surface-easy (open-pit accessible)' : 'Standard surface mining'
  }
  if (mineralComposition === 'Helium-3 sequestered regolith' || mineralComposition === 'Methane / hydrocarbon clathrates') return 'Subsurface (deep drill required)'

  return pickTable(rng, rng.int(1, 8), resourceAccessTable)
}

function generateBiosphereDistribution(rng: SeededRng, biosphereValue: string, category: BodyCategory, hydro: string, atm: string, bodyClass: WorldClassOption): string {
  if (biosphereValue === 'Sterile') return 'Sterile / not applicable'

  if (biosphereValue === 'Cryptic subsurface biosphere' || biosphereValue === 'Engineered remnant biosphere') return 'Subsurface only'

  // Photosynthetic mats need surface water + light
  if (biosphereValue === 'Photosynthetic microbial mats') return 'Wetland-bound around standing water'

  // Tidally-locked / eyeball worlds → equatorial belt
  if (/eyeball|terminator|tidally locked/i.test(bodyClass.className)) return 'Equatorial belt only'

  // Cold zones with localized life → polar refugia or wetland
  if (category === 'rocky-planet' || category === 'super-earth') {
    if (atm === 'Aerosol veil' || atm === 'Tholin photochemistry') return 'Polar refugia only'

    // Bone dry surface + microbial → subsurface or cave
    const dryHydros = new Set(['Bone dry', 'Hydrated minerals only', 'Vaporized volatile traces'])
    if (dryHydros.has(hydro)) return rng.chance(0.5) ? 'Cave / karst-bound' : 'Subsurface only'

    // Open ocean → surface-wide or coastal
    const oceanHydros = new Set(['Global ocean', 'Ocean-continent balance', 'Local seas', 'High-pressure deep ocean'])
    if (oceanHydros.has(hydro)) return rng.chance(0.5) ? 'Surface-wide coverage' : 'Coastal margins'
  }

  return pickTable(rng, rng.int(1, 10), biosphereDistributionTable)
}

function generateTidalRegime(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, rotationProfile: string, geology: string): string {
  if (category === 'belt') return 'Negligible tides'

  if (rotationProfile === 'Tidally locked (one face)' || rotationProfile === 'Resonant rotation (3:2)') return 'Locked tidal stress (tidally locked)'
  if (/tidally locked|terminator|tidally stretched|tidal volcanic/i.test(bodyClass.className)) return 'Locked tidal stress (tidally locked)'

  // Tidally heated geology implies strong tidal forces
  if (geology === 'Tidal heating') return 'Extreme tides (close massive moon)'

  // Class-name hint for many-moon resonant cases
  if (/peas-in-a-pod|resonant/i.test(bodyClass.className)) return 'Resonant tidal pulses (multi-moon resonance)'

  return pickTable(rng, rng.int(1, 6), tidalRegimeTable)
}

function generateAcousticEnvironment(rng: SeededRng, category: BodyCategory, atm: string, geology: string, hydro: string, bodyClass: WorldClassOption, magneticField: string): string {
  // No atmosphere → no sound
  if (atm === 'None / hard vacuum' || atm === 'None / dispersed volatiles' || atm === 'No ordinary atmosphere') return 'Silent vacuum (no sound transmission)'
  if (atm === 'Trace exosphere') return 'Silent vacuum (no sound transmission)'

  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Constant storm-drone'

  // Forced by features
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces' || geology === 'Global resurfacing') return 'Volcanic rumble'
  if (geology === 'Cryovolcanism' || geology === 'Subglacial volcanism') return 'Geyser screams (cryo or hot)'
  if (hydro === 'Cryo-geyser fields') return 'Geyser screams (cryo or hot)'
  if (hydro === 'Subsurface ice' || hydro === 'Polar caps / buried glaciers' || hydro === 'Ice-shell subsurface ocean') {
    if (rng.chance(0.6)) return 'Ice-cracking groans'
  }
  if (hydro === 'Liquid sulfur seas' || atm === 'Hydrogen sulfide rich') return 'Sulfur-vent hiss'

  // Wind-dominated for dense atm
  if (atm === 'Dense greenhouse' || atm === 'Sulfur/chlorine/ammonia haze' || atm === 'Steam atmosphere' || atm === 'Halocarbon greenhouse') {
    return rng.chance(0.5) ? 'Persistent wind howl' : 'Eerie muffled quiet (dense atm)'
  }

  // Magnetic field hum
  if (magneticField === 'Strong dipole shield' || magneticField === 'Aurora-belt dominated') {
    if (rng.chance(0.25)) return 'Resonant magnetic hum'
  }

  // GU bodies
  if (/programmable|chiral|bleed|observerse/i.test(bodyClass.className)) {
    return rng.chance(0.5) ? 'Programmable-matter clicking' : 'Bleed-resonance chime'
  }

  // Ocean coast worlds
  const oceanHydros = new Set(['Global ocean', 'Ocean-continent balance', 'Local seas', 'High-pressure deep ocean', 'Hydrocarbon lakes/seas'])
  if (oceanHydros.has(hydro) && rng.chance(0.5)) return 'Tidal surf along coastlines'

  return pickTable(rng, rng.int(2, 12), acousticEnvironmentTable)
}

function generateAtmosphericPressure(rng: SeededRng, category: BodyCategory, atm: string): string {
  if (category === 'belt') return 'Hard vacuum (<0.001 atm)'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Crushing (~50 atm)'

  // Forced by atmosphere class
  switch (atm) {
    case 'None / hard vacuum':
    case 'None / dispersed volatiles':
    case 'No ordinary atmosphere':
      return 'Hard vacuum (<0.001 atm)'
    case 'Trace exosphere':
      return 'Near-vacuum (~0.01 atm)'
    case 'Thin CO2/N2':
    case 'Thin but usable with pressure gear':
    case 'Aerosol veil':
      return 'Thin (~0.3 atm, pressure-gear required)'
    case 'Moderate inert atmosphere':
    case 'Moderate toxic atmosphere':
    case 'Oxygen-rich pre-industrial atmosphere':
      return 'Standard (~1 atm)'
    case 'Dense CO2/N2':
      return 'Dense (~3 atm)'
    case 'Dense greenhouse':
    case 'Sulfur/chlorine/ammonia haze':
    case 'Halocarbon greenhouse':
    case 'Photochemical smog':
    case 'Hydrogen sulfide rich':
      return 'High-pressure (~10 atm)'
    case 'Steam atmosphere':
      return rng.chance(0.5) ? 'High-pressure (~10 atm)' : 'Crushing (~50 atm)'
    case 'Rock-vapor atmosphere':
    case 'Metal vapor atmosphere':
    case 'Chiral-active atmosphere':
      return 'Crushing (~50 atm)'
    case 'Hydrogen/helium envelope':
      return 'Supercritical (Venus-extreme, ~90+ atm)'
    case 'Controlled habitat envelopes':
      return 'Standard (~1 atm)'
    default:
      return 'Standard (~1 atm)'
  }
}

function generateWindRegime(rng: SeededRng, category: BodyCategory, atm: string, climates: string[], bodyClass: WorldClassOption): string {
  if (category === 'belt') return 'Still / calm'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Stratified zonal jets (banded)'

  if (atm === 'None / hard vacuum' || atm === 'Trace exosphere' || atm === 'None / dispersed volatiles') return 'Still / calm'

  // Climate-driven overrides
  if (climates.includes('Hypercanes')) return 'Hypercane / supersonic jet streams'
  if (climates.includes('Permanent storm tracks') || climates.includes('Global monsoon')) return 'Storm-prone with high gusts'
  if (climates.includes('Runaway greenhouse') || climates.includes('Moist greenhouse edge')) return rng.chance(0.5) ? 'Hurricane-class continuous winds' : 'Stratified zonal jets (banded)'
  if (climates.includes('Aerosol winter')) return 'Periodic dust storm season'
  if (climates.includes('Hot desert') || climates.includes('Cold desert')) return rng.chance(0.4) ? 'Periodic dust storm season' : 'Persistent strong winds'
  if (climates.includes('Chiral cloud chemistry')) return 'Chiral wind chemistry'

  // Atmosphere thickness influences range
  if (atm === 'Dense greenhouse' || atm === 'Steam atmosphere' || atm === 'Halocarbon greenhouse') return rng.chance(0.5) ? 'Hurricane-class continuous winds' : 'Persistent strong winds'
  if (atm === 'Thin CO2/N2' || atm === 'Thin but usable with pressure gear') return rng.chance(0.5) ? 'Periodic dust storm season' : 'Light breeze'

  // Class hints
  if (/eyeball|terminator|tidally locked/i.test(bodyClass.className)) return 'Stratified zonal jets (banded)'

  return pickTable(rng, rng.int(1, 10), windRegimeTable)
}

function generateAxialTilt(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, rotationProfile: string): string {
  if (category === 'belt') return 'Precessing axis (long-cycle wobble)'
  // Tidally locked bodies have effectively no axial tilt (one face fixed)
  if (rotationProfile === 'Tidally locked (one face)') return 'Vertical / locked tilt (no seasons)'
  // Chaotic / wobbling rotation implies precessing
  if (rotationProfile === 'Wobbling rotation' || rotationProfile === 'Chaotic rotation') return 'Precessing axis (long-cycle wobble)'
  if (rotationProfile === 'Retrograde rotation') return 'Retrograde tilt'

  let roll = rng.int(1, 7)
  // Bias terrestrial bodies toward Earth-like mild tilt
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    if (rng.chance(0.4)) roll = pickOne(rng, [3, 4, 5])  // gas giants commonly have varied tilt (e.g. Uranus)
  } else if (rng.chance(0.45)) {
    roll = 3  // mild Earth-like
  }
  return pickTable(rng, clampTableRoll(roll, 7), axialTiltTable)
}

function generateSkyPhenomena(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, magneticField: string, primary: Star): string {
  // Aurora-belt magnetic field → Aurora ribbons sky
  if (magneticField === 'Aurora-belt dominated') return 'Aurora ribbons'
  if (magneticField === 'GU monopole anomaly') return 'Charged-particle sky glow'

  // Dark-sector classes show null zones
  if (/dark-sector|gardener-shadowed/i.test(bodyClass.className)) return 'Dark-sector visible nullzones'

  // Furnace/Inferno near star → corona view
  if (primary.activity.value === 'Extreme activity / metric-amplified events' && rng.chance(0.3)) return 'Persistent stellar plume / corona view'

  // Belts have belt arcs
  if (category === 'belt') return 'Belt-glittering arc'

  let roll = rng.int(1, 14)
  // Bias terrestrial/super-earth toward modest sky variations
  if (category === 'rocky-planet' || category === 'super-earth') {
    if (rng.chance(0.35)) roll = pickOne(rng, [1, 2, 4, 6, 7])  // clear / moons / aurora / meteor / refraction
  }
  return pickTable(rng, clampTableRoll(roll, 14), skyPhenomenaTable)
}

function generateDayLength(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, rotationProfile: string): string {
  // Drive from rotation profile (already computed)
  if (rotationProfile === 'Tidally locked (one face)') return 'No day-night cycle (tidally locked)'
  if (rotationProfile === 'Slow rotation (Mercury-style)') return 'Mercury-style year-length day'
  if (rotationProfile === 'Resonant rotation (3:2)') return 'Multi-day cycle (3-30 days)'
  if (rotationProfile === 'Fast rotation') return rng.chance(0.5) ? 'Very short day (under 6 Earth hours)' : 'Short day (6-18 hours)'
  if (rotationProfile === 'Chaotic rotation' || rotationProfile === 'Wobbling rotation') return 'Multi-day cycle (3-30 days)'

  // Class hints
  if (/tidally locked|terminator/i.test(bodyClass.className)) return 'No day-night cycle (tidally locked)'

  // Belt / envelope short
  if (category === 'belt') return 'Multi-day cycle (3-30 days)'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Short day (6-18 hours)'

  // Default — biased d7 toward Earth-like for terrestrial bodies (3-5 = Earth-like)
  const r = rng.int(1, 7)
  return pickTable(rng, r <= 1 ? 2 : r >= 6 ? 5 : 3, dayLengthTable)
}

function generateSurfaceLight(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, atm: string, rotationProfile: string): string {
  // Special anomaly-like classes
  if (/dark-sector|gardener-shadowed/i.test(bodyClass.className)) return 'Dark sector / GU-shadowed'
  if (/glass world|dayside glass|carbon-rich furnace/i.test(bodyClass.className)) return 'Glassy dayside glare'

  // Thermal zone extremes
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return rng.chance(0.7) ? 'Glassy dayside glare' : 'Bright daylight (Earth-like)'
  if (thermalZone === 'Dark') return rng.chance(0.7) ? 'Polar night' : 'Dark sector / GU-shadowed'
  if (thermalZone === 'Cryogenic') return rng.chance(0.5) ? 'Dim daylight (cold sun)' : 'Polar night'

  // Rotation drives terminator visibility
  if (rotationProfile === 'Tidally locked (one face)' || /terminator|tidally locked/i.test(bodyClass.className)) return 'Twilight / terminator zone'

  // Atmosphere-thick worlds dim the surface even in warm zones
  if (atm === 'Aerosol veil' || atm === 'Tholin photochemistry' || atm === 'Dense greenhouse' || atm === 'Sulfur/chlorine/ammonia haze') {
    return rng.chance(0.5) ? 'Dim daylight (cold sun)' : 'Twilight / terminator zone'
  }

  // Ringed-giant moons can sit in ring shadows
  if (category === 'dwarf-body' && rng.chance(0.12)) return 'Ring-shadow penumbra'
  // Strong magnetic / aurora-driven worlds (less common)
  if (rng.chance(0.06)) return 'Auroral glow dominant'

  return pickTable(rng, rng.int(1, 4), surfaceLightTable)  // bright/dim/twilight default range
}

function generateSeismicActivity(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, geology: string): string {
  if (category === 'belt') return 'Seismically dead'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Seismically dead'

  // GU / Bleed influence
  if (/\bgu\b|chiral|observerse|bleed/i.test(bodyClass.className) && rng.chance(0.4)) return 'Bleed-induced metric tremors'

  // Geology-driven overrides
  if (geology === 'Tidal heating') return 'Tidal flexing tremors'
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces' || geology === 'Global resurfacing') return 'Frequent shaking'
  if (geology === 'Plate tectonic analogue') return 'Active fault zones'
  if (geology === 'Supercontinent cycle') return 'Periodic plate quakes'
  if (geology === 'Dead interior' || geology === 'Ancient cratered crust') return rng.chance(0.7) ? 'Seismically dead' : 'Rare deep tremors'
  if (geology === 'Static lid') return 'Marsquake-scale crustal pops'
  if (geology === 'Cryovolcanism' || geology === 'Subglacial volcanism') return 'Constant micro-seismic noise'
  if (geology === 'Magnetic dynamo flicker') return 'Periodic plate quakes'

  return pickTable(rng, rng.int(1, 10), seismicActivityTable)
}

function generateSurfaceHazards(rng: SeededRng, category: BodyCategory, bodyClass: WorldClassOption, hydro: string, atm: string, mineralComposition: string): string {
  if (category === 'belt') return 'Wind-driven abrasive dust'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Clear surface — no contact hazards'

  // Strong forcing by mineral composition (the most chemistry-direct field)
  if (mineralComposition === 'Halogen-bearing crust') return rng.chance(0.5) ? 'Cyanide-bearing salt crust' : 'Hydrogen sulfide vent gas'
  if (mineralComposition === 'Chiral organics in soil') return 'Chiral-reactive contaminants'
  if (mineralComposition === 'Programmable-matter substrate' || mineralComposition === 'Bleed-altered crust') return 'Programmable-matter contamination'
  if (mineralComposition === 'Iron-rich (red oxide)' || mineralComposition === 'Sulfate evaporite crust') return rng.chance(0.55) ? 'Perchlorate-laden soil' : 'Wind-driven abrasive dust'
  if (mineralComposition === 'Salt / evaporite-rich') return 'Perchlorate-laden soil'
  if (mineralComposition === 'Sulfide ore-dominant') return 'Hydrogen sulfide vent gas'
  if (mineralComposition === 'Iron meteoritic enrichment') return 'Pyrophoric metallic dust'

  // Hydrosphere forcing
  if (hydro === 'Liquid sulfur seas' || atm === 'Sulfur/chlorine/ammonia haze') return 'Sulfuric acid pools'
  if (hydro === 'Cryogenic nitrogen reservoirs' || hydro === 'Methane permafrost cycle') return 'Cryogenic burn (LN2-cold contact)'
  if (hydro === 'Dust seas / fluidized regolith') return 'Electrostatic dust clouds'
  if (atm === 'Hydrogen sulfide rich') return 'Hydrogen sulfide vent gas'
  if (atm === 'Photochemical smog' || atm === 'Halocarbon greenhouse') return 'Carbon monoxide seeps'

  // Class hints
  if (/airless|stripped/i.test(bodyClass.className) && rng.chance(0.4)) return 'Electrostatic dust clouds'
  if (/scorched|inferno|furnace/i.test(bodyClass.className) && rng.chance(0.4)) return 'Mercury vapor pockets'

  let roll = rng.int(1, 14)
  if (atm === 'None / hard vacuum' || atm === 'Trace exosphere') {
    if (rng.chance(0.5)) roll = pickOne(rng, [2, 7, 8])  // dust / static / radioactive
  }
  return pickTable(rng, clampTableRoll(roll, 14), surfaceHazardsTable)
}

function generateTopography(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, geology: string, hydro: string): string {
  if (category === 'belt') return 'Crater-saturated'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Hemispheric albedo dichotomy'

  // Geology-driven overrides
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces') return 'Volcanic shield province'
  if (geology === 'Cryovolcanism' || geology === 'Subglacial volcanism') return rng.chance(0.5) ? 'Ice-shell terrain' : 'Glacial valley networks'
  if (geology === 'Karst / dissolution terrain') return 'Sand seas / dune fields'
  if (geology === 'Ancient cratered crust' || geology === 'Dead interior') return 'Crater-saturated'
  if (geology === 'Plate tectonic analogue') return rng.chance(0.5) ? 'Tectonic ridge system' : 'Highland-continent dichotomy'
  if (geology === 'Supercontinent cycle') return 'Tibetan plateau / supercontinent'
  if (geology === 'Magnetic dynamo flicker') return 'Mascon basin (gravity well)'

  // Hydrosphere hints
  if (hydro === 'Subsurface ice' || hydro === 'Polar caps / buried glaciers') return rng.chance(0.6) ? 'Bright icy poles' : 'Glacial valley networks'
  if (hydro === 'Ice-shell subsurface ocean' || hydro === 'Cryo-geyser fields') return 'Ice-shell terrain'

  // Class-driven hints
  if (/dust|airless|stripped/i.test(bodyClass.className)) return 'Crater-saturated'

  let roll = rng.int(1, 14)
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') {
    if (rng.chance(0.4)) roll = pickOne(rng, [11, 12, 13, 14])  // cold-zone topographies
  }
  if (thermalZone === 'Hot' || thermalZone === 'Furnace' || thermalZone === 'Inferno') {
    if (rng.chance(0.4)) roll = pickOne(rng, [6, 7, 9])  // volcanic / dune / mascon
  }
  return pickTable(rng, clampTableRoll(roll, 14), topographyTable)
}

function generateRotationProfile(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  // Class-driven tidally locked
  if (/tidally locked|terminator/i.test(bodyClass.className)) return 'Tidally locked (one face)'
  if (/tidally stretched|tidal volcanic/i.test(bodyClass.className)) return rng.chance(0.6) ? 'Tidally locked (one face)' : 'Resonant rotation (3:2)'
  // Hot close-in classes often tidally locked
  if ((thermalZone === 'Furnace' || thermalZone === 'Inferno') && rng.chance(0.6)) return 'Tidally locked (one face)'
  if (thermalZone === 'Hot' && rng.chance(0.3)) return 'Tidally locked (one face)'

  // Envelopes rotate fast
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Fast rotation'

  // Belts and dwarfs more often chaotic / wobbling
  if (category === 'belt') return 'Chaotic rotation'
  if (category === 'dwarf-body') {
    const r = rng.int(1, 4)
    if (r === 1) return 'Wobbling rotation'
    if (r === 2) return 'Chaotic rotation'
    if (r === 3) return 'Retrograde rotation'
    return 'Slow rotation (Mercury-style)'
  }

  return pickTable(rng, rng.int(1, 10), rotationProfileTable)
}

function generateAtmosphericTraces(rng: SeededRng, category: BodyCategory, atm: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return 'Noble gas excess'
  if (atm === 'None / hard vacuum' || atm === 'None / dispersed volatiles') return 'Noble gas excess'
  // Oxygen-rich atm is a strong life signal — biosignature traces fire here
  if (atm === 'Oxygen-rich pre-industrial atmosphere') {
    const r = rng.int(1, 3)
    if (r === 1) return 'Methane biosignature trace'
    if (r === 2) return 'Ozone layer present'
    return 'Carbon isotope biosignature'
  }
  if (atm === 'Aerosol veil') return 'Tholin photochemistry'
  if (atm === 'Halocarbon greenhouse' || atm === 'Photochemical smog') return 'Industrial pollutant signatures'
  if (atm === 'Hydrogen sulfide rich' || /sulfur|volcanic/i.test(bodyClass.className)) return 'Volcanic SO2 plumes'
  if (/\bgu\b|chiral|observerse|bleed/i.test(bodyClass.className) && rng.chance(0.45)) return 'Cyanide / cyanogen trace'

  let roll = rng.int(1, 12)
  if (/dwarf-body/.test(category) || /airless|dust/i.test(bodyClass.className)) roll = pickOne(rng, [2, 11])  // He-3 / noble gas
  if (atm === 'Steam atmosphere' || atm === 'Dense greenhouse') {
    if (rng.chance(0.4)) roll = 6  // Volcanic SO2
  }
  return pickTable(rng, clampTableRoll(roll, 12), atmosphericTracesTable)
}

function generateHydrology(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, hydro: string, geology: string): string {
  if (category === 'belt') return 'No active cycle'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'No active cycle'

  // Dry hydrospheres → no active cycle dominant
  const dryHydros = new Set(['Bone dry', 'Hydrated minerals only', 'Vaporized volatile traces', 'Nightside mineral frost', 'No accessible surface volatiles', 'Magma seas / lava lakes', 'Dust seas / fluidized regolith'])
  if (dryHydros.has(hydro)) return 'No active cycle'

  // Forced by hydrosphere
  if (hydro === 'Liquid sulfur seas') return 'Sulfur springs'
  if (hydro === 'Salt / perchlorate flats') return 'Salt-flat ephemeral lakes'
  if (hydro === 'Hydrocarbon lakes/seas') return 'Cryo-rivers / glacial meltwater channels'
  if (hydro === 'Ice-shell subsurface ocean' || hydro === 'Cryo-geyser fields') return 'Subglacial lake belt'
  if (hydro === 'Subsurface ice' || hydro === 'Polar caps / buried glaciers') return rng.chance(0.5) ? 'Frozen-thawed cycle lakes' : 'Cryo-rivers / glacial meltwater channels'
  if (hydro === 'Methane permafrost cycle') return 'Frozen-thawed cycle lakes'
  if (hydro === 'Cryogenic nitrogen reservoirs' || hydro === 'Cryovolcanic vents') return 'Cryo-rivers / glacial meltwater channels'
  if (hydro === 'Continental water tables') return 'Subsurface artesian springs'
  if (hydro === 'Briny aquifers') return rng.chance(0.6) ? 'Subsurface artesian springs' : 'Brackish marshlands'

  // Forced by geology
  if (geology === 'Karst / dissolution terrain') return 'Karst-fed underground rivers'

  // Class-tagged tidally-locked classes
  if (/tidally locked|terminator/i.test(bodyClass.className)) {
    return rng.chance(0.5) ? 'Tidally-locked hemispheric water' : 'Hemispheric ocean migration'
  }

  // Open-ocean / liquid-water hydros — distribute among cycle styles
  const openLiquid = new Set(['Local seas', 'Ocean-continent balance', 'Global ocean', 'High-pressure deep ocean', 'Ammonia-water antifreeze ocean'])
  if (openLiquid.has(hydro)) {
    const roll = rng.int(2, 14)  // skip "No active cycle"
    if (rng.chance(0.25) && (geology === 'Active volcanism' || geology === 'Plate tectonic analogue' || geology === 'Extreme plume provinces' || geology === 'Tidal heating' || geology === 'Subglacial volcanism')) {
      return 'Hot vent ecosystems'
    }
    return pickTable(rng, clampTableRoll(roll, 14), hydrologyTable)
  }

  // Exotic solvent / other — pick a generic flow style
  return pickOne(rng, ['Drainage-basin watersheds', 'Subsurface artesian springs', 'Brackish marshlands'])
}

function generateMineralComposition(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, geology: string): string {
  if (category === 'belt') return 'Sulfide ore-dominant'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return 'Olivine-pyroxene mantle exposure'

  let roll = rng.int(1, 20)
  // Thermal zone biases
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') {
    if (rng.chance(0.5)) roll = pickOne(rng, [3, 15, 16, 8])  // carbon-rich / iron meteoritic / vitrified / mantle
  }
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') {
    if (rng.chance(0.45)) roll = pickOne(rng, [9, 10, 19])  // clathrates / He-3 regolith / frozen organics
  }
  // Geology cross-link
  if (geology === 'Karst / dissolution terrain') roll = 7  // calcite/limestone
  if (geology === 'Glassy / vitrified surface') roll = 16
  // Class-specific routing
  if (/\bgu\b|chiral|observerse|bleed/i.test(bodyClass.className)) {
    if (rng.chance(0.6)) roll = pickOne(rng, [12, 13, 14])  // chiral / programmable / bleed-altered
  }
  if (/stripped|airless|remnant/i.test(bodyClass.className)) roll = pickOne(rng, [8, 15, 18])  // mantle / iron / bedrock
  if (/sulfur|volcanic/i.test(bodyClass.className) && (thermalZone === 'Hot' || thermalZone === 'Furnace' || thermalZone === 'Inferno')) roll = 4
  if (/salt|perchlorate|evaporite/i.test(bodyClass.className)) roll = pickOne(rng, [17, 20])
  if (/dense|super-mercury|heavy-gravity/i.test(bodyClass.className)) roll = pickOne(rng, [5, 4, 15])  // heavy elements / sulfide / iron

  return pickTable(rng, clampTableRoll(roll, 20), mineralCompositionTable)
}

function generateMagneticField(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption, geology: string, physical: BodyPhysicalHints): string {
  // Belt and dwarf bodies generally no field
  if (category === 'belt') return 'No field (naked)'
  if (category === 'dwarf-body' && rng.chance(0.85)) return rng.chance(0.5) ? 'No field (naked)' : 'Weak crustal remnant'

  // Geology cross-link: Magnetic dynamo flicker geology forces Pulsing/flickering
  if (geology === 'Magnetic dynamo flicker') return 'Pulsing / flickering'

  // Envelope bodies (gas/ice giants) typically have strong fields
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return rng.chance(0.85) ? 'Strong dipole shield' : 'Aurora-belt dominated'
  }

  // GU classes have a chance for the GU monopole anomaly
  if (/\bgu\b|chiral|observerse|bleed|programmable|metric/i.test(bodyClass.className) && rng.chance(0.35)) {
    return 'GU monopole anomaly'
  }

  let roll = rng.int(1, 10)
  // Super-Earth and high-gravity bodies bias toward stronger fields
  if (category === 'super-earth' || /high-gravity|super-earth|super-terrestrial/i.test(bodyClass.className)) roll += 1
  // Small bodies bias toward weaker
  if (physical.radiusEarth.value < 0.7) roll -= 2
  // Hot bodies with active geology bias toward functioning dynamos
  if ((thermalZone === 'Hot' || thermalZone === 'Furnace' || thermalZone === 'Inferno') && ['Active volcanism', 'Plate tectonic analogue', 'Tidal heating', 'Extreme plume provinces', 'Global resurfacing'].includes(geology)) roll += 1
  // Cold/Cryogenic dead bodies bias toward no field
  if ((thermalZone === 'Cryogenic' || thermalZone === 'Dark') && ['Dead interior', 'Ancient cratered crust'].includes(geology)) roll -= 2

  return pickTable(rng, clampTableRoll(roll, 9), magneticFieldTable)
}

function generateDetail(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  thermalZone: string,
  primary: Star
): PlanetaryDetail {
  const category = bodyClass.category
  if (category === 'anomaly') {
    const isFacilityLike = rng.chance(0.45)
    const detailWithoutBiosphere = {
      atmosphere: fact(
        isFacilityLike ? 'Controlled habitat envelopes' : 'No ordinary atmosphere',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      hydrosphere: fact(
        isFacilityLike ? 'Imported or recycled volatiles' : 'Not applicable: metric or route phenomenon',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      geology: fact(
        isFacilityLike ? 'Artificial platform or engineered substrate' : 'Metric shear geometry',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      climate: [
        fact(
          isFacilityLike ? 'Managed facility microclimates' : 'No planetary climate',
          'gu-layer',
          'MASS-GU anomaly environment constraint'
        ),
      ],
      radiation: fact(
        pickOne(rng, ['Electronics-disruptive metric/radiation mix', 'Only deep shielded habitats survive', 'Storm-dependent hazard']),
        'gu-layer',
        'MASS-GU anomaly radiation constraint'
      ),
      mineralComposition: fact(
        isFacilityLike ? 'Bedrock exposed (no regolith)' : 'Programmable-matter substrate',
        'gu-layer',
        'MASS-GU anomaly mineral constraint'
      ),
      magneticField: fact(
        isFacilityLike ? 'No field (naked)' : 'GU monopole anomaly',
        'gu-layer',
        'MASS-GU anomaly magnetic constraint'
      ),
      atmosphericTraces: fact(
        isFacilityLike ? 'Industrial pollutant signatures' : 'Cyanide / cyanogen trace',
        'gu-layer',
        'MASS-GU anomaly trace-gas constraint'
      ),
      hydrology: fact('No active cycle', 'gu-layer', 'MASS-GU anomaly hydrology constraint'),
      topography: fact(
        isFacilityLike ? 'Tibetan plateau / supercontinent' : 'Ring impact pattern',
        'gu-layer',
        'MASS-GU anomaly topography constraint'
      ),
      rotationProfile: fact(
        isFacilityLike ? 'Earth-like 24h cycle' : 'Chaotic rotation',
        'gu-layer',
        'MASS-GU anomaly rotation constraint'
      ),
      seismicActivity: fact(
        isFacilityLike ? 'Seismically dead' : 'Bleed-induced metric tremors',
        'gu-layer',
        'MASS-GU anomaly seismic constraint'
      ),
      surfaceHazards: fact(
        isFacilityLike ? 'Programmable-matter contamination' : 'Chiral-reactive contaminants',
        'gu-layer',
        'MASS-GU anomaly surface-hazard constraint'
      ),
      dayLength: fact(
        isFacilityLike ? 'Earth-like day (~24 hours)' : 'No day-night cycle (tidally locked)',
        'gu-layer',
        'MASS-GU anomaly day-length constraint'
      ),
      surfaceLight: fact(
        isFacilityLike ? 'Bright daylight (Earth-like)' : 'Dark sector / GU-shadowed',
        'gu-layer',
        'MASS-GU anomaly surface-light constraint'
      ),
      axialTilt: fact(
        isFacilityLike ? 'Vertical / locked tilt (no seasons)' : 'Precessing axis (long-cycle wobble)',
        'gu-layer',
        'MASS-GU anomaly axial-tilt constraint'
      ),
      skyPhenomena: fact(
        isFacilityLike ? 'Clear stellar sky' : 'Dark-sector visible nullzones',
        'gu-layer',
        'MASS-GU anomaly sky-phenomena constraint'
      ),
      atmosphericPressure: fact(
        isFacilityLike ? 'Standard (~1 atm)' : 'Hard vacuum (<0.001 atm)',
        'gu-layer',
        'MASS-GU anomaly pressure constraint'
      ),
      windRegime: fact(
        isFacilityLike ? 'Still / calm' : 'Chiral wind chemistry',
        'gu-layer',
        'MASS-GU anomaly wind constraint'
      ),
      tidalRegime: fact(
        isFacilityLike ? 'Negligible tides' : 'Resonant tidal pulses (multi-moon resonance)',
        'gu-layer',
        'MASS-GU anomaly tidal constraint'
      ),
      acousticEnvironment: fact(
        isFacilityLike ? 'Eerie muffled quiet (dense atm)' : 'Bleed-resonance chime',
        'gu-layer',
        'MASS-GU anomaly acoustic constraint'
      ),
      resourceAccess: fact(
        isFacilityLike ? 'Hazard-restricted (legal or environmental lock)' : 'Bleed-fluxed concentration zones',
        'gu-layer',
        'MASS-GU anomaly resource constraint'
      ),
      biosphereDistribution: fact('Sterile / not applicable', 'gu-layer', 'MASS-GU anomaly biosphere distribution constraint'),
    }

    return {
      ...detailWithoutBiosphere,
      biosphere: fact('Sterile', 'inferred', 'Anomaly bodies do not roll ordinary biospheres'),
    }
  }

  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  const isBelt = category === 'belt'
  const climateCount = rng.chance(0.4) ? 2 : 1
  const environmentPolicy = deriveEnvironmentPolicy(bodyClass, thermalZone, primary)
  const geology = rollGeology(rng, category, thermalZone, bodyClass)
  const atmosphere = rollAtmosphere(rng, category, thermalZone, primary, bodyClass, physical, geology)
  const hydrosphere = rollHydrosphere(rng, category, thermalZone, bodyClass)
  const climateFacts = generateClimate(rng, category, thermalZone, climateCount)

  const detailWithoutBiosphere = normalizeDetailForEnvironment({
    atmosphere: fact(
      atmosphere,
      'inferred',
      'MASS-GU 14 atmosphere d12 table with source modifiers'
    ),
    hydrosphere: fact(
      hydrosphere,
      'inferred',
      'MASS-GU 14 hydrosphere d12 table with volatile-state modifiers'
    ),
    geology: fact(
      geology,
      'inferred',
      isBelt || isEnvelopeWorld ? 'MASS-GU 14 geology table with category constraints' : 'MASS-GU 14 geology d12 table with source modifiers'
    ),
    climate: climateFacts,
    radiation: fact(
      generateRadiation(rng, category, thermalZone, primary, bodyClass),
      'inferred',
      'MASS-GU 14 radiation d8 table with source modifiers'
    ),
    ...((): Pick<PlanetaryDetail, 'mineralComposition' | 'magneticField' | 'atmosphericTraces' | 'hydrology' | 'topography' | 'rotationProfile' | 'seismicActivity' | 'surfaceHazards' | 'dayLength' | 'surfaceLight' | 'axialTilt' | 'skyPhenomena' | 'atmosphericPressure' | 'windRegime' | 'tidalRegime' | 'acousticEnvironment' | 'resourceAccess'> => {
      const mineralValue = generateMineralComposition(rng.fork('mineral-composition'), category, thermalZone, bodyClass, geology)
      const rotationValue = generateRotationProfile(rng.fork('rotation'), category, thermalZone, bodyClass)
      const magneticValue = generateMagneticField(rng.fork('magnetic-field'), category, thermalZone, bodyClass, geology, physical)
      const climateValues = climateFacts.map((c) => c.value)
      return {
        mineralComposition: fact(mineralValue, 'inferred', 'Generated lithology — biased by thermal zone, geology, and class chemistry'),
        magneticField: fact(magneticValue, 'inferred', 'Generated magnetic field profile — biased by mass, geology, and category'),
        atmosphericTraces: fact(
          generateAtmosphericTraces(rng.fork('atmospheric-traces'), category, atmosphere, bodyClass),
          'inferred',
          'Generated trace-gas signature — biased by atmosphere type and class chemistry',
        ),
        hydrology: fact(
          generateHydrology(rng.fork('hydrology'), category, thermalZone, bodyClass, hydrosphere, geology),
          'inferred',
          'Generated water-cycle pattern — biased by hydrosphere reservoir, geology, and tidal status',
        ),
        topography: fact(
          generateTopography(rng.fork('topography'), category, thermalZone, bodyClass, geology, hydrosphere),
          'inferred',
          'Generated surface morphology — biased by geology, hydrosphere, and thermal zone',
        ),
        rotationProfile: fact(rotationValue, 'inferred', 'Generated rotation profile — biased by class tags, thermal zone, and category'),
        seismicActivity: fact(
          generateSeismicActivity(rng.fork('seismic'), category, bodyClass, geology),
          'inferred',
          'Generated seismic regime — biased by geology and class tags',
        ),
        surfaceHazards: fact(
          generateSurfaceHazards(rng.fork('surface-hazards'), category, bodyClass, hydrosphere, atmosphere, mineralValue),
          'inferred',
          'Generated surface contact hazards — biased by mineral composition, hydrosphere, and atmosphere',
        ),
        dayLength: fact(
          generateDayLength(rng.fork('day-length'), category, thermalZone, bodyClass, rotationValue),
          'inferred',
          'Generated day length — derived from rotation profile and class tags',
        ),
        surfaceLight: fact(
          generateSurfaceLight(rng.fork('surface-light'), category, thermalZone, bodyClass, atmosphere, rotationValue),
          'inferred',
          'Generated surface light level — biased by thermal zone, atmosphere opacity, and rotation',
        ),
        axialTilt: fact(
          generateAxialTilt(rng.fork('axial-tilt'), category, bodyClass, rotationValue),
          'inferred',
          'Generated axial tilt regime — derived from rotation profile and category',
        ),
        skyPhenomena: fact(
          generateSkyPhenomena(rng.fork('sky-phenomena'), category, bodyClass, magneticValue, primary),
          'inferred',
          'Generated visible sky phenomena — biased by magnetic field, class flavor, and stellar activity',
        ),
        atmosphericPressure: fact(
          generateAtmosphericPressure(rng.fork('atmospheric-pressure'), category, atmosphere),
          'inferred',
          'Generated atmospheric pressure — forced by atmosphere class',
        ),
        windRegime: fact(
          generateWindRegime(rng.fork('wind-regime'), category, atmosphere, climateValues, bodyClass),
          'inferred',
          'Generated wind regime — biased by atmosphere, climate, and tidal locking',
        ),
        tidalRegime: fact(
          generateTidalRegime(rng.fork('tidal-regime'), category, bodyClass, rotationValue, geology),
          'inferred',
          'Generated tidal regime — biased by rotation profile, geology, and class tags',
        ),
        acousticEnvironment: fact(
          generateAcousticEnvironment(rng.fork('acoustic-env'), category, atmosphere, geology, hydrosphere, bodyClass, magneticValue),
          'inferred',
          'Generated acoustic environment — biased by atmosphere transmission, geology, hydrosphere, and class',
        ),
        resourceAccess: fact(
          generateResourceAccess(rng.fork('resource-access'), category, bodyClass, atmosphere, mineralValue),
          'inferred',
          'Generated resource access mode — biased by category, class, atmosphere pressure, and mineral wealth',
        ),
      }
    })(),
  }, environmentPolicy, thermalZone)

  const biosphereValue = environmentPolicy.biosphere.forced ?? generateBiosphere(rng, category, thermalZone, detailWithoutBiosphere, primary, bodyClass)
  const livingBiospheres = new Set(['Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'])
  const surfaceDryButLiving = livingBiospheres.has(biosphereValue) && detailWithoutBiosphere.hydrosphere.value === 'Bone dry'
  const biosphereSource = environmentPolicy.biosphere.forced
    ? `Forced by ${environmentPolicy.profile} environment policy`
    : surfaceDryButLiving
      ? 'MASS-GU biosphere score; surface reads Bone dry — biosphere implied as subsurface brine pockets or relict biofilm refugia'
      : 'MASS-GU biosphere score'

  const distributionValue = generateBiosphereDistribution(
    rng.fork('biosphere-distribution'),
    biosphereValue,
    category,
    detailWithoutBiosphere.hydrosphere.value,
    detailWithoutBiosphere.atmosphere.value,
    bodyClass,
  )

  return {
    ...detailWithoutBiosphere,
    biosphere: fact(biosphereValue, 'inferred', biosphereSource),
    biosphereDistribution: fact(distributionValue, 'inferred', 'Generated biosphere distribution — biased by biosphere tier, hydrosphere, atmosphere, and class'),
  }
}

function mergeKnownDetail(generated: PlanetaryDetail, known?: PartialKnownBody['detail']): PlanetaryDetail {
  return {
    atmosphere: mergeLockedFact(generated.atmosphere, known?.atmosphere),
    hydrosphere: mergeLockedFact(generated.hydrosphere, known?.hydrosphere),
    geology: mergeLockedFact(generated.geology, known?.geology),
    climate: known?.climate?.some((entry) => entry.locked) ? known.climate as Array<Fact<string>> : generated.climate,
    radiation: mergeLockedFact(generated.radiation, known?.radiation),
    biosphere: mergeLockedFact(generated.biosphere, known?.biosphere),
    mineralComposition: mergeLockedFact(generated.mineralComposition, known?.mineralComposition),
    magneticField: mergeLockedFact(generated.magneticField, known?.magneticField),
    atmosphericTraces: mergeLockedFact(generated.atmosphericTraces, known?.atmosphericTraces),
    hydrology: mergeLockedFact(generated.hydrology, known?.hydrology),
    topography: mergeLockedFact(generated.topography, known?.topography),
    rotationProfile: mergeLockedFact(generated.rotationProfile, known?.rotationProfile),
    seismicActivity: mergeLockedFact(generated.seismicActivity, known?.seismicActivity),
    surfaceHazards: mergeLockedFact(generated.surfaceHazards, known?.surfaceHazards),
    dayLength: mergeLockedFact(generated.dayLength, known?.dayLength),
    surfaceLight: mergeLockedFact(generated.surfaceLight, known?.surfaceLight),
    axialTilt: mergeLockedFact(generated.axialTilt, known?.axialTilt),
    skyPhenomena: mergeLockedFact(generated.skyPhenomena, known?.skyPhenomena),
    atmosphericPressure: mergeLockedFact(generated.atmosphericPressure, known?.atmosphericPressure),
    windRegime: mergeLockedFact(generated.windRegime, known?.windRegime),
    tidalRegime: mergeLockedFact(generated.tidalRegime, known?.tidalRegime),
    acousticEnvironment: mergeLockedFact(generated.acousticEnvironment, known?.acousticEnvironment),
    resourceAccess: mergeLockedFact(generated.resourceAccess, known?.resourceAccess),
    biosphereDistribution: mergeLockedFact(generated.biosphereDistribution, known?.biosphereDistribution),
  }
}

function hasLockedEnvironmentDetail(known?: PartialKnownBody['detail']): boolean {
  return Boolean(
    known?.atmosphere?.locked ||
    known?.hydrosphere?.locked ||
    known?.geology?.locked ||
    known?.climate?.some((entry) => entry.locked) ||
    known?.radiation?.locked
  )
}

function moonProfile(moonType: string): Pick<Moon, 'resource' | 'hazard' | 'use'> {
  const profiles: Record<string, { resource: string; hazard: string; use: string }> = {
    'Airless rock': {
      resource: 'metals, regolith, and vacuum construction sites',
      hazard: 'hard radiation and thermal cycling',
      use: 'mines, mass drivers, or bare-rock observatories',
    },
    'Cratered ice-rock': {
      resource: 'accessible ice mixed with rocky feedstock',
      hazard: 'fractured terrain and weak anchoring',
      use: 'volatile depots, buried habitats, and repair yards',
    },
    'Captured asteroid': {
      resource: 'metal-rich rubble and unusual impact history',
      hazard: 'irregular gravity and unstable debris',
      use: 'prospecting camps, salvage claims, and hidden docks',
    },
    'Captured dwarf': {
      resource: 'deep volatiles and differentiated mineral layers',
      hazard: 'distant, cold, and hard to police',
      use: 'bunkers, long-term archives, or high-autonomy settlements',
    },
    'Subsurface ocean moon': {
      resource: 'ocean chemistry, plumes, and protected volatiles',
      hazard: 'biosafety risk and ice-shell access failures',
      use: 'bore stations, biosafety labs, and plume harvesters',
    },
    'Thick ice-shell moon': {
      resource: 'massive water ice reserves',
      hazard: 'deep drilling risk and pressure faults',
      use: 'water monopolies, shielded habitats, and fuel production',
    },
    'Cryovolcanic moon': {
      resource: 'fresh volatiles and plume chemistry',
      hazard: 'eruptive ice terrain and corrosive deposits',
      use: 'plume skimmers, chemistry labs, and hazard-pay mines',
    },
    'Volcanic tidal moon': {
      resource: 'sulfur, metals, heat, and tidal power',
      hazard: 'surface eruptions and extreme tidal stress',
      use: 'power sites, hardened bunkers, and dangerous extraction towns',
    },
    'Dense-atmosphere moon': {
      resource: 'atmospheric feedstock and protected aerostat sites',
      hazard: 'weather, corrosive chemistry, and difficult evacuation',
      use: 'aerostats, research stations, and atmospheric harvesters',
    },
    'Hydrocarbon moon': {
      resource: 'hydrocarbon lakes and organic feedstock',
      hazard: 'cryogenic weather and flammable chemistry',
      use: 'fuel chemistry, frontier ports, and cold industrial settlements',
    },
    'Habitable-zone moon': {
      resource: 'temperate real estate and accessible volatiles',
      hazard: 'planetary radiation belts and contamination politics',
      use: 'treaty colonies, farms under shielding, and high-value research',
    },
    'Radiation-scorched inner moon': {
      resource: 'inner-system access and magnetospheric data',
      hazard: 'severe radiation belts',
      use: 'fortresses, listening posts, and automated observatories',
    },
    'Ring-shepherd moon': {
      resource: 'ring access and traffic-control leverage',
      hazard: 'debris lanes and collision risk',
      use: 'ring ports, customs posts, and shepherding stations',
    },
    'Chiral ice moon': {
      resource: 'chiral ice and metric-sensitive volatiles',
      hazard: 'chiral contamination and claim wars',
      use: 'sealed harvest sites, quarantine labs, and cartel enclaves',
    },
    'Dark-sector density moon': {
      resource: 'dark-sector doped ore and anomalous gravity gradients',
      hazard: 'navigation errors and instrumentation drift',
      use: 'black-budget extraction, observerse labs, and interdicted mines',
    },
    'Programmable regolith moon': {
      resource: 'programmable-matter regolith deposits',
      hazard: 'containment failure and illegal replication claims',
      use: 'containment sites, forensic labs, and military contractors',
    },
    'Former settlement moon': {
      resource: 'first-wave infrastructure and buried records',
      hazard: 'structural decay and legal ghosts',
      use: 'salvage towns, reoccupied ruins, and disputed inheritance claims',
    },
    'Active mining moon': {
      resource: 'proven industrial ore or volatile extraction',
      hazard: 'labor conflict and industrial accidents',
      use: 'mines, refineries, and company towns',
    },
    'Quarantine moon': {
      resource: 'sealed research value and forbidden records',
      hazard: 'biosafety, AI, or chiral quarantine',
      use: 'cordons, medical boards, and illegal entry jobs',
    },
    'Moving bleed node moon': {
      resource: 'mobile GU extraction and route prediction value',
      hazard: 'metric storms and unstable navigation baselines',
      use: 'bleed-chaser fleets, observerse AIs, and high-risk harvest crews',
    },
  }
  const profile = profiles[moonType] ?? {
    resource: 'survey value and local materials',
    hazard: 'ordinary frontier risk',
    use: 'survey crews and small outposts',
  }

  return {
    resource: fact(profile.resource, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') || moonType.includes('Programmable') ? 'gu-layer' : 'inferred', 'MASS-GU moon resource interpretation'),
    hazard: fact(profile.hazard, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') ? 'gu-layer' : 'inferred', 'MASS-GU moon hazard interpretation'),
    use: fact(profile.use, 'human-layer', 'MASS-GU moon playable-use interpretation'),
  }
}

function terrestrialMoonResult(roll: number): { count: number; scale?: string; typeHints?: readonly string[] } {
  if (roll <= 5) return { count: 0 }
  if (roll <= 8) return { count: 1, scale: 'minor captured moonlet', typeHints: ['Captured asteroid', 'Airless rock', 'Cratered ice-rock'] }
  if (roll === 9) return { count: 1, scale: 'small major moon' }
  if (roll === 10) return { count: 1, scale: 'mid-sized icy moon' }
  if (roll === 11) return { count: 1, scale: 'large differentiated moon' }
  return { count: 1, scale: 'planet-scale major moon' }
}

function giantMoonCount(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  thermalZone: string,
  primary: Star,
  architectureName: string
): number {
  const category = bodyClass.category
  const radius = physical.radiusEarth.value
  let count = category === 'gas-giant'
    ? rng.int(2, 6) + rng.int(1, 4)
    : rng.int(1, 4) + rng.int(0, 2)

  if (category === 'gas-giant') {
    if (radius >= 12) count += 3
    else if (radius >= 10.5) count += 2
    else if (radius >= 9) count += 1
    else count -= 1

    if (bodyClass.className === 'Super-Jovian') count += 4
    if (bodyClass.className === 'Ringed giant with moons') count += 1
    if (bodyClass.className === 'Migrated giant') count -= 1
  } else {
    if (radius >= 5) count += 2
    else if (radius >= 4.3) count += 1
    else if (radius < 3.8) count -= 1
    if (bodyClass.className === 'Small ice giant') count -= 2
    if (bodyClass.className === 'Neptune-like ice giant') count += 1
  }

  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') count += 1
  if (thermalZone === 'Hot') count -= 2
  if (physical.closeIn.value) count -= 1
  if (primary.ageState.value === 'Embryonic/very young' || primary.ageState.value === 'Young' || architectureName === 'Debris-dominated') count += 1
  if (architectureName === 'Giant-rich or chaotic') count += 1

  const minimum = category === 'gas-giant' && thermalZone !== 'Hot' && !physical.closeIn.value ? 4 : 1
  const maximum = category === 'gas-giant'
    ? bodyClass.className === 'Super-Jovian' ? 16 : 13
    : 9
  return Math.max(minimum, Math.min(maximum, count))
}

function subNeptuneMoonResult(
  rng: SeededRng,
  physical: BodyPhysicalHints,
  thermalZone: string,
  architectureName: string
): { count: number; scale?: string; typeHints?: readonly string[] } {
  let roll = rng.int(1, 6)
  if (physical.radiusEarth.value >= 3.2) roll += 1
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 1
  if (architectureName === 'Giant-rich or chaotic' || architectureName === 'Debris-dominated') roll += 1
  if (thermalZone === 'Hot') roll -= 2
  if (physical.closeIn.value) roll -= 2
  if (roll <= 5) return { count: 0 }
  if (roll <= 7) return { count: 1, scale: 'minor captured moonlet', typeHints: ['Captured asteroid', 'Airless rock', 'Cratered ice-rock'] }
  return { count: 2, scale: 'small major moon', typeHints: ['Captured asteroid', 'Cratered ice-rock', 'Thick ice-shell moon', 'Cryovolcanic moon'] }
}

function generateMoons(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  bodyIndex: number,
  thermalZone: string,
  primary: Star,
  architectureName: string,
  parentDesignation: string
): Moon[] {
  const category = bodyClass.category
  if (category === 'anomaly' || extremeHotThermalZones.has(thermalZone)) return []
  let moonCount = 0
  let scaleOverride: string | undefined
  let typeHints: readonly string[] | undefined

  if (category === 'gas-giant' || category === 'ice-giant') {
    moonCount = giantMoonCount(rng, bodyClass, physical, thermalZone, primary, architectureName)
  } else if (category === 'sub-neptune') {
    const result = subNeptuneMoonResult(rng, physical, thermalZone, architectureName)
    moonCount = result.count
    scaleOverride = result.scale
    typeHints = result.typeHints
  } else if (category === 'rocky-planet' || category === 'super-earth' || category === 'dwarf-body' || category === 'rogue-captured') {
    let roll = twoD6(rng)
    if (category === 'super-earth' || physical.radiusEarth.value >= 1.2) roll += 1
    if (architectureName === 'Giant-rich or chaotic' || architectureName === 'Debris-dominated') roll += 1
    if (thermalZone === 'Hot') roll -= 1
    if (physical.closeIn.value) roll -= 1
    if (category === 'dwarf-body' || category === 'rogue-captured') roll -= 1
    const result = terrestrialMoonResult(roll)
    moonCount = result.count
    scaleOverride = result.scale
    typeHints = result.typeHints
  }

  return Array.from({ length: moonCount }, (_, index) => {
    const moonType = typeHints ? pickOne(rng, typeHints) : pickOne(rng, moonTypes)
    const profile = moonProfile(moonType)
    return {
      id: `body-${bodyIndex + 1}-moon-${index + 1}`,
      name: fact(moonDesignation(parentDesignation, index), 'derived', 'Generated moon designation from parent body designation and moon order'),
      moonType: fact(moonType, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') || moonType.includes('Programmable') ? 'gu-layer' : 'inferred', 'MASS-GU 17 moon type table'),
      scale: fact(scaleOverride ?? (category === 'gas-giant' || category === 'ice-giant' ? pickOne(rng, moonScales.slice(1)) : pickOne(rng, moonScales.slice(0, 3))), 'inferred', 'MASS-GU 17 moon scale from moon count table'),
      ...profile,
    }
  })
}

function generateRingSystem(rng: SeededRng, category: BodyCategory): RingSystem | undefined {
  if (category !== 'gas-giant' && category !== 'ice-giant') return undefined
  const type = pickTable(rng, d12(rng), [...ringTypeTable])
  if (type === 'None or faint') return undefined
  return { type: fact(type, type.includes('GU') ? 'gu-layer' : 'inferred', 'MASS-GU 17 ring type d12 table') }
}

function pickWorldClassByCategory(
  rng: SeededRng,
  thermalZone: string,
  categories: BodyCategory[],
  fallback: WorldClassOption
): WorldClassOption {
  const options = worldClassesByThermalZone[thermalZone].filter((option) => categories.includes(option.category))
  return options.length ? pickOne(rng, options) : fallback
}

function pickBeltClass(rng: SeededRng, thermalZone: string, preferIce: boolean): WorldClassOption {
  const sourceRoll = d12(rng)
  const sourceClass = pickTable(rng, sourceRoll, [...beltClassTable])

  if (extremeHotThermalZones.has(thermalZone)) return sourceClass
  if (preferIce && rng.chance(0.6)) {
    return pickOne(rng, [
      { className: 'Ice-rich belt', category: 'belt', massClass: 'Ice-rich belt' },
      { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
      { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    ])
  }

  if (thermalZone === 'Hot' && sourceClass.className === 'Ice-rich belt') {
    return { className: 'Carbonaceous belt', category: 'belt', massClass: 'Carbonaceous belt' }
  }

  return sourceClass
}

function selectWorldClassForPlanKind(rng: SeededRng, thermalZone: string, planKind: BodyPlanKind): WorldClassOption {
  if (planKind === 'rocky') return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet'], forcedWorldClasses.rocky)
  if (planKind === 'super-earth') return pickWorldClassByCategory(rng, thermalZone, ['super-earth'], forcedWorldClasses.superEarth)
  if (planKind === 'sub-neptune') return pickWorldClassByCategory(rng, thermalZone, ['sub-neptune'], forcedWorldClasses.subNeptune)
  if ((planKind === 'belt' || planKind === 'ice-belt') && extremeHotThermalZones.has(thermalZone)) {
    return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], forcedWorldClasses.rocky)
  }
  if (planKind === 'belt') {
    return pickBeltClass(rng, thermalZone, thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark')
  }
  if (planKind === 'ice-belt') return pickBeltClass(rng, thermalZone, thermalZone !== 'Hot')
  if (planKind === 'gas-giant') {
    return pickWorldClassByCategory(
      rng,
      thermalZone,
      ['gas-giant'],
      hotThermalZones.has(thermalZone)
        ? { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' }
        : forcedWorldClasses.gasGiant
    )
  }
  if (planKind === 'ice-giant') {
    return pickWorldClassByCategory(
      rng,
      thermalZone,
      ['ice-giant'],
      hotThermalZones.has(thermalZone)
        ? { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' }
        : forcedWorldClasses.iceGiant
    )
  }
  if (planKind === 'dwarf') {
    if (hotThermalZones.has(thermalZone)) {
      return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' })
    }
    return forcedWorldClasses.dwarf
  }
  if (planKind === 'rogue') {
    if (hotThermalZones.has(thermalZone)) {
      return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' })
    }
    return forcedWorldClasses.rogue
  }
  if (planKind === 'anomaly') return pickWorldClassByCategory(rng, thermalZone, ['anomaly'], { className: 'Dark-sector density anomaly', category: 'anomaly', massClass: 'Dark-sector anomaly' })
  return pickOne(rng, worldClassesByThermalZone[thermalZone])
}

function knownBodyClass(known: PartialKnownBody | undefined, generated: WorldClassOption): WorldClassOption {
  if (!known) return generated
  return {
    className: known.bodyClass?.locked ? known.bodyClass.value : generated.className,
    category: known.category?.locked ? known.category.value : generated.category,
    massClass: known.massClass?.locked ? known.massClass.value : generated.massClass,
  }
}

function hasLockedBodyClass(known: PartialKnownBody | undefined): boolean {
  return Boolean(known?.bodyClass?.locked || known?.category?.locked || known?.massClass?.locked)
}

function generatedBody(
  rng: SeededRng,
  primary: Star,
  architectureName: string,
  systemName: string,
  orbitAu: number,
  index: number,
  planKind: BodyPlanKind,
  previousFiltered: FilteredWorldClass | null,
  known?: PartialKnownBody,
  orbitSource = 'Architecture-aware generated orbital placement'
): { body: OrbitingBody; filtered: FilteredWorldClass } {
  const insolation = calculateInsolation(primary.luminositySolar.value, orbitAu)
  const thermalZone = classifyThermalZone(insolation)
  const baseBodyClass = knownBodyClass(known, selectWorldClassForPlanKind(rng, thermalZone, planKind))
  const basePhysical = mergeKnownPhysicalHints(buildPhysicalHints(rng, baseBodyClass, orbitAu, primary, architectureName), known?.physical, baseBodyClass.category)
  const filtered = hasLockedBodyClass(known)
    ? {
        bodyClass: baseBodyClass,
        physical: basePhysical,
        filterNotes: [fact('Known body class locked; exoplanet demographic filters did not overwrite imported facts.', 'confirmed', 'Known-system import lock')],
      }
    : withRecomputedGravity(applyModernExoplanetFilters(rng, baseBodyClass, basePhysical, thermalZone, architectureName, previousFiltered))
  const habitabilityNotes = mDwarfHabitabilityNotes(rng, primary, thermalZone, filtered.bodyClass.category)
  const siteCount = rng.chance(0.55) ? 1 : 0
  const bodyName = mergeLockedFact(
    fact(bodyDesignation(systemName, index, filtered.bodyClass.category), 'derived', 'Generated celestial designation from system name, body category, and orbital order'),
    known?.name
  )
  const mergedDetail = mergeKnownDetail(generateDetail(rng, filtered.bodyClass, filtered.physical, thermalZone, primary), known?.detail)
  const detail = hasLockedEnvironmentDetail(known?.detail) && !known?.detail?.biosphere?.locked
    ? {
        ...mergedDetail,
        biosphere: fact(
          generateBiosphere(rng.fork(`locked-detail-biosphere-${index + 1}`), filtered.bodyClass.category, thermalZone, mergedDetail, primary, filtered.bodyClass),
          'inferred',
          'MASS-GU biosphere score recomputed after locked environmental facts'
        ),
      }
    : mergedDetail
  const moons = generateMoons(rng, filtered.bodyClass, filtered.physical, index, thermalZone, primary, architectureName, bodyName.value)
  const rings = generateRingSystem(rng, filtered.bodyClass.category)
  const giantEconomy = generateGiantEconomy(filtered.bodyClass, moons, rings)
  const bodyProfile = generateBodyProfile(filtered.bodyClass, detail, moons, rings)
  const whyInteresting = generateBodyInterest(rng.fork(`body-interest-${index + 1}`), filtered.bodyClass, thermalZone, detail, moons, rings, [...filtered.filterNotes, ...habitabilityNotes], bodyProfile, giantEconomy)
  return {
    body: {
      id: known?.id ?? `body-${index + 1}`,
      orbitAu: mergeLockedFact(fact(orbitAu, 'derived', orbitSource), known?.orbitAu),
      name: bodyName,
      category: mergeLockedFact(fact(filtered.bodyClass.category, 'inferred', 'Thermal-zone body class table'), known?.category),
      massClass: mergeLockedFact(fact(filtered.bodyClass.massClass, 'inferred', 'Thermal-zone body class table'), known?.massClass),
      bodyClass: mergeLockedFact(fact(filtered.bodyClass.className, 'inferred', 'Thermal-zone, architecture, and exoplanet filters'), known?.bodyClass),
      bodyProfile,
      whyInteresting,
      thermalZone: fact(thermalZone, 'derived', `Insolation ${roundTo(insolation, 3)} S`),
      physical: filtered.physical,
      detail,
      moons,
      rings,
      giantEconomy,
      filterNotes: [...filtered.filterNotes, ...habitabilityNotes],
      traits: [fact(pickOne(rng, traitOptions), 'inferred', 'Generated world trait')],
      sites: Array.from({ length: siteCount }, () => fact(pickBodySite(rng, filtered.bodyClass.category), 'human-layer', 'Generated site by body category')),
    },
    filtered,
  }
}

function applyFinalDesignations(systemName: string, bodies: OrbitingBody[]): OrbitingBody[] {
  return bodies
    .sort((left, right) => left.orbitAu.value - right.orbitAu.value)
    .map((body, bodyIndex) => {
      const name = body.name.locked
        ? body.name
        : fact(bodyDesignation(systemName, bodyIndex, body.category.value), 'derived', 'Generated celestial designation from system name, body category, and final orbital order')
      const moons = body.moons.map((moon, moonIndex) => ({
        ...moon,
        name: fact(moonDesignation(name.value, moonIndex), 'derived', 'Generated moon designation from parent body designation and moon order'),
      }))

      return {
        ...body,
        name,
        moons,
      }
    })
}

function reservedKnownSlots(orbits: number[], knownBodies: PartialKnownBody[]): Map<number, PartialKnownBody> {
  const slots = new Map<number, PartialKnownBody>()
  const used = new Set<number>()

  for (const known of [...knownBodies].sort((left, right) => left.orbitAu.value - right.orbitAu.value)) {
    let bestIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY
    orbits.forEach((orbit, index) => {
      if (used.has(index)) return
      const distance = Math.abs(orbit - known.orbitAu.value)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    if (bestIndex >= 0) {
      used.add(bestIndex)
      slots.set(bestIndex, known)
    }
  }

  return slots
}

function expandSlotsForKnownBodies(slots: ArchitectureSlot[], knownBodies: PartialKnownBody[]): ArchitectureSlot[] {
  const expanded = [...slots]
  while (expanded.length < knownBodies.length) {
    expanded.push(createKnownImportSlot(expanded.length))
  }
  return expanded
}

function replacementOrbitAu(rng: SeededRng, primary: Star, bodies: OrbitingBody[], slot: ArchitectureSlot): number {
  const occupied = bodies
    .map((body) => ({
      orbitAu: body.orbitAu.value,
      massEarth: typeof body.physical.massEarth.value === 'number' && body.physical.massEarth.value > 0
        ? body.physical.massEarth.value
        : estimatedPlanMassEarth(slot.planKind, undefined, slot),
    }))
    .sort((left, right) => left.orbitAu - right.orbitAu)
  const band = slot.orbitBand ?? defaultOrbitBand(slot.planKind)
  return placeGeneratedOrbit(
    rng,
    primary.luminositySolar.value,
    primary.massSolar.value,
    band,
    sampleOrbitInBand(rng.fork('preferred-replacement-orbit'), primary.luminositySolar.value, band),
    estimatedPlanMassEarth(slot.planKind, undefined, slot),
    occupied
  )
}

function addArchitectureReplacementNote(body: OrbitingBody, slot: ArchitectureSlot): OrbitingBody {
  return {
    ...body,
    filterNotes: [
      ...body.filterNotes,
      fact(
        `Architecture replacement slot ${slot.id} added to satisfy ${slot.requirementId ?? 'profile requirement'}.`,
        'inferred',
        slot.source
      ),
    ],
  }
}

function addKnownOrbitBandNote(body: OrbitingBody, slot: ArchitectureSlot): OrbitingBody {
  return {
    ...body,
    filterNotes: [
      ...body.filterNotes,
      fact(
        `Known imported orbit ${body.orbitAu.value} AU sits outside the generated ${slot.orbitBand ?? defaultOrbitBand(slot.planKind)} architecture band; locked catalog orbit preserved.`,
        'confirmed',
        'Known-system import locked orbital placement'
      ),
    ],
  }
}

function generateBodies(rng: SeededRng, primary: Star, architectureName: string, systemName: string, knownBodies: PartialKnownBody[] = []): OrbitingBody[] {
  const slots = expandSlotsForKnownBodies(buildArchitectureSlots(rng.fork('body-plan'), architectureName), knownBodies)
  const orbitAssignments = generateOrbitAssignments(rng, primary.luminositySolar.value, primary.massSolar.value, slots, knownBodies)
  const bodies: OrbitingBody[] = []
  let previousFiltered: FilteredWorldClass | null = null

  for (let index = 0; index < orbitAssignments.length; index++) {
    const assignment = orbitAssignments[index]
    const generated = generatedBody(
      rng,
      primary,
      architectureName,
      systemName,
      assignment.known?.orbitAu.value ?? assignment.orbitAu,
      index,
      assignment.slot.planKind,
      previousFiltered,
      assignment.known,
      'Architecture-aware orbital placement using HZ and snow-line bands'
    )
    bodies.push(assignment.outOfBandKnown ? addKnownOrbitBandNote(generated.body, assignment.slot) : generated.body)
    previousFiltered = generated.filtered
  }

  const replacementSlots = replacementSlotsForUnsatisfiedRequirements(evaluateArchitectureSatisfaction(architectureName, bodies))
  for (const slot of replacementSlots) {
    const replacementIndex = bodies.length
    const generated = generatedBody(
      rng.fork(`slot-${slot.id}:replacement`),
      primary,
      architectureName,
      systemName,
      replacementOrbitAu(rng.fork(`slot-${slot.id}:orbit`), primary, bodies, slot),
      replacementIndex,
      slot.planKind,
      previousFiltered,
      undefined,
      'Architecture replacement orbital placement using HZ and snow-line bands'
    )
    bodies.push(addArchitectureReplacementNote(generated.body, slot))
    previousFiltered = generated.filtered
  }

  return applyFinalDesignations(systemName, bodies)
}

function intensityFromRoll(roll: number): string {
  return guIntensityTable.find((entry) => roll <= entry.max)?.value ?? guIntensityTable[guIntensityTable.length - 1].value
}

function generateGuOverlay(rng: SeededRng, preference: GuPreference, primary: Star, companions: StellarCompanion[], bodies: OrbitingBody[], architectureName: string) {
  let intensityRoll = twoD6(rng)
  const intensityModifiers: Array<Fact<string>> = []

  if (preference === 'low') {
    intensityRoll -= 2
    intensityModifiers.push(fact('-2 low GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (preference === 'high') {
    intensityRoll += 2
    intensityModifiers.push(fact('+2 high GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (preference === 'fracture') {
    intensityRoll += 4
    intensityModifiers.push(fact('+4 fracture GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (companions.length > 0) {
    intensityRoll += 2
    intensityModifiers.push(fact('+2 multi-star', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'M dwarf' && isHighActivity(primary.activity.value)) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 M dwarf with high activity', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (architectureName === 'Compact inner system' || architectureName === 'Peas-in-a-pod chain') {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 close-in resonant planetary chain', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (bodies.some((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant')) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 strong giant magnetosphere', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'White dwarf/remnant' && bodies.some((body) => body.category.value === 'belt')) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 white dwarf debris system', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'G star' || primary.spectralType.value === 'K star') {
    if (primary.activity.value === 'Quiet' && companions.length === 0) {
      intensityRoll -= 1
      intensityModifiers.push(fact('-1 quiet single G/K system', 'gu-layer', 'MASS-GU GU intensity modifiers'))
    }
  }

  const locationRoll = d20(rng)
  const behaviorRoll = d12(rng)
  const resourceRoll = d20(rng)
  const hazardRoll = d20(rng)
  const hazard = guHazardTable[hazardRoll - 1]
  const resource = guResourceTable[resourceRoll - 1]

  return {
    intensity: fact(intensityFromRoll(intensityRoll), 'gu-layer', 'MASS-GU modified 2d6 GU intensity table'),
    bleedLocation: fact(bleedLocationTable[locationRoll - 1], 'gu-layer', `MASS-GU d20 bleed-zone location roll ${locationRoll}`),
    bleedBehavior: fact(bleedBehaviorTable[behaviorRoll - 1], 'gu-layer', `MASS-GU d12 bleed behavior roll ${behaviorRoll}`),
    resource: fact(resource, 'gu-layer', `MASS-GU d20 resource roll ${resourceRoll}`),
    hazard: fact(hazard === 'Systemic cascade' ? `Systemic cascade: ${pickOne(rng, guHazardTable.slice(0, 19))}; ${pickOne(rng, guHazardTable.slice(0, 19))}` : hazard, 'gu-layer', `MASS-GU d20 hazard roll ${hazardRoll}`),
    intensityRoll: fact(intensityRoll, 'derived', 'Modified 2d6 GU intensity roll'),
    intensityModifiers,
  }
}
export type GuOverlay = ReturnType<typeof generateGuOverlay>

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, value))
}

function assertNever(value: never): never {
  throw new Error(`Unhandled settlement category: ${value}`)
}

function chooseSettlementTags(rng: SeededRng, population: SettlementPopulation): [string, string] {
  const band = populationBandFor(population)
  const weighted: string[] = []
  for (const tag of settlementTagOptions) {
    const civicScale = tag.civicScale ?? 'neutral'
    let weight = 1
    if (band === 'urban') {
      if (civicScale === 'civic') weight = 3
      if (civicScale === 'remote') weight = 0
    } else if (band === 'outpost') {
      if (civicScale === 'remote') weight = 3
      if (civicScale === 'civic') weight = 0
    }
    for (let i = 0; i < weight; i++) weighted.push(tag.label)
  }
  if (weighted.length === 0) {
    settlementTagOptions.forEach((tag) => weighted.push(tag.label))
  }
  const obvious = pickOne(rng, weighted)
  const remaining = weighted.filter((label) => label !== obvious)
  const deeper = pickOne(rng, remaining.length > 0 ? remaining : weighted)
  return [obvious, deeper]
}

function settlementPresenceTier(score: number): string {
  if (score <= 2) return 'Empty except probes'
  if (score <= 4) return 'Beacon, cache, survey buoy'
  if (score === 5) return 'Automated monitor or claim marker'
  if (score === 6) return 'Temporary camp or rotating crew'
  if (score === 7) return 'Automated mine/refinery/research rig'
  if (score === 8) return 'Small permanent outpost'
  if (score === 9) return 'Settlement, dome, tunnel-town, or station'
  if (score === 10) return 'Major base or industrial site'
  if (score === 11) return 'Town, freeport, or military complex'
  if (score === 12) return 'Large colony, hub, or shipyard'
  if (score <= 14) return 'Regional power center'
  return 'Major campaign location'
}

function scoreSettlementPresence(rng: SeededRng, body: OrbitingBody, guOverlay: GuOverlay, reachability: Reachability) {
  const roll = twoD6(rng)
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
  const score = roll + resource + access + strategic + guValue + routeValue + habitability - hazard - legalHeat
  const tier = settlementPresenceTier(score)

  return { score, roll, tier, resource, access, strategic, guValue, habitability, hazard, legalHeat }
}
export type SettlementPresenceScore = ReturnType<typeof scoreSettlementPresence>

interface ScoredSettlementBody {
  body: OrbitingBody
  presence: SettlementPresenceScore
}

function weightedSettlementBaseCount(rng: SeededRng, density: GenerationOptions['settlements']): number {
  const roll = rng.int(1, 100)
  if (density === 'sparse') {
    if (roll <= 35) return 0
    if (roll <= 85) return 1
    return 2
  }
  if (density === 'crowded') {
    if (roll <= 15) return 3
    if (roll <= 45) return 4
    if (roll <= 80) return 5
    return 6
  }
  if (density === 'hub') {
    if (roll <= 10) return 4
    if (roll <= 30) return 5
    if (roll <= 60) return 6
    if (roll <= 85) return 7
    return 8
  }

  if (roll <= 25) return 1
  if (roll <= 75) return 2
  if (roll <= 97) return 3
  return 4
}

function settlementCountBounds(density: GenerationOptions['settlements']): [number, number] {
  if (density === 'sparse') return [0, 2]
  if (density === 'crowded') return [3, 6]
  if (density === 'hub') return [4, 8]
  return [1, 4]
}

function targetSettlementCount(
  rng: SeededRng,
  options: GenerationOptions,
  scored: ScoredSettlementBody[],
  guOverlay: GuOverlay,
  reachability: Reachability,
  architectureName: string
): number {
  const [min, max] = settlementCountBounds(options.settlements)
  let count = weightedSettlementBaseCount(rng, options.settlements)
  const topScores = scored.slice(0, Math.max(1, Math.min(3, scored.length))).map((entry) => entry.presence.score)
  const averageTopScore = topScores.length
    ? topScores.reduce((sum, score) => sum + score, 0) / topScores.length
    : 0
  const topScore = topScores[0] ?? 0

  if (options.settlements === 'sparse') {
    if (topScore < 8) count = 0
    if ((reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub')) && averageTopScore >= 12) count += 1
    return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
  }

  if (options.settlements === 'normal') {
    if (reachability.className.value.includes('Dead-end') || reachability.className.value.includes('Marginal')) count -= 1
    if ((guOverlay.intensity.value.includes('Rich') || guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) && averageTopScore >= 14) count += 1
    if (topScore < 9) count -= 1
    if (scored.slice(0, 3).every((entry) => entry.presence.hazard >= 4)) count -= 1
    return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
  }

  if ((reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub')) && averageTopScore >= 13) count += 1
  if (reachability.className.value.includes('Dead-end') || reachability.className.value.includes('Marginal')) count -= 1
  if (guOverlay.intensity.value.includes('Rich') || guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) count += 1
  if (architectureName === 'Giant-rich or chaotic') count += 1
  if (averageTopScore >= 14) count += 1
  if (topScore < 9) count -= 1
  if (scored.slice(0, 3).every((entry) => entry.presence.hazard >= 4)) count -= 1

  return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
}

function settlementPopulationFromRoll(rng: SeededRng, presence: SettlementPresenceScore): SettlementPopulation {
  let roll = d10(rng)
  if (presence.score <= 6) roll -= 2
  if (presence.score === 7 || presence.score === 8) roll -= 1
  if (presence.score >= 12) roll += 1
  if (presence.score >= 15) roll += 2
  roll = Math.max(1, Math.min(10, roll))
  return settlementPopulationTable[roll - 1]
}

const HABITATION_LOW_EXOTICS: Record<SettlementSiteCategory, readonly SettlementHabitationPattern[]> = {
  'Surface settlement': ['Underground city', 'Sealed arcology'],
  'Orbital station': ['Modular island station'],
  'Asteroid or belt base': ['Hollow asteroid'],
  'Moon base': ['Underground city', 'Sealed arcology'],
  'Deep-space platform': ['Drift colony', 'Modular island station'],
  'Gate or route node': ['Modular island station'],
  'Mobile site': [],
  'Derelict or restricted site': [],
}

const HABITATION_HIGH_EXOTICS_BASE: Record<SettlementSiteCategory, readonly SettlementHabitationPattern[]> = {
  'Surface settlement': ['Tethered tower', 'Hub complex'],
  'Orbital station': ['Ring station', "O'Neill cylinder", 'Tethered tower', 'Hub complex'],
  'Asteroid or belt base': ['Belt cluster', 'Modular island station', 'Hub complex'],
  'Moon base': ['Hub complex'],
  'Deep-space platform': ['Ring station', "O'Neill cylinder", 'Generation ship', 'Hub complex'],
  'Gate or route node': ['Hub complex'],
  'Mobile site': [],
  'Derelict or restricted site': [],
}

function bodyHasAtmosphere(body: OrbitingBody): boolean {
  const atm = body.detail.atmosphere.value
  return atm !== 'None / hard vacuum' && atm !== 'Trace exosphere'
}

function highExoticsFor(siteCategory: SettlementSiteCategory, body: OrbitingBody): readonly SettlementHabitationPattern[] {
  const base = HABITATION_HIGH_EXOTICS_BASE[siteCategory]
  if (siteCategory === 'Surface settlement' && bodyHasAtmosphere(body)) {
    return [...base, 'Sky platform']
  }
  return base
}

function settlementHabitationPatternFromRoll(
  rng: SeededRng,
  presence: SettlementPresenceScore,
  siteCategory: SettlementSiteCategory,
  body: OrbitingBody,
  tone: GeneratorTone,
): SettlementHabitationPattern {
  const defaultPattern = habitationPatternDefaults[siteCategory]

  if (defaultPattern === 'Distributed swarm') {
    const generationShipRate = tone === 'cinematic' ? 0.18 : tone === 'astronomy' ? 0.04 : 0.1
    const driftColonyRate = tone === 'cinematic' ? 0.18 : tone === 'astronomy' ? 0.04 : 0.1
    if (rng.chance(generationShipRate)) return 'Generation ship'
    if (rng.chance(driftColonyRate)) return 'Drift colony'
    return defaultPattern
  }
  if (defaultPattern === 'Abandoned') return defaultPattern

  let roll = d20(rng)
  if (presence.score <= 6) roll -= 4
  if (presence.score === 7 || presence.score === 8) roll -= 2
  if (presence.score >= 12) roll += 2
  if (presence.score >= 15) roll += 4

  if (tone === 'cinematic' && rng.chance(0.25)) roll -= 2
  if (tone === 'astronomy') roll = Math.max(5, Math.min(18, roll))

  if (roll <= 1) return 'Abandoned'
  if (roll === 2) return 'Automated'

  if (roll === 3) {
    const pool = HABITATION_LOW_EXOTICS[siteCategory]
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll === 18 || roll === 19) {
    const pool = highExoticsFor(siteCategory, body)
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll >= 20) return 'Distributed swarm'

  return defaultPattern
}

function clampPopulationToFloor(population: SettlementPopulation, floorIndex: number): SettlementPopulation {
  const idx = POPULATION_BAND_INDEX[population]
  if (idx < 0) return settlementPopulationTable[floorIndex]
  if (idx >= floorIndex) return population
  return settlementPopulationTable[floorIndex]
}

function clampPopulationToBand(
  population: SettlementPopulation,
  floorIndex: number,
  ceilingIndex: number,
  rng: SeededRng,
): SettlementPopulation {
  const idx = POPULATION_BAND_INDEX[population]
  if (idx < 0) {
    return settlementPopulationTable[rng.int(floorIndex, ceilingIndex)]
  }
  if (idx < floorIndex) return settlementPopulationTable[floorIndex]
  if (idx > ceilingIndex) return settlementPopulationTable[ceilingIndex]
  return population
}

function applyHabitationPopulationConstraint(
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
  rng: SeededRng,
): SettlementPopulation {
  if (habitationPattern === 'Abandoned') return 'Unknown'
  if (habitationPattern === 'Automated') return 'Minimal (<5)'
  if (habitationPattern === 'Generation ship') {
    return clampPopulationToBand(population, GENERATION_SHIP_POPULATION_BAND.floor, GENERATION_SHIP_POPULATION_BAND.ceiling, rng)
  }
  const floor = HABITATION_POPULATION_FLOORS[habitationPattern]
  if (floor !== undefined) return clampPopulationToFloor(population, floor)
  return population
}

function chooseSettlementAuthority(rng: SeededRng, habitationPattern: SettlementHabitationPattern): string {
  if (settlementAuthorityByHabitationPattern[habitationPattern]) {
    return pickOne(rng, settlementAuthorityByHabitationPattern[habitationPattern])
  }
  return pickOne(rng, settlementAuthorities)
}

function chooseSettlementCondition(rng: SeededRng, habitationPattern: SettlementHabitationPattern): string {
  if (settlementConditionByHabitationPattern[habitationPattern]) {
    return pickOne(rng, settlementConditionByHabitationPattern[habitationPattern])
  }
  return pickOne(rng, settlementConditions)
}

function chooseSettlementCrisis(
  rng: SeededRng,
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
): string {
  if (settlementCrisisByHabitationPattern[habitationPattern]) {
    return pickOne(rng, settlementCrisisByHabitationPattern[habitationPattern])
  }
  const band = populationBandFor(population)
  if (band && settlementCrisisByPopulationBand[band] && rng.chance(0.4)) {
    return pickOne(rng, settlementCrisisByPopulationBand[band])
  }
  return pickOne(rng, settlementCrises)
}

function chooseHiddenTruth(rng: SeededRng, habitationPattern: SettlementHabitationPattern): string {
  if (hiddenTruthByHabitationPattern[habitationPattern]) {
    return pickOne(rng, hiddenTruthByHabitationPattern[habitationPattern])
  }
  return pickOne(rng, hiddenTruths)
}

function chooseEncounterSites(
  rng: SeededRng,
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
  settlementFunction: string,
): string[] {
  const value = settlementFunction.toLowerCase()
  const candidates = new Set<string>()

  encounterSitesByHabitationPattern[habitationPattern]?.forEach((site) => candidates.add(site))
  const band = populationBandFor(population)
  if (band) encounterSitesByPopulationBand[band]?.forEach((site) => candidates.add(site))
  encounterSitesByFunctionKeyword.forEach((pool) => {
    if (pool.keywords.some((keyword) => value.includes(keyword))) {
      pool.sites.forEach((site) => candidates.add(site))
    }
  })
  if (candidates.size < 2) encounterSites.forEach((site) => candidates.add(site))

  const pool = [...candidates]
  const first = pickOne(rng, pool)
  const secondPool = pool.filter((site) => site !== first)
  return [first, pickOne(rng, secondPool.length ? secondPool : pool)]
}

function chooseSettlementLocation(rng: SeededRng, body: OrbitingBody, reachability: Reachability): SettlementLocationOption {
  const orbitalOptions = settlementLocations.orbital
  const routeOptions = settlementLocations.route
  const asteroidOptions = settlementLocations.asteroid
  const surfaceOptions = settlementLocations.surface
  const moonOptions = settlementLocations.moon
  const mobileOptions = settlementLocations.mobile
  const restrictedOptions = settlementLocations.restricted

  if (reachability.className.value.includes('Iggygate') && rng.chance(0.6)) return pickOne(rng, routeOptions)
  if (body.category.value === 'belt') return pickOne(rng, [...asteroidOptions, ...orbitalOptions])
  if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') {
    return pickOne(rng, [
      ...settlementLocations.gasGiantSpecial,
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
  guOverlay: GuOverlay
): string {
  if (guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) {
    return pickOne(rng, guFractureFunctionsBySiteCategory[locationOption.category])
  }
  if (body.detail.biosphere.value !== 'Sterile') return pickOne(rng, biosphereFunctions)

  switch (locationOption.category) {
    case 'Surface settlement':
      if (locationOption.label.includes('ice') || locationOption.label.includes('under-ice')) return pickOne(rng, surfaceIceFunctions)
      if (locationOption.label.includes('Lava') || locationOption.label.includes('Polar')) return pickOne(rng, [...extractionFunctions, ...surveyFunctions])
      return pickOne(rng, [...civilFunctions, ...surveyFunctions, ...extractionFunctions])
    case 'Orbital station':
      if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') return pickOne(rng, giantOrbitalFunctions)
      return pickOne(rng, [...orbitalFunctions, ...surveyFunctions, ...securityFunctions])
    case 'Asteroid or belt base':
      return pickOne(rng, asteroidBaseFunctions)
    case 'Moon base':
      return pickOne(rng, moonBaseFunctions)
    case 'Deep-space platform':
      return pickOne(rng, deepSpaceFunctions)
    case 'Gate or route node':
      return pickOne(rng, [...routeFunctions, ...securityFunctions])
    case 'Mobile site':
      return pickOne(rng, mobileFunctions)
    case 'Derelict or restricted site':
      return pickOne(rng, restrictedFunctions)
    default:
      return assertNever(locationOption.category)
  }
}

function chooseBuiltForm(rng: SeededRng, locationOption: SettlementLocationOption, settlementFunction: string): string {
  const exactBuiltForm = builtForms.exactLocation[locationOption.label]
  if (exactBuiltForm) return exactBuiltForm
  const locationPool = builtForms.mobileLocationPools[locationOption.label]
  if (locationPool) return pickOne(rng, locationPool)
  if (settlementFunction.includes('mine') || settlementFunction.includes('extraction')) {
    return pickOne(rng, builtForms.miningBySiteCategory[locationOption.category] ?? builtForms.miningBySiteCategory.default)
  }

  switch (locationOption.category) {
    case 'Orbital station':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Asteroid or belt base':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Surface settlement':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Moon base':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Gate or route node':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Mobile site':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Deep-space platform':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
    case 'Derelict or restricted site':
      return pickOne(rng, builtForms.bySiteCategory[locationOption.category])
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
    const moon = chooseMoonForLocation(rng, body.moons, locationOption.label)
    if (moon) {
      return {
        kind: 'major moon',
        name: moon.name.value,
        detail: `${locationOption.label} on ${moon.name.value}, a ${moon.scale.value} ${moon.moonType.value.toLowerCase()} orbiting ${bodyName}. ${moon.use.value}.`,
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

function chooseMoonForLocation(rng: SeededRng, moons: Moon[], locationLabel: string): Moon | undefined {
  if (moons.length === 0) return undefined

  const preferred = moons.filter((moon) => {
    const moonType = moon.moonType.value
    if (locationLabel === 'Subsurface ocean bore station') return moonType.includes('ocean') || moonType.includes('ice-shell') || moonType.includes('Cryovolcanic')
    if (locationLabel === 'Tidal-volcanic power site') return moonType.includes('Volcanic') || moonType.includes('tidal')
    if (locationLabel === 'Magnetic-pole observatory' || locationLabel === 'Radiation-belt fortress') return moonType.includes('Radiation') || moonType.includes('Ring-shepherd') || moonType.includes('Dark-sector')
    if (locationLabel === 'Moon crater base') return moonType.includes('Airless') || moonType.includes('Cratered') || moonType.includes('Captured') || moonType.includes('Former settlement') || moonType.includes('Active mining')
    return true
  })

  return pickOne(rng, preferred.length ? preferred : moons)
}

function descriptorFromRules(value: string, descriptorSet: RuleBackedDescriptorSet): string {
  const normalizedValue = value.toLowerCase()
  return descriptorSet.rules.find((rule) =>
    rule.keywords.some((keyword) => normalizedValue.includes(keyword.toLowerCase()))
  )?.descriptor ?? descriptorSet.default
}

function settlementDescriptorForFunction(settlementFunction: string): string {
  return descriptorFromRules(settlementFunction, settlementNameDescriptors.function)
}

function settlementDescriptorForCategory(siteCategory: string): string {
  return settlementNameDescriptors.category[siteCategory] ?? settlementNameDescriptors.category.default
}

function settlementDescriptorForAuthority(authority: string): string {
  return descriptorFromRules(authority, settlementNameDescriptors.authority)
}

function settlementDescriptorForHabitationPattern(habitationPattern: SettlementHabitationPattern): string {
  return (
    settlementNameDescriptors.scale.exact[habitationPattern] ??
    descriptorFromRules(habitationPattern, settlementNameDescriptors.scale)
  )
}

function settlementDescriptorForPopulation(population: SettlementPopulation): string {
  return (
    settlementNameDescriptors.population.exact[population] ??
    settlementNameDescriptors.population.default
  )
}

function generateSettlementName(
  rng: SeededRng,
  body: OrbitingBody,
  anchor: SettlementAnchor,
  siteCategory: string,
  settlementFunction: string,
  authority: string,
  population: SettlementPopulation,
  habitationPattern: SettlementHabitationPattern
): string {
  const anchorStem = anchor.name.split(',')[0].replace(/\s+(orbital space|route geometry|traffic pattern|transit geometry)$/i, '')
  const functionDescriptor = settlementDescriptorForFunction(settlementFunction)
  const categoryDescriptor = settlementDescriptorForCategory(siteCategory)
  const authorityDescriptor = settlementDescriptorForAuthority(authority)
  const habitationDescriptor = settlementDescriptorForHabitationPattern(habitationPattern)
  const populationDescriptor = settlementDescriptorForPopulation(population)

  const pattern = rng.int(1, 5)
  if (pattern === 1) return `${anchorStem} ${functionDescriptor}`
  if (pattern === 2) return `${anchorStem} ${categoryDescriptor}`
  if (pattern === 3) return `${body.name.value} ${authorityDescriptor}`
  if (pattern === 4) {
    const useHabitation = rng.chance(0.5)
    return `${anchorStem} ${useHabitation ? habitationDescriptor : populationDescriptor}`
  }
  return `${body.name.value} ${functionDescriptor} ${rng.int(2, 99).toString().padStart(2, '0')}`
}

function generateSettlements(
  rng: SeededRng,
  options: GenerationOptions,
  systemName: string,
  bodies: OrbitingBody[],
  guOverlay: GuOverlay,
  reachability: Reachability,
  architectureName: string
): Settlement[] {
  const scored = bodies
    .map((body, bodyIndex) => ({ body, presence: scoreSettlementPresence(rng.fork(`presence-${bodyIndex + 1}`), body, guOverlay, reachability) }))
    .sort((a, b) => b.presence.score - a.presence.score)
  const targetCount = targetSettlementCount(rng, options, scored, guOverlay, reachability, architectureName)
  const selected = scored.slice(0, targetCount)
  const nameRegistry = new NameRegistry()

  return selected.map(({ body, presence }, index) => {
    const locationOption = chooseSettlementLocation(rng, body, reachability)
    const settlementFunction = chooseSettlementFunction(rng, body, locationOption, guOverlay)
    const builtForm = chooseBuiltForm(rng, locationOption, settlementFunction)
    const anchor = chooseSettlementAnchor(rng, systemName, body, locationOption)
    const rolledPopulation = settlementPopulationFromRoll(rng, presence)
    const habitationPattern = settlementHabitationPatternFromRoll(
      rng.fork(`habitation-pattern-${index + 1}`),
      presence,
      locationOption.category,
      body,
      options.tone,
    )
    const population = applyHabitationPopulationConstraint(
      habitationPattern,
      rolledPopulation,
      rng.fork(`population-clamp-${index + 1}`),
    )
    const tags = chooseSettlementTags(rng, population)
    const authority = chooseSettlementAuthority(rng, habitationPattern)
    const condition = chooseSettlementCondition(rng, habitationPattern)
    const crisis = chooseSettlementCrisis(rng, habitationPattern, population)
    const hiddenTruth = chooseHiddenTruth(rng, habitationPattern)
    const encounterSiteValues = chooseEncounterSites(rng.fork(`encounter-sites-${index + 1}`), habitationPattern, population, settlementFunction)
    const tagHook = settlementHookSynthesis(rng.fork(`tag-hook-${index + 1}`), tags[0], tags[1], {
      habitationPattern,
      siteCategory: locationOption.category,
      settlementFunction,
      condition,
      crisis,
      hiddenTruth,
      encounterSites: encounterSiteValues,
      guIntensity: guOverlay.intensity.value,
    })
    const baseSettlementName = generateSettlementName(
      rng.fork(`settlement-name-${index + 1}`),
      body,
      anchor,
      locationOption.category,
      settlementFunction,
      authority,
      population,
      habitationPattern,
    )
    const settlementId = `settlement-${index + 1}`
    const settlementName = nameRegistry.uniqueGeneratedName(baseSettlementName, {
      bodyName: body.name.value,
      anchorName: anchor.name,
      anchorKind: anchor.kind,
      location: locationOption.label,
      siteCategory: locationOption.category,
      authority,
      functionName: settlementFunction,
      settlementId,
      ordinal: index + 1,
    })
    return {
      id: settlementId,
      bodyId: body.id,
      moonId: anchor.moonId,
      name: fact(
        settlementName,
        'human-layer',
        settlementName === baseSettlementName
          ? 'Generated settlement name from anchor, function, authority, and habitation pattern'
          : 'Generated settlement name from anchor, function, authority, and habitation pattern; duplicate repaired by deterministic name registry'
      ),
      anchorKind: fact(anchor.kind, 'human-layer', 'Generated site-to-body relationship'),
      anchorName: fact(anchor.name, 'human-layer', 'Generated site-to-body relationship'),
      anchorDetail: fact(anchor.detail, 'human-layer', 'Generated site-to-body relationship'),
      siteCategory: fact(locationOption.category, 'human-layer', 'MASS-GU section 18 constrained site category'),
      location: fact(locationOption.label, 'human-layer', 'MASS-GU 18.3 site location table with body constraints'),
      function: fact(settlementFunction, 'human-layer', 'MASS-GU settlement function table with body constraints'),
      population: fact(population, 'human-layer', 'Population magnitude (d10 with presence modifier); habitation override applied'),
      habitationPattern: fact(habitationPattern, 'human-layer', 'Habitation pattern (siteCategory default with d12 special-pattern roll)'),
      authority: fact(authority, 'human-layer', 'MASS-GU 18.5 authority table'),
      builtForm: fact(builtForm, 'human-layer', 'MASS-GU built form table with location/function constraints'),
      aiSituation: fact(pickOne(rng, aiSituations), 'human-layer', 'MASS-GU AI situation table'),
      condition: fact(condition, 'human-layer', 'MASS-GU settlement condition table with scale compatibility'),
      tags: tags.map((tag, tagIndex) => fact(tag, 'human-layer', tagIndex === 0 ? 'MASS-GU 18.9 obvious settlement tag' : 'MASS-GU 18.9 deeper settlement tag')),
      tagHook: fact(tagHook, 'human-layer', 'Generated contextual interpretation of MASS-GU 18.9 tag pair, crisis, hidden truth, and site pressure'),
      crisis: fact(crisis, 'human-layer', 'MASS-GU 18.10 crisis table with scale compatibility'),
      hiddenTruth: fact(hiddenTruth, 'human-layer', 'MASS-GU 18.11 hidden truth table with scale compatibility; no-alien conversion applied where needed'),
      encounterSites: encounterSiteValues.map((site) => fact(site, 'human-layer', 'MASS-GU 18.12 local encounter site table with function/scale weighting')),
      whyHere: fact('', 'human-layer', 'Populated by graph-aware reshape'),
      methodNotes: [
        fact('Source-derived from MASS-GU section 18; current implementation adds compatibility constraints between body, site category, function, built form, and physical anchor.', 'human-layer', 'Implementation note'),
      ],
      presence: {
        score: fact(presence.score, 'human-layer', 'MASS-GU settlement presence score'),
        roll: fact(presence.roll, 'human-layer', 'MASS-GU 18.1 settlement presence 2d6 roll'),
        tier: fact(presence.tier, 'human-layer', 'MASS-GU 18.1 settlement presence result'),
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

function settlementToGate(settlement: Settlement, ordinal: number): Gate {
  return {
    id: `gate-${ordinal}`,
    name: settlement.name,
    bodyId: settlement.bodyId,
    moonId: settlement.moonId,
    anchorKind: settlement.anchorKind,
    anchorName: settlement.anchorName,
    anchorDetail: settlement.anchorDetail,
    location: settlement.location,
    builtForm: settlement.builtForm,
    routeNote: settlement.function,
    authority: settlement.authority,
    condition: settlement.condition,
    tagHook: settlement.tagHook,
    whyHere: settlement.whyHere,
  }
}

function partitionGates(allSettlements: Settlement[]): { settlements: Settlement[]; gates: Gate[] } {
  const settlements: Settlement[] = []
  const gates: Gate[] = []
  for (const s of allSettlements) {
    if (s.siteCategory.value === 'Gate or route node') {
      gates.push(settlementToGate(s, gates.length + 1))
    } else {
      settlements.push(s)
    }
  }
  return { settlements, gates }
}

function generateHumanRemnants(rng: SeededRng, bodies: OrbitingBody[], guOverlay: GuOverlay): HumanRemnant[] {
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

function generatePhenomena(rng: SeededRng, architectureName: string, guOverlay: GuOverlay): SystemPhenomenon[] {
  const count = guOverlay.intensity.value.includes('Rich') || architectureName.includes('Major') ? 3 : 2
  const used = new Set<string>()
  return Array.from({ length: count }, (_, index) => {
    const remaining = phenomena.filter(p => !used.has(p.label))
    const pool = remaining.length > 0 ? remaining : phenomena
    const phenomenon = pickOne(rng, pool)
    used.add(phenomenon.label)
    const travelEffect = pickPhenomenonField(rng, phenomenon.travelEffect, phenomenon.variants?.travelEffect)
    const surveyQuestion = pickPhenomenonField(rng, phenomenon.surveyQuestion, phenomenon.variants?.surveyQuestion)
    const conflictHook = pickPhenomenonField(rng, phenomenon.conflictHook, phenomenon.variants?.conflictHook)
    const sceneAnchor = pickPhenomenonField(rng, phenomenon.sceneAnchor, phenomenon.variants?.sceneAnchor)
    const resolved = { ...phenomenon, travelEffect, surveyQuestion, conflictHook, sceneAnchor }
    const note = phenomenonNote(resolved)
    return {
      id: `phenomenon-${index + 1}`,
      phenomenon: fact(phenomenon.label, phenomenon.confidence, 'MASS-GU expanded phenomena table'),
      note: fact(note, phenomenon.confidence, 'Generated structured phenomenon consequences'),
      travelEffect: fact(travelEffect, phenomenon.confidence, 'Generated phenomenon travel consequence'),
      surveyQuestion: fact(surveyQuestion, phenomenon.confidence, 'Generated phenomenon survey question'),
      conflictHook: fact(conflictHook, phenomenon.confidence, 'Generated phenomenon conflict hook'),
      sceneAnchor: fact(sceneAnchor, phenomenon.confidence, 'Generated phenomenon scene anchor'),
    }
  })
}

function pickPhenomenonField(rng: SeededRng, base: string, variants?: readonly string[]): string {
  if (!variants || variants.length === 0) return base
  const pool: readonly string[] = [base, ...variants]
  return pickOne(rng, pool)
}

interface NarrativeGenerationContext {
  options: GenerationOptions
  systemName: Fact<string>
  primary: Star
  companions: StellarCompanion[]
  reachability: Reachability
  architectureName: string
  bodies: OrbitingBody[]
  guOverlay: GuOverlay
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
  factionRng: SeededRng
}

function narrativeDomainsForText(value: string): string[] {
  const text = value.toLowerCase()
  const domains: string[] = []

  if (/(navy|militia|military|mercenary|weapon|war|defense|basing|blockade|casualty)/.test(text)) domains.push('war')
  if (/(trade|customs|freeport|shipyard|depot|resource|ore|mine|extraction|concession|debt|bank|fuel|tax|shipment|salvage)/.test(text)) domains.push('trade')
  if (/(intelligence|erased|deleted|falsified|censored|secret|black site|hidden|sealed|sabotage|forged|impostor)/.test(text)) domains.push('espionage', 'information-integrity')
  if (/(survey|research|science|biosafety|medical|microbial|biosphere|ecology|terrafor|lab|academic)/.test(text)) domains.push('science')
  if (/(biosphere|microbial|ecology|contamination|quarantine|chiral|terraform)/.test(text)) domains.push('ecology')
  if (/(medical|medicine|clinic|triage|exposure|neurological|vestibular|treatment|quarantine ward|chirality stock)/.test(text)) domains.push('medicine')
  if (/(terraform|climate|mirror|volatile import|garden dome|failed garden|greenhouse|biosphere project)/.test(text)) domains.push('terraforming')
  if (/(worker|labor|strike|draft|ration|life-support|forced|crew)/.test(text)) domains.push('labor')
  if (/(life-support|repair|shipyard|power|radiator|maintenance|spare|parts|heat rejection|shield)/.test(text)) domains.push('infrastructure')
  if (/(election|authority|council|democracy|magistrate|govern|succession|autonomy|charter)/.test(text)) domains.push('governance')
  if (/(law|legal|court|claim|title|liability|jurisdiction|evidence|docket|compliance)/.test(text)) domains.push('law', 'information-integrity')
  if (/(religious|cult|commune|gardener|sol)/.test(text)) domains.push('religion')
  if (/(gardener|sol-interdiction|interdiction|exclusion picket|compliance office|sealed sol)/.test(text)) domains.push('gardener-interdiction')
  if (/(pirate|criminal|smuggler|cartel|racket|black market)/.test(text)) domains.push('crime')
  if (/(refugee|exile|resettlement|evacuation|ark)/.test(text)) domains.push('migration')
  if (/(first-wave|ruin|remnant|inheritance|archive|salvage title|old)/.test(text)) domains.push('archaeology')
  if (/(ai|narrow-ai|automation|simulation|root credentials|memory)/.test(text)) domains.push('ai')
  if (/(disaster|accident|breach|cascade|storm|failure|hazard|radiation|misjump)/.test(text)) domains.push('disaster')
  if (/(flare|coronal|eclipse|stellar|radiation storm|white-dwarf|brown dwarf|periastron)/.test(text)) domains.push('stellar-events')
  if (/(ration|festival|public|school|market|funeral|civilian|colony)/.test(text)) domains.push('public-life', 'daily-life')
  if (/(route|iggygate|pinch|gate|transit|corridor|anchor|reachability|survey|scout|chart|beacon)/.test(text)) domains.push('exploration', 'trade')
  if (/(route weather|safe window|bleed-window|metric weather|pinch forecast|stormbound|schedule failure|calibration scar|moving node)/.test(text)) domains.push('route-weather')

  return uniqueStrings(domains.length ? domains : ['public-life'])
}

function narrativeFact(input: {
  id: string
  kind: string
  subjectType: NarrativeFact['subjectType']
  subjectId?: string
  value: string
  confidence: Fact<string>['confidence']
  source: string
  sourcePath: string
  tags?: string[]
  status?: NarrativeFact['status']
  domains?: string[]
}): NarrativeFact {
  const tags = uniqueStrings([...(input.tags ?? []), input.kind, input.subjectType])
  const domains = uniqueStrings(input.domains ?? narrativeDomainsForText(`${input.kind} ${input.value} ${tags.join(' ')}`))

  return {
    id: input.id,
    kind: input.kind,
    domains,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    value: fact(input.value, input.confidence, input.source),
    tags,
    status: input.status ?? 'established',
    sourcePath: input.sourcePath,
  }
}

function radiationCreatesNarrativeHazard(value: string): boolean {
  return !/^(benign|manageable)$/i.test(value.trim())
}

function buildNarrativeFacts(ctx: NarrativeGenerationContext): NarrativeFact[] {
  const factions = generateFactions(ctx.factionRng, ctx.options.tone, 8)
  const facts: NarrativeFact[] = [
    narrativeFact({
      id: 'system.reachability',
      kind: 'route.reachability',
      subjectType: 'route',
      value: ctx.reachability.className.value,
      confidence: ctx.reachability.className.confidence,
      source: 'Narrative context from generated reachability class',
      sourcePath: 'reachability.className',
      tags: ['route', 'access'],
      domains: ['route-weather', 'trade', 'exploration', 'governance'],
    }),
    narrativeFact({
      id: 'system.architecture',
      kind: 'system.architecture',
      subjectType: 'system',
      value: ctx.architectureName,
      confidence: 'inferred',
      source: 'Narrative context from generated architecture',
      sourcePath: 'architecture.name',
      tags: ['physical'],
      domains: ['exploration', 'science'],
    }),
    narrativeFact({
      id: 'star.activity',
      kind: 'star.activity',
      subjectType: 'star',
      subjectId: ctx.primary.id,
      value: ctx.primary.activity.value,
      confidence: ctx.primary.activity.confidence,
      source: 'Narrative context from generated stellar activity',
      sourcePath: 'primary.activity',
      tags: ['physical', 'hazard'],
      domains: ['stellar-events', 'science', 'disaster', 'public-life'],
    }),
    narrativeFact({
      id: 'gu.intensity',
      kind: 'gu.intensity',
      subjectType: 'gu',
      value: ctx.guOverlay.intensity.value,
      confidence: ctx.guOverlay.intensity.confidence,
      source: 'Narrative context from generated GU intensity',
      sourcePath: 'guOverlay.intensity',
      tags: ['gu'],
      domains: ['route-weather', 'science', 'trade', 'disaster'],
    }),
    narrativeFact({
      id: 'gu.resource',
      kind: 'gu.resource',
      subjectType: 'gu',
      value: ctx.guOverlay.resource.value,
      confidence: ctx.guOverlay.resource.confidence,
      source: 'Narrative context from generated GU resource',
      sourcePath: 'guOverlay.resource',
      tags: ['gu', 'resource'],
      domains: domainsForGuValue('resources', ctx.guOverlay.resource.value, ['trade', 'science', 'crime']),
    }),
    narrativeFact({
      id: 'gu.hazard',
      kind: 'gu.hazard',
      subjectType: 'gu',
      value: ctx.guOverlay.hazard.value,
      confidence: ctx.guOverlay.hazard.confidence,
      source: 'Narrative context from generated GU hazard',
      sourcePath: 'guOverlay.hazard',
      tags: ['gu', 'hazard'],
      domains: domainsForGuValue('hazards', ctx.guOverlay.hazard.value, ['disaster', 'science', 'governance']),
    }),
    narrativeFact({
      id: 'gu.bleed-location',
      kind: 'gu.bleedLocation',
      subjectType: 'gu',
      value: ctx.guOverlay.bleedLocation.value,
      confidence: ctx.guOverlay.bleedLocation.confidence,
      source: 'Narrative context from generated GU bleed location',
      sourcePath: 'guOverlay.bleedLocation',
      tags: ['gu', 'routeAsset'],
      domains: domainsForGuValue('bleedLocations', ctx.guOverlay.bleedLocation.value, ['trade', 'science', 'exploration']),
    }),
    narrativeFact({
      id: 'gu.bleed-behavior',
      kind: 'gu.bleedBehavior',
      subjectType: 'gu',
      value: ctx.guOverlay.bleedBehavior.value,
      confidence: ctx.guOverlay.bleedBehavior.confidence,
      source: 'Narrative context from generated GU bleed behavior',
      sourcePath: 'guOverlay.bleedBehavior',
      tags: ['gu', 'pressure'],
      domains: domainsForGuValue('bleedBehaviors', ctx.guOverlay.bleedBehavior.value, ['science', 'disaster', 'trade']),
    }),
    ...factions.map((faction) => narrativeFact({
      id: `faction.${faction.id}`,
      kind: 'namedFaction',
      subjectType: 'faction' as const,
      value: faction.name,
      confidence: 'human-layer',
      source: `${faction.publicFace}; ${faction.kind}`,
      sourcePath: `factions.${faction.id}`,
      tags: ['actor', faction.kind],
      domains: [...faction.domains],
    })),
  ]

  ctx.bodies.forEach((body, bodyIndex) => {
    facts.push(
      narrativeFact({
        id: `body.${body.id}.class`,
        kind: 'body.class',
        subjectType: 'body',
        subjectId: body.id,
        value: `${body.name.value}: ${body.bodyClass.value}`,
        confidence: body.bodyClass.confidence,
        source: 'Narrative context from generated body class',
        sourcePath: `bodies[${bodyIndex}].bodyClass`,
        tags: ['physical', body.category.value],
        domains: ['exploration', 'science'],
      }),
      narrativeFact({
        id: `body.${body.id}.radiation`,
        kind: 'body.radiation',
        subjectType: 'body',
        subjectId: body.id,
        value: radiationCreatesNarrativeHazard(body.detail.radiation.value)
          ? `${sentenceFragment(body.detail.radiation.value)} near ${body.name.value}`
          : `stable radiation conditions near ${body.name.value}`,
        confidence: body.detail.radiation.confidence,
        source: 'Narrative context from generated body radiation',
        sourcePath: `bodies[${bodyIndex}].detail.radiation`,
        tags: radiationCreatesNarrativeHazard(body.detail.radiation.value) ? ['hazard', 'physical'] : ['physical'],
        domains: radiationCreatesNarrativeHazard(body.detail.radiation.value) ? ['stellar-events', 'disaster', 'medicine', 'public-life'] : ['public-life', 'science'],
      })
    )

    if (body.detail.biosphere.value !== 'Sterile') {
      facts.push(narrativeFact({
        id: `body.${body.id}.biosphere`,
        kind: 'body.biosphere',
        subjectType: 'body',
        subjectId: body.id,
        value: `${sentenceFragment(body.detail.biosphere.value)} on ${body.name.value}`,
        confidence: body.detail.biosphere.confidence,
        source: 'Narrative context from generated biosphere',
        sourcePath: `bodies[${bodyIndex}].detail.biosphere`,
        tags: ['biosphere', 'ecology'],
        domains: ['ecology', 'science', 'governance'],
      }))
    }

    body.sites.forEach((site, siteIndex) => {
      facts.push(narrativeFact({
        id: `body.${body.id}.site.${siteIndex + 1}`,
        kind: 'body.site',
        subjectType: 'body',
        subjectId: body.id,
        value: `${lowerFirst(site.value)} on ${body.name.value}`,
        confidence: site.confidence,
        source: 'Narrative context from generated body site',
        sourcePath: `bodies[${bodyIndex}].sites[${siteIndex}]`,
        tags: ['site'],
      }))
    })
  })

  ctx.settlements.forEach((settlement, settlementIndex) => {
    const settlementBase = `settlements[${settlementIndex}]`
    const settlementLabel = settlement.name.value
    const actorValue = lowerFirst(settlement.authority.value)

    facts.push(
      narrativeFact({
        id: `settlement.${settlement.id}.authority`,
        kind: 'settlement.authority',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: actorValue,
        confidence: settlement.authority.confidence,
        source: `Narrative context from ${settlementLabel} authority`,
        sourcePath: `${settlementBase}.authority`,
        tags: ['actor', settlement.siteCategory.value, settlement.function.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.function`,
        kind: 'settlement.function',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: `${lowerFirst(settlement.function.value)} at ${settlementLabel}`,
        confidence: settlement.function.confidence,
        source: `Narrative context from ${settlementLabel} function`,
        sourcePath: `${settlementBase}.function`,
        tags: ['stake', settlement.siteCategory.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.location`,
        kind: 'settlement.location',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.location.value,
        confidence: settlement.location.confidence,
        source: `Narrative context from ${settlementLabel} location`,
        sourcePath: `${settlementBase}.location`,
        tags: ['routeAsset', settlement.siteCategory.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.condition`,
        kind: 'settlement.condition',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: `${lowerFirst(settlement.condition.value)} at ${settlementLabel}`,
        confidence: settlement.condition.confidence,
        source: `Narrative context from ${settlementLabel} condition`,
        sourcePath: `${settlementBase}.condition`,
        tags: ['pressure'],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.crisis`,
        kind: 'settlement.crisis',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.crisis.value,
        confidence: settlement.crisis.confidence,
        source: `Narrative context from ${settlementLabel} crisis`,
        sourcePath: `${settlementBase}.crisis`,
        tags: ['pressure', 'crisis'],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.hiddenTruth`,
        kind: 'settlement.hiddenTruth',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.hiddenTruth.value,
        confidence: settlement.hiddenTruth.confidence,
        source: `Narrative context from ${settlementLabel} hidden truth`,
        sourcePath: `${settlementBase}.hiddenTruth`,
        tags: ['secret'],
        status: 'secret',
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.ai`,
        kind: 'settlement.aiSituation',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.aiSituation.value,
        confidence: settlement.aiSituation.confidence,
        source: `Narrative context from ${settlementLabel} AI situation`,
        sourcePath: `${settlementBase}.aiSituation`,
        tags: ['ai', 'pressure'],
        domains: ['ai', ...narrativeDomainsForText(settlement.aiSituation.value)],
      })
    )

    settlement.tags.forEach((tag, tagIndex) => {
      facts.push(narrativeFact({
        id: `settlement.${settlement.id}.tag.${tagIndex + 1}`,
        kind: 'settlement.tag',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: tag.value,
        confidence: tag.confidence,
        source: `Narrative context from ${settlementLabel} settlement tag`,
        sourcePath: `${settlementBase}.tags[${tagIndex}]`,
        tags: ['pressure'],
      }))
    })

    facts.push(narrativeFact({
      id: `settlement.${settlement.id}.tagHook`,
      kind: 'settlement.tagHook',
      subjectType: 'settlement',
      subjectId: settlement.id,
      value: settlement.tagHook.value,
      confidence: settlement.tagHook.confidence,
      source: `Narrative context from ${settlementLabel} settlement tag hook`,
      sourcePath: `${settlementBase}.tagHook`,
      tags: ['pressure', 'claim', 'secret'],
      domains: narrativeDomainsForText(settlement.tagHook.value),
    }))

    settlement.encounterSites.forEach((site, siteIndex) => {
      facts.push(narrativeFact({
        id: `settlement.${settlement.id}.encounterSite.${siteIndex + 1}`,
        kind: 'settlement.encounterSite',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: site.value,
        confidence: site.confidence,
        source: `Narrative context from ${settlementLabel} encounter site`,
        sourcePath: `${settlementBase}.encounterSites[${siteIndex}]`,
        tags: ['sceneAnchor'],
      }))
    })
  })

  ctx.ruins.forEach((ruin, ruinIndex) => {
    facts.push(
      narrativeFact({
        id: `ruin.${ruin.id}.type`,
        kind: 'ruin.type',
        subjectType: 'ruin',
        subjectId: ruin.id,
        value: `${ruin.location.value}: ${ruin.remnantType.value}`,
        confidence: ruin.remnantType.confidence,
        source: 'Narrative context from generated human remnant',
        sourcePath: `ruins[${ruinIndex}].remnantType`,
        tags: ['remnant', 'first-wave'],
        domains: ['archaeology', 'trade', 'espionage'],
      }),
      narrativeFact({
        id: `ruin.${ruin.id}.hook`,
        kind: 'ruin.hook',
        subjectType: 'ruin',
        subjectId: ruin.id,
        value: ruin.hook.value,
        confidence: ruin.hook.confidence,
        source: 'Narrative context from generated human remnant hook',
        sourcePath: `ruins[${ruinIndex}].hook`,
        tags: ['claim', 'secret'],
      })
    )
  })

  ctx.phenomena.forEach((phenomenon, phenomenonIndex) => {
    facts.push(narrativeFact({
      id: `phenomenon.${phenomenon.id}`,
      kind: 'phenomenon',
      subjectType: 'phenomenon',
      subjectId: phenomenon.id,
      value: phenomenon.phenomenon.value,
      confidence: phenomenon.phenomenon.confidence,
      source: 'Narrative context from generated system phenomenon',
      sourcePath: `phenomena[${phenomenonIndex}].phenomenon`,
      tags: ['phenomenon'],
    }))
  })

  return facts
}

const noAlienReplacements: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  { pattern: /\balien\s+civilizations?\b/gi, replacement: 'human polities', label: 'alien civilization -> human polity' },
  { pattern: /\balien\s+ruins?\b/gi, replacement: 'first-wave human ruins', label: 'alien ruin -> first-wave human ruin' },
  { pattern: /\balien\s+artifacts?\b/gi, replacement: 'natural GU formations', label: 'alien artifact -> natural GU formation' },
  { pattern: /\balien\s+signals?\b/gi, replacement: 'encrypted human beacons', label: 'alien signal -> encrypted human beacon' },
  { pattern: /\balien\s+megastructures?\b/gi, replacement: 'failed Iggygate collars', label: 'alien megastructure -> failed Iggygate collar' },
  { pattern: /\bforbidden\s+archaeology\b/gi, replacement: 'deleted expedition archive', label: 'forbidden archaeology -> deleted expedition archive' },
  { pattern: /\bnative\s+civilizations?\b/gi, replacement: 'native non-sapient ecologies', label: 'native civilization -> native non-sapient ecology' },
  { pattern: /\bancient\s+cities\b/gi, replacement: 'first-wave human cities', label: 'ancient city -> first-wave human city' },
  { pattern: /\balien\s+machines?\b/gi, replacement: 'human experimental devices', label: 'alien machine -> human experimental device' },
  { pattern: /\bnonhuman\s+signals?\b/gi, replacement: 'unknown human or natural signals', label: 'nonhuman signal -> human or natural signal' },
]

export function applyNoAlienTextGuard(value: string): { value: string; conversions: string[] } {
  const conversions: string[] = []
  let guarded = value

  for (const replacement of noAlienReplacements) {
    replacement.pattern.lastIndex = 0
    if (replacement.pattern.test(guarded)) {
      replacement.pattern.lastIndex = 0
      guarded = guarded.replace(replacement.pattern, replacement.replacement)
      conversions.push(replacement.label)
    }
  }

  return { value: guarded, conversions }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function guardGeneratedText<T>(input: T, conversions: string[]): T {
  if (typeof input === 'string') {
    return applyNoAlienTextGuard(input).value as T
  }

  if (Array.isArray(input)) {
    return input.map((entry) => guardGeneratedText(entry, conversions)) as T
  }

  if (!isRecord(input)) return input

  const output: Record<string, unknown> = { ...input }
  if (input.locked === true) return output as T
  if (typeof input.value === 'string') {
    const guarded = applyNoAlienTextGuard(input.value)
    if (guarded.value !== input.value) {
      conversions.push(...guarded.conversions)
      output.value = guarded.value
      if (typeof input.source === 'string') output.source = `${input.source}; no-alien guard`
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (key === 'value' || key === 'source' || key === 'noAlienCheck') continue
    output[key] = guardGeneratedText(value, conversions)
  }

  return output as T
}

function runNoAlienGuard(system: Omit<GeneratedSystem, 'noAlienCheck'>): GeneratedSystem {
  const conversions: string[] = []
  const guardedSystem = guardGeneratedText(system, conversions)
  const uniqueConversions = [...new Set(conversions)]

  return {
    ...guardedSystem,
    noAlienCheck: {
      passed: true,
      note: uniqueConversions.length
        ? `No alien civilizations, ruins, artifacts, or megastructures generated. Converted ${uniqueConversions.length} old-style result${uniqueConversions.length === 1 ? '' : 's'}.`
        : 'No alien civilizations, ruins, artifacts, or megastructures generated.',
    },
  }
}

function stellarActivityHazards(primary: Star): Array<Fact<string>> {
  const activity = primary.activity.value
  if (activity === 'Flare-prone' || activity === 'Violent flare cycle' || activity === 'Extreme activity / metric-amplified events') {
    return [fact(activity, 'inferred', 'Stellar activity hazard')]
  }
  return []
}

export function generateSystem(options: GenerationOptions, knownSystem?: PartialKnownSystem): GeneratedSystem {
  const rootRng = createSeededRng(options.seed)
  const name = mergeLockedFact(fact(generateSystemName(rootRng.fork('name')), 'human-layer', 'Generated system name'), knownSystem?.name)
  const basePrimary = generatePrimaryStar(rootRng.fork('star'), options, name.value, knownSystem?.primary)
  const companions = generateStellarCompanions(rootRng.fork('companions'), basePrimary)
  const primary = applyCompanionActivityModifier(basePrimary, companions)
  const reachability = generateReachability(rootRng.fork('reachability'), options, primary, companions)
  const architectureResult = generateArchitecture(rootRng.fork('architecture'), options, primary, reachability.className.value)
  const hz = calculateHabitableZone(primary.luminositySolar.value)
  const snowLine = calculateSnowLine(primary.luminositySolar.value)
  const bodies = generateBodies(rootRng.fork('bodies'), primary, architectureResult.architecture.name.value, name.value, knownSystem?.bodies)
  const guOverlay = generateGuOverlay(rootRng.fork('gu'), options.gu, primary, companions, bodies, architectureResult.architecture.name.value)
  const allSettlements = generateSettlements(rootRng.fork('settlements'), options, name.value, bodies, guOverlay, reachability, architectureResult.architecture.name.value)
  const { settlements, gates } = partitionGates(allSettlements)
  const ruins = generateHumanRemnants(rootRng.fork('ruins'), bodies, guOverlay)
  const phenomena = generatePhenomena(rootRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)
  const narrativeFacts = buildNarrativeFacts({
    options,
    systemName: name,
    primary,
    companions,
    reachability,
    architectureName: architectureResult.architecture.name.value,
    bodies,
    guOverlay,
    settlements,
    ruins,
    phenomena,
    factionRng: rootRng.fork('factions'),
  })
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: name.value,
      primary: { spectralType: primary.spectralType },
      companions,
      bodies,
      settlements: settlements.map(s => ({
        id: s.id,
        name: s.name,
        bodyId: s.bodyId,
        presence: { guValue: s.presence.guValue, hazard: s.presence.hazard },
      })),
      guOverlay,
      phenomena,
      ruins: ruins.map(r => ({ id: r.id, remnantType: r.remnantType, location: r.location })),
      narrativeFacts,
    },
    { tone: options.tone, gu: options.gu, distribution: options.distribution, settlements: options.settlements },
    narrativeFacts,
    rootRng.fork('graph'),
  )
  const reshaped = graphAwareReshape({
    settlements,
    phenomena,
    relationshipGraph,
    options,
    rng: rootRng,
  })
  const reshapedSettlements = reshaped.settlements
  const reshapedPhenomena = reshaped.phenomena
  const systemStory = renderSystemStory(
    relationshipGraph,
    rootRng.fork('story'),
    {
      tone: options.tone,
      gu: options.gu,
      distribution: options.distribution,
      settlements: options.settlements,
    },
  )
  const hooks = selectSystemHooks({
    rng: rootRng.fork('hooks'),
    context: {
      guOverlay,
      settlements: reshapedSettlements,
      ruins,
      phenomena: reshapedPhenomena,
      architecture: architectureResult.architecture,
      reachability,
    },
  })

  return runNoAlienGuard({
    id: knownSystem?.id ?? `system-${options.seed}`,
    seed: options.seed,
    options,
    name,
    dataBasis: mergeLockedFact(
      fact(knownSystem ? 'Partial known system with generated fictional layers' : 'Fictional generated system', knownSystem ? 'confirmed' : 'human-layer', knownSystem ? 'Known-system import plus procedural completion' : 'MVP fictional generation'),
      knownSystem?.dataBasis
    ),
    primary,
    companions,
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
    settlements: reshapedSettlements,
    gates,
    ruins,
    phenomena: reshapedPhenomena,
    narrativeFacts,
    relationshipGraph,
    systemStory,
    hooks,
    majorHazards: [guOverlay.hazard, ...stellarActivityHazards(primary)],
  })
}

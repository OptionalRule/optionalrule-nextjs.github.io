import type {
  BodyCategory,
  BodyPhysicalHints,
  Fact,
  GeneratedSystem,
  GenerationOptions,
  GuPreference,
  HumanRemnant,
  Moon,
  NarrativeFact,
  NarrativeLine,
  NarrativeThread,
  OrbitingBody,
  PlanetaryDetail,
  PartialKnownBody,
  PartialKnownStar,
  PartialKnownSystem,
  RingSystem,
  Settlement,
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
import { d8, d12, d20, d100, pickOne, pickTable, twoD6 } from './dice'
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
  activityLabels,
  atmosphereTable,
  biospheres,
  climateSourceTable,
  coldClimateTags,
  envelopeClimateTags,
  envelopeGeologies,
  extremeHotAtmospheres,
  extremeHotClimateTags,
  extremeHotEnvelopeClimateTags,
  extremeHotVolatiles,
  geologyTable,
  hotClimateTags,
  hydrosphereTable,
  moonScales,
  moonTypes,
  radiationTable,
  ringTypeTable,
  siteOptions,
  temperateClimateTags,
} from './data/mechanics'
import { humanRemnants, namedFactions, narrativeStructures, narrativeVariablePools, phenomena, remnantHooks, type NarrativeStructure } from './data/narrative'
import {
  aiSituations,
  asteroidBaseFunctions,
  biosphereFunctions,
  builtForms,
  civilFunctions,
  deepSpaceFunctions,
  encounterSites,
  encounterSitesByFunctionKeyword,
  encounterSitesByScale,
  extractionFunctions,
  giantOrbitalFunctions,
  guFractureFunctionsBySiteCategory,
  hiddenTruthByScale,
  hiddenTruths,
  mobileFunctions,
  moonBaseFunctions,
  orbitalFunctions,
  restrictedFunctions,
  routeFunctions,
  securityFunctions,
  settlementAuthorities,
  settlementAuthorityByScale,
  settlementConditionByScale,
  settlementConditions,
  settlementCrisisByScale,
  settlementCrises,
  settlementLocations,
  settlementScaleTable,
  settlementTagPairHooks,
  settlementTagPressures,
  settlementTags,
  surveyFunctions,
  surfaceIceFunctions,
  type SettlementLocationOption,
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
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation, smoothTechnicalPhrase, definiteNounPhrase, normalizeNarrativeText } from './prose/helpers'
import { conditionAsPressure, crisisAsPressure } from './prose/crisisShaping'
import { settlementHookSynthesis, settlementWhyHere } from './prose/settlementProse'
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
    { className: 'Deep observiverse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
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
    { className: 'Deep observiverse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
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

function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
  return { value, confidence, source }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function uniqueByNormalizedValue<T extends { value: string }>(values: readonly T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const value of values) {
    const key = value.value.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function hiddenCauseBeatText(secretText: string): string {
  const secret = stripTerminalPunctuation(lowerFirst(secretText))
  if (/^(records|evidence|proof)\b/i.test(secret)) {
    const verb = /^records\b/i.test(secret) ? 'are' : 'is'
    return `${sentenceStart(secret)} ${verb} driving the conflict.`
  }
  if (/^(the|a|an)\s+.+\s+(is|are|was|were|has|have|cannot|can|will|would)\b/i.test(secret)) {
    return `The hidden cause is that ${secret}.`
  }
  return `The hidden evidence is ${secret}.`
}

function domainProtectionPhrase(domain: string | undefined): string {
  switch (domain) {
    case 'archaeology':
      return 'the archaeological record'
    case 'ecology':
      return 'ecological stability'
    case 'science':
      return 'scientific access'
    case 'trade':
      return 'trade access'
    case 'governance':
      return 'public legitimacy'
    case 'law':
      return 'lawful title'
    case 'public-life':
    case 'daily-life':
      return 'civilian life'
    case 'labor':
      return 'worker survival'
    case 'war':
      return 'defense readiness'
    case 'espionage':
      return 'operational secrecy'
    case 'crime':
      return 'off-book leverage'
    case 'migration':
      return 'refugee safety'
    case 'disaster':
      return 'containment'
    case 'religion':
      return 'public ritual'
    case 'ai':
      return 'AI custody'
    case 'exploration':
      return 'safe passage'
    case 'stellar-events':
      return 'storm readiness'
    case 'gardener-interdiction':
      return 'interdiction safety'
    case 'infrastructure':
      return 'critical systems'
    case 'terraforming':
      return 'climate stability'
    case 'route-weather':
      return 'the safe transit window'
    case 'information-integrity':
      return 'the public record'
    case 'medicine':
      return 'medical triage'
    default:
      return 'public order'
  }
}

function exposurePhrase(secretText: string): string {
  const secret = stripTerminalPunctuation(lowerFirst(secretText))
  if (/^(the|a|an)\s+.+\s+(is|are|was|were|has|have|cannot|can|will|would)\b/i.test(secret)) {
    return `that ${secret}`
  }
  return secret
}

function choiceBeatText(domains: readonly string[], secretText: string | undefined, publicSubject: string): string {
  const protectedValue = domainProtectionPhrase(domains[0])
  const exposedValue = secretText
    ? exposurePhrase(secretText)
    : `what ${lowerFirst(publicSubject)} is hiding`
  return `Choice: protect ${protectedValue} or expose ${exposedValue}.`
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

export function generateReachability(rng: SeededRng, options: GenerationOptions, primary: Star, companions: StellarCompanion[]) {
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
  return Math.max(0.015, orbitAu * 0.035)
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

  return pickTable(rng, clampTableRoll(roll, 12), geologyTable)
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
    return pickTable(rng, clampTableRoll(d12(rng) + 3, 12), atmosphereTable)
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotAtmospheres)

  let roll = d12(rng)
  if (category === 'super-earth') roll += 1
  if (isVolatileRichWorld(bodyClass, category, thermalZone)) roll += 1
  if (physical.radiusEarth.value < 0.8 || category === 'dwarf-body') roll -= 1
  if (thermalZone === 'Hot') roll -= 1
  if (isHighActivityStar(primary)) roll -= primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces' || geology === 'Global resurfacing') roll += 1
  if (isArtificialOrTerraformed(bodyClass)) roll += 1

  return pickTable(rng, clampTableRoll(roll, 12), atmosphereTable)
}

function rollHydrosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return pickOne(rng, ['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return pickOne(rng, ['Deep atmospheric volatile layers', 'High-pressure condensate decks', 'No accessible surface volatiles'])
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotVolatiles)

  let roll = d12(rng)
  if (thermalZone === 'Hot') roll -= 2
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 2
  if (bodyClass.className.includes('Ocean') || bodyClass.className.includes('Waterworld') || bodyClass.className.includes('Hycean')) roll += 3
  if (bodyClass.className.includes('Dry') || bodyClass.className.includes('desert') || bodyClass.className.includes('Airless')) roll -= 3
  if (bodyClass.className.includes('Hydrogen') || bodyClass.className.includes('Exotic')) roll += 1

  return pickTable(rng, clampTableRoll(roll, 12), hydrosphereTable)
}

function generateClimate(rng: SeededRng, category: BodyCategory, thermalZone: string, count: number) {
  const climateOptions =
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

  return Array.from({ length: count }, () => {
    const sourceClimate = pickTable(rng, d20(rng), climateSourceTable)
    const value = (climateOptions as readonly string[]).includes(sourceClimate) ? sourceClimate : pickOne(rng, climateOptions)
    return fact(value, 'inferred', 'MASS-GU climate tag d20 table with thermal-zone constraints')
  })
}

function generateRadiation(rng: SeededRng, category: BodyCategory, thermalZone: string, primary: Star): string {
  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  let roll = d8(rng)
  if (isEnvelopeWorld) roll += 2
  if (isHighActivityStar(primary)) roll += primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') roll += 2
  if (thermalZone === 'Hot') roll += 1

  return pickTable(rng, clampTableRoll(roll, 8), radiationTable)
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
    climate: generateClimate(rng, category, thermalZone, climateCount),
    radiation: fact(
      generateRadiation(rng, category, thermalZone, primary),
      'inferred',
      'MASS-GU 14 radiation d8 table with source modifiers'
    ),
  }, environmentPolicy)

  return {
    ...detailWithoutBiosphere,
    biosphere: fact(
      environmentPolicy.biosphere.forced ?? generateBiosphere(rng, category, thermalZone, detailWithoutBiosphere, primary),
      'inferred',
      environmentPolicy.biosphere.forced ? `Forced by ${environmentPolicy.profile} environment policy` : 'MASS-GU biosphere score'
    ),
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
      use: 'black-budget extraction, observiverse labs, and interdicted mines',
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
      use: 'bleed-chaser fleets, observiverse AIs, and high-risk harvest crews',
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
          generateBiosphere(rng.fork(`locked-detail-biosphere-${index + 1}`), filtered.bodyClass.category, thermalZone, mergedDetail, primary),
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
      sites: Array.from({ length: siteCount }, () => fact(pickOne(rng, siteOptions), 'human-layer', 'Generated site')),
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

export function generateGuOverlay(rng: SeededRng, preference: GuPreference, primary: Star, companions: StellarCompanion[], bodies: OrbitingBody[], architectureName: string) {
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

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, value))
}

function assertNever(value: never): never {
  throw new Error(`Unhandled settlement category: ${value}`)
}

export function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string {
  const exactPair = `${obviousTag} + ${deeperTag}`
  if (settlementTagPairHooks[exactPair]) return settlementTagPairHooks[exactPair]
  const reversePair = `${deeperTag} + ${obviousTag}`
  if (settlementTagPairHooks[reversePair]) return settlementTagPairHooks[reversePair]

  const deeperText = settlementTagPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`
  const template = rng.int(1, 4)
  if (template === 1) return `${obviousTag} is what visitors notice first; ${deeperText}`
  if (template === 2) return `Outsiders call it ${obviousTag}, but the local pressure is sharper: ${deeperText}`
  if (template === 3) return `${obviousTag} is the surface story, but ${deeperTag} shows who benefits from the tension: ${deeperText}`
  return `The public tag is ${obviousTag}; the private trouble is ${deeperTag}, because ${deeperText}`
}

function chooseSettlementTags(rng: SeededRng): [string, string] {
  const obviousTag = pickOne(rng, settlementTags)
  const deeperOptions = settlementTags.filter((tag) => tag !== obviousTag)
  const deeperTag = deeperOptions.length ? pickOne(rng, deeperOptions) : settlementTags[(settlementTags.indexOf(obviousTag) + 1) % settlementTags.length]
  return [obviousTag, deeperTag]
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

export function scoreSettlementPresence(rng: SeededRng, body: OrbitingBody, guOverlay: ReturnType<typeof generateGuOverlay>, reachability: ReturnType<typeof generateReachability>) {
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

type SettlementPresenceScore = ReturnType<typeof scoreSettlementPresence>

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
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
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

function settlementScaleFromRoll(rng: SeededRng, presence: SettlementPresenceScore): string {
  let roll = d12(rng)
  if (presence.score <= 6) roll -= 2
  if (presence.score === 7 || presence.score === 8) roll -= 1
  if (presence.score >= 12) roll += 1
  if (presence.score >= 15) roll += 2
  roll = Math.max(1, Math.min(12, roll))
  return settlementScaleTable[roll - 1]
}

function chooseSettlementAuthority(rng: SeededRng, scale: string): string {
  if (settlementAuthorityByScale[scale]) return pickOne(rng, settlementAuthorityByScale[scale])
  return pickOne(rng, settlementAuthorities)
}

function chooseSettlementCondition(rng: SeededRng, scale: string): string {
  if (settlementConditionByScale[scale]) return pickOne(rng, settlementConditionByScale[scale])
  return pickOne(rng, settlementConditions)
}

function chooseSettlementCrisis(rng: SeededRng, scale: string): string {
  if (settlementCrisisByScale[scale]) return pickOne(rng, settlementCrisisByScale[scale])
  return pickOne(rng, settlementCrises)
}

function chooseHiddenTruth(rng: SeededRng, scale: string): string {
  if (hiddenTruthByScale[scale]) return pickOne(rng, hiddenTruthByScale[scale])
  return pickOne(rng, hiddenTruths)
}

function chooseEncounterSites(rng: SeededRng, scale: string, settlementFunction: string): string[] {
  const value = settlementFunction.toLowerCase()
  const candidates = new Set<string>()

  encounterSitesByScale[scale]?.forEach((site) => candidates.add(site))
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

function chooseSettlementLocation(rng: SeededRng, body: OrbitingBody, reachability: ReturnType<typeof generateReachability>): SettlementLocationOption {
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
  guOverlay: ReturnType<typeof generateGuOverlay>
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

function settlementDescriptorForScale(scale: string): string {
  return settlementNameDescriptors.scale.exact[scale] ?? descriptorFromRules(scale, settlementNameDescriptors.scale)
}

function generateSettlementName(
  rng: SeededRng,
  body: OrbitingBody,
  anchor: SettlementAnchor,
  siteCategory: string,
  settlementFunction: string,
  authority: string,
  scale: string
): string {
  const anchorStem = anchor.name.split(',')[0].replace(/\s+(orbital space|route geometry|traffic pattern|transit geometry)$/i, '')
  const functionDescriptor = settlementDescriptorForFunction(settlementFunction)
  const categoryDescriptor = settlementDescriptorForCategory(siteCategory)
  const authorityDescriptor = settlementDescriptorForAuthority(authority)
  const scaleDescriptor = settlementDescriptorForScale(scale)

  const pattern = rng.int(1, 5)
  if (pattern === 1) return `${anchorStem} ${functionDescriptor}`
  if (pattern === 2) return `${anchorStem} ${categoryDescriptor}`
  if (pattern === 3) return `${body.name.value} ${authorityDescriptor}`
  if (pattern === 4) return `${anchorStem} ${scaleDescriptor}`
  return `${body.name.value} ${functionDescriptor} ${rng.int(2, 99).toString().padStart(2, '0')}`
}

function generateSettlements(
  rng: SeededRng,
  options: GenerationOptions,
  systemName: string,
  bodies: OrbitingBody[],
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
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
    const whyHere = settlementWhyHere(rng.fork(`why-here-${index + 1}`), body, presence, guOverlay, reachability, anchor)
    const tags = chooseSettlementTags(rng)
    const scale = settlementScaleFromRoll(rng, presence)
    const authority = chooseSettlementAuthority(rng, scale)
    const condition = chooseSettlementCondition(rng, scale)
    const crisis = chooseSettlementCrisis(rng, scale)
    const hiddenTruth = chooseHiddenTruth(rng, scale)
    const encounterSiteValues = chooseEncounterSites(rng.fork(`encounter-sites-${index + 1}`), scale, settlementFunction)
    const tagHook = settlementHookSynthesis(rng.fork(`tag-hook-${index + 1}`), tags[0], tags[1], {
      scale,
      siteCategory: locationOption.category,
      settlementFunction,
      condition,
      crisis,
      hiddenTruth,
      encounterSites: encounterSiteValues,
      guIntensity: guOverlay.intensity.value,
    })
    const baseSettlementName = generateSettlementName(rng.fork(`settlement-name-${index + 1}`), body, anchor, locationOption.category, settlementFunction, authority, scale)
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
          ? 'Generated settlement name from anchor, function, authority, and scale'
          : 'Generated settlement name from anchor, function, authority, and scale; duplicate repaired by deterministic name registry'
      ),
      anchorKind: fact(anchor.kind, 'human-layer', 'Generated site-to-body relationship'),
      anchorName: fact(anchor.name, 'human-layer', 'Generated site-to-body relationship'),
      anchorDetail: fact(anchor.detail, 'human-layer', 'Generated site-to-body relationship'),
      siteCategory: fact(locationOption.category, 'human-layer', 'MASS-GU section 18 constrained site category'),
      location: fact(locationOption.label, 'human-layer', 'MASS-GU 18.3 site location table with body constraints'),
      function: fact(settlementFunction, 'human-layer', 'MASS-GU settlement function table with body constraints'),
      scale: fact(scale, 'human-layer', 'MASS-GU 18.2 settlement scale d12 table'),
      authority: fact(authority, 'human-layer', 'MASS-GU 18.5 authority table'),
      builtForm: fact(builtForm, 'human-layer', 'MASS-GU built form table with location/function constraints'),
      aiSituation: fact(pickOne(rng, aiSituations), 'human-layer', 'MASS-GU AI situation table'),
      condition: fact(condition, 'human-layer', 'MASS-GU settlement condition table with scale compatibility'),
      tags: tags.map((tag, tagIndex) => fact(tag, 'human-layer', tagIndex === 0 ? 'MASS-GU 18.9 obvious settlement tag' : 'MASS-GU 18.9 deeper settlement tag')),
      tagHook: fact(tagHook, 'human-layer', 'Generated contextual interpretation of MASS-GU 18.9 tag pair, crisis, hidden truth, and site pressure'),
      crisis: fact(crisis, 'human-layer', 'MASS-GU 18.10 crisis table with scale compatibility'),
      hiddenTruth: fact(hiddenTruth, 'human-layer', 'MASS-GU 18.11 hidden truth table with scale compatibility; no-alien conversion applied where needed'),
      encounterSites: encounterSiteValues.map((site) => fact(site, 'human-layer', 'MASS-GU 18.12 local encounter site table with function/scale weighting')),
      whyHere: fact(whyHere, 'human-layer', 'Generated from MASS-GU 18.1 presence score components'),
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
    const note = `Transit: ${phenomenon.travelEffect} Question: ${phenomenon.surveyQuestion} Hook: ${phenomenon.conflictHook} Image: ${phenomenon.sceneAnchor}`
    return {
      id: `phenomenon-${index + 1}`,
      phenomenon: fact(phenomenon.label, phenomenon.confidence, 'MASS-GU expanded phenomena table'),
      note: fact(note, phenomenon.confidence, 'Generated structured phenomenon consequences'),
      travelEffect: fact(phenomenon.travelEffect, phenomenon.confidence, 'Generated phenomenon travel consequence'),
      surveyQuestion: fact(phenomenon.surveyQuestion, phenomenon.confidence, 'Generated phenomenon survey question'),
      conflictHook: fact(phenomenon.conflictHook, phenomenon.confidence, 'Generated phenomenon conflict hook'),
      sceneAnchor: fact(phenomenon.sceneAnchor, phenomenon.confidence, 'Generated phenomenon scene anchor'),
    }
  })
}

interface NarrativeGenerationContext {
  options: GenerationOptions
  systemName: Fact<string>
  primary: Star
  companions: StellarCompanion[]
  reachability: ReturnType<typeof generateReachability>
  architectureName: string
  bodies: OrbitingBody[]
  guOverlay: ReturnType<typeof generateGuOverlay>
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
}

interface NarrativeSlotCandidate {
  value: string
  factId?: string
  confidence: Fact<string>['confidence']
  source: string
  weight?: number
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

function secretCandidateFromFact(factEntry: NarrativeFact): boolean {
  if (factEntry.kind === 'settlement.hiddenTruth' || factEntry.kind === 'settlement.tagHook' || factEntry.kind === 'ruin.hook') return true
  if (factEntry.kind !== 'settlement.aiSituation') return false
  return /(hidden|illegal|memory gaps|only witness|censored|impostor|secret|missing|cut down|wrong authority|catastrophe|gardener)/i.test(factEntry.value.value)
}

function buildNarrativeFacts(ctx: NarrativeGenerationContext): NarrativeFact[] {
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
    ...namedFactions.map((faction) => narrativeFact({
      id: `faction.${faction.id}`,
      kind: 'namedFaction',
      subjectType: 'faction' as const,
      value: faction.name,
      confidence: 'human-layer',
      source: `${faction.publicFace}; ${faction.kind}`,
      sourcePath: `namedFactions.${faction.id}`,
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

function candidatesFromFacts(facts: readonly NarrativeFact[], poolName: string): NarrativeSlotCandidate[] {
  const byKind = (kinds: string[]) => facts.filter((factEntry) => kinds.includes(factEntry.kind))
  const byTag = (tags: string[]) => facts.filter((factEntry) => tags.some((tag) => factEntry.tags.includes(tag)))

  const selected =
    poolName === 'groups' ? byKind(['settlement.authority', 'namedFaction']) :
    poolName === 'stakes' ? [...byKind(['gu.resource', 'route.reachability', 'settlement.function', 'body.biosphere', 'body.site']), ...byTag(['stake'])] :
    poolName === 'leverage' ? [...byKind(['gu.bleedLocation', 'settlement.location', 'settlement.encounterSite']), ...byTag(['routeAsset', 'sceneAnchor'])] :
    poolName === 'pressures' ? [...byKind(['settlement.crisis', 'settlement.condition', 'settlement.tag', 'settlement.tagHook', 'gu.hazard', 'gu.bleedBehavior']), ...byTag(['pressure'])] :
    poolName === 'threats' ? [...byKind(['gu.hazard', 'gu.bleedBehavior', 'body.radiation', 'settlement.crisis']), ...byTag(['hazard'])].filter((factEntry) => factEntry.kind !== 'body.radiation' || factEntry.tags.includes('hazard')) :
    poolName === 'secrets' ? [...byKind(['settlement.hiddenTruth', 'settlement.tagHook', 'settlement.aiSituation', 'ruin.hook']), ...byTag(['secret'])].filter(secretCandidateFromFact) :
    poolName === 'routeAssets' ? [...byKind(['gu.bleedLocation', 'settlement.location']), ...byTag(['routeAsset'])] :
    poolName === 'claims' ? [...byKind(['ruin.hook', 'settlement.hiddenTruth', 'settlement.tagHook']), ...byTag(['claim'])] :
    poolName === 'sceneAnchors' ? [...byKind(['settlement.encounterSite', 'settlement.location']), ...byTag(['sceneAnchor'])] :
    poolName === 'publics' ? byKind(['settlement.function', 'settlement.location']) :
    poolName === 'choices' ? [...byKind(['settlement.hiddenTruth', 'settlement.tagHook', 'ruin.hook']), ...byTag(['claim', 'secret'])] :
    []

  return uniqueByNormalizedValue(selected.map((factEntry) => ({
    value: narrativeSlotDisplayValue(factEntry, poolName),
    factId: factEntry.id,
    confidence: factEntry.value.confidence,
    source: `Narrative fact ledger: ${factEntry.sourcePath}`,
    weight: narrativeCandidateWeight(factEntry, poolName),
  })))
}

function narrativeCandidateWeight(factEntry: NarrativeFact, poolName: string): number {
  if (poolName === 'groups') return factEntry.kind === 'settlement.authority' ? 1.5 : 1
  if (factEntry.kind === 'settlement.crisis') return 5
  if (factEntry.kind === 'settlement.hiddenTruth') return 5
  if (factEntry.kind === 'settlement.tag') return 4.4
  if (factEntry.kind === 'settlement.tagHook') return 4.1
  if (factEntry.kind === 'gu.resource' || factEntry.kind === 'gu.hazard') return 4
  if (factEntry.kind === 'settlement.function') return 3.2
  if (factEntry.kind === 'settlement.location') return 2.8
  if (factEntry.kind === 'gu.bleedLocation') return 2.6
  if (factEntry.kind === 'gu.bleedBehavior') return 2.4
  if (factEntry.kind === 'ruin.hook') return 2
  if (factEntry.kind === 'settlement.aiSituation') return 1.8
  if (factEntry.kind === 'settlement.encounterSite') return 1.2
  return 1
}

function pickWeightedCandidate(rng: SeededRng, candidates: readonly NarrativeSlotCandidate[]): NarrativeSlotCandidate {
  const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(candidate.weight ?? 1, 0), 0)
  if (totalWeight <= 0) return pickOne(rng, candidates)

  let roll = rng.float(0, totalWeight)
  for (const candidate of candidates) {
    roll -= Math.max(candidate.weight ?? 1, 0)
    if (roll <= 0) return candidate
  }

  return candidates[candidates.length - 1]
}

function tagHookSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => stripTerminalPunctuation(sentence.trim()))
    .filter(Boolean)
}

function tagHookSecret(value: string): string | undefined {
  const privateSentence = tagHookSentences(value).find((sentence) => /^Privately,\s+/i.test(sentence))
  if (!privateSentence) return undefined
  return lowerFirst(privateSentence.replace(/^Privately,\s*/i, ''))
}

function tagHookPressure(value: string): string | undefined {
  const sentences = tagHookSentences(value)
  const localPressure = sentences
    .map((sentence) => sentence.match(/local pressure is sharper:\s*(.+)$/i)?.[1])
    .find((sentence): sentence is string => Boolean(sentence))
  if (localPressure) return lowerFirst(localPressure)

  const crisisSentence = sentences.find((sentence) => /^The crisis around\s+/i.test(sentence))
  if (crisisSentence) return lowerFirst(crisisSentence)

  return undefined
}

function factAsChoiceClause(factEntry: NarrativeFact, value: string): string {
  if (factEntry.kind === 'settlement.tagHook') {
    const secret = tagHookSecret(factEntry.value.value)
    if (secret) return `exposing that ${secret} is worth the risk`
  }

  if (factEntry.status === 'secret') return `exposing that ${value} is worth the risk`

  if (factEntry.kind === 'ruin.hook') {
    if (/^(is|was|appears|sits)\b/i.test(value)) return `the remnant ${value}`
    if (/^contains\s+(.+)$/i.test(value)) return value.replace(/^contains\s+/i, 'the remnant contains ')
    if (/^holds\s+(.+)$/i.test(value)) return value.replace(/^holds\s+/i, 'the remnant holds ')
  }

  return value
}

function bleedBehaviorThreat(value: string): string {
  if (/^stable and charted$/i.test(value)) return 'a stable, charted bleed pattern'
  if (/^stable but weakening$/i.test(value)) return 'a stable but weakening bleed pattern'
  if (/^seasonal\/orbital cycle$/i.test(value)) return 'a seasonal orbital bleed cycle'
  if (/^(flare-triggered|tidal-cycle triggered)$/i.test(value)) return `a ${value.toLowerCase()} bleed pattern`
  if (/^(migrates|splits|appears|follows|reacts)\b/i.test(value)) return `a bleed pattern that ${value}`
  if (/^apparently anticipatory/i.test(value)) return 'an apparently anticipatory bleed pattern'
  return `a bleed pattern shaped by ${value}`
}

function narrativeSlotDisplayValue(factEntry: NarrativeFact, poolName: string): string {
  const rawValue = factEntry.value.value
  const value = factEntry.kind === 'namedFaction' ? rawValue : smoothTechnicalPhrase(sentenceFragment(rawValue))

  if (poolName === 'groups') {
    if (value === 'no recognized authority') return 'unrecognized local crews'
    if (value === 'official records are falsified') return 'officially falsified records'
    return value
  }

  if (poolName === 'publics') {
    if (factEntry.kind === 'settlement.function') return `${value} crews`
    if (factEntry.kind === 'settlement.location') return `${value.toLowerCase()} residents`
  }

  if (poolName === 'choices') {
    return factAsChoiceClause(factEntry, value)
  }

  if (poolName === 'claims') {
    if (factEntry.kind === 'settlement.tagHook') return tagHookSecret(rawValue) ?? value
    if (factEntry.kind === 'ruin.hook') {
      if (/^contains\s+(.+)$/i.test(value)) return value.replace(/^contains\s+/i, 'the remnant contains ')
      if (/^holds\s+(.+)$/i.test(value)) return value.replace(/^holds\s+/i, 'the remnant holds ')
      if (/^proves\s+(.+)$/i.test(value)) return value.replace(/^proves\s+/i, '')
      if (/^shows\s+(.+)$/i.test(value)) return value.replace(/^shows\s+/i, '')
      if (/^(appears|sits|was|is|keeps|has|hides|marks)\b/i.test(value)) return `the remnant ${value}`
    }
    if (factEntry.kind === 'settlement.hiddenTruth') return lowerFirst(value)
  }

  if (poolName === 'secrets') {
    if (factEntry.kind === 'settlement.tagHook') return tagHookSecret(rawValue) ?? value
    if (factEntry.kind === 'ruin.hook') {
      if (/^contains\s+(.+)$/i.test(value)) return value.replace(/^contains\s+/i, '')
      if (/^holds\s+(.+)$/i.test(value)) return value.replace(/^holds\s+/i, '')
      if (/^proves\s+(.+)$/i.test(value)) return value.replace(/^proves\s+/i, 'proof that ')
      if (/^shows\s+(.+)$/i.test(value)) return value.replace(/^shows\s+/i, 'evidence that ')
      if (/^(marks|has|hides|keeps)\b/i.test(value)) return `evidence that it ${value}`
      if (/^(is|was|appears|sits)\b/i.test(value)) return `evidence that the remnant ${value}`
    }
    if (factEntry.kind === 'settlement.hiddenTruth') return lowerFirst(value)
  }

  if (poolName === 'pressures') {
    if (factEntry.kind === 'settlement.tagHook') return tagHookPressure(rawValue) ?? value
    if (factEntry.kind === 'settlement.crisis') return crisisAsPressure(rawValue)
    if (factEntry.kind === 'settlement.condition') {
      const match = value.match(/^(.+) at (.+)$/)
      if (match) return conditionAsPressure(match[1], match[2])
    }
    if (factEntry.kind === 'settlement.tag') return `${value.toLowerCase()} tensions`
  }

  if (poolName === 'threats') {
    if (factEntry.kind === 'settlement.crisis') return crisisAsPressure(rawValue)
    if (factEntry.kind === 'body.radiation') return value
    if (factEntry.kind === 'gu.bleedBehavior') return bleedBehaviorThreat(value)
  }

  if (poolName === 'routeAssets') {
    if (factEntry.kind === 'gu.bleedLocation' || factEntry.kind === 'settlement.location' || factEntry.kind === 'body.site') {
      return definiteNounPhrase(value)
    }
  }

  if (poolName === 'leverage') {
    if (factEntry.kind === 'settlement.location' || factEntry.kind === 'settlement.encounterSite' || factEntry.kind === 'gu.bleedLocation') {
      return definiteNounPhrase(value)
    }
  }

  if (poolName === 'stakes' && factEntry.kind === 'settlement.function') {
    const match = value.match(/^(.+) at (.+)$/)
    if (match) return `control of ${definiteNounPhrase(match[1])} at ${match[2]}`
  }

  return value
}

function fallbackCandidates(poolName: string, values: readonly string[]): NarrativeSlotCandidate[] {
  return values.map((value) => ({
    value: fallbackSlotDisplayValue(poolName, value),
    confidence: 'human-layer',
    source: `Narrative variable pool "${poolName}"`,
    weight: 1,
  }))
}

function fallbackSlotDisplayValue(poolName: string, value: string): string {
  if (poolName !== 'groups') return value

  return value
    .replace(/^revolutionary cells$/i, 'revolutionary cell network')
    .replace(/^route forecasters$/i, 'route forecasting office')
    .replace(/^archive auditors$/i, 'archive audit office')
    .replace(/^flare-season forecasters$/i, 'flare-season forecasting office')
    .replace(/^medical\/biosafety board$/i, 'medical and biosafety board')
}

function addNarrativeDomainBoost(boosts: Map<string, number>, domain: string, amount: number): void {
  boosts.set(domain, Math.min((boosts.get(domain) ?? 0) + amount, 6))
}

function boostDomains(boosts: Map<string, number>, domains: readonly string[], amount: number): void {
  domains.forEach((domain) => addNarrativeDomainBoost(boosts, domain, amount))
}

function deriveNarrativeDomainBoosts(narrativeFacts: readonly NarrativeFact[]): Map<string, number> {
  const boosts = new Map<string, number>()

  narrativeFacts.forEach((factEntry) => {
    const text = `${factEntry.kind} ${factEntry.value.value} ${factEntry.tags.join(' ')} ${factEntry.domains.join(' ')}`.toLowerCase()

    if (factEntry.kind.startsWith('gu.')) boostDomains(boosts, factEntry.domains, 0.55)
    if (factEntry.kind === 'phenomenon') boostDomains(boosts, factEntry.domains, 0.35)
    if (factEntry.kind.startsWith('settlement.')) boostDomains(boosts, factEntry.domains, 0.04)

    if (factEntry.kind === 'route.reachability') {
      if (text.includes('gardener-shadowed')) addNarrativeDomainBoost(boosts, 'gardener-interdiction', 4)
      if (/(route|gate|pinch|hub|anchor|crossroads|corridor)/.test(text)) addNarrativeDomainBoost(boosts, 'route-weather', 1.4)
    }

    if (factEntry.kind === 'star.activity' && !/quiet|moderate/.test(text)) {
      addNarrativeDomainBoost(boosts, 'stellar-events', 2.5)
      addNarrativeDomainBoost(boosts, 'medicine', 0.6)
      addNarrativeDomainBoost(boosts, 'disaster', 0.6)
    }

    if (factEntry.kind === 'gu.intensity') {
      if (/rich/.test(text)) addNarrativeDomainBoost(boosts, 'route-weather', 0.8)
      if (/dangerous|fracture|major|shear/.test(text)) {
        addNarrativeDomainBoost(boosts, 'route-weather', 1.8)
        addNarrativeDomainBoost(boosts, 'disaster', 0.8)
      }
    }

    if (/(flare|coronal|eclipse|stellar|white-dwarf|brown dwarf|periastron|radiation storm)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'stellar-events', 1.6)
    }
    if (/(gardener|sol-interdiction|interdiction|exclusion picket|compliance office|sealed sol)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'gardener-interdiction', 1.8)
    }
    if (/(life-support|shipyard|repair|maintenance|radiator|power|shield|replacement part|fuel depot)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'infrastructure', 1.3)
    }
    if (/(terraform|climate|mirror|volatile import|garden dome|greenhouse|failed garden|failed terraforming)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'terraforming', 1.5)
    }
    if (/(route weather|safe window|bleed-window|metric weather|pinch forecast|stormbound|schedule failure|calibration scar|moving node|iggygate|pinchdrive)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'route-weather', 1.2)
    }
    if (/(falsified|censored|erased|records|archive|casualty|evidence|forged|deleted|witness)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'information-integrity', 1.3)
    }
    if (/(medical|medicine|clinic|triage|exposure|neurological|vestibular|treatment|quarantine ward|chiral contamination|chirality stock)/.test(text)) {
      addNarrativeDomainBoost(boosts, 'medicine', 1.4)
    }
  })

  return boosts
}

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback
}

function narrativeStructureWeight(
  structure: NarrativeStructure,
  options: GenerationOptions,
  domainBoosts: ReadonlyMap<string, number>
): number {
  const domains = structure.domains ?? []
  const baseWeight = finiteNonNegative(structure.baseWeight, 1)
  const contextBoost = domains.length
    ? domains.reduce((sum, domain) => sum + (domainBoosts.get(domain) ?? 0), 0) / domains.length
    : 0
  const domainBias = domains.length
    ? Math.max(...domains.map((domain) => finiteNonNegative(options.narrativeBias?.domains?.[domain], 1)))
    : 1
  const structureBias = finiteNonNegative(options.narrativeBias?.structures?.[structure.id], 1)

  return baseWeight * (1 + contextBoost) * domainBias * structureBias
}

function pickWeightedNarrativeStructure(
  rng: SeededRng,
  structures: readonly NarrativeStructure[],
  options: GenerationOptions,
  domainBoosts: ReadonlyMap<string, number>
): NarrativeStructure {
  const weighted = structures.map((structure) => ({
    structure,
    weight: narrativeStructureWeight(structure, options, domainBoosts),
  }))
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0)

  if (totalWeight <= 0) return pickOne(rng, structures)

  let roll = rng.float(0, totalWeight)
  for (const entry of weighted) {
    roll -= entry.weight
    if (roll <= 0) return entry.structure
  }

  return weighted[weighted.length - 1].structure
}

function narrativeDomainsForStructure(structureDomains: readonly string[] | undefined, variables: Record<string, Fact<string>>): string[] {
  const variableDomains = Object.values(variables).flatMap((variable) => narrativeDomainsForText(variable.value))
  return uniqueStrings([...(structureDomains ?? []), ...variableDomains]).slice(0, 4)
}

function generateNarrativeLines(
  rng: SeededRng,
  options: GenerationOptions,
  narrativeFacts: readonly NarrativeFact[]
): NarrativeLine[] {
  const count =
    options.tone === 'cinematic' || options.gu === 'fracture' ? 5 :
    options.gu === 'high' || options.settlements === 'hub' || options.settlements === 'crowded' ? 4 :
    3
  const availableStructures = [...narrativeStructures]
  const domainBoosts = deriveNarrativeDomainBoosts(narrativeFacts)

  return Array.from({ length: Math.min(count, availableStructures.length) }, (_, index) => {
    const structure = pickWeightedNarrativeStructure(rng, availableStructures, options, domainBoosts)
    availableStructures.splice(availableStructures.findIndex((candidate) => candidate.id === structure.id), 1)
    const variables: Record<string, Fact<string>> = {}
    const factsUsed = new Set<string>()

    for (const [slot, poolName] of Object.entries(structure.slots)) {
      const factPool = candidatesFromFacts(narrativeFacts, poolName)
      const fallbackPool = fallbackCandidates(poolName, narrativeVariablePools[poolName] ?? [])
      const pool = uniqueByNormalizedValue([...factPool, ...fallbackPool])
      const blockedValues = new Set(
        (structure.distinctSlots ?? [])
          .filter(([left, right]) => right === slot && variables[left])
          .map(([left]) => variables[left].value)
      )
      const eligibleFactPool = factPool.filter((candidate) => !blockedValues.has(candidate.value))
      const eligiblePool = pool.filter((candidate) => !blockedValues.has(candidate.value))
      const preferredPool = eligibleFactPool.length && rng.chance(0.85) ? eligibleFactPool : eligiblePool
      const value = pickWeightedCandidate(rng, preferredPool.length ? preferredPool : pool)
      if (value.factId) factsUsed.add(value.factId)
      variables[slot] = fact(value.value, value.confidence, value.source)
    }

    if (!factsUsed.size) {
      for (const [slot, poolName] of Object.entries(structure.slots)) {
        const factCandidate = candidatesFromFacts(narrativeFacts, poolName).find((candidate) =>
          !(structure.distinctSlots ?? []).some(([left, right]) =>
            right === slot && variables[left]?.value === candidate.value
          )
        )
        if (!factCandidate) continue
        if (factCandidate.factId) factsUsed.add(factCandidate.factId)
        variables[slot] = fact(factCandidate.value, factCandidate.confidence, factCandidate.source)
        break
      }
    }

    const text = normalizeNarrativeText(structure.template.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, slot: string) => {
      return variables[slot]?.value ?? placeholder
    }))
    const domains = narrativeDomainsForStructure(structure.domains, variables)

    return {
      id: `narrative-${index + 1}`,
      structureId: fact(structure.id, 'human-layer', 'Narrative structure id'),
      label: fact(structure.label, 'human-layer', 'Narrative structure label'),
      motif: structure.motif ? fact(structure.motif, 'human-layer', 'Narrative motif') : undefined,
      domains: domains.map((domain) => fact(domain, 'human-layer', 'Narrative domain inferred from structure and resolved facts')),
      text: fact(text, 'human-layer', 'Generated narrative structure with narrative fact ledger and fallback variable pools'),
      variables,
      factsUsed: [...factsUsed],
      factsIntroduced: [],
    }
  })
}

function generateNarrativeThreads(lines: readonly NarrativeLine[], narrativeFacts: readonly NarrativeFact[]): NarrativeThread[] {
  const factsById = new Map(narrativeFacts.map((factEntry) => [factEntry.id, factEntry]))

  return lines.map((line, index) => {
    const usedFacts = line.factsUsed.map((factId) => factsById.get(factId)).filter((factEntry): factEntry is NarrativeFact => Boolean(factEntry))
    const pressureFact = usedFacts.find((factEntry) => factEntry.tags.includes('pressure') || factEntry.tags.includes('hazard'))
    const secretFact = usedFacts.find((factEntry) => factEntry.status === 'secret' || factEntry.tags.includes('secret'))
    const publicFact = usedFacts.find((factEntry) => factEntry.subjectType === 'settlement' || factEntry.subjectType === 'ruin')
    const domains = line.domains.map((domain) => domain.value)
    const publicSubject = smoothTechnicalPhrase(publicFact ? sentenceFragment(publicFact.value.value) : line.label.value.toLowerCase())
    const pressureText =
      (pressureFact ? narrativeSlotDisplayValue(pressureFact, 'pressures') : undefined) ??
      line.variables.pressure?.value ??
      line.variables.threat?.value ??
      line.variables.stake?.value
    const secretText = (secretFact ? narrativeSlotDisplayValue(secretFact, 'secrets') : undefined) ?? Object.values(line.variables).find((variable) => variable.source?.includes('secrets'))?.value

    const beats = [
      {
        id: `${line.id}-beat-1`,
        kind: 'public-premise' as const,
        text: fact(line.text.value, 'human-layer', 'Narrative thread premise from generated line'),
        factsUsed: line.factsUsed,
      },
      {
        id: `${line.id}-beat-2`,
        kind: 'pressure' as const,
        text: fact(
          pressureText
            ? `Immediate pressure centers on ${stripTerminalPunctuation(lowerFirst(pressureText))}.`
            : 'Immediate pressure comes from the dispute itself.',
          'human-layer',
          'Narrative thread pressure synthesized from fact ledger'
        ),
        factsUsed: pressureFact ? [pressureFact.id] : line.factsUsed,
      },
      {
        id: `${line.id}-beat-3`,
        kind: 'hidden-cause' as const,
        text: fact(
          secretText
            ? hiddenCauseBeatText(secretText)
            : `The hidden cause is still disputed because ${lowerFirst(publicSubject)} is the only reliable anchor.`,
          'human-layer',
          'Narrative thread hidden cause synthesized from fact ledger'
        ),
        factsUsed: secretFact ? [secretFact.id] : line.factsUsed,
      },
      {
        id: `${line.id}-beat-4`,
        kind: 'choice' as const,
        text: fact(choiceBeatText(domains, secretText, publicSubject), 'human-layer', 'Narrative thread choice synthesized from domains and fact ledger'),
        factsUsed: line.factsUsed,
      },
    ]

    return {
      id: `thread-${index + 1}`,
      title: fact(line.label.value, 'human-layer', 'Narrative thread title from source line'),
      domains: line.domains,
      motif: line.motif,
      lineIds: [line.id],
      beats,
      factsUsed: line.factsUsed,
      factsIntroduced: line.factsIntroduced,
    }
  })
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
  const settlements = generateSettlements(rootRng.fork('settlements'), options, name.value, bodies, guOverlay, reachability, architectureResult.architecture.name.value)
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
  })
  const narrativeLines = generateNarrativeLines(rootRng.fork('narrative-lines'), options, narrativeFacts)
  const narrativeThreads = generateNarrativeThreads(narrativeLines, narrativeFacts)

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
    settlements,
    ruins,
    phenomena,
    narrativeFacts,
    narrativeLines,
    narrativeThreads,
    majorHazards: [guOverlay.hazard, fact(primary.activity.value, 'inferred', 'Stellar activity hazard')],
  })
}

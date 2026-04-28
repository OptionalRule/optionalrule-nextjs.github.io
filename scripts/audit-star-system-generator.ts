import { generateSystem } from '../src/features/tools/star_system_generator/lib/generator/index'
import {
  coldThermalZones as coldZones,
  envelopeCategories,
  fullPlanetCategories,
  giantCategories,
  minorBodyCategories,
  rockyChainCategories,
  solidSurfaceCategories,
} from '../src/features/tools/star_system_generator/lib/generator/domain'
import { frontierStarTypes, realisticStarTypes } from '../src/features/tools/star_system_generator/lib/generator/tables'
import type {
  BodyCategory,
  GeneratedSystem,
  GenerationOptions,
  GeneratorDistribution,
  GeneratorTone,
  GuPreference,
  OrbitingBody,
  Settlement,
  SettlementDensity,
} from '../src/features/tools/star_system_generator/types'

type Severity = 'error' | 'warning'

interface Finding {
  severity: Severity
  seed: string
  path: string
  message: string
}

interface CorpusStats {
  systems: number
  bodies: number
  settlements: number
  moons: number
  multiStarSystems: number
  systemNames: Map<string, number>
  bodyNames: Map<string, number>
  firstBodyNames: Map<string, number>
  moonNames: Map<string, number>
  settlementNames: Map<string, number>
  bodyInterestPhrases: Map<string, number>
  settlementWhyHerePhrases: Map<string, number>
  settlementTagHookPhrases: Map<string, number>
  starTypes: Map<string, number>
  starTypesByDistribution: Record<GeneratorDistribution, Map<string, number>>
  architectures: Map<string, number>
  bodyClasses: Map<string, number>
  categoriesByArchitecture: Map<string, Map<BodyCategory, number>>
  categories: Map<BodyCategory, number>
  atmospheres: Map<string, number>
  hydrospheres: Map<string, number>
  geologies: Map<string, number>
  radiation: Map<string, number>
  biospheres: Map<string, number>
  moonTypes: Map<string, number>
  ringTypes: Map<string, number>
  settlementCategories: Map<string, number>
  settlementCountsByDensity: Record<SettlementDensity, number[]>
  settlementPresenceRolls: Map<number, number>
  settlementPresenceTiers: Map<string, number>
  settlementScales: Map<string, number>
  guIntensityByPreference: Record<GuPreference, Map<string, number>>
  guBehaviors: Map<string, number>
  guResources: Map<string, number>
  guHazards: Map<string, number>
  guIntensityModifiers: Map<string, number>
  companionTypes: Map<string, number>
  companionSeparations: Map<string, number>
  activityModifiers: Map<string, number>
  reachabilityModifiers: Map<string, number>
  reachabilityClasses: Map<string, number>
}

const auditProfiles = {
  quick: 3,
  default: 10,
  deep: 50,
} as const

const auditProfile = (process.env.STAR_SYSTEM_AUDIT_PROFILE ?? 'default') as keyof typeof auditProfiles
const profileCorpusPerOption = auditProfiles[auditProfile] ?? auditProfiles.default
const corpusPerOption = Number.parseInt(process.env.STAR_SYSTEM_AUDIT_COUNT_PER_OPTION ?? String(profileCorpusPerOption), 10)
const findingLimit = Number.parseInt(process.env.STAR_SYSTEM_AUDIT_FINDING_LIMIT ?? '50', 10)
const distributions: GeneratorDistribution[] = ['frontier', 'realistic']
const tones: GeneratorTone[] = ['balanced', 'astronomy', 'cinematic']
const guPreferences: GuPreference[] = ['low', 'normal', 'high', 'fracture']
const settlementDensities: SettlementDensity[] = ['sparse', 'normal', 'crowded', 'hub']

const extremeHotZones = new Set(['Furnace', 'Inferno'])

const forbiddenAlienPatterns = [
  /\balien\b/i,
  /\bnonhuman\b/i,
  /\bnative\s+civilization\b/i,
  /\bancient\s+cities\b/i,
  /\bforbidden\s+archaeology\b/i,
]

const extremeHotAllowedAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'Rock-vapor atmosphere',
  'Metal vapor atmosphere',
  'Chiral-active atmosphere',
])

const extremeHotAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

const coldAllowedClimateTags = new Set([
  'Snowball',
  'Cold desert',
  'Aerosol winter',
  'Methane cycle',
  'CO2 glacier cycle',
  'Dark-sector gravity tides',
])

const envelopeAllowedGeologies = new Set([
  'Deep atmospheric circulation',
  'Metallic hydrogen interior',
  'Layered volatile mantle',
  'Magnetosphere-driven weather',
])

const anomalyAllowedGeologies = new Set([
  'Artificial platform or engineered substrate',
  'Metric shear geometry',
])

const guFractureFunctionsBySiteCategory: Record<string, ReadonlySet<string>> = {
  'Surface settlement': new Set(['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station']),
  'Orbital station': new Set(['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station', 'Pinchdrive tuning station']),
  'Asteroid or belt base': new Set(['Chiral harvesting site', 'Dark-sector ore extraction', 'Programmable-matter containment site', 'Quarantine station']),
  'Moon base': new Set(['Chiral harvesting site', 'Dark-sector ore extraction', 'Narrow-AI observiverse facility', 'Quarantine station']),
  'Deep-space platform': new Set(['Moving bleed-node tracking platform', 'Pinchdrive tuning station', 'Narrow-AI observiverse facility', 'Quarantine station']),
  'Gate or route node': new Set(['Iggygate control station', 'Pinchdrive tuning station', 'Quarantine station', 'Narrow-AI observiverse facility']),
  'Mobile site': new Set(['Moving bleed-node harvest fleet', 'Freeport', 'Smuggler port', 'Refugee settlement', 'Naval logistics depot']),
  'Derelict or restricted site': new Set(['Programmable-matter containment site', 'Intelligence black site', 'Quarantine station', 'Weapons test range']),
}

const allowedBuiltFormsBySiteCategory: Record<string, ReadonlySet<string>> = {
  'Surface settlement': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Lava-tube arcology',
    'Dome cluster',
    'Rail-linked terminator city',
    'Aerostat city',
    'Submarine habitat',
    'Borehole habitat',
    'Shielded military bunker',
    'Corporate luxury enclave',
    'First-wave retrofitted ruin',
  ]),
  'Orbital station': new Set([
    'Inflatable modules',
    'Rotating cylinder',
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Corporate luxury enclave',
    'Slum raft cluster',
    'Shielded military bunker',
  ]),
  'Asteroid or belt base': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Asteroid hollow',
    'Modular orbital lattice',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
  ]),
  'Moon base': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Dome cluster',
    'Borehole habitat',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
  ]),
  'Deep-space platform': new Set([
    'Inflatable modules',
    'Rotating cylinder',
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Corporate luxury enclave',
    'Slum raft cluster',
    'Shielded military bunker',
  ]),
  'Gate or route node': new Set([
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Shielded military bunker',
    'Partly self-growing programmable structure',
  ]),
  'Mobile site': new Set([
    'Inflatable modules',
    'Crawling mobile base',
    'Modular orbital lattice',
    'Rotating cylinder',
    'Shielded military bunker',
  ]),
  'Derelict or restricted site': new Set([
    'Asteroid hollow',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
    'Partly self-growing programmable structure',
  ]),
}

function increment<Key>(map: Map<Key, number>, key: Key): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function nestedIncrement<OuterKey, InnerKey>(map: Map<OuterKey, Map<InnerKey, number>>, outerKey: OuterKey, innerKey: InnerKey): void {
  const innerMap = map.get(outerKey) ?? new Map<InnerKey, number>()
  increment(innerMap, innerKey)
  map.set(outerKey, innerMap)
}

function makeSeed(options: Omit<GenerationOptions, 'seed'>, index: number): string {
  return [
    'ssg-audit',
    options.distribution,
    options.tone,
    options.gu,
    options.settlements,
    index.toString(16).padStart(4, '0'),
  ].join('-')
}

function makeOptions(
  distribution: GeneratorDistribution,
  tone: GeneratorTone,
  gu: GuPreference,
  settlements: SettlementDensity,
  index: number
): GenerationOptions {
  const options = {
    distribution,
    tone,
    gu,
    settlements,
  }

  return {
    ...options,
    seed: makeSeed(options, index),
  }
}

function addFinding(findings: Finding[], severity: Severity, seed: string, path: string, message: string): void {
  findings.push({ severity, seed, path, message })
}

function assertText(
  findings: Finding[],
  seed: string,
  path: string,
  value: string | undefined,
  label: string
): void {
  if (!value || value.trim().length === 0) {
    addFinding(findings, 'error', seed, path, `${label} is missing or blank.`)
  }
}

function collectStrings(value: unknown, path = '$'): Array<{ path: string; value: string }> {
  if (typeof value === 'string') return [{ path, value }]
  if (typeof value !== 'object' || value === null) return []
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`))
  }

  return Object.entries(value).flatMap(([key, entry]) => {
    if (key === 'noAlienCheck') return []
    if (key === 'source') return []
    return collectStrings(entry, `${path}.${key}`)
  })
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

function phraseKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7)
    .join(' ')
}

function countBodiesByCategory(system: GeneratedSystem, categories: ReadonlySet<BodyCategory>): number {
  return system.bodies.filter((body) => categories.has(body.category.value)).length
}

function auditArchitectureIntent(system: GeneratedSystem, findings: Finding[]): void {
  const seed = system.seed
  const architecture = system.architecture.name.value
  const fullPlanets = countBodiesByCategory(system, fullPlanetCategories)
  const minorBodies = countBodiesByCategory(system, minorBodyCategories)
  const rockyChainBodies = countBodiesByCategory(system, rockyChainCategories)
  const giants = countBodiesByCategory(system, giantCategories)

  if (architecture === 'Failed system') {
    if (fullPlanets > 3) {
      addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Failed system generated ${fullPlanets} full planets.`)
    }
    if (minorBodies < 2) {
      addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Failed system generated only ${minorBodies} debris/minor bodies.`)
    }
  }

  if (architecture === 'Debris-dominated') {
    if (minorBodies < 2 || minorBodies + 1 < fullPlanets) {
      addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Debris-dominated system has ${minorBodies} debris/minor bodies versus ${fullPlanets} full planets.`)
    }
  }

  if (architecture === 'Sparse rocky') {
    if (rockyChainBodies < 1) {
      addFinding(findings, 'error', seed, 'architecture.bodyPlan', 'Sparse rocky system lacks a rocky/super-terrestrial/sub-Neptune survivor.')
    }
    if (giants > 1) {
      addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Sparse rocky system generated ${giants} giants.`)
    }
  }

  if (architecture === 'Compact inner system' && rockyChainBodies < 3) {
    addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Compact inner system generated only ${rockyChainBodies} rocky/super-Earth/sub-Neptune bodies.`)
  }

  if (architecture === 'Peas-in-a-pod chain' && rockyChainBodies < 4) {
    addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Peas-in-a-pod chain generated only ${rockyChainBodies} chain bodies.`)
  }

  if (architecture === 'Solar-ish mixed' && giants < 1) {
    addFinding(findings, 'error', seed, 'architecture.bodyPlan', 'Solar-ish mixed system lacks a giant planet.')
  }

  if (architecture === 'Migrated giant' && giants < 1) {
    addFinding(findings, 'error', seed, 'architecture.bodyPlan', 'Migrated giant architecture lacks a generated giant.')
  }

  if (architecture === 'Giant-rich or chaotic' && giants < 2) {
    addFinding(findings, 'error', seed, 'architecture.bodyPlan', `Giant-rich or chaotic system generated only ${giants} giants.`)
  }
}

function auditBody(system: GeneratedSystem, body: OrbitingBody, bodyIndex: number, findings: Finding[]): void {
  const seed = system.seed
  const path = `bodies[${bodyIndex}]`
  const category = body.category.value
  const thermalZone = body.thermalZone.value

  assertText(findings, seed, `${path}.name`, body.name.value, 'Body name')
  assertText(findings, seed, `${path}.bodyClass`, body.bodyClass.value, 'Body class')
  assertText(findings, seed, `${path}.whyInteresting`, body.whyInteresting.value, 'Body interest summary')

  if (body.orbitAu.value <= 0) {
    addFinding(findings, 'error', seed, `${path}.orbitAu`, `Orbit must be positive; got ${body.orbitAu.value}.`)
  }

  if (extremeHotZones.has(thermalZone) && !envelopeCategories.has(category) && category !== 'anomaly') {
    if (!extremeHotAllowedAtmospheres.has(body.detail.atmosphere.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.atmosphere`, `${thermalZone} world has implausible atmosphere "${body.detail.atmosphere.value}".`)
    }
    if (!extremeHotAllowedHydrospheres.has(body.detail.hydrosphere.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.hydrosphere`, `${thermalZone} world has implausible hydrosphere "${body.detail.hydrosphere.value}".`)
    }
  }

  if (extremeHotZones.has(thermalZone)) {
    if (body.detail.biosphere.value !== 'Sterile') {
      addFinding(findings, 'error', seed, `${path}.detail.biosphere`, `${thermalZone} world has non-sterile biosphere "${body.detail.biosphere.value}".`)
    }
    if (body.moons.length > 0) {
      addFinding(findings, 'error', seed, `${path}.moons`, `${thermalZone} world generated ${body.moons.length} moons.`)
    }
  }

  if (coldZones.has(thermalZone) && solidSurfaceCategories.has(category)) {
    const badClimate = body.detail.climate.find((tag) => !coldAllowedClimateTags.has(tag.value))
    if (badClimate) {
      addFinding(findings, 'error', seed, `${path}.detail.climate`, `${thermalZone} solid body has hot/temperate climate tag "${badClimate.value}".`)
    }
  }

  if (envelopeCategories.has(category)) {
    if (!body.physical.volatileEnvelope.value) {
      addFinding(findings, 'error', seed, `${path}.physical.volatileEnvelope`, `${category} should be marked as a volatile-envelope world.`)
    }
    if (body.detail.biosphere.value !== 'Sterile') {
      addFinding(findings, 'error', seed, `${path}.detail.biosphere`, `${category} generated non-sterile biosphere "${body.detail.biosphere.value}".`)
    }
    if (!envelopeAllowedGeologies.has(body.detail.geology.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.geology`, `${category} has surface geology "${body.detail.geology.value}".`)
    }
    if (!body.physical.gravityLabel.value.startsWith('Cloud-top/envelope estimate')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, `${category} gravity label should be an envelope estimate.`)
    }
  } else if (category !== 'anomaly' && body.physical.volatileEnvelope.value) {
    addFinding(findings, 'error', seed, `${path}.physical.volatileEnvelope`, `${category} should not be marked as a volatile-envelope world.`)
  }

  if (category === 'belt') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      addFinding(findings, 'error', seed, `${path}.physical`, 'Belt should not have mass or surface gravity estimates.')
    }
    if (!body.physical.gravityLabel.value.includes('distributed belt')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, 'Belt gravity label should explain distributed belt/swarm.')
    }
    if (body.detail.geology.value !== 'Minor-body rubble and collision families') {
      addFinding(findings, 'error', seed, `${path}.detail.geology`, `Belt has non-belt geology "${body.detail.geology.value}".`)
    }
  }

  if (category === 'anomaly') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      addFinding(findings, 'error', seed, `${path}.physical`, 'Anomaly should not have ordinary mass or gravity estimates.')
    }
    if (!body.physical.gravityLabel.value.startsWith('Unreliable')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, 'Anomaly gravity label should be marked unreliable.')
    }
    if (body.rings) {
      addFinding(findings, 'error', seed, `${path}.rings`, 'Anomaly should not use ordinary planet ring generation.')
    }
    if (body.moons.length > 0) {
      addFinding(findings, 'error', seed, `${path}.moons`, 'Anomaly should not use ordinary moon generation.')
    }
    if (!anomalyAllowedGeologies.has(body.detail.geology.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.geology`, `Anomaly has ordinary planet geology "${body.detail.geology.value}".`)
    }
  }

  if (!envelopeCategories.has(category) && category !== 'belt' && category !== 'anomaly') {
    if (body.physical.massEarth.value === null || body.physical.surfaceGravityG.value === null) {
      addFinding(findings, 'error', seed, `${path}.physical`, `${category} is missing mass or gravity estimates.`)
    }
    if (!body.physical.gravityLabel.value.startsWith('Estimated surface gravity')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, `${category} gravity label should be a surface estimate.`)
    }
  }

  if (body.rings && category !== 'gas-giant' && category !== 'ice-giant') {
    addFinding(findings, 'error', seed, `${path}.rings`, `${category} generated a ring system.`)
  }

  if (hasDuplicates(body.moons.map((moon) => moon.name.value))) {
    addFinding(findings, 'warning', seed, `${path}.moons`, 'Moon names repeat around the same body.')
  }

  body.moons.forEach((moon, moonIndex) => {
    assertText(findings, seed, `${path}.moons[${moonIndex}].moonType`, moon.moonType.value, 'Moon type')
    assertText(findings, seed, `${path}.moons[${moonIndex}].use`, moon.use.value, 'Moon use')
  })
}

function auditSettlement(system: GeneratedSystem, settlement: Settlement, settlementIndex: number, findings: Finding[]): void {
  const seed = system.seed
  const path = `settlements[${settlementIndex}]`
  const body = system.bodies.find((candidate) => candidate.id === settlement.bodyId)
  const siteCategory = settlement.siteCategory.value
  const allowedBuiltForms = allowedBuiltFormsBySiteCategory[siteCategory]

  assertText(findings, seed, `${path}.name`, settlement.name.value, 'Settlement name')
  assertText(findings, seed, `${path}.anchorDetail`, settlement.anchorDetail.value, 'Settlement anchor detail')
  assertText(findings, seed, `${path}.function`, settlement.function.value, 'Settlement function')
  assertText(findings, seed, `${path}.whyHere`, settlement.whyHere.value, 'Settlement reason')
  assertText(findings, seed, `${path}.tagHook`, settlement.tagHook.value, 'Settlement tag hook')

  if (!body) {
    addFinding(findings, 'error', seed, `${path}.bodyId`, `Settlement references missing body "${settlement.bodyId}".`)
    return
  }

  const tags = settlement.tags.map((tag) => tag.value)
  if (tags.length < 2) {
    addFinding(findings, 'error', seed, `${path}.tags`, 'Settlement has fewer than two tags.')
  } else if (hasDuplicates(tags)) {
    addFinding(findings, 'error', seed, `${path}.tags`, `Settlement repeats tag pair "${tags.join(' + ')}".`)
  }

  if (!allowedBuiltForms) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Unknown site category "${siteCategory}".`)
  } else if (!allowedBuiltForms.has(settlement.builtForm.value)) {
    addFinding(findings, 'error', seed, `${path}.builtForm`, `${siteCategory} has incompatible built form "${settlement.builtForm.value}".`)
  }

  if (system.guOverlay.intensity.value.includes('fracture') || system.guOverlay.intensity.value.includes('shear')) {
    const allowedFunctions = guFractureFunctionsBySiteCategory[siteCategory]
    if (!allowedFunctions?.has(settlement.function.value)) {
      addFinding(findings, 'error', seed, `${path}.function`, `${siteCategory} has incompatible GU fracture/shear function "${settlement.function.value}".`)
    }
  }

  if (siteCategory === 'Moon base') {
    if (!settlement.moonId) {
      addFinding(findings, 'error', seed, `${path}.moonId`, 'Moon base lacks a moon id.')
    } else if (!body.moons.some((moon) => moon.id === settlement.moonId)) {
      addFinding(findings, 'error', seed, `${path}.moonId`, `Moon base references missing moon "${settlement.moonId}".`)
    }
  } else if (settlement.moonId) {
    addFinding(findings, 'error', seed, `${path}.moonId`, `${siteCategory} should not carry a moon id.`)
  }

  if (siteCategory === 'Surface settlement' && envelopeCategories.has(body.category.value)) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Surface settlement anchored to ${body.category.value}.`)
  }

  if (siteCategory === 'Surface settlement' && extremeHotZones.has(body.thermalZone.value)) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Surface settlement anchored to ${body.thermalZone.value} body.`)
  }

  if (settlement.methodNotes.length === 0 || settlement.methodNotes.some((note) => !note.value.trim())) {
    addFinding(findings, 'error', seed, `${path}.methodNotes`, 'Settlement method notes are missing or blank.')
  }

  for (const [component, fact] of Object.entries(settlement.presence)) {
    if (typeof fact.value === 'number' && !Number.isFinite(fact.value)) {
      addFinding(findings, 'error', seed, `${path}.presence.${component}`, 'Presence component is not finite.')
    } else if (typeof fact.value === 'string' && fact.value.trim().length === 0) {
      addFinding(findings, 'error', seed, `${path}.presence.${component}`, 'Presence text component is blank.')
    }
  }

  if (settlement.presence.roll.value < 2 || settlement.presence.roll.value > 12) {
    addFinding(findings, 'error', seed, `${path}.presence.roll`, `Presence roll must be 2-12; got ${settlement.presence.roll.value}.`)
  }

  if (!settlement.scale.value.trim()) {
    addFinding(findings, 'error', seed, `${path}.scale`, 'Settlement scale is blank.')
  }
}

function auditSystem(system: GeneratedSystem, findings: Finding[], stats: CorpusStats): void {
  const seed = system.seed
  stats.systems += 1
  stats.bodies += system.bodies.length
  stats.settlements += system.settlements.length
  stats.moons += system.bodies.reduce((total, body) => total + body.moons.length, 0)
  if (system.companions.length > 0) stats.multiStarSystems += 1
  increment(stats.systemNames, system.name.value)
  increment(stats.starTypes, system.primary.spectralType.value)
  increment(stats.starTypesByDistribution[system.options.distribution], system.primary.spectralType.value)
  increment(stats.architectures, system.architecture.name.value)
  increment(stats.reachabilityClasses, system.reachability.className.value)
  increment(stats.guIntensityByPreference[system.options.gu], system.guOverlay.intensity.value)
  increment(stats.guBehaviors, system.guOverlay.bleedBehavior.value)
  increment(stats.guResources, system.guOverlay.resource.value)
  increment(stats.guHazards, system.guOverlay.hazard.value)
  system.guOverlay.intensityModifiers.forEach((modifier) => increment(stats.guIntensityModifiers, modifier.value))
  stats.settlementCountsByDensity[system.options.settlements].push(system.settlements.length)
  system.primary.activityModifiers.forEach((modifier) => increment(stats.activityModifiers, modifier.value))
  system.reachability.modifiers.forEach((modifier) => increment(stats.reachabilityModifiers, modifier.value))
  system.companions.forEach((companion) => {
    increment(stats.companionTypes, companion.companionType.value)
    increment(stats.companionSeparations, companion.separation.value)
  })
  system.bodies.forEach((body, bodyIndex) => {
    increment(stats.bodyNames, body.name.value)
    if (bodyIndex === 0) increment(stats.firstBodyNames, body.name.value)
    increment(stats.bodyInterestPhrases, phraseKey(body.whyInteresting.value))
    increment(stats.categories, body.category.value)
    increment(stats.bodyClasses, body.bodyClass.value)
    increment(stats.atmospheres, body.detail.atmosphere.value)
    increment(stats.hydrospheres, body.detail.hydrosphere.value)
    increment(stats.geologies, body.detail.geology.value)
    increment(stats.radiation, body.detail.radiation.value)
    increment(stats.biospheres, body.detail.biosphere.value)
    if (body.rings) increment(stats.ringTypes, body.rings.type.value)
    body.moons.forEach((moon) => {
      increment(stats.moonNames, moon.name.value)
      increment(stats.moonTypes, moon.moonType.value)
    })
    nestedIncrement(stats.categoriesByArchitecture, system.architecture.name.value, body.category.value)
  })
  system.settlements.forEach((settlement) => {
    increment(stats.settlementNames, settlement.name.value)
    increment(stats.settlementWhyHerePhrases, phraseKey(settlement.whyHere.value))
    increment(stats.settlementTagHookPhrases, phraseKey(settlement.tagHook.value))
    increment(stats.settlementCategories, settlement.siteCategory.value)
    increment(stats.settlementPresenceRolls, settlement.presence.roll.value)
    increment(stats.settlementPresenceTiers, settlement.presence.tier.value)
    increment(stats.settlementScales, settlement.scale.value)
  })

  assertText(findings, seed, 'name', system.name.value, 'System name')
  assertText(findings, seed, 'primary.spectralType', system.primary.spectralType.value, 'Primary spectral type')

  if (!system.noAlienCheck.passed) {
    addFinding(findings, 'error', seed, 'noAlienCheck', 'No-alien check did not pass.')
  }

  if (!Number.isFinite(system.primary.activityRoll.value)) {
    addFinding(findings, 'error', seed, 'primary.activityRoll', 'Activity roll is not finite.')
  }

  if (system.primary.activityModifiers.some((modifier) => !modifier.value.trim())) {
    addFinding(findings, 'error', seed, 'primary.activityModifiers', 'Activity modifier is blank.')
  }

  if (!Number.isFinite(system.reachability.roll.value) || system.reachability.roll.value < 1 || system.reachability.roll.value > 12) {
    addFinding(findings, 'error', seed, 'reachability.roll', `Reachability roll must be clamped to 1-12; got ${system.reachability.roll.value}.`)
  }

  if (system.reachability.modifiers.some((modifier) => !modifier.value.trim())) {
    addFinding(findings, 'error', seed, 'reachability.modifiers', 'Reachability modifier is blank.')
  }

  if (!Number.isFinite(system.guOverlay.intensityRoll.value)) {
    addFinding(findings, 'error', seed, 'guOverlay.intensityRoll', 'GU intensity roll is not finite.')
  }

  assertText(findings, seed, 'guOverlay.bleedBehavior', system.guOverlay.bleedBehavior.value, 'GU bleed behavior')

  if (system.guOverlay.intensityModifiers.some((modifier) => !modifier.value.trim())) {
    addFinding(findings, 'error', seed, 'guOverlay.intensityModifiers', 'GU intensity modifier is blank.')
  }

  if (system.bodies.length === 0) {
    addFinding(findings, 'error', seed, 'bodies', 'System generated no orbital bodies.')
  }

  if (hasDuplicates(system.bodies.map((body) => body.id))) {
    addFinding(findings, 'error', seed, 'bodies', 'Body ids repeat within a system.')
  }

  if (hasDuplicates(system.bodies.map((body) => body.name.value))) {
    addFinding(findings, 'error', seed, 'bodies', 'Body names repeat within a system.')
  }

  if (hasDuplicates(system.settlements.map((settlement) => settlement.id))) {
    addFinding(findings, 'error', seed, 'settlements', 'Settlement ids repeat within a system.')
  }

  system.companions.forEach((companion, companionIndex) => {
    assertText(findings, seed, `companions[${companionIndex}].companionType`, companion.companionType.value, 'Companion type')
    assertText(findings, seed, `companions[${companionIndex}].separation`, companion.separation.value, 'Companion separation')
    assertText(findings, seed, `companions[${companionIndex}].planetaryConsequence`, companion.planetaryConsequence.value, 'Companion planetary consequence')
    assertText(findings, seed, `companions[${companionIndex}].guConsequence`, companion.guConsequence.value, 'Companion GU consequence')
    if (companion.rollMargin.value < 0) {
      addFinding(findings, 'error', seed, `companions[${companionIndex}].rollMargin`, `Companion generated with negative margin ${companion.rollMargin.value}.`)
    }
  })

  auditArchitectureIntent(system, findings)
  system.bodies.forEach((body, bodyIndex) => auditBody(system, body, bodyIndex, findings))
  system.settlements.forEach((settlement, settlementIndex) => auditSettlement(system, settlement, settlementIndex, findings))

  for (const text of collectStrings(system)) {
    const forbiddenPattern = forbiddenAlienPatterns.find((pattern) => pattern.test(text.value))
    if (forbiddenPattern) {
      addFinding(findings, 'error', seed, text.path, `Forbidden no-alien phrase survived: "${text.value}".`)
    }
  }
}

function auditCoverage(stats: CorpusStats, findings: Finding[]): void {
  const syntheticSeed = 'corpus'
  const expectedStarTypes = ['M dwarf', 'K star', 'G star', 'F star', 'O/B/A bright star', 'White dwarf/remnant', 'Brown dwarf/substellar primary']
  const expectedCategories: BodyCategory[] = [
    'rocky-planet',
    'super-earth',
    'sub-neptune',
    'gas-giant',
    'ice-giant',
    'belt',
    'dwarf-body',
    'rogue-captured',
    'anomaly',
  ]

  for (const starType of expectedStarTypes) {
    if (!stats.starTypes.has(starType)) {
      addFinding(findings, 'warning', syntheticSeed, 'primary.spectralType', `Corpus did not produce star type "${starType}".`)
    }
  }

  for (const category of expectedCategories) {
    if (!stats.categories.has(category)) {
      addFinding(findings, 'warning', syntheticSeed, 'bodies.category', `Corpus did not produce body category "${category}".`)
    }
  }

  const bodyClassEntries = [...stats.bodyClasses.entries()]
  const topBodyClass = bodyClassEntries.sort(([, left], [, right]) => right - left)[0]
  if (topBodyClass && topBodyClass[1] / stats.bodies > 0.18) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.bodyClass', `Body class "${topBodyClass[0]}" accounts for more than 18% of generated bodies.`)
  }

  const moonTypeEntries = [...stats.moonTypes.entries()]
  const topMoonType = moonTypeEntries.sort(([, left], [, right]) => right - left)[0]
  if (topMoonType && topMoonType[1] / stats.moons > 0.2) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.moons.moonType', `Moon type "${topMoonType[0]}" accounts for more than 20% of generated moons.`)
  }

  auditNameConcentration(findings, stats.systemNames, stats.systems, 'name', 'System name', 0.02)
  auditNameConcentration(findings, stats.firstBodyNames, stats.systems, 'bodies[0].name', 'First body name', 0.03)
  auditNameConcentration(findings, stats.settlementNames, stats.settlements, 'settlements.name', 'Settlement name', 0.02)
  auditNameConcentration(findings, stats.moonNames, stats.moons, 'bodies.moons.name', 'Moon name', 0.03)
  auditPhraseConcentration(findings, stats.bodyInterestPhrases, stats.bodies, 'bodies.whyInteresting', 'Body interest opening', 0.18)
  auditPhraseConcentration(findings, stats.settlementWhyHerePhrases, stats.settlements, 'settlements.whyHere', 'Settlement reason opening', 0.18)
  auditPhraseConcentration(findings, stats.settlementTagHookPhrases, stats.settlements, 'settlements.tagHook', 'Settlement tag hook opening', 0.18)

  if (!stats.settlementCategories.has('Moon base')) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements.siteCategory', 'Corpus did not produce any moon-base settlements.')
  }

  if (!stats.settlementCategories.has('Surface settlement')) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements.siteCategory', 'Corpus did not produce any surface settlements.')
  }

  if (stats.settlements < stats.systems) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements', 'Average settlement count fell below one per system.')
  }

  if (stats.moons < stats.systems) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.moons', 'Average moon count fell below one per system.')
  }

  auditStarDistribution('realistic', realisticStarTypes, stats, findings)
  auditStarDistribution('frontier', frontierStarTypes, stats, findings)
}

function auditStarDistribution(
  distribution: GeneratorDistribution,
  table: typeof realisticStarTypes,
  stats: CorpusStats,
  findings: Finding[]
): void {
  const observed = stats.starTypesByDistribution[distribution]
  const sampleSize = [...observed.values()].reduce((sum, count) => sum + count, 0)
  const allowedDelta = Math.max(8, Math.ceil(sampleSize * 0.06))

  for (const entry of table) {
    const expected = ((entry.max - entry.min + 1) / 100) * sampleSize
    const actual = observed.get(entry.value.type) ?? 0
    if (Math.abs(actual - expected) > allowedDelta) {
      addFinding(
        findings,
        'error',
        'corpus',
        `primary.spectralType.${distribution}`,
        `${distribution} star type "${entry.value.type}" produced ${actual}; expected about ${expected.toFixed(1)} from d100 range ${entry.min}-${entry.max}.`
      )
    }
  }
}

function formatMap<Key>(map: Map<Key, number>): string {
  return [...map.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([key, count]) => `${String(key)}: ${count}`)
    .join(', ')
}

function uniqueSummary(map: Map<string, number>, total: number): string {
  const top = [...map.entries()].sort(([, left], [, right]) => right - left)[0]
  const topText = top ? `, top "${top[0]}" x${top[1]}` : ''
  return `${map.size}/${total}${topText}`
}

function auditNameConcentration(
  findings: Finding[],
  map: Map<string, number>,
  total: number,
  path: string,
  label: string,
  maxShare: number
): void {
  const top = [...map.entries()].sort(([, left], [, right]) => right - left)[0]
  if (top && total > 0 && top[1] / total > maxShare) {
    addFinding(findings, 'warning', 'corpus', path, `${label} "${top[0]}" appears ${top[1]} times, above ${(maxShare * 100).toFixed(1)}% concentration.`)
  }
}

function auditPhraseConcentration(
  findings: Finding[],
  map: Map<string, number>,
  total: number,
  path: string,
  label: string,
  maxShare: number
): void {
  const top = [...map.entries()].sort(([, left], [, right]) => right - left)[0]
  if (top && total > 0 && top[1] / total > maxShare) {
    addFinding(findings, 'warning', 'corpus', path, `${label} phrase "${top[0]}" appears ${top[1]} times, above ${(maxShare * 100).toFixed(1)}% concentration.`)
  }
}

function formatNestedCategoryMap(map: Map<string, Map<BodyCategory, number>>): string {
  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([architecture, categories]) => `${architecture} => ${formatMap(categories)}`)
    .join('\n')
}

function formatGuIntensityByPreference(stats: CorpusStats): string {
  return guPreferences
    .map((preference) => `${preference}: ${formatMap(stats.guIntensityByPreference[preference])}`)
    .join('\n')
}

function formatSettlementCountsByDensity(stats: CorpusStats): string {
  return settlementDensities
    .map((density) => {
      const counts = stats.settlementCountsByDensity[density]
      const average = counts.length
        ? counts.reduce((sum, count) => sum + count, 0) / counts.length
        : 0
      const min = counts.length ? Math.min(...counts) : 0
      const max = counts.length ? Math.max(...counts) : 0
      return `${density}: avg ${average.toFixed(2)}, range ${min}-${max}`
    })
    .join('\n')
}

const findings: Finding[] = []
const stats: CorpusStats = {
  systems: 0,
  bodies: 0,
  settlements: 0,
  moons: 0,
  multiStarSystems: 0,
  systemNames: new Map(),
  bodyNames: new Map(),
  firstBodyNames: new Map(),
  moonNames: new Map(),
  settlementNames: new Map(),
  bodyInterestPhrases: new Map(),
  settlementWhyHerePhrases: new Map(),
  settlementTagHookPhrases: new Map(),
  starTypes: new Map(),
  starTypesByDistribution: {
    frontier: new Map(),
    realistic: new Map(),
  },
  architectures: new Map(),
  bodyClasses: new Map(),
  categoriesByArchitecture: new Map(),
  categories: new Map(),
  atmospheres: new Map(),
  hydrospheres: new Map(),
  geologies: new Map(),
  radiation: new Map(),
  biospheres: new Map(),
  moonTypes: new Map(),
  ringTypes: new Map(),
  settlementCategories: new Map(),
  settlementCountsByDensity: {
    sparse: [],
    normal: [],
    crowded: [],
    hub: [],
  },
  settlementPresenceRolls: new Map(),
  settlementPresenceTiers: new Map(),
  settlementScales: new Map(),
  guIntensityByPreference: {
    low: new Map(),
    normal: new Map(),
    high: new Map(),
    fracture: new Map(),
  },
  guBehaviors: new Map(),
  guResources: new Map(),
  guHazards: new Map(),
  guIntensityModifiers: new Map(),
  companionTypes: new Map(),
  companionSeparations: new Map(),
  activityModifiers: new Map(),
  reachabilityModifiers: new Map(),
  reachabilityClasses: new Map(),
}

for (const distribution of distributions) {
  for (const tone of tones) {
    for (const gu of guPreferences) {
      for (const settlements of settlementDensities) {
        for (let index = 0; index < corpusPerOption; index += 1) {
          auditSystem(generateSystem(makeOptions(distribution, tone, gu, settlements, index)), findings, stats)
        }
      }
    }
  }
}

auditCoverage(stats, findings)

const errors = findings.filter((finding) => finding.severity === 'error')
const warnings = findings.filter((finding) => finding.severity === 'warning')

console.log('Star System Generator Audit')
console.log(`Profile: ${auditProfile in auditProfiles ? auditProfile : 'default'}`)
console.log(`Option matrix: ${distributions.length} distributions x ${tones.length} tones x ${guPreferences.length} GU preferences x ${settlementDensities.length} settlement densities`)
console.log(`Corpus per option: ${corpusPerOption}`)
console.log(`Systems: ${stats.systems}`)
console.log(`Bodies: ${stats.bodies}`)
console.log(`Moons: ${stats.moons}`)
console.log(`Settlements: ${stats.settlements}`)
console.log(`Multi-star systems: ${stats.multiStarSystems}`)
console.log(`Unique system names: ${uniqueSummary(stats.systemNames, stats.systems)}`)
console.log(`Unique body names: ${uniqueSummary(stats.bodyNames, stats.bodies)}`)
console.log(`Unique first-body names: ${uniqueSummary(stats.firstBodyNames, stats.systems)}`)
console.log(`Unique moon names: ${uniqueSummary(stats.moonNames, stats.moons)}`)
console.log(`Unique settlement names: ${uniqueSummary(stats.settlementNames, stats.settlements)}`)
console.log(`Body interest phrase openings: ${uniqueSummary(stats.bodyInterestPhrases, stats.bodies)}`)
console.log(`Settlement reason phrase openings: ${uniqueSummary(stats.settlementWhyHerePhrases, stats.settlements)}`)
console.log(`Settlement tag hook phrase openings: ${uniqueSummary(stats.settlementTagHookPhrases, stats.settlements)}`)
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)
console.log(`Star types: ${formatMap(stats.starTypes)}`)
console.log(`Frontier star types: ${formatMap(stats.starTypesByDistribution.frontier)}`)
console.log(`Realistic star types: ${formatMap(stats.starTypesByDistribution.realistic)}`)
console.log(`Body categories: ${formatMap(stats.categories)}`)
console.log(`Body classes: ${formatMap(stats.bodyClasses)}`)
console.log(`Atmospheres: ${formatMap(stats.atmospheres)}`)
console.log(`Hydrospheres: ${formatMap(stats.hydrospheres)}`)
console.log(`Geologies: ${formatMap(stats.geologies)}`)
console.log(`Radiation: ${formatMap(stats.radiation)}`)
console.log(`Biospheres: ${formatMap(stats.biospheres)}`)
console.log(`Moon types: ${formatMap(stats.moonTypes)}`)
console.log(`Ring types: ${formatMap(stats.ringTypes)}`)
console.log(`Settlement categories: ${formatMap(stats.settlementCategories)}`)
console.log(`Settlement presence rolls: ${formatMap(stats.settlementPresenceRolls)}`)
console.log(`Settlement presence tiers: ${formatMap(stats.settlementPresenceTiers)}`)
console.log(`Settlement scales: ${formatMap(stats.settlementScales)}`)
console.log(`Architectures: ${formatMap(stats.architectures)}`)
console.log(`Reachability classes: ${formatMap(stats.reachabilityClasses)}`)
console.log(`Companion types: ${formatMap(stats.companionTypes)}`)
console.log(`Companion separations: ${formatMap(stats.companionSeparations)}`)
console.log(`Activity modifiers: ${formatMap(stats.activityModifiers)}`)
console.log(`Reachability modifiers: ${formatMap(stats.reachabilityModifiers)}`)
console.log('Settlement counts by density:')
console.log(formatSettlementCountsByDensity(stats))
console.log('GU intensity by preference:')
console.log(formatGuIntensityByPreference(stats))
console.log(`GU behaviors: ${formatMap(stats.guBehaviors)}`)
console.log(`GU resources: ${formatMap(stats.guResources)}`)
console.log(`GU hazards: ${formatMap(stats.guHazards)}`)
console.log(`GU intensity modifiers: ${formatMap(stats.guIntensityModifiers)}`)
console.log('Body categories by architecture:')
console.log(formatNestedCategoryMap(stats.categoriesByArchitecture))

if (findings.length > 0) {
  console.log('')
  console.log(`First ${Math.min(findingLimit, findings.length)} finding${findings.length === 1 ? '' : 's'}:`)
  for (const finding of findings.slice(0, findingLimit)) {
    console.log(`[${finding.severity}] ${finding.seed} ${finding.path}: ${finding.message}`)
  }
}

if (errors.length > 0) {
  process.exitCode = 1
}

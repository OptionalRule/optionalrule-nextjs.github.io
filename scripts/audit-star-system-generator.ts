import { generateSystem } from '../src/features/tools/star_system_generator/lib/generator/index'
import {
  coldThermalZones as coldZones,
  envelopeCategories,
  solidSurfaceCategories,
} from '../src/features/tools/star_system_generator/lib/generator/domain'
import { frontierStarTypes, realisticStarTypes } from '../src/features/tools/star_system_generator/lib/generator/tables'
import { validateSystem, type ValidationFinding, type ValidationSource } from '../src/features/tools/star_system_generator/lib/generator/validation'
import { separationToBucketAu } from '../src/features/tools/star_system_generator/lib/generator/companionGeometry'
import { siblingOuterAuLimit } from '../src/features/tools/star_system_generator/lib/generator/companionStability'
import { isNamedEntity, EDGE_TYPES, HISTORICAL_ELIGIBLE_TYPES } from '../src/features/tools/star_system_generator/lib/generator/graph'
import type { EdgeType } from '../src/features/tools/star_system_generator/lib/generator/graph'
import {
  builtForms,
  GENERATION_SHIP_POPULATION_BAND,
  guFractureFunctionsBySiteCategory as settlementGuFractureFunctionsBySiteCategory,
  HABITATION_POPULATION_FLOORS,
  POPULATION_BAND_INDEX,
  settlementLocations,
} from '../src/features/tools/star_system_generator/lib/generator/data/settlements'
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
  source?: ValidationSource | 'audit'
  code?: string
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
  outermostAu: number[]
  outermostByStarType: Map<string, number[]>
  outermostByArchitecture: Map<string, number[]>
  outermostHzRatio: number[]
  outermostSnowLineRatio: number[]
  suspiciousCompactByArchitecture: Map<string, number>
  bodyClasses: Map<string, number>
  categoriesByArchitecture: Map<string, Map<BodyCategory, number>>
  categories: Map<BodyCategory, number>
  atmospheres: Map<string, number>
  hydrospheres: Map<string, number>
  geologies: Map<string, number>
  radiation: Map<string, number>
  biospheres: Map<string, number>
  moonTypes: Map<string, number>
  moonCountsByCategory: Map<string, number[]>
  moonCountsByBodyClass: Map<string, number[]>
  ringTypes: Map<string, number>
  settlementCategories: Map<string, number>
  settlementCountsByDensity: Record<SettlementDensity, number[]>
  settlementPresenceRolls: Map<number, number>
  settlementPresenceTiers: Map<string, number>
  settlementPopulations: Map<string, number>
  settlementHabitationPatterns: Map<string, number>
  guIntensityByPreference: Record<GuPreference, Map<string, number>>
  guBehaviors: Map<string, number>
  guResources: Map<string, number>
  guHazards: Map<string, number>
  guIntensityModifiers: Map<string, number>
  companionTypes: Map<string, number>
  companionSeparations: Map<string, number>
  companionModes: Map<string, number>
  binaryStabilityFindings: number
  binaryStabilityLockedConflicts: number
  activityModifiers: Map<string, number>
  reachabilityModifiers: Map<string, number>
  reachabilityClasses: Map<string, number>
  edgeCounts: number[]
  spineCounts: number[]
  edgesByType: Record<EdgeType, number>
  systemsWithZeroEdges: number
  spineSummaryLengths: number[]
  bodyParagraphCounts: number[]
  bodySentenceCounts: number[]
  hookCounts: number[]
  systemsWithEmptyStory: number
  factionNames: Set<string>
  historicalEdgeCounts: number[]
  systemsWithAnyHistorical: number
  spineEdgesWithHistorical: number
  spineEdgesEligibleForHistorical: number
  whyHereGraphAwareCount: number
  whyHereFallbackCount: number
  noteGraphAwareCount: number
  noteFallbackCount: number
  hookGraphAwareCount: number
  hookFallbackCount: number
  historicalSummariesByBucket: Map<string, { count: number; distinct: Set<string> }>
  spineEdgeTypesAcrossCorpus: Set<EdgeType>
  fractureSpineSamples: number
  fracturePhenomenonAnchoredSpines: number
  astronomySpineSamples: number
  astronomyNonContestsSpines: number
  body0ByTone: Map<GeneratorTone, { samples: number; uniqueStrings: Set<string> }>
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
const includeReportOnlyValidation = process.env.STAR_SYSTEM_AUDIT_REPORT_ONLY === '1'
const distributions: GeneratorDistribution[] = ['frontier', 'realistic']
const tones: GeneratorTone[] = ['balanced', 'astronomy', 'cinematic']
const guPreferences: GuPreference[] = ['low', 'normal', 'high', 'fracture']
const settlementDensities: SettlementDensity[] = ['sparse', 'normal', 'crowded', 'hub']

const extremeHotZones = new Set(['Furnace', 'Inferno'])

// Phase 7 Task 10 regression guards. See per-system block in auditSystem for
// rationale and provenance.
const DOUBLE_PREPOSITION_PATTERN = /\b(during|in|on|at|to)\s+(in|on|at|to|before|after)\b/i
const UNSTRIPPED_ARTICLE_BRIDGE_PATTERN = /\bThe [a-z]+(?:\s[a-z]+)? took shape\b/
// Phase 8 Task 2 + post-Phase-8 Task 1: catches spine-assembly joiner
// regressions where a post-bridge clause's proper-noun head was lowercased
// mid-sentence. Anchors on bridge punctuation (',' or '—' followed by a
// space) and a "lowercaseWord SpaceUppercaseWord" pair. The negative
// lookahead excludes leading English articles ("the"/"a"/"an") which
// composeSpineSummary deliberately lowercases as part of the article
// narrowing rule — those are correct, not regressions.
const LOWERCASE_FACTION_MID_SENTENCE_PATTERN = /[,—] (?!(?:the|a|an) )[a-z][a-zA-Z]+ [A-Z]/

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

const guFractureFunctionsBySiteCategory: Record<string, ReadonlySet<string>> = Object.fromEntries(
  Object.entries(settlementGuFractureFunctionsBySiteCategory).map(([category, functions]) => [category, new Set(functions)])
)

function buildAllowedBuiltFormsBySiteCategory(): Record<string, ReadonlySet<string>> {
  const allowed = Object.fromEntries(
    Object.entries(builtForms.bySiteCategory).map(([category, forms]) => [category, new Set(forms)])
  ) as Record<string, Set<string>>

  const locationCategoryByLabel = new Map(
    Object.values(settlementLocations).flat().map((location) => [location.label, location.category])
  )

  for (const [label, form] of Object.entries(builtForms.exactLocation)) {
    const category = locationCategoryByLabel.get(label)
    if (category) allowed[category]?.add(form)
  }

  for (const [label, forms] of Object.entries(builtForms.mobileLocationPools)) {
    const category = locationCategoryByLabel.get(label)
    if (category) {
      const categoryAllowed = allowed[category]
      for (const form of forms) categoryAllowed?.add(form)
    }
  }

  for (const [category, forms] of Object.entries(builtForms.miningBySiteCategory)) {
    if (category === 'default') {
      for (const categoryAllowed of Object.values(allowed)) {
        for (const form of forms) categoryAllowed.add(form)
      }
    } else {
      const categoryAllowed = allowed[category]
      for (const form of forms) categoryAllowed?.add(form)
    }
  }

  return Object.fromEntries(
    Object.entries(allowed).map(([category, forms]) => [category, forms as ReadonlySet<string>])
  )
}

const allowedBuiltFormsBySiteCategory = buildAllowedBuiltFormsBySiteCategory()

function increment<Key>(map: Map<Key, number>, key: Key): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function nestedIncrement<OuterKey, InnerKey>(map: Map<OuterKey, Map<InnerKey, number>>, outerKey: OuterKey, innerKey: InnerKey): void {
  const innerMap = map.get(outerKey) ?? new Map<InnerKey, number>()
  increment(innerMap, innerKey)
  map.set(outerKey, innerMap)
}

function nestedPush<OuterKey>(map: Map<OuterKey, number[]>, outerKey: OuterKey, value: number): void {
  const values = map.get(outerKey) ?? []
  values.push(value)
  map.set(outerKey, values)
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
    graphAware: {
      phenomenonNote: true,
      settlementHookSynthesis: true,
    },
  }
}

function addFinding(findings: Finding[], severity: Severity, seed: string, path: string, message: string, source: Finding['source'] = 'audit', code?: string): void {
  findings.push({ severity, seed, path, message, source, code })
}

function addValidationFindings(findings: Finding[], seed: string, validationFindings: ValidationFinding[]): void {
  for (const validationFinding of validationFindings) {
    if (validationFinding.severity === 'info') continue
    if (validationFinding.severity === 'warning' && validationFinding.source !== 'locked-conflict' && !includeReportOnlyValidation) continue

    addFinding(
      findings,
      validationFinding.severity,
      seed,
      validationFinding.path,
      `${validationFinding.code}: ${validationFinding.message}`,
      validationFinding.source,
      validationFinding.code
    )
  }
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

  if (!settlement.population.value.trim()) {
    addFinding(findings, 'error', seed, `${path}.population`, 'Settlement population is blank.')
  }
  if (!settlement.habitationPattern.value.trim()) {
    addFinding(findings, 'error', seed, `${path}.habitationPattern`, 'Settlement habitationPattern is blank.')
  }
  if (settlement.habitationPattern.value === 'Abandoned' && settlement.population.value !== 'Unknown') {
    addFinding(findings, 'error', seed, `${path}.population`, `Abandoned habitationPattern must force population to "Unknown"; got "${settlement.population.value}".`)
  }
  if (settlement.habitationPattern.value === 'Automated' && settlement.population.value !== 'Minimal (<5)') {
    addFinding(findings, 'error', seed, `${path}.population`, `Automated habitationPattern must force population to "Minimal (<5)"; got "${settlement.population.value}".`)
  }

  const floor = HABITATION_POPULATION_FLOORS[settlement.habitationPattern.value]
  if (floor !== undefined) {
    const idx = POPULATION_BAND_INDEX[settlement.population.value]
    if (idx === undefined || idx < floor) {
      addFinding(findings, 'error', seed, `${path}.population`, `${settlement.habitationPattern.value} requires population band >= ${floor}; got "${settlement.population.value}".`)
    }
  }

  if (settlement.habitationPattern.value === 'Generation ship') {
    const idx = POPULATION_BAND_INDEX[settlement.population.value]
    const { floor: shipFloor, ceiling: shipCeiling } = GENERATION_SHIP_POPULATION_BAND
    if (idx === undefined || idx < shipFloor || idx > shipCeiling) {
      addFinding(findings, 'error', seed, `${path}.population`, `Generation ship population must be band ${shipFloor}..${shipCeiling}; got "${settlement.population.value}".`)
    }
  }
}

function isSuspiciouslyCompact(system: GeneratedSystem, outermostOrbit: number, snowLine: number): boolean {
  if (system.primary.spectralType.value === 'M dwarf' || system.primary.spectralType.value === 'Brown dwarf/substellar primary') return false
  if (system.architecture.name.value === 'Compact inner system' || system.architecture.name.value === 'Peas-in-a-pod chain' || system.architecture.name.value === 'Sparse rocky') return false
  if (snowLine <= 0) return outermostOrbit <= 3.9
  return outermostOrbit <= 3.9 && outermostOrbit < snowLine * 1.4
}

function auditSystem(system: GeneratedSystem, findings: Finding[], stats: CorpusStats): void {
  const seed = system.seed
  const validationFindings = validateSystem(system)
  addValidationFindings(findings, seed, validationFindings)
  for (const finding of validationFindings) {
    if (finding.code === 'BINARY_STABILITY_CONFLICT') stats.binaryStabilityFindings += 1
    if (finding.code === 'LOCKED_FACT_CONFLICT' && finding.policyCode === 'BINARY_STABILITY_CONFLICT') {
      stats.binaryStabilityLockedConflicts += 1
    }
  }

  stats.systems += 1
  stats.bodies += system.bodies.length
  stats.settlements += system.settlements.length
  stats.moons += system.bodies.reduce((total, body) => total + body.moons.length, 0)
  if (system.companions.length > 0) stats.multiStarSystems += 1
  increment(stats.systemNames, system.name.value)
  increment(stats.starTypes, system.primary.spectralType.value)
  increment(stats.starTypesByDistribution[system.options.distribution], system.primary.spectralType.value)
  increment(stats.architectures, system.architecture.name.value)
  const outermostOrbit = Math.max(...system.bodies.map((body) => body.orbitAu.value))
  const hzCenter = system.zones.habitableCenterAu.value
  const snowLine = system.zones.snowLineAu.value
  stats.outermostAu.push(outermostOrbit)
  nestedPush(stats.outermostByStarType, system.primary.spectralType.value, outermostOrbit)
  nestedPush(stats.outermostByArchitecture, system.architecture.name.value, outermostOrbit)
  if (hzCenter > 0) stats.outermostHzRatio.push(outermostOrbit / hzCenter)
  if (snowLine > 0) stats.outermostSnowLineRatio.push(outermostOrbit / snowLine)
  if (isSuspiciouslyCompact(system, outermostOrbit, snowLine)) {
    increment(stats.suspiciousCompactByArchitecture, system.architecture.name.value)
  }
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
    increment(stats.companionModes, companion.mode)
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
    nestedPush(stats.moonCountsByCategory, body.category.value, body.moons.length)
    nestedPush(stats.moonCountsByBodyClass, body.bodyClass.value, body.moons.length)
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
    increment(stats.settlementPopulations, settlement.population.value)
    increment(stats.settlementHabitationPatterns, settlement.habitationPattern.value)
  })

  // Per-consumer trigger-rate detection (Phase 6). Heuristic: relies on stable
  // Phase 6 templates — fallback whyHere uses ';' joiner; fallback tagHook ends
  // 'decides who has leverage'; fallback note carries 'Transit:'. If a Phase 7
  // template change alters those markers, update this block.
  for (const settlement of system.settlements) {
    if (settlement.whyHere.value.includes(';')) {
      stats.whyHereFallbackCount += 1
    } else {
      stats.whyHereGraphAwareCount += 1
    }
    if (settlement.tagHook.value.includes('decides who has leverage')) {
      stats.hookFallbackCount += 1
    } else {
      stats.hookGraphAwareCount += 1
    }
    if (settlement.whyHere.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Settlement ${settlement.id} whyHere contains unresolved slot.`)
    }
    if (settlement.tagHook.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Settlement ${settlement.id} tagHook contains unresolved slot.`)
    }
  }
  for (const phenomenon of system.phenomena) {
    if (phenomenon.note.value.includes('Transit:')) {
      stats.noteFallbackCount += 1
    } else {
      stats.noteGraphAwareCount += 1
    }
    if (phenomenon.note.value.includes('{')) {
      addFinding(findings, 'error', seed, 'prose.unresolvedSlot',
        `Phenomenon ${phenomenon.id} note contains unresolved slot.`)
    }
  }

  const edgeCount = system.relationshipGraph.edges.length
  stats.edgeCounts.push(edgeCount)
  stats.spineCounts.push(system.relationshipGraph.spineEdgeIds.length)
  if (edgeCount === 0) stats.systemsWithZeroEdges += 1
  for (const edge of system.relationshipGraph.edges) {
    stats.edgesByType[edge.type] += 1
  }

  const presentEdgeCount = system.relationshipGraph.edges.filter(e => e.era === 'present').length
  if (presentEdgeCount > 12) {
    addFinding(findings, 'error', seed, 'graph.edges.count',
      `Present edge count ${presentEdgeCount} exceeds hard ceiling 12`)
  }

  const historical = system.relationshipGraph.edges.filter(e => e.era === 'historical')
  stats.historicalEdgeCounts.push(historical.length)
  if (historical.length > 0) stats.systemsWithAnyHistorical += 1

  const spineEdges = system.relationshipGraph.edges.filter(e =>
    system.relationshipGraph.spineEdgeIds.includes(e.id),
  )
  for (const spine of spineEdges) {
    const eligible = HISTORICAL_ELIGIBLE_TYPES.has(spine.type)
    if (!eligible) continue
    stats.spineEdgesEligibleForHistorical += 1
    const linked = historical.some(h => h.consequenceEdgeIds?.includes(spine.id))
    if (linked) stats.spineEdgesWithHistorical += 1
  }

  const topSpine = system.relationshipGraph.edges.find(
    e => e.id === system.relationshipGraph.spineEdgeIds[0],
  )
  if (topSpine) {
    stats.spineEdgeTypesAcrossCorpus.add(topSpine.type)
    if (system.options.gu === 'fracture') {
      stats.fractureSpineSamples += 1
      const phenomenonAnchored =
        topSpine.subject.kind === 'phenomenon' || topSpine.object.kind === 'phenomenon'
      if (phenomenonAnchored) stats.fracturePhenomenonAnchoredSpines += 1
    }
    if (system.options.tone === 'astronomy') {
      stats.astronomySpineSamples += 1
      if (topSpine.type !== 'CONTESTS') stats.astronomyNonContestsSpines += 1
    }
  }

  for (const edge of system.relationshipGraph.edges) {
    if (edge.era !== 'historical') continue

    if (!edge.summary || edge.summary === '') {
      addFinding(findings, 'error', seed, 'history.missingSummary',
        `Historical edge ${edge.id} has no summary string.`)
    }
    if (!edge.consequenceEdgeIds || edge.consequenceEdgeIds.length === 0) {
      addFinding(findings, 'error', seed, 'history.orphan',
        `Historical edge ${edge.id} has no consequenceEdgeIds linking to a present spine edge.`)
    } else {
      for (const targetId of edge.consequenceEdgeIds) {
        const target = system.relationshipGraph.edges.find(e => e.id === targetId)
        if (!target) {
          addFinding(findings, 'error', seed, 'history.orphan',
            `Historical edge ${edge.id} references missing consequence edge ${targetId}.`)
        }
      }
    }
  }

  const edgeKeys = new Set<string>()
  for (const edge of system.relationshipGraph.edges) {
    const key = `${edge.subject.id}|${edge.object.id}|${edge.type}`
    if (edgeKeys.has(key)) {
      addFinding(findings, 'error', seed, 'graph.edges.duplicate',
        `Duplicate edge ${key}`)
    }
    edgeKeys.add(key)
  }

  for (const spineId of system.relationshipGraph.spineEdgeIds) {
    const edge = system.relationshipGraph.edges.find((candidate) => candidate.id === spineId)
    if (!edge) {
      addFinding(findings, 'error', seed, 'graph.spine.missing',
        `Spine edge id ${spineId} not found in edges array`)
      continue
    }
    if (!isNamedEntity(edge.subject) || !isNamedEntity(edge.object)) {
      addFinding(findings, 'error', seed, 'graph.spine.unnamed',
        `Spine edge ${edge.id} has un-named endpoint(s)`)
    }
  }

  const factIds = new Set(system.narrativeFacts.map((fact) => fact.id))
  for (const edge of system.relationshipGraph.edges) {
    for (const fid of edge.groundingFactIds) {
      if (!factIds.has(fid)) {
        addFinding(findings, 'error', seed, 'graph.grounding.dangling',
          `Edge ${edge.id} grounds on non-existent fact ${fid}`)
      }
    }
  }

  const systemFactionNames: string[] = []
  for (const fact of system.narrativeFacts) {
    if (fact.kind === 'namedFaction') {
      stats.factionNames.add(fact.value.value)
      systemFactionNames.push(fact.value.value)
    }
  }
  const cinematicMarkers = ['Carrion', 'Brothers of', 'Sisters of', 'Pale Saint', 'Vow-Breaker', 'Black Comet', 'Bone Lantern', 'Gravewatch', 'Knife-and-Crown', 'Salt Wound']
  const astronomyMarkers = ['Bonn-Tycho', 'Stellar Survey', 'Calibration', 'Aperture', 'Pulsar Timing', 'Spectral Census', 'Coronagraph', 'Heliometric', 'Photometric', 'Ephemeris']
  const hasCinematic = systemFactionNames.some(n => cinematicMarkers.some(m => n.includes(m)))
  const hasAstronomy = systemFactionNames.some(n => astronomyMarkers.some(m => n.includes(m)))
  if (hasCinematic && hasAstronomy) {
    addFinding(findings, 'error', seed, 'narrative.factionCohesionWithinSystem',
      `System mixes cinematic and astronomy faction registers: ${systemFactionNames.join(', ')}`)
  }

  stats.spineSummaryLengths.push(system.systemStory.spineSummary.length)
  stats.bodyParagraphCounts.push(system.systemStory.body.length)
  stats.bodySentenceCounts.push(
    system.systemStory.body.reduce((sum, p) => sum + p.split(/(?<=[.!?])\s+/).length, 0),
  )
  stats.hookCounts.push(system.systemStory.hooks.length)
  if (system.systemStory.spineSummary === '' && system.systemStory.body.length === 0) {
    stats.systemsWithEmptyStory += 1
  }

  const tone = system.options.tone
  const body0 = system.systemStory.body[0] ?? ''
  if (body0 !== '') {
    let bucket = stats.body0ByTone.get(tone)
    if (!bucket) {
      bucket = { samples: 0, uniqueStrings: new Set<string>() }
      stats.body0ByTone.set(tone, bucket)
    }
    bucket.samples += 1
    bucket.uniqueStrings.add(body0)
  }

  const allOutputs = [
    system.systemStory.spineSummary,
    ...system.systemStory.body,
    ...system.systemStory.hooks,
  ]

  for (const output of allOutputs) {
    if (output.includes('{')) {
      addFinding(findings, 'error', seed, 'story.unresolvedSlot',
        `Rendered output contains unresolved slot: "${output}"`)
    }
  }

  for (const output of allOutputs) {
    if (/\b(evidence|records|logs|claims|reports)\s+\S+\s+\1\s+(of|that)\b/i.test(output)) {
      addFinding(findings, 'error', seed, 'story.doubledNoun',
        `Doubled-noun pattern: "${output}"`)
    }
  }

  // Phase 7 Task 10 regression guards.
  //
  // prose.doublePreposition (Task 2): catches era/preposition collisions if a
  // future template change re-introduces shapes like "during before the
  // quarantine" or "during in the long quiet". The broad pattern produces 0
  // findings against the deep-audit corpus (50 systems × 96 option combos),
  // so we keep the broad form rather than tightening to `during\s+(in|before|after)`.
  const proseSurfaces = [system.systemStory.spineSummary, ...system.systemStory.body]
  for (const surface of proseSurfaces) {
    if (DOUBLE_PREPOSITION_PATTERN.test(surface)) {
      addFinding(findings, 'error', seed, 'prose.doublePreposition',
        `Double preposition detected in story prose: "${surface.slice(0, 160)}"`)
    }
  }

  // prose.unstrippedArticleInBridge (Task 5): catches phenomenon-typed
  // DESTABILIZES bridge subjects that fail to strip a leading article. Task 5
  // changed the bridge subject shape from `properNoun` to `nounPhrase`, so a
  // phenomenon "the bleed season" now renders as "Bleed season took shape ...".
  // If the regression re-introduces the unstripped form, the spineSummary will
  // contain `The <lowercase noun phrase> took shape`. Verified 0 findings
  // against the deep-audit corpus.
  if (UNSTRIPPED_ARTICLE_BRIDGE_PATTERN.test(system.systemStory.spineSummary)) {
    addFinding(findings, 'error', seed, 'prose.unstrippedArticleInBridge',
      `Bridge subject likely retained leading article: "${system.systemStory.spineSummary.slice(0, 200)}"`)
  }

  // prose.lowercaseFactionMidSentence (Phase 8 Task 2 + post-Phase-8 Task 1):
  // see LOWERCASE_FACTION_MID_SENTENCE_PATTERN above for the antipattern shape
  // and the article-narrowing rationale.
  if (LOWERCASE_FACTION_MID_SENTENCE_PATTERN.test(system.systemStory.spineSummary)) {
    addFinding(findings, 'error', seed, 'prose.lowercaseFactionMidSentence',
      `Spine summary has a lowercased proper-noun head mid-sentence: "${system.systemStory.spineSummary.slice(0, 160)}..."`)
  }

  // prose.alwaysFirstHistoricalVariant (Task 4 corpus aggregation): track
  // distinct rendered historical-summary strings per (edgeType, era) bucket.
  // Evaluation happens after all systems are processed, in auditCoverage.
  for (const edge of system.relationshipGraph.edges) {
    if (edge.era !== 'historical' || !edge.summary) continue
    const bucket = `${edge.type}|${edge.approxEra ?? 'unknown'}`
    let info = stats.historicalSummariesByBucket.get(bucket)
    if (!info) {
      info = { count: 0, distinct: new Set<string>() }
      stats.historicalSummariesByBucket.set(bucket, info)
    }
    info.count += 1
    info.distinct.add(edge.summary)
  }

  if (system.systemStory.spineSummary.length > 0
      && !/[.!?]$/.test(system.systemStory.spineSummary)) {
    addFinding(findings, 'warning', seed, 'story.terminalPunct',
      `spineSummary missing terminal punctuation: "${system.systemStory.spineSummary}"`)
  }

  if (system.systemStory.body.length > 3) {
    addFinding(findings, 'error', seed, 'story.bodyParagraphs',
      `Body has ${system.systemStory.body.length} paragraphs; expected <= 3.`)
  }

  const hiddenEdgeIds = new Set(
    system.relationshipGraph.edges
      .filter(e => e.visibility === 'hidden')
      .map(e => e.id),
  )

  if (hiddenEdgeIds.size > 0) {
    const visibleEndpointPairs = new Set<string>()
    for (const edge of system.relationshipGraph.edges) {
      if (edge.visibility === 'hidden') continue
      visibleEndpointPairs.add(`${edge.subject.id}|${edge.object.id}`)
      visibleEndpointPairs.add(`${edge.object.id}|${edge.subject.id}`)
    }
    for (const edge of system.relationshipGraph.edges) {
      if (edge.visibility !== 'hidden') continue
      const pairKey = `${edge.subject.id}|${edge.object.id}`
      if (visibleEndpointPairs.has(pairKey)) continue
      let leakingPara: string | undefined
      for (const para of system.systemStory.body) {
        if (!para.includes(edge.subject.displayName)) continue
        if (!para.includes(edge.object.displayName)) continue
        const sentences = para.split(/(?<=[.!?])\s+/)
        const sentenceWithBoth = sentences.find(s =>
          s.includes(edge.subject.displayName) && s.includes(edge.object.displayName)
        )
        if (sentenceWithBoth) {
          leakingPara = para
          break
        }
      }
      if (leakingPara) {
        addFinding(findings, 'error', seed, 'story.hiddenLeak',
          `Hidden edge ${edge.id} appears to leak into body paragraph: "${leakingPara}"`)
      }
    }

    if (system.systemStory.hooks.length === 0) {
      addFinding(findings, 'warning', seed, 'story.hiddenWithoutHook',
        `${hiddenEdgeIds.size} hidden edge(s) but no hooks produced.`)
    }
  }

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
    const hasTightBinary = system.companions.some((c) => c.mode === 'volatile')
      || system.companions.some((c) => c.mode === 'orbital-sibling' && (() => {
        const limit = siblingOuterAuLimit(
          separationToBucketAu(c.separation.value),
          system.primary.massSolar.value,
          c.star.massSolar.value,
        )
        return limit < 1
      })())
    if (hasTightBinary) {
      addFinding(findings, 'warning', seed, 'bodies', 'System generated no orbital bodies (orbit volume constrained by binary stability).')
    } else {
      addFinding(findings, 'error', seed, 'bodies', 'System generated no orbital bodies.')
    }
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

  const gasGiantMoonCounts = stats.moonCountsByCategory.get('gas-giant') ?? []
  const iceGiantMoonCounts = stats.moonCountsByCategory.get('ice-giant') ?? []
  if (gasGiantMoonCounts.length > 0 && percentile(gasGiantMoonCounts, 0.5) < 7) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.gas-giant.moons', 'Median gas-giant moon count fell below seven named major moons.')
  }
  if (gasGiantMoonCounts.length > 0 && iceGiantMoonCounts.length > 0 && percentile(gasGiantMoonCounts, 0.5) <= percentile(iceGiantMoonCounts, 0.5)) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.giant.moons', 'Gas giants did not produce a higher median moon count than ice giants.')
  }

  auditStarDistribution('realistic', realisticStarTypes, stats, findings)
  auditStarDistribution('frontier', frontierStarTypes, stats, findings)

  const median = percentile(stats.edgeCounts, 0.5)
  if (median < 3) {
    addFinding(findings, 'warning', syntheticSeed, 'graph.edges.median',
      `Median edge count across corpus is ${median}; expected >=3`)
  }

  // prose.alwaysFirstHistoricalVariant (Task 10, Task 4 regression guard).
  // Flag any (edgeType × era) bucket of size >= 10 that produced only a single
  // distinct rendered historical-summary string — a signal that
  // stableHashString-based variant rotation has degenerated. Verified 0
  // findings against the deep-audit corpus (each historical bucket renders
  // 6 distinct variants across ~900 edges per bucket).
  for (const [bucket, info] of stats.historicalSummariesByBucket) {
    if (info.count >= 10 && info.distinct.size === 1) {
      addFinding(findings, 'warning', syntheticSeed, 'prose.alwaysFirstHistoricalVariant',
        `Historical bucket ${bucket} (${info.count} edges) used only one body variant; rotation may be degenerate.`)
    }
  }

  // narrative.factionNameDiversity (Phase B Task 5): pre-Phase-B the corpus
  // surfaced exactly 10 unique faction names (the static namedFactions[] pool).
  // Per-tone generateFactions() should produce >=100 across the deep-audit
  // corpus (3 tones x ~96 stem/suffix combinations). Below the floor signals
  // a regression in bank size or generator determinism.
  if (auditProfile === 'deep' && stats.factionNames.size < 100) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.factionNameDiversity',
      `Faction name diversity collapsed to ${stats.factionNames.size} unique names across the deep-audit corpus (${stats.systems} systems). Expected >=100 (Phase B per-tone faction generator regression).`)
  }

  // narrative.spineToneSensitivity (Phase A Task 7): across a corpus that varies
  // tone × gu, at least 2 distinct spine edge types should appear. The original
  // plan called for >=3 but the rule corpus realistically supports 2 spine-eligible
  // families at scale (CONTESTS for faction-on-faction; DESTABILIZES via the new
  // phenomenon-anchored sub-fork rules). A regression to 1 distinct type signals
  // tone weights or eligibility predicate collapse.
  const spineTypeCount = stats.spineEdgeTypesAcrossCorpus.size
  if (spineTypeCount < 2) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.spineToneSensitivity',
      `Spine edge types collapsed to ${spineTypeCount} distinct values across the tone × gu corpus: ${[...stats.spineEdgeTypesAcrossCorpus].join(', ')}. Expected >=2 (regression of Phase A tone-aware spine).`)
  }

  // Per-sub-corpus floors: at least 1 phenomenon-anchored spine across the
  // fracture sub-corpus (Task 5 predicate widening), and at least 1 non-CONTESTS
  // spine across the astronomy sub-corpus (Task 4 tone-multiplier).
  if (stats.fractureSpineSamples > 0 && stats.fracturePhenomenonAnchoredSpines === 0) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.spineToneSensitivity',
      `0/${stats.fractureSpineSamples} fracture-GU systems produced a phenomenon-anchored spine. Expected >=1 (Phase A predicate widening regression).`)
  }
  if (stats.astronomySpineSamples > 0 && stats.astronomyNonContestsSpines === 0) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.spineToneSensitivity',
      `0/${stats.astronomySpineSamples} astronomy-tone systems produced a non-CONTESTS spine. Expected >=1 (Phase A tone-multiplier regression).`)
  }

  if (auditProfile === 'deep') {
    auditDistributionAxisSensitivity(findings, syntheticSeed)
    auditDensityAxisSensitivity(findings, syntheticSeed)
  }

  // narrative.body0VoiceDiversity (Phase C task 7): across the deep-audit
  // corpus, body[0] strings within a single tone should be >=50% unique.
  // Catches a regression where one bodyByTone variant collapses to dominate
  // (e.g. all balanced systems pick body[0] index 0). Threshold 50% leaves
  // room for legitimate cluster shape variation that produces overlapping
  // body[0] cluster prose; the floor is set per the plan's task 7 spec.
  // Only enforced under the deep audit profile (corpus large enough for the
  // ratio to be meaningful, samples >=100 per tone).
  if (auditProfile === 'deep') {
    for (const [tone, bucket] of stats.body0ByTone) {
      if (bucket.samples < 100) continue
      const uniquenessRate = bucket.uniqueStrings.size / bucket.samples
      if (uniquenessRate < 0.5) {
        addFinding(findings, 'warning', syntheticSeed, 'narrative.body0VoiceDiversity',
          `body[0] uniqueness for tone=${tone}: ${bucket.uniqueStrings.size}/${bucket.samples} (${Math.round(100 * uniquenessRate)}%, expected >=50%). Variant array may be collapsing.`)
      }
    }
  }
}

function auditDistributionAxisSensitivity(findings: Finding[], syntheticSeed: string): void {
  const sampleSize = 100
  const baseFlags = { phenomenonNote: true, settlementHookSynthesis: true }
  let differing = 0
  for (let i = 0; i < sampleSize; i++) {
    const seed = `dist-axis-audit-${i}`
    const frontier = generateSystem({
      seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal', graphAware: baseFlags,
    })
    const realistic = generateSystem({
      seed, distribution: 'realistic', tone: 'balanced', gu: 'normal', settlements: 'normal', graphAware: baseFlags,
    })
    const fb = frontier.systemStory.body[0] ?? ''
    const rb = realistic.systemStory.body[0] ?? ''
    if (fb !== rb) differing++
  }
  const ratio = differing / sampleSize
  if (ratio < 0.4) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.distributionAxisSensitivity',
      `Distribution axis differentiation: ${differing}/${sampleSize} seeds (${Math.round(100 * ratio)}%, expected >=40%). Phase D distribution-axis multipliers may have regressed.`)
  }
}

function auditDensityAxisSensitivity(findings: Finding[], syntheticSeed: string): void {
  const sampleSize = 100
  const baseFlags = { phenomenonNote: true, settlementHookSynthesis: true }
  let differing = 0
  for (let i = 0; i < sampleSize; i++) {
    const seed = `density-axis-audit-${i}`
    const sparse = generateSystem({
      seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'sparse', graphAware: baseFlags,
    })
    const hub = generateSystem({
      seed, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'hub', graphAware: baseFlags,
    })
    const sb = sparse.systemStory.body[0] ?? ''
    const hb = hub.systemStory.body[0] ?? ''
    if (sb !== hb) differing++
  }
  const ratio = differing / sampleSize
  if (ratio < 0.4) {
    addFinding(findings, 'warning', syntheticSeed, 'narrative.densityAxisSensitivity',
      `Density axis differentiation: ${differing}/${sampleSize} seeds (${Math.round(100 * ratio)}%, expected >=40%). Phase D density-conditioned cluster pulling may have regressed.`)
  }
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

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * quantile)))
  return sorted[index]
}

function formatPercentiles(values: number[], unit = ''): string {
  return `p10 ${percentile(values, 0.1).toFixed(2)}${unit}, p50 ${percentile(values, 0.5).toFixed(2)}${unit}, p90 ${percentile(values, 0.9).toFixed(2)}${unit}`
}

function formatNestedPercentiles(map: Map<string, number[]>, unit = ''): string {
  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, values]) => `${key}: ${formatPercentiles(values, unit)}`)
    .join('\n')
}

function findingCodeSummary(findings: Finding[]): string {
  const codes = new Map<string, number>()
  for (const finding of findings) {
    increment(codes, finding.code ?? finding.source ?? 'audit')
  }
  return formatMap(codes)
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
  outermostAu: [],
  outermostByStarType: new Map(),
  outermostByArchitecture: new Map(),
  outermostHzRatio: [],
  outermostSnowLineRatio: [],
  suspiciousCompactByArchitecture: new Map(),
  bodyClasses: new Map(),
  categoriesByArchitecture: new Map(),
  categories: new Map(),
  atmospheres: new Map(),
  hydrospheres: new Map(),
  geologies: new Map(),
  radiation: new Map(),
  biospheres: new Map(),
  moonTypes: new Map(),
  moonCountsByCategory: new Map(),
  moonCountsByBodyClass: new Map(),
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
  settlementPopulations: new Map(),
  settlementHabitationPatterns: new Map(),
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
  companionModes: new Map(),
  binaryStabilityFindings: 0,
  binaryStabilityLockedConflicts: 0,
  activityModifiers: new Map(),
  reachabilityModifiers: new Map(),
  reachabilityClasses: new Map(),
  edgeCounts: [],
  spineCounts: [],
  edgesByType: Object.fromEntries(EDGE_TYPES.map(t => [t, 0])) as Record<EdgeType, number>,
  systemsWithZeroEdges: 0,
  spineSummaryLengths: [],
  bodyParagraphCounts: [],
  bodySentenceCounts: [],
  hookCounts: [],
  systemsWithEmptyStory: 0,
  factionNames: new Set<string>(),
  historicalEdgeCounts: [],
  systemsWithAnyHistorical: 0,
  spineEdgesWithHistorical: 0,
  spineEdgesEligibleForHistorical: 0,
  whyHereGraphAwareCount: 0,
  whyHereFallbackCount: 0,
  noteGraphAwareCount: 0,
  noteFallbackCount: 0,
  hookGraphAwareCount: 0,
  hookFallbackCount: 0,
  historicalSummariesByBucket: new Map(),
  spineEdgeTypesAcrossCorpus: new Set<EdgeType>(),
  fractureSpineSamples: 0,
  fracturePhenomenonAnchoredSpines: 0,
  astronomySpineSamples: 0,
  astronomyNonContestsSpines: 0,
  body0ByTone: new Map<GeneratorTone, { samples: number; uniqueStrings: Set<string> }>(),
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
const lockedConflicts = findings.filter((finding) => finding.source === 'locked-conflict')

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
console.log(`Unique faction names: ${stats.factionNames.size} across ${stats.systems} systems`)
console.log(`Body interest phrase openings: ${uniqueSummary(stats.bodyInterestPhrases, stats.bodies)}`)
console.log(`Settlement reason phrase openings: ${uniqueSummary(stats.settlementWhyHerePhrases, stats.settlements)}`)
console.log(`Settlement tag hook phrase openings: ${uniqueSummary(stats.settlementTagHookPhrases, stats.settlements)}`)
console.log(`Edges per system (p10/p50/p90): ${formatPercentiles(stats.edgeCounts)}`)
console.log(`Spine size per system (p10/p50/p90): ${formatPercentiles(stats.spineCounts)}`)
console.log(`Systems with zero edges: ${stats.systemsWithZeroEdges} / ${stats.systems}`)
for (const [type, count] of Object.entries(stats.edgesByType)) {
  if (count > 0) console.log(`  edges of type ${type}: ${count}`)
}
console.log(`Historical edges per system (p10/p50/p90): ${formatPercentiles(stats.historicalEdgeCounts)}`)
console.log(`Systems with any historical edge: ${stats.systemsWithAnyHistorical} / ${stats.systems}`)
if (stats.spineEdgesEligibleForHistorical > 0) {
  const rate = stats.spineEdgesWithHistorical / stats.spineEdgesEligibleForHistorical
  console.log(`Spine edges with attached history: ${(rate * 100).toFixed(1)}% (${stats.spineEdgesWithHistorical}/${stats.spineEdgesEligibleForHistorical})`)
}
const totalSettlements = stats.whyHereGraphAwareCount + stats.whyHereFallbackCount
if (totalSettlements > 0) {
  const whyHerePct = (stats.whyHereGraphAwareCount / totalSettlements * 100).toFixed(1)
  console.log(`whyHere graph-aware rate: ${whyHerePct}% (${stats.whyHereGraphAwareCount}/${totalSettlements})`)
  // Phase 7 Task 7: deep-run baseline ~54%. The fallback population is dominated by
  // structural unavoidability — the HOSTS rule fires for ~100% of missing settlements
  // (they sit on named bodies) but the per-system edge-selection budget
  // (TOTAL_HARD_CEILING=12, PERIPHERAL_PER_TYPE_CAP=2 in graph/score.ts) drops most
  // candidates before the graph is finalized. ~46% of missing settlements end up with
  // zero incident edges; ~41% additionally have no fn/crisis keyword overlap with the
  // gu resource (no DEPENDS_ON candidate at all). Broadening rule predicates would not
  // help — the cap is structural. Phase 7 accepts ~50–70% as the realistic ceiling.
  // Below 50% indicates regression in the host or depends-on rule files.
  const whyHereRatio = stats.whyHereGraphAwareCount / totalSettlements
  if (whyHereRatio < 0.5) {
    console.log(`  WARN: whyHere graph-aware rate below realistic-ceiling floor (50%) — possible regression in HOSTS or DEPENDS_ON rules.`)
  }
  const hookPct = (stats.hookGraphAwareCount / totalSettlements * 100).toFixed(1)
  console.log(`tagHook graph-aware rate: ${hookPct}% (${stats.hookGraphAwareCount}/${totalSettlements})`)
}
const totalPhenomena = stats.noteGraphAwareCount + stats.noteFallbackCount
if (totalPhenomena > 0) {
  const notePct = (stats.noteGraphAwareCount / totalPhenomena * 100).toFixed(1)
  console.log(`phenomenonNote graph-aware rate: ${notePct}% (${stats.noteGraphAwareCount}/${totalPhenomena})`)
}
console.log(`Story spineSummary length (p10/p50/p90): ${formatPercentiles(stats.spineSummaryLengths)} chars`)
console.log(`Story body paragraph count (p10/p50/p90): ${formatPercentiles(stats.bodyParagraphCounts)}`)
console.log(`Story body sentence count (p10/p50/p90): ${formatPercentiles(stats.bodySentenceCounts)}`)
console.log(`Story hook count (p10/p50/p90): ${formatPercentiles(stats.hookCounts)}`)
console.log(`Systems with empty story: ${stats.systemsWithEmptyStory} / ${stats.systems}`)
const emptyStoryRate = stats.systems > 0 ? stats.systemsWithEmptyStory / stats.systems : 0
console.log(`Empty-story rate: ${(emptyStoryRate * 100).toFixed(2)}% (${stats.systemsWithEmptyStory}/${stats.systems})`)
// Phase 7 Task 9: deep-run baseline ~6.77%. Diagnostic across 4800 systems
// (full distribution × tone × gu × density grid, 50 per option) showed empty-story
// systems are structurally homogeneous: 100% of empty-story systems have zero
// settlements (sparse density only — 27.08% of sparse systems roll 0 settlements;
// non-sparse densities never produce empty stories). Median spineEdges=0,
// median edges=2 vs corpus median 13. Named-faction count is baseline (10/10):
// the bottleneck isn't entity inventory but the absence of a settlement anchor —
// there is no human-layer endpoint to surface named-on-named compacts against.
// Empty story is the *correct* outcome for these systems. Phase 7 accepts ~6.77%
// as the structural floor. Above 10% indicates regression in entity inventory or
// rule generation (Phase 3 carryover).
if (emptyStoryRate > 0.10) {
  console.log(`  WARN: empty-story rate above structural floor (10%) — possible regression in entity inventory or rule generation.`)
}
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)
console.log(`Locked fact conflicts: ${lockedConflicts.length}`)
console.log(`Finding codes: ${findingCodeSummary(findings) || 'none'}`)
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
console.log('Moon counts by category:')
console.log(formatNestedPercentiles(stats.moonCountsByCategory))
console.log('Moon counts by giant class:')
console.log(formatNestedPercentiles(new Map([...stats.moonCountsByBodyClass.entries()].filter(([bodyClass]) => bodyClass.toLowerCase().includes('giant') || bodyClass === 'Hot Jupiter' || bodyClass === 'Super-Jovian'))))
console.log(`Ring types: ${formatMap(stats.ringTypes)}`)
console.log(`Settlement categories: ${formatMap(stats.settlementCategories)}`)
console.log(`Settlement presence rolls: ${formatMap(stats.settlementPresenceRolls)}`)
console.log(`Settlement presence tiers: ${formatMap(stats.settlementPresenceTiers)}`)
console.log(`Settlement populations: ${formatMap(stats.settlementPopulations)}`)
console.log(`Settlement habitation patterns: ${formatMap(stats.settlementHabitationPatterns)}`)
console.log(`Architectures: ${formatMap(stats.architectures)}`)
console.log(`Outermost orbit AU percentiles: ${formatPercentiles(stats.outermostAu, ' AU')}`)
console.log(`Outermost / HZ center percentiles: ${formatPercentiles(stats.outermostHzRatio, 'x')}`)
console.log(`Outermost / snow-line percentiles: ${formatPercentiles(stats.outermostSnowLineRatio, 'x')}`)
console.log(`Suspicious compact counts by architecture: ${formatMap(stats.suspiciousCompactByArchitecture) || 'none'}`)
console.log(`Reachability classes: ${formatMap(stats.reachabilityClasses)}`)
console.log(`Companion types: ${formatMap(stats.companionTypes)}`)
console.log(`Companion separations: ${formatMap(stats.companionSeparations)}`)
console.log(`Companion modes: ${formatMap(stats.companionModes) || 'none'}`)
console.log(`Binary stability findings (generated): ${stats.binaryStabilityFindings}`)
console.log(`Binary stability findings (locked imports): ${stats.binaryStabilityLockedConflicts}`)
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
console.log('Outermost orbit by star type:')
console.log(formatNestedPercentiles(stats.outermostByStarType, ' AU'))
console.log('Outermost orbit by architecture:')
console.log(formatNestedPercentiles(stats.outermostByArchitecture, ' AU'))

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

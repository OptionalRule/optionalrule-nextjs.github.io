import type { BodyCategory, GeneratedSystem, OrbitingBody, Settlement } from '../../types'
import {
  envelopeCategories,
  fullPlanetCategories,
  giantCategories,
  minorBodyCategories,
  rockyChainCategories,
  solidSurfaceCategories,
} from './domain'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export type ValidationSource = 'generated-error' | 'locked-conflict' | 'repair-applied' | 'audit' | 'test'

export type ValidationTargetKind =
  | 'system'
  | 'body'
  | 'moon'
  | 'settlement'
  | 'architecture'
  | 'locked-fact'

export const validationSources = {
  generatedError: 'generated-error',
  lockedConflict: 'locked-conflict',
  repairApplied: 'repair-applied',
  audit: 'audit',
  test: 'test',
} as const satisfies Record<string, ValidationSource>

export const validationCodes = {
  environmentAirlessAtmosphere: 'ENV_AIRLESS_ATMOSPHERE',
  environmentAirlessHydrosphere: 'ENV_AIRLESS_HYDROSPHERE',
  environmentDesertHydrosphere: 'ENV_DESERT_HYDROSPHERE',
  architectureMinimumUnsatisfied: 'ARCH_MINIMUM_UNSATISFIED',
  settlementDuplicateName: 'SETTLEMENT_DUPLICATE_NAME',
  lockedFactConflict: 'LOCKED_FACT_CONFLICT',
  repairApplied: 'REPAIR_APPLIED',
} as const

export type ValidationCode = typeof validationCodes[keyof typeof validationCodes] | (string & {})

export interface ValidationFinding {
  severity: ValidationSeverity
  code: ValidationCode
  path: string
  message: string
  targetId?: string
  targetKind?: ValidationTargetKind
  source?: ValidationSource
  observed?: unknown
  expected?: unknown
  rawValue?: unknown
  finalValue?: unknown
  policyCode?: string
  locked?: boolean
  gmImplication?: string
}

const extremeHotZones = new Set(['Furnace', 'Inferno'])
const coldZones = new Set(['Cold', 'Cryogenic', 'Dark'])

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

const airlessAllowedAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'None / dispersed volatiles',
  'No ordinary atmosphere',
])

const airlessAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'No accessible surface volatiles',
  'Not applicable: metric or route phenomenon',
])

const desertAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Briny aquifers',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

const forbiddenAlienPatterns = [
  /\balien\b/i,
  /\bnonhuman\b/i,
  /\bnative\s+civilization\b/i,
  /\bancient\s+cities\b/i,
  /\bforbidden\s+archaeology\b/i,
]

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
  'Surface settlement': new Set(['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster', 'Rail-linked terminator city', 'Aerostat city', 'Submarine habitat', 'Borehole habitat', 'Shielded military bunker', 'Corporate luxury enclave', 'First-wave retrofitted ruin']),
  'Orbital station': new Set(['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster', 'Shielded military bunker']),
  'Asteroid or belt base': new Set(['Buried pressure cans', 'Ice-shielded tunnels', 'Asteroid hollow', 'Modular orbital lattice', 'Shielded military bunker', 'First-wave retrofitted ruin']),
  'Moon base': new Set(['Buried pressure cans', 'Ice-shielded tunnels', 'Dome cluster', 'Borehole habitat', 'Shielded military bunker', 'First-wave retrofitted ruin']),
  'Deep-space platform': new Set(['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster', 'Shielded military bunker']),
  'Gate or route node': new Set(['Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Shielded military bunker', 'Partly self-growing programmable structure']),
  'Mobile site': new Set(['Inflatable modules', 'Crawling mobile base', 'Modular orbital lattice', 'Rotating cylinder', 'Shielded military bunker']),
  'Derelict or restricted site': new Set(['Asteroid hollow', 'Shielded military bunker', 'First-wave retrofitted ruin', 'Partly self-growing programmable structure']),
}

function finding(input: ValidationFinding): ValidationFinding {
  return input
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

function countBodiesByCategory(system: GeneratedSystem, categories: ReadonlySet<BodyCategory>): number {
  return system.bodies.filter((body) => categories.has(body.category.value)).length
}

export function isEnvelopeCategory(category: BodyCategory): boolean {
  return envelopeCategories.has(category)
}

export function isSolidSurfaceCategory(category: BodyCategory): boolean {
  return solidSurfaceCategories.has(category)
}

export function isRockyChainCategory(category: BodyCategory): boolean {
  return rockyChainCategories.has(category)
}

export function isAirlessClass(className: string): boolean {
  return /\bairless\b/i.test(className)
}

export function isDesertClass(className: string): boolean {
  return /\bdesert\b/i.test(className) || /\bdry\b/i.test(className) || /\bMars-like\b/i.test(className) || /\bMercury-like\b/i.test(className)
}

export function isAirlessAtmosphere(value: string): boolean {
  return airlessAllowedAtmospheres.has(value)
}

export function isAirlessHydrosphere(value: string): boolean {
  return airlessAllowedHydrospheres.has(value)
}

export function isDesertCompatibleHydrosphere(value: string): boolean {
  return desertAllowedHydrospheres.has(value)
}

export function isAtmosphereCompatible(body: OrbitingBody): boolean {
  if (isAirlessClass(body.bodyClass.value)) return isAirlessAtmosphere(body.detail.atmosphere.value)
  return true
}

export function isHydrosphereCompatible(body: OrbitingBody): boolean {
  if (isAirlessClass(body.bodyClass.value)) return isAirlessHydrosphere(body.detail.hydrosphere.value)
  if (isDesertClass(body.bodyClass.value)) return isDesertCompatibleHydrosphere(body.detail.hydrosphere.value)
  return true
}

export function validateBodyEnvironment(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const category = body.category.value
  const thermalZone = body.thermalZone.value

  if (extremeHotZones.has(thermalZone) && !envelopeCategories.has(category) && category !== 'anomaly') {
    if (!extremeHotAllowedAtmospheres.has(body.detail.atmosphere.value)) {
      findings.push(finding({
        severity: 'error',
        code: 'ENV_EXTREME_HOT_ATMOSPHERE',
        path: `${path}.detail.atmosphere`,
        message: `${thermalZone} world has implausible atmosphere "${body.detail.atmosphere.value}".`,
        targetId: body.id,
        targetKind: 'body',
        source: 'generated-error',
        observed: body.detail.atmosphere.value,
        expected: [...extremeHotAllowedAtmospheres],
      }))
    }
    if (!extremeHotAllowedHydrospheres.has(body.detail.hydrosphere.value)) {
      findings.push(finding({
        severity: 'error',
        code: 'ENV_EXTREME_HOT_HYDROSPHERE',
        path: `${path}.detail.hydrosphere`,
        message: `${thermalZone} world has implausible hydrosphere "${body.detail.hydrosphere.value}".`,
        targetId: body.id,
        targetKind: 'body',
        source: 'generated-error',
        observed: body.detail.hydrosphere.value,
        expected: [...extremeHotAllowedHydrospheres],
      }))
    }
  }

  if (extremeHotZones.has(thermalZone) && body.detail.biosphere.value !== 'Sterile') {
    findings.push(finding({
      severity: 'error',
      code: 'ENV_EXTREME_HOT_BIOSPHERE',
      path: `${path}.detail.biosphere`,
      message: `${thermalZone} world has non-sterile biosphere "${body.detail.biosphere.value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: body.detail.biosphere.value,
      expected: 'Sterile',
    }))
  }

  if (coldZones.has(thermalZone) && solidSurfaceCategories.has(category)) {
    const badClimate = body.detail.climate.find((tag) => !coldAllowedClimateTags.has(tag.value))
    if (badClimate) {
      findings.push(finding({
        severity: 'error',
        code: 'ENV_COLD_CLIMATE',
        path: `${path}.detail.climate`,
        message: `${thermalZone} solid body has hot/temperate climate tag "${badClimate.value}".`,
        targetId: body.id,
        targetKind: 'body',
        source: 'generated-error',
        observed: badClimate.value,
        expected: [...coldAllowedClimateTags],
      }))
    }
  }

  if (isAirlessClass(body.bodyClass.value) && !isAirlessAtmosphere(body.detail.atmosphere.value)) {
    findings.push(finding({
      severity: 'warning',
      code: validationCodes.environmentAirlessAtmosphere,
      path: `${path}.detail.atmosphere`,
      message: `Airless class "${body.bodyClass.value}" has incompatible atmosphere "${body.detail.atmosphere.value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: body.detail.atmosphere.value,
      expected: [...airlessAllowedAtmospheres],
    }))
  }

  if (isAirlessClass(body.bodyClass.value) && !isAirlessHydrosphere(body.detail.hydrosphere.value)) {
    findings.push(finding({
      severity: 'warning',
      code: validationCodes.environmentAirlessHydrosphere,
      path: `${path}.detail.hydrosphere`,
      message: `Airless class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: body.detail.hydrosphere.value,
      expected: [...airlessAllowedHydrospheres],
    }))
  }

  if (isDesertClass(body.bodyClass.value) && !isDesertCompatibleHydrosphere(body.detail.hydrosphere.value)) {
    findings.push(finding({
      severity: 'warning',
      code: validationCodes.environmentDesertHydrosphere,
      path: `${path}.detail.hydrosphere`,
      message: `Desert class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: body.detail.hydrosphere.value,
      expected: [...desertAllowedHydrospheres],
    }))
  }

  return findings
}

export function validateBodyPhysicalContract(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const category = body.category.value

  if (envelopeCategories.has(category)) {
    if (!body.physical.volatileEnvelope.value) {
      findings.push(finding({ severity: 'error', code: 'BODY_ENVELOPE_FLAG', path: `${path}.physical.volatileEnvelope`, message: `${category} should be marked as a volatile-envelope world.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (body.detail.biosphere.value !== 'Sterile') {
      findings.push(finding({ severity: 'error', code: 'BODY_ENVELOPE_BIOSPHERE', path: `${path}.detail.biosphere`, message: `${category} generated non-sterile biosphere "${body.detail.biosphere.value}".`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!envelopeAllowedGeologies.has(body.detail.geology.value)) {
      findings.push(finding({ severity: 'error', code: 'BODY_ENVELOPE_GEOLOGY', path: `${path}.detail.geology`, message: `${category} has surface geology "${body.detail.geology.value}".`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!body.physical.gravityLabel.value.startsWith('Cloud-top/envelope estimate')) {
      findings.push(finding({ severity: 'error', code: 'BODY_ENVELOPE_GRAVITY_LABEL', path: `${path}.physical.gravityLabel`, message: `${category} gravity label should be an envelope estimate.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
  } else if (category !== 'anomaly' && body.physical.volatileEnvelope.value) {
    findings.push(finding({ severity: 'error', code: 'BODY_NON_ENVELOPE_FLAG', path: `${path}.physical.volatileEnvelope`, message: `${category} should not be marked as a volatile-envelope world.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
  }

  if (category === 'belt') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      findings.push(finding({ severity: 'error', code: 'BODY_BELT_PHYSICAL', path: `${path}.physical`, message: 'Belt should not have mass or surface gravity estimates.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!body.physical.gravityLabel.value.includes('distributed belt')) {
      findings.push(finding({ severity: 'error', code: 'BODY_BELT_GRAVITY_LABEL', path: `${path}.physical.gravityLabel`, message: 'Belt gravity label should explain distributed belt/swarm.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (body.detail.geology.value !== 'Minor-body rubble and collision families') {
      findings.push(finding({ severity: 'error', code: 'BODY_BELT_GEOLOGY', path: `${path}.detail.geology`, message: `Belt has non-belt geology "${body.detail.geology.value}".`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
  }

  if (category === 'anomaly') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      findings.push(finding({ severity: 'error', code: 'BODY_ANOMALY_PHYSICAL', path: `${path}.physical`, message: 'Anomaly should not have ordinary mass or gravity estimates.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!body.physical.gravityLabel.value.startsWith('Unreliable')) {
      findings.push(finding({ severity: 'error', code: 'BODY_ANOMALY_GRAVITY_LABEL', path: `${path}.physical.gravityLabel`, message: 'Anomaly gravity label should be marked unreliable.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (body.rings) {
      findings.push(finding({ severity: 'error', code: 'BODY_ANOMALY_RINGS', path: `${path}.rings`, message: 'Anomaly should not use ordinary planet ring generation.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (body.moons.length > 0) {
      findings.push(finding({ severity: 'error', code: 'BODY_ANOMALY_MOONS', path: `${path}.moons`, message: 'Anomaly should not use ordinary moon generation.', targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!anomalyAllowedGeologies.has(body.detail.geology.value)) {
      findings.push(finding({ severity: 'error', code: 'BODY_ANOMALY_GEOLOGY', path: `${path}.detail.geology`, message: `Anomaly has ordinary planet geology "${body.detail.geology.value}".`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
  }

  if (!envelopeCategories.has(category) && category !== 'belt' && category !== 'anomaly') {
    if (body.physical.massEarth.value === null || body.physical.surfaceGravityG.value === null) {
      findings.push(finding({ severity: 'error', code: 'BODY_SOLID_PHYSICAL', path: `${path}.physical`, message: `${category} is missing mass or gravity estimates.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
    if (!body.physical.gravityLabel.value.startsWith('Estimated surface gravity')) {
      findings.push(finding({ severity: 'error', code: 'BODY_SOLID_GRAVITY_LABEL', path: `${path}.physical.gravityLabel`, message: `${category} gravity label should be a surface estimate.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
    }
  }

  if (body.rings && category !== 'gas-giant' && category !== 'ice-giant') {
    findings.push(finding({ severity: 'error', code: 'BODY_INVALID_RING_CATEGORY', path: `${path}.rings`, message: `${category} generated a ring system.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
  }

  if (extremeHotZones.has(body.thermalZone.value) && body.moons.length > 0) {
    findings.push(finding({ severity: 'error', code: 'BODY_EXTREME_HOT_MOONS', path: `${path}.moons`, message: `${body.thermalZone.value} world generated ${body.moons.length} moons.`, targetId: body.id, targetKind: 'body', source: 'generated-error' }))
  }

  return findings
}

export function validateArchitecture(system: GeneratedSystem): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const architecture = system.architecture.name.value
  const fullPlanets = countBodiesByCategory(system, fullPlanetCategories)
  const minorBodies = countBodiesByCategory(system, minorBodyCategories)
  const rockyChainBodies = countBodiesByCategory(system, rockyChainCategories)
  const giants = countBodiesByCategory(system, giantCategories)

  const addArchitectureFinding = (message: string, observed?: unknown, expected?: unknown) => findings.push(finding({
    severity: 'error',
    code: validationCodes.architectureMinimumUnsatisfied,
    path: 'architecture.bodyPlan',
    message,
    targetId: system.id,
    targetKind: 'architecture',
    source: 'generated-error',
    observed,
    expected,
  }))

  if (architecture === 'Failed system') {
    if (fullPlanets > 3) addArchitectureFinding(`Failed system generated ${fullPlanets} full planets.`, fullPlanets, '<= 3')
    if (minorBodies < 2) addArchitectureFinding(`Failed system generated only ${minorBodies} debris/minor bodies.`, minorBodies, '>= 2')
  }
  if (architecture === 'Debris-dominated' && (minorBodies < 2 || minorBodies + 1 < fullPlanets)) {
    addArchitectureFinding(`Debris-dominated system has ${minorBodies} debris/minor bodies versus ${fullPlanets} full planets.`, { minorBodies, fullPlanets }, 'debris/minor dominance')
  }
  if (architecture === 'Sparse rocky') {
    if (rockyChainBodies < 1) addArchitectureFinding('Sparse rocky system lacks a rocky/super-terrestrial/sub-Neptune survivor.', rockyChainBodies, '>= 1')
    if (giants > 1) addArchitectureFinding(`Sparse rocky system generated ${giants} giants.`, giants, '<= 1')
  }
  if (architecture === 'Compact inner system' && rockyChainBodies < 3) addArchitectureFinding(`Compact inner system generated only ${rockyChainBodies} rocky/super-Earth/sub-Neptune bodies.`, rockyChainBodies, '>= 3')
  if (architecture === 'Peas-in-a-pod chain' && rockyChainBodies < 4) addArchitectureFinding(`Peas-in-a-pod chain generated only ${rockyChainBodies} chain bodies.`, rockyChainBodies, '>= 4')
  if (architecture === 'Solar-ish mixed' && giants < 1) addArchitectureFinding('Solar-ish mixed system lacks a giant planet.', giants, '>= 1')
  if (architecture === 'Migrated giant' && giants < 1) addArchitectureFinding('Migrated giant architecture lacks a generated giant.', giants, '>= 1')
  if (architecture === 'Giant-rich or chaotic' && giants < 2) addArchitectureFinding(`Giant-rich or chaotic system generated only ${giants} giants.`, giants, '>= 2')

  return findings
}

export function validateSettlementNames(system: GeneratedSystem): ValidationFinding[] {
  const names = system.settlements.map((settlement) => settlement.name.value)
  if (!hasDuplicates(names)) return []

  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
  return [...new Set(duplicateNames)].map((name) => finding({
    severity: 'warning',
    code: validationCodes.settlementDuplicateName,
    path: 'settlements.name',
    message: `Settlement name "${name}" repeats within the system.`,
    targetId: system.id,
    targetKind: 'settlement',
    source: 'generated-error',
    observed: name,
    expected: 'unique settlement names per system',
  }))
}

export function validateSettlementCompatibility(system: GeneratedSystem, settlement: Settlement, path = 'settlement'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const body = system.bodies.find((candidate) => candidate.id === settlement.bodyId)
  const siteCategory = settlement.siteCategory.value
  const allowedBuiltForms = allowedBuiltFormsBySiteCategory[siteCategory]

  if (!body) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_MISSING_BODY', path: `${path}.bodyId`, message: `Settlement references missing body "${settlement.bodyId}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
    return findings
  }

  const tags = settlement.tags.map((tag) => tag.value)
  if (tags.length < 2) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_TAGS_MISSING', path: `${path}.tags`, message: 'Settlement has fewer than two tags.', targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  } else if (hasDuplicates(tags)) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_TAGS_DUPLICATE', path: `${path}.tags`, message: `Settlement repeats tag pair "${tags.join(' + ')}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  }

  if (!allowedBuiltForms) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_UNKNOWN_SITE_CATEGORY', path: `${path}.siteCategory`, message: `Unknown site category "${siteCategory}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  } else if (!allowedBuiltForms.has(settlement.builtForm.value)) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_BUILT_FORM_INCOMPATIBLE', path: `${path}.builtForm`, message: `${siteCategory} has incompatible built form "${settlement.builtForm.value}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  }

  if (system.guOverlay.intensity.value.includes('fracture') || system.guOverlay.intensity.value.includes('shear')) {
    const allowedFunctions = guFractureFunctionsBySiteCategory[siteCategory]
    if (!allowedFunctions?.has(settlement.function.value)) {
      findings.push(finding({ severity: 'error', code: 'SETTLEMENT_GU_FUNCTION_INCOMPATIBLE', path: `${path}.function`, message: `${siteCategory} has incompatible GU fracture/shear function "${settlement.function.value}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
    }
  }

  if (siteCategory === 'Moon base') {
    if (!settlement.moonId) {
      findings.push(finding({ severity: 'error', code: 'SETTLEMENT_MOON_BASE_MISSING_MOON', path: `${path}.moonId`, message: 'Moon base lacks a moon id.', targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
    } else if (!body.moons.some((moon) => moon.id === settlement.moonId)) {
      findings.push(finding({ severity: 'error', code: 'SETTLEMENT_MOON_BASE_INVALID_MOON', path: `${path}.moonId`, message: `Moon base references missing moon "${settlement.moonId}".`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
    }
  } else if (settlement.moonId) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_UNEXPECTED_MOON_ID', path: `${path}.moonId`, message: `${siteCategory} should not carry a moon id.`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  }

  if (siteCategory === 'Surface settlement' && envelopeCategories.has(body.category.value)) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_SURFACE_ON_ENVELOPE', path: `${path}.siteCategory`, message: `Surface settlement anchored to ${body.category.value}.`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  }
  if (siteCategory === 'Surface settlement' && extremeHotZones.has(body.thermalZone.value)) {
    findings.push(finding({ severity: 'error', code: 'SETTLEMENT_SURFACE_ON_EXTREME_HOT', path: `${path}.siteCategory`, message: `Surface settlement anchored to ${body.thermalZone.value} body.`, targetId: settlement.id, targetKind: 'settlement', source: 'generated-error' }))
  }

  return findings
}

export function validateMoonAnchors(system: GeneratedSystem): ValidationFinding[] {
  return system.settlements.flatMap((settlement, index) => validateSettlementCompatibility(system, settlement, `settlements[${index}]`).filter((finding) => finding.path.endsWith('.moonId')))
}

function collectStrings(value: unknown, path = '$'): Array<{ path: string; value: string }> {
  if (typeof value === 'string') return [{ path, value }]
  if (typeof value !== 'object' || value === null) return []
  if (Array.isArray(value)) return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`))

  return Object.entries(value).flatMap(([key, entry]) => {
    if (key === 'noAlienCheck' || key === 'source') return []
    return collectStrings(entry, `${path}.${key}`)
  })
}

export function validateNoAlienText(system: GeneratedSystem): ValidationFinding[] {
  return collectStrings(system).flatMap((text) => {
    const forbiddenPattern = forbiddenAlienPatterns.find((pattern) => pattern.test(text.value))
    if (!forbiddenPattern) return []
    return [finding({
      severity: 'error',
      code: 'NO_ALIEN_TEXT',
      path: text.path,
      message: `Forbidden no-alien phrase survived: "${text.value}".`,
      targetId: system.id,
      targetKind: 'system',
      source: 'generated-error',
      observed: text.value,
      expected: 'MASS-GU human or natural explanation terminology',
    })]
  })
}

export function validateLockedBodyDetail(): ValidationFinding[] {
  return []
}

export function validateSystem(system: GeneratedSystem): ValidationFinding[] {
  return [
    ...validateArchitecture(system),
    ...validateSettlementNames(system),
    ...system.bodies.flatMap((body, index) => [
      ...validateBodyEnvironment(body, `bodies[${index}]`),
      ...validateBodyPhysicalContract(body, `bodies[${index}]`),
    ]),
    ...system.settlements.flatMap((settlement, index) => validateSettlementCompatibility(system, settlement, `settlements[${index}]`)),
    ...validateNoAlienText(system),
  ]
}

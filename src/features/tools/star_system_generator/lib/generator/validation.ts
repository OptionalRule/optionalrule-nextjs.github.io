import type { BodyCategory, Fact, GeneratedSystem, OrbitingBody, Settlement } from '../../types'
import { evaluateArchitectureSatisfaction } from './architecture'
import {
  rockyChainCategories,
} from './domain'
import {
  builtForms,
  guFractureFunctionsBySiteCategory as settlementGuFractureFunctionsBySiteCategory,
  settlementLocations,
} from './data/settlements'
import {
  airlessAllowedAtmospheres,
  airlessAllowedHydrospheres,
  anomalyAllowedGeologies,
  coldAllowedClimateTags,
  desertAllowedHydrospheres,
  envelopeAllowedGeologies,
  extremeHotAllowedAtmospheres,
  extremeHotAllowedHydrospheres,
  isAirlessAtmosphere,
  isAirlessClass,
  isAirlessHydrosphere,
  isDesertClass,
  isDesertCompatibleHydrosphere,
  isEnvelopeCategory as isEnvelopeCategoryCompatible,
  isGreenhouseAtmosphereCompatible,
  isGreenhouseClass,
  isHyceanClass,
  isHyceanHydrosphere,
  isSolidHydrogenEnvelopeConflict,
  isSolidSurfaceCategory as isSolidSurfaceCategoryCompatible,
  isWaterOceanClass,
  isWetOceanHydrosphere,
} from './environmentCompatibility'

export {
  isAirlessAtmosphere,
  isAirlessClass,
  isAirlessHydrosphere,
  isDesertClass,
  isDesertCompatibleHydrosphere,
} from './environmentCompatibility'

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
  environmentGreenhouseAtmosphere: 'ENV_GREENHOUSE_ATMOSPHERE',
  environmentOceanHydrosphere: 'ENV_OCEAN_HYDROSPHERE',
  environmentHyceanHydrosphere: 'ENV_HYCEAN_HYDROSPHERE',
  environmentSolidHydrogenEnvelope: 'ENV_SOLID_H2_ENVELOPE',
  architectureMinimumUnsatisfied: 'ARCH_MINIMUM_UNSATISFIED',
  settlementDuplicateName: 'SETTLEMENT_DUPLICATE_NAME',
  lockedFactConflict: 'LOCKED_FACT_CONFLICT',
  repairApplied: 'REPAIR_APPLIED',
  proseSingularMoonGrammar: 'PROSE_SINGULAR_MOON_GRAMMAR',
  proseRedundantZoneWording: 'PROSE_REDUNDANT_ZONE_WORDING',
  narrativeNoConcreteFact: 'NARRATIVE_NO_CONCRETE_FACT',
  narrativeUnknownFactRef: 'NARRATIVE_UNKNOWN_FACT_REF',
  narrativeUnresolvedSlot: 'NARRATIVE_UNRESOLVED_SLOT',
  narrativeThreadMissingBeat: 'NARRATIVE_THREAD_MISSING_BEAT',
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

const forbiddenAlienPatterns = [
  /\balien\b/i,
  /\bnonhuman\b/i,
  /\bnative\s+civilization\b/i,
  /\bancient\s+cities\b/i,
  /\bforbidden\s+archaeology\b/i,
]

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

function finding(input: ValidationFinding): ValidationFinding {
  return input
}

function detailConflictFinding(input: {
  code: ValidationCode
  path: string
  message: string
  targetId: string
  fact: Fact<unknown>
  expected: unknown
}): ValidationFinding {
  if (input.fact.locked) {
    return finding({
      severity: 'warning',
      code: validationCodes.lockedFactConflict,
      path: input.path,
      message: `Locked imported fact conflicts with ${input.code}: ${input.message}`,
      targetId: input.targetId,
      targetKind: 'locked-fact',
      source: validationSources.lockedConflict,
      observed: input.fact.value,
      expected: input.expected,
      policyCode: input.code,
      locked: true,
    })
  }

  return finding({
    severity: 'error',
    code: input.code,
    path: input.path,
    message: input.message,
    targetId: input.targetId,
    targetKind: 'body',
    source: validationSources.generatedError,
    observed: input.fact.value,
    expected: input.expected,
  })
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

export function isEnvelopeCategory(category: BodyCategory): boolean {
  return isEnvelopeCategoryCompatible(category)
}

export function isSolidSurfaceCategory(category: BodyCategory): boolean {
  return isSolidSurfaceCategoryCompatible(category)
}

export function isRockyChainCategory(category: BodyCategory): boolean {
  return rockyChainCategories.has(category)
}

export function isAtmosphereCompatible(body: OrbitingBody): boolean {
  if (isAirlessClass(body.bodyClass.value)) return isAirlessAtmosphere(body.detail.atmosphere.value)
  if (isGreenhouseClass(body.bodyClass.value)) return isGreenhouseAtmosphereCompatible(body.detail.atmosphere.value)
  if (isSolidHydrogenEnvelopeConflict(body)) return false
  return true
}

export function isHydrosphereCompatible(body: OrbitingBody): boolean {
  if (isHyceanClass(body.bodyClass.value)) return isHyceanHydrosphere(body.detail.hydrosphere.value)
  if (isAirlessClass(body.bodyClass.value)) return isAirlessHydrosphere(body.detail.hydrosphere.value)
  if (isDesertClass(body.bodyClass.value)) return isDesertCompatibleHydrosphere(body.detail.hydrosphere.value)
  if (isWaterOceanClass(body.bodyClass.value)) return isWetOceanHydrosphere(body.detail.hydrosphere.value)
  return true
}

export function validateBodyEnvironment(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const category = body.category.value
  const thermalZone = body.thermalZone.value

  if (extremeHotZones.has(thermalZone) && !isEnvelopeCategory(category) && category !== 'anomaly') {
    if (!extremeHotAllowedAtmospheres.has(body.detail.atmosphere.value)) {
      findings.push(detailConflictFinding({
        code: 'ENV_EXTREME_HOT_ATMOSPHERE',
        path: `${path}.detail.atmosphere`,
        message: `${thermalZone} world has implausible atmosphere "${body.detail.atmosphere.value}".`,
        targetId: body.id,
        fact: body.detail.atmosphere,
        expected: [...extremeHotAllowedAtmospheres],
      }))
    }
    if (!extremeHotAllowedHydrospheres.has(body.detail.hydrosphere.value)) {
      findings.push(detailConflictFinding({
        code: 'ENV_EXTREME_HOT_HYDROSPHERE',
        path: `${path}.detail.hydrosphere`,
        message: `${thermalZone} world has implausible hydrosphere "${body.detail.hydrosphere.value}".`,
        targetId: body.id,
        fact: body.detail.hydrosphere,
        expected: [...extremeHotAllowedHydrospheres],
      }))
    }
  }

  if (extremeHotZones.has(thermalZone) && body.detail.biosphere.value !== 'Sterile') {
    findings.push(detailConflictFinding({
      code: 'ENV_EXTREME_HOT_BIOSPHERE',
      path: `${path}.detail.biosphere`,
      message: `${thermalZone} world has non-sterile biosphere "${body.detail.biosphere.value}".`,
      targetId: body.id,
      fact: body.detail.biosphere,
      expected: 'Sterile',
    }))
  }

  if (coldZones.has(thermalZone) && isSolidSurfaceCategory(category)) {
    const badClimate = body.detail.climate.find((tag) => !coldAllowedClimateTags.has(tag.value))
    if (badClimate) {
      findings.push(detailConflictFinding({
        code: 'ENV_COLD_CLIMATE',
        path: `${path}.detail.climate`,
        message: `${thermalZone} solid body has hot/temperate climate tag "${badClimate.value}".`,
        targetId: body.id,
        fact: badClimate,
        expected: [...coldAllowedClimateTags],
      }))
    }
  }

  if (isAirlessClass(body.bodyClass.value) && !isAirlessAtmosphere(body.detail.atmosphere.value)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentAirlessAtmosphere,
      path: `${path}.detail.atmosphere`,
      message: `Airless class "${body.bodyClass.value}" has incompatible atmosphere "${body.detail.atmosphere.value}".`,
      targetId: body.id,
      fact: body.detail.atmosphere,
      expected: [...airlessAllowedAtmospheres],
    }))
  }

  if (isAirlessClass(body.bodyClass.value) && !isAirlessHydrosphere(body.detail.hydrosphere.value)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentAirlessHydrosphere,
      path: `${path}.detail.hydrosphere`,
      message: `Airless class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
      targetId: body.id,
      fact: body.detail.hydrosphere,
      expected: [...airlessAllowedHydrospheres],
    }))
  }

  if (isDesertClass(body.bodyClass.value) && !isDesertCompatibleHydrosphere(body.detail.hydrosphere.value)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentDesertHydrosphere,
      path: `${path}.detail.hydrosphere`,
      message: `Desert class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
      targetId: body.id,
      fact: body.detail.hydrosphere,
      expected: [...desertAllowedHydrospheres],
    }))
  }

  if (isGreenhouseClass(body.bodyClass.value) && !isGreenhouseAtmosphereCompatible(body.detail.atmosphere.value)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentGreenhouseAtmosphere,
      path: `${path}.detail.atmosphere`,
      message: `Atmosphere-bearing greenhouse/cloud class "${body.bodyClass.value}" has incompatible atmosphere "${body.detail.atmosphere.value}".`,
      targetId: body.id,
      fact: body.detail.atmosphere,
      expected: 'dense, greenhouse, steam, haze, toxic, or GU-distorted atmosphere',
    }))
  }

  if (isHyceanClass(body.bodyClass.value)) {
    if (!isHyceanHydrosphere(body.detail.hydrosphere.value)) {
      findings.push(detailConflictFinding({
        code: validationCodes.environmentHyceanHydrosphere,
        path: `${path}.detail.hydrosphere`,
        message: `Hycean class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
        targetId: body.id,
        fact: body.detail.hydrosphere,
        expected: 'deep ocean, condensate, or deep atmospheric volatile layers',
      }))
    }
  } else if (isWaterOceanClass(body.bodyClass.value) && !isWetOceanHydrosphere(body.detail.hydrosphere.value)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentOceanHydrosphere,
      path: `${path}.detail.hydrosphere`,
      message: `Water/ocean class "${body.bodyClass.value}" has incompatible hydrosphere "${body.detail.hydrosphere.value}".`,
      targetId: body.id,
      fact: body.detail.hydrosphere,
      expected: 'wet, protected-ocean, volatile, or vaporized ocean-remnant hydrosphere',
    }))
  }

  if (isSolidHydrogenEnvelopeConflict(body)) {
    findings.push(detailConflictFinding({
      code: validationCodes.environmentSolidHydrogenEnvelope,
      path: `${path}.detail.atmosphere`,
      message: `Solid class "${body.bodyClass.value}" should not retain a hydrogen/helium envelope atmosphere.`,
      targetId: body.id,
      fact: body.detail.atmosphere,
      expected: 'solid-world atmosphere or airless state',
    }))
  }

  return findings
}

export function validateBodyPhysicalContract(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const category = body.category.value

  if (isEnvelopeCategory(category)) {
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

  if (!isEnvelopeCategory(category) && category !== 'belt' && category !== 'anomaly') {
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
  return evaluateArchitectureSatisfaction(system.architecture.name.value, system.bodies).map((result) => finding({
    severity: 'error',
    code: validationCodes.architectureMinimumUnsatisfied,
    path: 'architecture.bodyPlan',
    message: result.message,
    targetId: system.id,
    targetKind: 'architecture',
    source: 'generated-error',
    observed: result.observed,
    expected: result.expected,
  }))
}

export function validateSettlementNames(system: GeneratedSystem): ValidationFinding[] {
  const names = system.settlements.map((settlement) => settlement.name.value)
  if (!hasDuplicates(names)) return []

  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
  return [...new Set(duplicateNames)].map((name) => finding({
    severity: 'error',
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

  if (siteCategory === 'Surface settlement' && isEnvelopeCategory(body.category.value)) {
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

export function validateBodyInterestText(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const value = body.whyInteresting.value

  if (/\b(?:hot|cold|cryogenic|inferno|furnace|temperate band)\s+zone\b/i.test(value)) {
    findings.push(finding({
      severity: 'warning',
      code: validationCodes.proseRedundantZoneWording,
      path: `${path}.whyInteresting`,
      message: `Body interest text uses redundant thermal-zone wording: "${value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: value,
      expected: 'natural thermal-location phrasing',
    }))
  }

  if (/\b1\s+major\s+moons?\s+create\b/i.test(value) || /\b[2-9]\s+major\s+moon\s+creates\b/i.test(value)) {
    findings.push(finding({
      severity: 'error',
      code: validationCodes.proseSingularMoonGrammar,
      path: `${path}.whyInteresting`,
      message: `Body interest text has moon-count grammar mismatch: "${value}".`,
      targetId: body.id,
      targetKind: 'body',
      source: 'generated-error',
      observed: value,
      expected: 'moon count agrees with noun and verb',
    }))
  }

  return findings
}

export function validateLockedBodyDetail(body: OrbitingBody, path = 'body'): ValidationFinding[] {
  return validateBodyEnvironment(body, path).filter((finding) => finding.source === validationSources.lockedConflict)
}

export function validateNarrativeCoherence(system: GeneratedSystem): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const factIds = new Set(system.narrativeFacts.map((factEntry) => factEntry.id))
  const lineIds = new Set(system.narrativeLines.map((line) => line.id))

  system.narrativeLines.forEach((line, index) => {
    if (line.text.value.includes('{') || line.text.value.includes('}')) {
      findings.push(finding({
        severity: 'error',
        code: validationCodes.narrativeUnresolvedSlot,
        path: `narrativeLines[${index}].text`,
        message: `Narrative line has unresolved template slot: "${line.text.value}".`,
        targetId: line.id,
        targetKind: 'system',
        source: validationSources.generatedError,
        observed: line.text.value,
        expected: 'fully resolved narrative text',
      }))
    }

    if (!line.factsUsed.length) {
      findings.push(finding({
        severity: 'warning',
        code: validationCodes.narrativeNoConcreteFact,
        path: `narrativeLines[${index}].factsUsed`,
        message: `Narrative line "${line.label.value}" does not reference a generated narrative fact.`,
        targetId: line.id,
        targetKind: 'system',
        source: validationSources.audit,
        expected: 'at least one generated fact reference',
      }))
    }

    line.factsUsed.forEach((factId, factIndex) => {
      if (!factIds.has(factId)) {
        findings.push(finding({
          severity: 'error',
          code: validationCodes.narrativeUnknownFactRef,
          path: `narrativeLines[${index}].factsUsed[${factIndex}]`,
          message: `Narrative line references unknown narrative fact "${factId}".`,
          targetId: line.id,
          targetKind: 'system',
          source: validationSources.generatedError,
          observed: factId,
          expected: 'known narrative fact id',
        }))
      }
    })
  })

  system.narrativeThreads.forEach((thread, index) => {
    if (thread.beats.length < 4) {
      findings.push(finding({
        severity: 'warning',
        code: validationCodes.narrativeThreadMissingBeat,
        path: `narrativeThreads[${index}].beats`,
        message: `Narrative thread "${thread.title.value}" has fewer than four beats.`,
        targetId: thread.id,
        targetKind: 'system',
        source: validationSources.audit,
        observed: thread.beats.length,
        expected: 'public premise, pressure, hidden cause, and choice beats',
      }))
    }

    thread.lineIds.forEach((lineId, lineIndex) => {
      if (!lineIds.has(lineId)) {
        findings.push(finding({
          severity: 'error',
          code: validationCodes.narrativeUnknownFactRef,
          path: `narrativeThreads[${index}].lineIds[${lineIndex}]`,
          message: `Narrative thread references unknown line "${lineId}".`,
          targetId: thread.id,
          targetKind: 'system',
          source: validationSources.generatedError,
          observed: lineId,
          expected: 'known narrative line id',
        }))
      }
    })
  })

  return findings
}

export function validateSystem(system: GeneratedSystem): ValidationFinding[] {
  return [
    ...validateArchitecture(system),
    ...validateSettlementNames(system),
    ...system.bodies.flatMap((body, index) => [
      ...validateBodyEnvironment(body, `bodies[${index}]`),
      ...validateBodyPhysicalContract(body, `bodies[${index}]`),
      ...validateBodyInterestText(body, `bodies[${index}]`),
    ]),
    ...system.settlements.flatMap((settlement, index) => validateSettlementCompatibility(system, settlement, `settlements[${index}]`)),
    ...validateNarrativeCoherence(system),
    ...validateNoAlienText(system),
  ]
}

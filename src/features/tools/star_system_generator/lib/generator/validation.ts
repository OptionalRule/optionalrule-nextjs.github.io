import type { BodyCategory, Fact, GeneratedSystem, OrbitingBody, Settlement } from '../../types'
import { evaluateArchitectureSatisfaction } from './architecture'
import { separationToBucketAu } from './companionGeometry'
import { circumbinaryInnerAuLimit, siblingOuterAuLimit } from './companionStability'
import { selectArchetypeForCompanion } from './debrisFields'
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
  binaryStabilityConflict: 'BINARY_STABILITY_CONFLICT',
  debrisFieldMissing: 'DEBRIS_FIELD_MISSING',
  debrisFieldGeometryInvalid: 'DEBRIS_FIELD_GEOMETRY_INVALID',
  debrisFieldAnchorViolation: 'DEBRIS_FIELD_ANCHOR_VIOLATION',
  debrisFieldPhenomenonOrphan: 'DEBRIS_FIELD_PHENOMENON_ORPHAN',
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

function systemIsOrbitVolumeConstrained(system: GeneratedSystem): boolean {
  if (!system.primary?.massSolar) return false
  if (system.companions.some((c) => c.mode === 'volatile')) return true
  const siblings = system.companions.filter((c) => c.mode === 'orbital-sibling')
  if (siblings.length === 0) return false
  const limit = Math.min(
    ...siblings.map((c) =>
      siblingOuterAuLimit(
        separationToBucketAu(c.separation.value),
        system.primary.massSolar.value,
        c.star.massSolar.value,
      )
    )
  )
  return limit < 1
}

export function validateArchitecture(system: GeneratedSystem): ValidationFinding[] {
  const orbitVolumeConstrained = systemIsOrbitVolumeConstrained(system)
  return evaluateArchitectureSatisfaction(system.architecture.name.value, system.bodies).map((result) => finding({
    severity: orbitVolumeConstrained ? 'warning' : 'error',
    code: validationCodes.architectureMinimumUnsatisfied,
    path: 'architecture.bodyPlan',
    message: orbitVolumeConstrained
      ? `${result.message} (orbit volume constrained by binary stability)`
      : result.message,
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

export function validateBinaryStability(system: GeneratedSystem): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  if (!system.primary?.massSolar || system.companions.length === 0) return findings
  const primaryMass = system.primary.massSolar.value

  const circumbinary = system.companions.find((c) => c.mode === 'circumbinary')
  if (circumbinary) {
    const innerLimit = circumbinaryInnerAuLimit(
      separationToBucketAu(circumbinary.separation.value),
      primaryMass,
      circumbinary.star.massSolar.value,
    )
    system.bodies.forEach((body, index) => {
      if (body.orbitAu.value < innerLimit) {
        const locked = body.orbitAu.locked === true
        findings.push({
          severity: locked ? 'warning' : 'error',
          code: locked ? validationCodes.lockedFactConflict : validationCodes.binaryStabilityConflict,
          path: `bodies[${index}].orbitAu`,
          message: `Body sits at ${body.orbitAu.value} AU, inside the circumbinary inner stability limit ${innerLimit.toFixed(2)} AU.`,
          targetId: body.id,
          targetKind: 'body',
          source: validationSources.generatedError,
          observed: body.orbitAu.value,
          expected: `>= ${innerLimit.toFixed(2)}`,
          policyCode: locked ? validationCodes.binaryStabilityConflict : undefined,
          locked,
        })
      }
    })
  }

  const siblings = system.companions.filter((c) => c.mode === 'orbital-sibling')
  if (siblings.length > 0) {
    const limit = Math.min(
      ...siblings.map((c) =>
        siblingOuterAuLimit(
          separationToBucketAu(c.separation.value),
          primaryMass,
          c.star.massSolar.value,
        )
      )
    )
    system.bodies.forEach((body, index) => {
      if (body.orbitAu.value > limit) {
        const locked = body.orbitAu.locked === true
        findings.push({
          severity: locked ? 'warning' : 'error',
          code: locked ? validationCodes.lockedFactConflict : validationCodes.binaryStabilityConflict,
          path: `bodies[${index}].orbitAu`,
          message: `Body sits at ${body.orbitAu.value} AU, outside the sibling-binary outer stability limit ${limit.toFixed(2)} AU.`,
          targetId: body.id,
          targetKind: 'body',
          source: validationSources.generatedError,
          observed: body.orbitAu.value,
          expected: `<= ${limit.toFixed(2)}`,
          policyCode: locked ? validationCodes.binaryStabilityConflict : undefined,
          locked,
        })
      }
    })
  }

  for (const companion of siblings) {
    if (!companion.subSystem) continue
    const compLimit = siblingOuterAuLimit(
      separationToBucketAu(companion.separation.value),
      companion.star.massSolar.value,
      primaryMass,
    )
    companion.subSystem.bodies.forEach((body, index) => {
      if (body.orbitAu.value > compLimit) {
        const locked = body.orbitAu.locked === true
        findings.push({
          severity: locked ? 'warning' : 'error',
          code: locked ? validationCodes.lockedFactConflict : validationCodes.binaryStabilityConflict,
          path: `companions[${companion.id}].subSystem.bodies[${index}].orbitAu`,
          message: `Sub-system body sits at ${body.orbitAu.value} AU, outside the sibling-binary outer stability limit ${compLimit.toFixed(2)} AU.`,
          targetId: body.id,
          targetKind: 'body',
          source: validationSources.generatedError,
          observed: body.orbitAu.value,
          expected: `<= ${compLimit.toFixed(2)}`,
          policyCode: locked ? validationCodes.binaryStabilityConflict : undefined,
          locked,
        })
      }
    })
  }

  return findings
}

const TRANSIENT_MOBILE_PATTERNS = new Set(['Distributed swarm', 'Mobile site'])

export function validateDebrisFields(system: GeneratedSystem): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const debrisFields = system.debrisFields ?? []
  const phenomena = system.phenomena ?? []
  const ruins = system.ruins ?? []
  const hierarchicalTriple = system.companions.some(c => c.id === 'companion-2')
  const fieldById = new Map(debrisFields.map(f => [f.id, f]))
  const fieldByCompanionId = new Map(debrisFields.map(f => [f.companionId, f]))
  const phenomenonIds = new Set(phenomena.map(p => p.id))
  const debrisSpawnedPhenomenonIds = new Set(
    debrisFields.flatMap(f => f.spawnedPhenomenonId ? [f.spawnedPhenomenonId] : [])
  )

  for (const companion of system.companions) {
    const expected = selectArchetypeForCompanion(
      { seed: system.seed },
      companion,
      system.primary,
      { hierarchicalTriple },
    )
    if (!expected) continue
    if (!fieldByCompanionId.has(companion.id)) {
      findings.push(finding({
        severity: 'error',
        code: validationCodes.debrisFieldMissing,
        path: `companions[${companion.id}].debrisField`,
        message: `Companion ${companion.id} (mode: ${companion.mode}) should produce a debris field (shape: ${expected.shape}) but none exists in system.debrisFields.`,
        targetId: companion.id,
        targetKind: 'system',
        source: validationSources.audit,
        observed: null,
        expected: expected.shape,
      }))
    }
  }

  const circumbinary = system.companions.find(c => c.mode === 'circumbinary')
  if (circumbinary && system.primary?.massSolar) {
    const sepAu = separationToBucketAu(circumbinary.separation.value)
    const innerLimit = circumbinaryInnerAuLimit(sepAu, system.primary.massSolar.value, circumbinary.star.massSolar.value)
    const coOrbitalShapes = new Set<string>(['trojan-camp', 'mass-transfer-stream', 'accretion-bridge', 'inner-pair-halo'])
    debrisFields.forEach((field, index) => {
      if (coOrbitalShapes.has(field.shape.value)) return
      if (field.spatialExtent.innerAu.value < innerLimit) {
        findings.push(finding({
          severity: 'error',
          code: validationCodes.debrisFieldGeometryInvalid,
          path: `debrisFields[${index}].spatialExtent.innerAu`,
          message: `Debris field ${field.id} (shape: ${field.shape.value}) innerAu ${field.spatialExtent.innerAu.value.toFixed(3)} AU is inside the circumbinary keep-out radius ${innerLimit.toFixed(3)} AU.`,
          targetId: field.id,
          targetKind: 'system',
          source: validationSources.audit,
          observed: field.spatialExtent.innerAu.value,
          expected: `>= ${innerLimit.toFixed(3)}`,
        }))
      }
    })

    debrisFields.forEach((field, index) => {
      if (field.anchorMode.value !== 'unanchorable') return
      system.bodies.forEach((body, bodyIndex) => {
        const orbit = body.orbitAu.value
        if (orbit >= field.spatialExtent.innerAu.value && orbit <= field.spatialExtent.outerAu.value) {
          findings.push(finding({
            severity: 'error',
            code: validationCodes.debrisFieldGeometryInvalid,
            path: `debrisFields[${index}].spatialExtent`,
            message: `Unanchorable debris field ${field.id} overlaps body ${body.id} at orbit ${orbit.toFixed(3)} AU (field extent: ${field.spatialExtent.innerAu.value.toFixed(3)}-${field.spatialExtent.outerAu.value.toFixed(3)} AU).`,
            targetId: field.id,
            targetKind: 'body',
            source: validationSources.audit,
            observed: orbit,
            expected: `outside ${field.spatialExtent.innerAu.value.toFixed(3)}-${field.spatialExtent.outerAu.value.toFixed(3)} AU`,
          }))
          void bodyIndex
        }
      })
    })
  }

  const allAnchoredEntities: Array<{ debrisFieldId: string; id: string; kind: string; habitationPattern?: string }> = [
    ...system.settlements
      .filter(s => s.debrisFieldId !== undefined)
      .map(s => ({ debrisFieldId: s.debrisFieldId as string, id: s.id, kind: 'settlement', habitationPattern: s.habitationPattern.value })),
    ...ruins
      .filter(r => r.debrisFieldId !== undefined)
      .map(r => ({ debrisFieldId: r.debrisFieldId as string, id: r.id, kind: 'ruin' })),
  ]

  for (const entity of allAnchoredEntities) {
    const field = fieldById.get(entity.debrisFieldId)
    if (!field) continue
    const anchorMode = field.anchorMode.value
    if (anchorMode === 'unanchorable') {
      findings.push(finding({
        severity: 'error',
        code: validationCodes.debrisFieldAnchorViolation,
        path: `${entity.kind}[${entity.id}].debrisFieldId`,
        message: `${entity.kind} ${entity.id} is anchored to debris field ${field.id} whose anchorMode is 'unanchorable'.`,
        targetId: entity.id,
        targetKind: entity.kind === 'settlement' ? 'settlement' : 'system',
        source: validationSources.audit,
        observed: anchorMode,
        expected: 'embedded | edge-only | transient-only',
      }))
    } else if (anchorMode === 'transient-only' && entity.kind === 'settlement') {
      const pattern = entity.habitationPattern ?? ''
      if (!TRANSIENT_MOBILE_PATTERNS.has(pattern)) {
        findings.push(finding({
          severity: 'error',
          code: validationCodes.debrisFieldAnchorViolation,
          path: `settlements[${entity.id}].debrisFieldId`,
          message: `Settlement ${entity.id} (pattern: '${pattern}') is anchored to debris field ${field.id} whose anchorMode is 'transient-only', but the pattern is not mobile.`,
          targetId: entity.id,
          targetKind: 'settlement',
          source: validationSources.audit,
          observed: pattern,
          expected: `one of: ${[...TRANSIENT_MOBILE_PATTERNS].join(', ')}`,
        }))
      }
    }
  }

  debrisFields.forEach((field, index) => {
    if (field.spawnedPhenomenonId !== null && !phenomenonIds.has(field.spawnedPhenomenonId)) {
      findings.push(finding({
        severity: 'error',
        code: validationCodes.debrisFieldPhenomenonOrphan,
        path: `debrisFields[${index}].spawnedPhenomenonId`,
        message: `Debris field ${field.id} references phenomenon ${field.spawnedPhenomenonId} which does not exist in system.phenomena.`,
        targetId: field.id,
        targetKind: 'system',
        source: validationSources.audit,
        observed: field.spawnedPhenomenonId,
        expected: 'existing phenomenon id',
      }))
    }
  })

  phenomena.forEach((phenomenon, index) => {
    if (phenomenon.id.startsWith('phen-debris-') && !debrisSpawnedPhenomenonIds.has(phenomenon.id)) {
      findings.push(finding({
        severity: 'error',
        code: validationCodes.debrisFieldPhenomenonOrphan,
        path: `phenomena[${index}].id`,
        message: `Phenomenon ${phenomenon.id} appears to be debris-spawned (id prefix 'phen-debris-') but no debris field claims it as spawnedPhenomenonId.`,
        targetId: phenomenon.id,
        targetKind: 'system',
        source: validationSources.audit,
        observed: phenomenon.id,
        expected: 'referenced by a debris field spawnedPhenomenonId',
      }))
    }
  })

  return findings
}

export function validateSystem(system: GeneratedSystem): ValidationFinding[] {
  return [
    ...validateArchitecture(system),
    ...validateSettlementNames(system),
    ...validateBinaryStability(system),
    ...validateDebrisFields(system),
    ...system.bodies.flatMap((body, index) => [
      ...validateBodyEnvironment(body, `bodies[${index}]`),
      ...validateBodyPhysicalContract(body, `bodies[${index}]`),
      ...validateBodyInterestText(body, `bodies[${index}]`),
    ]),
    ...system.settlements.flatMap((settlement, index) => validateSettlementCompatibility(system, settlement, `settlements[${index}]`)),
    ...validateNoAlienText(system),
  ]
}

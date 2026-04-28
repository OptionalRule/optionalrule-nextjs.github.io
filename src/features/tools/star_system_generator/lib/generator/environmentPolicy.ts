import type { BodyCategory, Fact, PlanetaryDetail, Star } from '../../types'
import { extremeHotThermalZones, type WorldClassEnvironmentProfile, type WorldClassOption } from './domain'
import { deriveWorldClassMetadata } from './worldClassMetadata'

export type EnvironmentProfile = WorldClassEnvironmentProfile

export interface EnvironmentPolicyFacets {
  substrate: 'solid' | 'minor-body' | 'envelope' | 'metric-phenomenon' | 'engineered'
  atmosphereRegime: 'airless' | 'trace' | 'thin' | 'moderate' | 'dense' | 'envelope' | 'controlled' | 'exotic'
  volatileState: 'none' | 'dry' | 'buried' | 'ice' | 'local-liquid' | 'ocean' | 'deep-envelope' | 'imported' | 'exotic'
  surfaceAccess: 'open-surface' | 'hostile-surface' | 'sealed-habitat' | 'cloud-tops' | 'no-surface'
  management: 'natural' | 'terraformed' | 'failed-terraforming' | 'active-facility' | 'gu-distorted'
  biosphereEligibility: 'none' | 'prebiotic' | 'microbial' | 'open'
  specialTags: string[]
}

export interface EnvironmentPolicy {
  profile: EnvironmentProfile
  facets: EnvironmentPolicyFacets
  atmosphere: {
    allowed: ReadonlySet<string>
    fallback: string
  }
  hydrosphere: {
    allowed: ReadonlySet<string>
    fallback: string
  }
  geology?: {
    allowed?: ReadonlySet<string>
    fallback?: string
  }
  climate?: {
    allowed?: ReadonlySet<string>
  }
  biosphere: {
    allowed: boolean
    forced?: string
  }
  notes: string[]
}

type DetailWithoutBiosphere = Omit<PlanetaryDetail, 'biosphere'>

const airlessAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'None / dispersed volatiles',
  'No ordinary atmosphere',
])

const airlessHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'No accessible surface volatiles',
  'Not applicable: metric or route phenomenon',
])

const desertHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Briny aquifers',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

const envelopeHydrospheres = new Set([
  'Deep atmospheric volatile layers',
  'High-pressure condensate decks',
  'No accessible surface volatiles',
])

const beltAtmospheres = new Set(['None / dispersed volatiles'])
const beltHydrospheres = new Set(['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])

function envelopeCategory(category: BodyCategory): boolean {
  return category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
}

function baseFacets(overrides: Partial<EnvironmentPolicyFacets> = {}): EnvironmentPolicyFacets {
  return {
    substrate: 'solid',
    atmosphereRegime: 'moderate',
    volatileState: 'local-liquid',
    surfaceAccess: 'open-surface',
    management: 'natural',
    biosphereEligibility: 'open',
    specialTags: [],
    ...overrides,
  }
}

export function deriveEnvironmentPolicy(
  bodyClass: WorldClassOption,
  thermalZone: string,
  _primary: Star
): EnvironmentPolicy {
  const category = bodyClass.category
  const metadata = deriveWorldClassMetadata(bodyClass)

  if (category === 'belt') {
    return {
      profile: 'belt',
      facets: baseFacets({ substrate: 'minor-body', atmosphereRegime: 'airless', volatileState: 'ice', surfaceAccess: 'no-surface', biosphereEligibility: 'none' }),
      atmosphere: { allowed: beltAtmospheres, fallback: 'None / dispersed volatiles' },
      hydrosphere: { allowed: beltHydrospheres, fallback: thermalZone === 'Hot' ? 'Hydrated minerals only' : 'Subsurface ice' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Belt profile constrains atmosphere and volatiles to minor-body states.'],
    }
  }

  if (metadata.environmentProfileHint === 'facility') {
    return {
      profile: 'facility',
      facets: baseFacets({ substrate: 'engineered', atmosphereRegime: 'controlled', volatileState: 'imported', surfaceAccess: 'sealed-habitat', management: bodyClass.className.includes('Failed') ? 'failed-terraforming' : 'active-facility', biosphereEligibility: 'microbial' }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: new Set(), fallback: '' },
      biosphere: { allowed: true },
      notes: ['Facility profile permits managed or imported environmental states.'],
    }
  }

  if (category === 'anomaly' || metadata.environmentProfileHint === 'anomaly') {
    return {
      profile: 'anomaly',
      facets: baseFacets({ substrate: 'metric-phenomenon', atmosphereRegime: 'exotic', volatileState: 'exotic', surfaceAccess: 'no-surface', management: 'gu-distorted', biosphereEligibility: 'none' }),
      atmosphere: { allowed: new Set(['Controlled habitat envelopes', 'No ordinary atmosphere']), fallback: 'No ordinary atmosphere' },
      hydrosphere: { allowed: new Set(['Imported or recycled volatiles', 'Not applicable: metric or route phenomenon']), fallback: 'Not applicable: metric or route phenomenon' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Anomaly profile prevents ordinary planetary environment details.'],
    }
  }

  if (metadata.environmentProfileHint === 'airless' || metadata.physicalTags.includes('airless')) {
    return {
      profile: 'airless',
      facets: baseFacets({ atmosphereRegime: 'airless', volatileState: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'ice' : 'dry', surfaceAccess: 'hostile-surface', biosphereEligibility: 'none' }),
      atmosphere: { allowed: airlessAtmospheres, fallback: 'None / hard vacuum' },
      hydrosphere: { allowed: airlessHydrospheres, fallback: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Subsurface ice' : 'Hydrated minerals only' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Airless class constrains atmosphere and surface volatiles.'],
    }
  }

  if (metadata.environmentProfileHint === 'desert' || metadata.physicalTags.includes('desert')) {
    return {
      profile: 'desert',
      facets: baseFacets({ volatileState: 'dry', surfaceAccess: 'hostile-surface', biosphereEligibility: 'prebiotic' }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: desertHydrospheres, fallback: extremeHotThermalZones.has(thermalZone) ? 'Bone dry' : thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Subsurface ice' : 'Briny aquifers' },
      biosphere: { allowed: true },
      notes: ['Desert class constrains hydrosphere to dry, buried, or briny states.'],
    }
  }

  if (envelopeCategory(category)) {
    return {
      profile: 'envelope',
      facets: baseFacets({ substrate: 'envelope', atmosphereRegime: 'envelope', volatileState: 'deep-envelope', surfaceAccess: 'cloud-tops', biosphereEligibility: 'none' }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: envelopeHydrospheres, fallback: 'Deep atmospheric volatile layers' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Envelope profile keeps volatiles in atmosphere/deep-pressure states.'],
    }
  }

  if (metadata.environmentProfileHint === 'ocean' || metadata.physicalTags.includes('ocean')) {
    return {
      profile: 'ocean',
      facets: baseFacets({ volatileState: 'ocean', biosphereEligibility: 'open' }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: new Set(), fallback: '' },
      biosphere: { allowed: true },
      notes: ['Ocean profile preserves source-table ocean and water-rich rolls.'],
    }
  }

  return {
    profile: 'terrestrial',
    facets: baseFacets(),
    atmosphere: { allowed: new Set(), fallback: '' },
    hydrosphere: { allowed: new Set(), fallback: '' },
    biosphere: { allowed: true },
    notes: ['Default terrestrial profile preserves compatible source-table rolls.'],
  }
}

function normalizeFact<T extends string>(
  input: Fact<T>,
  allowed: ReadonlySet<string>,
  fallback: T,
  policy: EnvironmentPolicy,
  field: string
): Fact<T> {
  if (allowed.size === 0 || allowed.has(input.value)) return input

  return {
    ...input,
    value: fallback,
    source: `${input.source ?? 'Generated detail'}; normalized by ${policy.profile} environment policy (${field})`,
  }
}

export function normalizeDetailForEnvironment(
  detail: DetailWithoutBiosphere,
  policy: EnvironmentPolicy
): DetailWithoutBiosphere {
  return {
    ...detail,
    atmosphere: normalizeFact(detail.atmosphere, policy.atmosphere.allowed, policy.atmosphere.fallback, policy, 'atmosphere'),
    hydrosphere: normalizeFact(detail.hydrosphere, policy.hydrosphere.allowed, policy.hydrosphere.fallback, policy, 'hydrosphere'),
  }
}

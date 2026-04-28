import type { BodyCategory, Fact, PlanetaryDetail, Star } from '../../types'
import { extremeHotThermalZones, type WorldClassEnvironmentProfile, type WorldClassOption } from './domain'
import {
  airlessAllowedAtmospheres,
  airlessAllowedHydrospheres,
  beltAllowedAtmospheres,
  beltAllowedHydrospheres,
  desertAllowedHydrospheres,
  envelopeAllowedHydrospheres,
  greenhouseAtmospheres,
  hyceanHydrospheres,
  magmaOceanHydrospheres,
  solidSurfaceAtmospheres,
  steamHydrospheres,
  waterOceanHydrospheres,
} from './environmentCompatibility'
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
      atmosphere: { allowed: beltAllowedAtmospheres, fallback: 'None / dispersed volatiles' },
      hydrosphere: { allowed: beltAllowedHydrospheres, fallback: thermalZone === 'Hot' ? 'Hydrated minerals only' : 'Subsurface ice' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Belt profile constrains atmosphere and volatiles to minor-body states.'],
    }
  }

  if (metadata.environmentProfileHint === 'facility') {
    const facilityAtmospheres =
      category === 'anomaly'
        ? new Set(['Controlled habitat envelopes', 'No ordinary atmosphere'])
        : metadata.physicalTags.includes('hydrogen-atmosphere')
          ? new Set<string>()
          : solidSurfaceAtmospheres

    return {
      profile: 'facility',
      facets: baseFacets({ substrate: 'engineered', atmosphereRegime: 'controlled', volatileState: 'imported', surfaceAccess: 'sealed-habitat', management: bodyClass.className.includes('Failed') ? 'failed-terraforming' : 'active-facility', biosphereEligibility: 'microbial' }),
      atmosphere: { allowed: facilityAtmospheres, fallback: 'Controlled habitat envelopes' },
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
      atmosphere: { allowed: airlessAllowedAtmospheres, fallback: 'None / hard vacuum' },
      hydrosphere: { allowed: airlessAllowedHydrospheres, fallback: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Subsurface ice' : 'Hydrated minerals only' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Airless class constrains atmosphere and surface volatiles.'],
    }
  }

  if (metadata.environmentProfileHint === 'desert' || metadata.physicalTags.includes('desert')) {
    const desertAtmospheres = metadata.physicalTags.includes('hydrogen-atmosphere') ? new Set<string>() : solidSurfaceAtmospheres

    return {
      profile: 'desert',
      facets: baseFacets({ volatileState: 'dry', surfaceAccess: 'hostile-surface', biosphereEligibility: 'prebiotic' }),
      atmosphere: { allowed: desertAtmospheres, fallback: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Thin CO2/N2' : 'Dense CO2/N2' },
      hydrosphere: { allowed: desertAllowedHydrospheres, fallback: extremeHotThermalZones.has(thermalZone) ? 'Bone dry' : thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Subsurface ice' : 'Briny aquifers' },
      biosphere: { allowed: true },
      notes: ['Desert class constrains hydrosphere to dry, buried, or briny states.'],
    }
  }

  if (metadata.physicalTags.includes('hycean')) {
    return {
      profile: 'ocean',
      facets: baseFacets({ substrate: 'envelope', atmosphereRegime: 'envelope', volatileState: 'deep-envelope', surfaceAccess: 'cloud-tops', biosphereEligibility: 'microbial', specialTags: ['hycean'] }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: hyceanHydrospheres, fallback: 'High-pressure deep ocean' },
      biosphere: { allowed: true },
      notes: ['Hycean profile preserves deep volatile/ocean states before generic envelope policy applies.'],
    }
  }

  if (envelopeCategory(category)) {
    return {
      profile: 'envelope',
      facets: baseFacets({ substrate: 'envelope', atmosphereRegime: 'envelope', volatileState: 'deep-envelope', surfaceAccess: 'cloud-tops', biosphereEligibility: 'none' }),
      atmosphere: { allowed: new Set(), fallback: '' },
      hydrosphere: { allowed: envelopeAllowedHydrospheres, fallback: 'Deep atmospheric volatile layers' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Envelope profile keeps volatiles in atmosphere/deep-pressure states.'],
    }
  }

  if (metadata.physicalTags.includes('magma-ocean')) {
    return {
      profile: 'terrestrial',
      facets: baseFacets({ atmosphereRegime: 'exotic', volatileState: 'exotic', surfaceAccess: 'hostile-surface', biosphereEligibility: 'none', specialTags: ['magma-ocean'] }),
      atmosphere: { allowed: new Set(['Rock-vapor atmosphere', 'Metal vapor atmosphere', 'Chiral-active atmosphere', 'Trace exosphere']), fallback: 'Rock-vapor atmosphere' },
      hydrosphere: { allowed: magmaOceanHydrospheres, fallback: 'Vaporized volatile traces' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Magma-ocean profile keeps furnace worlds in vaporized or nightside-frost volatile states.'],
    }
  }

  if (metadata.physicalTags.includes('greenhouse')) {
    const fallback =
      metadata.physicalTags.includes('steam') ? 'Steam atmosphere' :
      metadata.physicalTags.includes('cloud') ? 'Sulfur/chlorine/ammonia haze' :
      'Dense greenhouse'
    const hydrosphereAllowed = metadata.physicalTags.includes('steam') ? steamHydrospheres : new Set<string>()

    return {
      profile: 'terrestrial',
      facets: baseFacets({ atmosphereRegime: 'dense', volatileState: metadata.physicalTags.includes('steam') ? 'ocean' : 'local-liquid', surfaceAccess: 'hostile-surface', biosphereEligibility: 'prebiotic', specialTags: ['greenhouse'] }),
      atmosphere: { allowed: greenhouseAtmospheres, fallback },
      hydrosphere: { allowed: hydrosphereAllowed, fallback: 'Vaporized volatile traces' },
      biosphere: { allowed: true },
      notes: ['Greenhouse profile prevents atmosphere-bearing class labels from becoming airless.'],
    }
  }

  if (metadata.environmentProfileHint === 'ocean' || metadata.physicalTags.includes('water-ocean')) {
    const fallback = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Ice-shell subsurface ocean' : extremeHotThermalZones.has(thermalZone) ? 'Vaporized volatile traces' : 'Global ocean'
    const oceanAtmospheres = metadata.physicalTags.includes('hydrogen-atmosphere') ? new Set<string>() : solidSurfaceAtmospheres
    return {
      profile: 'ocean',
      facets: baseFacets({ volatileState: 'ocean', biosphereEligibility: 'open' }),
      atmosphere: { allowed: oceanAtmospheres, fallback: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Thin CO2/N2' : 'Moderate inert atmosphere' },
      hydrosphere: { allowed: waterOceanHydrospheres, fallback },
      biosphere: { allowed: true },
      notes: ['Ocean profile preserves source-table ocean and water-rich rolls.'],
    }
  }

  const solidAtmospheres = metadata.physicalTags.includes('hydrogen-atmosphere') ? new Set<string>() : solidSurfaceAtmospheres

  return {
    profile: 'terrestrial',
    facets: baseFacets(),
    atmosphere: { allowed: solidAtmospheres, fallback: thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark' ? 'Thin CO2/N2' : 'Dense CO2/N2' },
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

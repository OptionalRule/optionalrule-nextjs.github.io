import type { BodyCategory, Fact, PlanetaryDetail, Star } from '../../types'
import { extremeHotThermalZones, type WorldClassEnvironmentProfile, type WorldClassOption } from './domain'
import {
  airlessAllowedAtmospheres,
  airlessAllowedHydrospheres,
  anomalyAllowedGeologies,
  beltAllowedAtmospheres,
  beltAllowedHydrospheres,
  coldIcyGeologies,
  coldTerrestrialAtmospheres,
  coldTerrestrialHydrospheres,
  desertAllowedHydrospheres,
  envelopeAllowedAtmospheres,
  envelopeAllowedGeologies,
  envelopeAllowedHydrospheres,
  greenhouseAtmospheres,
  greenhouseHydrospheres,
  hotSilicateGeologies,
  hotTerrestrialHydrospheres,
  hyceanHydrospheres,
  magmaOceanGeologies,
  magmaOceanHydrospheres,
  noWaterSourceHydrospheres,
  openLiquidHydrospheres,
  solidSurfaceAtmospheres,
  steamHydrospheres,
  tidalColdGeologies,
  vacuumLikeAtmospheres,
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
      geology: { allowed: anomalyAllowedGeologies, fallback: 'Metric shear geometry' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Anomaly profile prevents ordinary planetary environment details.'],
    }
  }

  if (metadata.environmentProfileHint === 'airless' || metadata.physicalTags.includes('airless')) {
    const isColdAirless = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark'
    return {
      profile: 'airless',
      facets: baseFacets({ atmosphereRegime: 'airless', volatileState: isColdAirless ? 'ice' : 'dry', surfaceAccess: 'hostile-surface', biosphereEligibility: 'none' }),
      atmosphere: { allowed: airlessAllowedAtmospheres, fallback: 'None / hard vacuum' },
      hydrosphere: { allowed: airlessAllowedHydrospheres, fallback: isColdAirless ? 'Subsurface ice' : 'Hydrated minerals only' },
      geology: {
        allowed: isColdAirless ? coldIcyGeologies : hotSilicateGeologies,
        fallback: isColdAirless ? 'Ancient cratered crust' : 'Dead interior',
      },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Airless class constrains atmosphere, surface volatiles, and geology by thermal zone.'],
    }
  }

  if (metadata.environmentProfileHint === 'desert' || metadata.physicalTags.includes('desert')) {
    const isColdZone = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark'
    const desertAtmospheres = metadata.physicalTags.includes('hydrogen-atmosphere')
      ? new Set<string>()
      : isColdZone
        ? coldTerrestrialAtmospheres
        : solidSurfaceAtmospheres

    return {
      profile: 'desert',
      facets: baseFacets({ volatileState: 'dry', surfaceAccess: 'hostile-surface', biosphereEligibility: 'prebiotic' }),
      atmosphere: { allowed: desertAtmospheres, fallback: isColdZone ? 'Thin CO2/N2' : 'Dense CO2/N2' },
      hydrosphere: { allowed: desertAllowedHydrospheres, fallback: extremeHotThermalZones.has(thermalZone) ? 'Bone dry' : isColdZone ? 'Subsurface ice' : 'Briny aquifers' },
      geology: {
        allowed: isColdZone ? coldIcyGeologies : hotSilicateGeologies,
        fallback: isColdZone ? 'Ancient cratered crust' : 'Low volcanism',
      },
      biosphere: { allowed: true },
      notes: ['Desert class constrains hydrosphere and geology to zone-appropriate states.'],
    }
  }

  if (metadata.physicalTags.includes('hycean')) {
    return {
      profile: 'ocean',
      facets: baseFacets({ substrate: 'envelope', atmosphereRegime: 'envelope', volatileState: 'deep-envelope', surfaceAccess: 'cloud-tops', biosphereEligibility: 'microbial', specialTags: ['hycean'] }),
      atmosphere: { allowed: envelopeAllowedAtmospheres, fallback: 'Hydrogen/helium envelope' },
      hydrosphere: { allowed: hyceanHydrospheres, fallback: 'High-pressure deep ocean' },
      biosphere: { allowed: true },
      notes: ['Hycean profile preserves deep volatile/ocean states and a hydrogen-envelope atmosphere.'],
    }
  }

  if (envelopeCategory(category)) {
    return {
      profile: 'envelope',
      facets: baseFacets({ substrate: 'envelope', atmosphereRegime: 'envelope', volatileState: 'deep-envelope', surfaceAccess: 'cloud-tops', biosphereEligibility: 'none' }),
      atmosphere: { allowed: envelopeAllowedAtmospheres, fallback: 'Hydrogen/helium envelope' },
      hydrosphere: { allowed: envelopeAllowedHydrospheres, fallback: 'Deep atmospheric volatile layers' },
      geology: { allowed: envelopeAllowedGeologies, fallback: 'Deep atmospheric circulation' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Envelope profile keeps volatiles in atmosphere/deep-pressure states; atmosphere pinned to hydrogen-helium (optionally GU-distorted).'],
    }
  }

  if (metadata.physicalTags.includes('magma-ocean')) {
    return {
      profile: 'terrestrial',
      facets: baseFacets({ atmosphereRegime: 'exotic', volatileState: 'exotic', surfaceAccess: 'hostile-surface', biosphereEligibility: 'none', specialTags: ['magma-ocean'] }),
      atmosphere: { allowed: new Set(['Rock-vapor atmosphere', 'Metal vapor atmosphere', 'Chiral-active atmosphere', 'Trace exosphere']), fallback: 'Rock-vapor atmosphere' },
      hydrosphere: { allowed: magmaOceanHydrospheres, fallback: 'Magma seas / lava lakes' },
      geology: { allowed: magmaOceanGeologies, fallback: 'Active volcanism' },
      biosphere: { allowed: false, forced: 'Sterile' },
      notes: ['Magma-ocean profile pins surface volatiles to molten silicate or vaporized rock states; geology forced to active silicate volcanism.'],
    }
  }

  if (metadata.physicalTags.includes('greenhouse')) {
    const fallback =
      metadata.physicalTags.includes('steam') ? 'Steam atmosphere' :
      metadata.physicalTags.includes('cloud') ? 'Sulfur/chlorine/ammonia haze' :
      'Dense greenhouse'
    const hydrosphereAllowed = metadata.physicalTags.includes('steam') ? steamHydrospheres : greenhouseHydrospheres

    return {
      profile: 'terrestrial',
      facets: baseFacets({ atmosphereRegime: 'dense', volatileState: metadata.physicalTags.includes('steam') ? 'ocean' : 'local-liquid', surfaceAccess: 'hostile-surface', biosphereEligibility: 'prebiotic', specialTags: ['greenhouse'] }),
      atmosphere: { allowed: greenhouseAtmospheres, fallback },
      hydrosphere: { allowed: hydrosphereAllowed, fallback: 'Vaporized volatile traces' },
      geology: { allowed: hotSilicateGeologies, fallback: 'Active volcanism' },
      biosphere: { allowed: true },
      notes: ['Greenhouse profile blocks deep-ocean rolls; steam variant keeps source-table wet states; geology pinned to hot-silicate set.'],
    }
  }

  if (metadata.environmentProfileHint === 'ocean' || metadata.physicalTags.includes('water-ocean')) {
    const isColdZone = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark'
    const fallback = isColdZone ? 'Ice-shell subsurface ocean' : extremeHotThermalZones.has(thermalZone) ? 'Vaporized volatile traces' : 'Global ocean'
    const oceanAtmospheres = metadata.physicalTags.includes('hydrogen-atmosphere')
      ? new Set<string>()
      : isColdZone
        ? coldTerrestrialAtmospheres
        : solidSurfaceAtmospheres
    return {
      profile: 'ocean',
      facets: baseFacets({ volatileState: 'ocean', biosphereEligibility: 'open' }),
      atmosphere: { allowed: oceanAtmospheres, fallback: isColdZone ? 'Thin CO2/N2' : 'Moderate inert atmosphere' },
      hydrosphere: { allowed: waterOceanHydrospheres, fallback },
      geology: {
        allowed: isColdZone ? coldIcyGeologies : hotSilicateGeologies,
        fallback: isColdZone ? 'Cryovolcanism' : 'Plate tectonic analogue',
      },
      biosphere: { allowed: true },
      notes: ['Ocean profile preserves source-table ocean and water-rich rolls; geology constrained by zone.'],
    }
  }

  const isCold = thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark'
  const isHot = thermalZone === 'Hot'
  const hasHydrogenAtmosphere = metadata.physicalTags.includes('hydrogen-atmosphere')
  const isTidalClass = /tidally|cryovolcanic|volcanic/i.test(bodyClass.className) && !/tidally locked/i.test(bodyClass.className)

  const terrestrialAtmosphereAllowed: ReadonlySet<string> = hasHydrogenAtmosphere
    ? new Set<string>()
    : isCold
      ? coldTerrestrialAtmospheres
      : solidSurfaceAtmospheres

  const terrestrialHydrosphereAllowed: ReadonlySet<string> = isHot
    ? hotTerrestrialHydrospheres
    : isCold
      ? coldTerrestrialHydrospheres
      : new Set<string>()

  const terrestrialHydrosphereFallback = isHot
    ? 'Hydrated minerals only'
    : isCold
      ? 'Subsurface ice'
      : ''

  const terrestrialGeologyAllowed: ReadonlySet<string> = isCold
    ? (isTidalClass ? tidalColdGeologies : coldIcyGeologies)
    : hotSilicateGeologies

  const terrestrialGeologyFallback = isCold
    ? (isTidalClass ? 'Tidal heating' : 'Cryovolcanism')
    : 'Plate tectonic analogue'

  return {
    profile: 'terrestrial',
    facets: baseFacets(),
    atmosphere: { allowed: terrestrialAtmosphereAllowed, fallback: isCold ? 'Thin CO2/N2' : 'Dense CO2/N2' },
    hydrosphere: { allowed: terrestrialHydrosphereAllowed, fallback: terrestrialHydrosphereFallback },
    geology: { allowed: terrestrialGeologyAllowed, fallback: terrestrialGeologyFallback },
    biosphere: { allowed: true },
    notes: [
      isHot
        ? 'Default terrestrial profile (Hot zone): blocks open-ocean rolls + cryovolcanism; allows dry, briny, magma, and silicate volcanism.'
        : isCold
          ? 'Default terrestrial profile (Cold/Cryogenic zone): blocks heat-requiring atmospheres + silicate volcanism; allows ice, cryogenic, cryovolcanic. Tidal-flagged classes get Io-style silicate volcanism back.'
          : 'Default terrestrial profile (Temperate band): preserves compatible source-table rolls; geology pinned to silicate set.',
    ],
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

function applyCrossFieldConsistency(detail: DetailWithoutBiosphere): DetailWithoutBiosphere {
  let atmosphere = detail.atmosphere
  let hydrosphere = detail.hydrosphere

  // Rule 1: open surface liquids require retentive atmosphere (water sublimes in vacuum).
  if (openLiquidHydrospheres.has(hydrosphere.value) && vacuumLikeAtmospheres.has(atmosphere.value)) {
    atmosphere = {
      ...atmosphere,
      value: 'Thin CO2/N2',
      source: `${atmosphere.source ?? 'Generated detail'}; upgraded by cross-field consistency: open-liquid hydrosphere requires retentive atmosphere`,
    }
  }

  // Rule 2: Steam atmosphere implies a vaporizing water source.
  if (atmosphere.value === 'Steam atmosphere' && noWaterSourceHydrospheres.has(hydrosphere.value)) {
    hydrosphere = {
      ...hydrosphere,
      value: 'Vaporized volatile traces',
      source: `${hydrosphere.source ?? 'Generated detail'}; upgraded by cross-field consistency: steam atmosphere implies vaporizing surface volatiles`,
    }
  }

  return { ...detail, atmosphere, hydrosphere }
}

export function normalizeDetailForEnvironment(
  detail: DetailWithoutBiosphere,
  policy: EnvironmentPolicy
): DetailWithoutBiosphere {
  const geologyAllowed = policy.geology?.allowed
  const geologyFallback = policy.geology?.fallback
  const geology = geologyAllowed && geologyFallback
    ? normalizeFact(detail.geology, geologyAllowed, geologyFallback, policy, 'geology')
    : detail.geology
  const fieldNormalized: DetailWithoutBiosphere = {
    ...detail,
    atmosphere: normalizeFact(detail.atmosphere, policy.atmosphere.allowed, policy.atmosphere.fallback, policy, 'atmosphere'),
    hydrosphere: normalizeFact(detail.hydrosphere, policy.hydrosphere.allowed, policy.hydrosphere.fallback, policy, 'hydrosphere'),
    geology,
  }
  return applyCrossFieldConsistency(fieldNormalized)
}

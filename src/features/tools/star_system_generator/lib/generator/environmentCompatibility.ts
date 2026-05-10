import type { BodyCategory, OrbitingBody } from '../../types'
import { envelopeCategories, solidSurfaceCategories, type WorldClassOption } from './domain'
import { deriveWorldClassMetadata, metadataForClassName } from './worldClassMetadata'

export const airlessAllowedAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'None / dispersed volatiles',
  'No ordinary atmosphere',
])

export const airlessAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Cryogenic nitrogen reservoirs',
  'Cryovolcanic vents',
  'No accessible surface volatiles',
  'Not applicable: metric or route phenomenon',
])

export const desertAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Briny aquifers',
  'Salt / perchlorate flats',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

export const envelopeAllowedHydrospheres = new Set([
  'Deep atmospheric volatile layers',
  'High-pressure condensate decks',
  'No accessible surface volatiles',
])

// Envelope bodies (sub-Neptune, gas giant, ice giant) always have hydrogen-helium upper atmospheres,
// optionally GU-distorted. Block silicate-surface atmosphere rolls that shouldn't apply.
export const envelopeAllowedAtmospheres = new Set([
  'Hydrogen/helium envelope',
  'Chiral-active or GU-distorted atmosphere',
])

export const beltAllowedAtmospheres = new Set(['None / dispersed volatiles'])
export const beltAllowedHydrospheres = new Set(['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])

export const solidSurfaceAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'Thin CO2/N2',
  'Thin but usable with pressure gear',
  'Moderate inert atmosphere',
  'Moderate toxic atmosphere',
  'Dense CO2/N2',
  'Dense greenhouse',
  'Steam atmosphere',
  'Sulfur/chlorine/ammonia haze',
  'Chiral-active or GU-distorted atmosphere',
  'Rock-vapor atmosphere',
  'Metal vapor atmosphere',
  'Chiral-active atmosphere',
  'Controlled habitat envelopes',
  'No ordinary atmosphere',
])

// Atmospheres that need heat (steam vapor pressure, chemistry mobilization).
// Excluded from Cold/Cryogenic/Dark terrestrial fallthrough.
export const coldTerrestrialAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'Thin CO2/N2',
  'Thin but usable with pressure gear',
  'Moderate inert atmosphere',
  'Moderate toxic atmosphere',
  'Dense CO2/N2',
  'Chiral-active or GU-distorted atmosphere',
  'Controlled habitat envelopes',
  'No ordinary atmosphere',
])

export const greenhouseAtmospheres = new Set([
  'Dense CO2/N2',
  'Dense greenhouse',
  'Steam atmosphere',
  'Sulfur/chlorine/ammonia haze',
  'Moderate toxic atmosphere',
  'Chiral-active or GU-distorted atmosphere',
])

export const steamHydrospheres = new Set([
  'Briny aquifers',
  'Local seas',
  'Ocean-continent balance',
  'Global ocean',
  'High-pressure deep ocean',
  'Ice-shell subsurface ocean',
  'Hydrocarbon lakes/seas',
  'Exotic solvent or GU-stabilized fluid chemistry',
  'Vaporized volatile traces',
])

// Hydrospheres compatible with non-steam greenhouse worlds (Venus-like, Sulfur-cloud, Cloudy greenhouse).
// Blocks deep ocean / ice-shell rolls that the empty fallthrough used to allow.
export const greenhouseHydrospheres = new Set([
  'Vaporized volatile traces',
  'Briny aquifers',
  'Local seas',
  'Salt / perchlorate flats',
  'Bone dry',
  'Hydrated minerals only',
])

export const magmaOceanHydrospheres = new Set([
  'Magma seas / lava lakes',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

export const hotTerrestrialHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Vaporized volatile traces',
  'Nightside mineral frost',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Briny aquifers',
  'Salt / perchlorate flats',
  'Local seas',
  'Magma seas / lava lakes',
])

export const coldTerrestrialHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Briny aquifers',
  'Local seas',
  'Ice-shell subsurface ocean',
  'Hydrocarbon lakes/seas',
  'Cryogenic nitrogen reservoirs',
  'Cryovolcanic vents',
  'Exotic solvent or GU-stabilized fluid chemistry',
])

export const waterOceanHydrospheres = new Set([
  'Briny aquifers',
  'Local seas',
  'Ocean-continent balance',
  'Global ocean',
  'High-pressure deep ocean',
  'Ice-shell subsurface ocean',
  'Subsurface ice',
  'Polar caps / buried glaciers',
  'Exotic solvent or GU-stabilized fluid chemistry',
  'Vaporized volatile traces',
])

export const hyceanHydrospheres = new Set([
  'High-pressure deep ocean',
  'High-pressure condensate decks',
  'Deep atmospheric volatile layers',
  'Global ocean',
])

export const dryHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'No accessible surface volatiles',
  'Vaporized volatile traces',
])

export const extremeHotAllowedAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'Rock-vapor atmosphere',
  'Metal vapor atmosphere',
  'Chiral-active atmosphere',
])

export const extremeHotAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Vaporized volatile traces',
  'Nightside mineral frost',
  'Magma seas / lava lakes',
])

export const coldAllowedClimateTags = new Set([
  'Snowball',
  'Cold desert',
  'Aerosol winter',
  'Methane cycle',
  'CO2 glacier cycle',
  'Dark-sector gravity tides',
])

export const envelopeAllowedGeologies = new Set([
  'Deep atmospheric circulation',
  'Metallic hydrogen interior',
  'Layered volatile mantle',
  'Magnetosphere-driven weather',
])

export const anomalyAllowedGeologies = new Set([
  'Artificial platform or engineered substrate',
  'Metric shear geometry',
])

// Geology classes that work on any rocky world regardless of thermal zone.
const universalGeologies = [
  'Dead interior',
  'Ancient cratered crust',
  'Low volcanism',
  'Static lid',
  'Programmable-matter geological behavior',
]

// Hot / temperate silicate-surface geologies. No cryovolcanism — needs cold to be water/ammonia ice.
export const hotSilicateGeologies = new Set([
  ...universalGeologies,
  'Active volcanism',
  'Plate tectonic analogue',
  'Supercontinent cycle',
  'Tidal heating',
  'Extreme plume provinces',
  'Global resurfacing',
])

// Cold/icy-body geologies. Silicate volcanism only via tidal heating on a special class.
export const coldIcyGeologies = new Set([
  ...universalGeologies,
  'Cryovolcanism',
  'Tidal heating',
])

// Tidally-heated cold bodies (Io-analogues, near gas giants) can still drive silicate volcanism.
export const tidalColdGeologies = new Set([
  ...coldIcyGeologies,
  'Active volcanism',
  'Extreme plume provinces',
])

export const magmaOceanGeologies = new Set([
  'Active volcanism',
  'Extreme plume provinces',
  'Global resurfacing',
  'Tidal heating',
])

export function isEnvelopeCategory(category: BodyCategory): boolean {
  return envelopeCategories.has(category)
}

export function isSolidSurfaceCategory(category: BodyCategory): boolean {
  return solidSurfaceCategories.has(category)
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

export function isDryHydrosphere(value: string): boolean {
  return dryHydrospheres.has(value)
}

export function isWetOceanHydrosphere(value: string): boolean {
  return waterOceanHydrospheres.has(value)
}

export function isHyceanHydrosphere(value: string): boolean {
  return hyceanHydrospheres.has(value)
}

export function isHydrogenHeliumEnvelope(value: string): boolean {
  return value === 'Hydrogen/helium envelope'
}

export function isSolidSurfaceAtmosphere(value: string): boolean {
  return solidSurfaceAtmospheres.has(value)
}

export function isGreenhouseAtmosphereCompatible(value: string): boolean {
  return greenhouseAtmospheres.has(value)
}

export function isAirlessClass(className: string): boolean {
  const metadata = metadataForClassName(className)
  return metadata.environmentProfileHint === 'airless' || metadata.physicalTags.includes('airless')
}

export function isDesertClass(className: string): boolean {
  const metadata = metadataForClassName(className)
  return metadata.environmentProfileHint === 'desert' || metadata.physicalTags.includes('desert')
}

export function isGreenhouseClass(className: string): boolean {
  const metadata = metadataForClassName(className)
  return metadata.physicalTags.includes('greenhouse') || metadata.physicalTags.includes('steam') || metadata.physicalTags.includes('cloud')
}

export function isSteamClass(className: string): boolean {
  return metadataForClassName(className).physicalTags.includes('steam')
}

export function isHyceanClass(className: string): boolean {
  return metadataForClassName(className).physicalTags.includes('hycean')
}

export function isMagmaOceanClass(className: string): boolean {
  return metadataForClassName(className).physicalTags.includes('magma-ocean')
}

export function isWaterOceanClass(className: string): boolean {
  const metadata = metadataForClassName(className)
  return !isMagmaOceanClass(className) && (metadata.physicalTags.includes('water-ocean') || metadata.physicalTags.includes('hycean'))
}

export function isHydrogenAtmosphereException(className: string): boolean {
  return metadataForClassName(className).physicalTags.includes('hydrogen-atmosphere')
}

export function isSolidNoEnvelopeClass(className: string): boolean {
  const metadata = metadataForClassName(className)
  return metadata.physicalTags.includes('stripped-core') || /\brocky terrestrial\b|\bearth-sized terrestrial\b|\bsuper-terrestrial\b|\bbasaltic\b|\bmercury\b/i.test(className)
}

export function isSolidHydrogenEnvelopeConflict(body: OrbitingBody): boolean {
  return (
    solidSurfaceCategories.has(body.category.value) &&
    isHydrogenHeliumEnvelope(body.detail.atmosphere.value) &&
    !isHydrogenAtmosphereException(body.bodyClass.value)
  )
}

export function worldClassHasTag(option: WorldClassOption, tag: ReturnType<typeof deriveWorldClassMetadata>['physicalTags'][number]): boolean {
  return deriveWorldClassMetadata(option).physicalTags.includes(tag)
}

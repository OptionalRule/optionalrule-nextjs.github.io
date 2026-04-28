import type { BodyCategory } from '../../types'

export type WorldClassEnvironmentProfile =
  | 'airless'
  | 'desert'
  | 'terrestrial'
  | 'ocean'
  | 'envelope'
  | 'belt'
  | 'anomaly'
  | 'facility'

export type WorldClassArchitectureTag = 'full-planet' | 'minor-body' | 'rocky-chain' | 'giant' | 'anomaly'

export type WorldClassPhysicalTag =
  | 'airless'
  | 'volatile-rich'
  | 'desert'
  | 'ocean'
  | 'water-ocean'
  | 'magma-ocean'
  | 'hycean'
  | 'greenhouse'
  | 'steam'
  | 'cloud'
  | 'hydrogen-atmosphere'
  | 'facility'
  | 'gu-anomaly'
  | 'stripped-core'

export type WorldClassSpecialHandling = 'no-moons' | 'no-rings' | 'managed-habitat' | 'metric-phenomenon'

export interface WorldClassOption {
  className: string
  category: BodyCategory
  massClass: string
  environmentProfileHint?: WorldClassEnvironmentProfile
  architectureTags?: WorldClassArchitectureTag[]
  physicalTags?: WorldClassPhysicalTag[]
  specialHandling?: WorldClassSpecialHandling[]
}

export type BodyPlanKind =
  | 'rocky'
  | 'super-earth'
  | 'sub-neptune'
  | 'belt'
  | 'ice-belt'
  | 'gas-giant'
  | 'ice-giant'
  | 'dwarf'
  | 'rogue'
  | 'anomaly'
  | 'thermal'

export const envelopeCategories = new Set<BodyCategory>(['sub-neptune', 'gas-giant', 'ice-giant'])
export const solidSurfaceCategories = new Set<BodyCategory>(['rocky-planet', 'super-earth', 'dwarf-body', 'rogue-captured'])
export const fullPlanetCategories = new Set<BodyCategory>(['rocky-planet', 'super-earth', 'sub-neptune', 'gas-giant', 'ice-giant'])
export const minorBodyCategories = new Set<BodyCategory>(['belt', 'dwarf-body', 'rogue-captured'])
export const rockyChainCategories = new Set<BodyCategory>(['rocky-planet', 'super-earth', 'sub-neptune'])
export const giantCategories = new Set<BodyCategory>(['gas-giant', 'ice-giant'])

export const hotThermalZones = new Set(['Furnace', 'Inferno', 'Hot'])
export const extremeHotThermalZones = new Set(['Furnace', 'Inferno'])
export const coldThermalZones = new Set(['Cold', 'Cryogenic', 'Dark'])

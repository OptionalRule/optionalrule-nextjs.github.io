import type { BodyCategory } from '../../types'

export interface WorldClassOption {
  className: string
  category: BodyCategory
  massClass: string
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

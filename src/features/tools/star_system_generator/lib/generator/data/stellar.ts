import type { TableEntry } from '../dice'
import stellarData from '../../../data/stellar.json'

export interface StarTypeProfile {
  type: string
  massRange: [number, number]
  luminosityRange: [number, number]
}

export interface ReachabilityClassProfile {
  className: string
  routeNote: string
  pinchDifficulty: string
}

export interface ArchitectureProfileEntry {
  name: string
  description: string
}

interface StellarData {
  realisticStarTypes: Array<TableEntry<StarTypeProfile>>
  frontierStarTypes: Array<TableEntry<StarTypeProfile>>
  ageStates: Array<TableEntry<string>>
  metallicities: Array<TableEntry<string>>
  reachabilityClasses: Array<TableEntry<ReachabilityClassProfile>>
  architectures: Array<TableEntry<ArchitectureProfileEntry>>
}

const typedStellarData = stellarData as unknown as StellarData

export const realisticStarTypes = typedStellarData.realisticStarTypes
export const frontierStarTypes = typedStellarData.frontierStarTypes
export const ageStates = typedStellarData.ageStates
export const metallicities = typedStellarData.metallicities
export const reachabilityClasses = typedStellarData.reachabilityClasses
export const architectures = typedStellarData.architectures

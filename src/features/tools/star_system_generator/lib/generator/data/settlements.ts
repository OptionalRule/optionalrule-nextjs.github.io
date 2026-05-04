import settlementsData from '../../../data/settlements.json'
import type { SettlementHabitationPattern, SettlementPopulation } from '../../../types'

export const POPULATION_BAND_INDEX: Record<SettlementPopulation, number> = {
  'Minimal (<5)': 0,
  '1-20': 1,
  '21-100': 2,
  '101-1,000': 3,
  '1,001-10,000': 4,
  '10,001-100,000': 5,
  '100,001-1 million': 6,
  '1-10 million': 7,
  '10+ million': 8,
  Unknown: -1,
}

export const HABITATION_POPULATION_FLOORS: Partial<Record<SettlementHabitationPattern, number>> = {
  'Sky platform': 2,
  'Underground city': 3,
  'Hollow asteroid': 3,
  'Belt cluster': 3,
  'Ring station': 4,
  'Hub complex': 4,
  "O'Neill cylinder": 5,
}

export const GENERATION_SHIP_POPULATION_BAND: { floor: number; ceiling: number } = { floor: 4, ceiling: 6 }

export type SettlementSiteCategory =
  | 'Surface settlement'
  | 'Orbital station'
  | 'Asteroid or belt base'
  | 'Moon base'
  | 'Deep-space platform'
  | 'Gate or route node'
  | 'Mobile site'
  | 'Derelict or restricted site'

export interface SettlementLocationOption {
  label: string
  category: SettlementSiteCategory
}

export interface SettlementTagOption {
  id: string
  label: string
  pressure: string
  civicScale?: 'civic' | 'remote' | 'neutral'
}

export interface KeywordSitePool {
  keywords: readonly string[]
  sites: readonly string[]
}

interface SettlementsData {
  siteCategories: readonly SettlementSiteCategory[]
  locations: {
    orbital: readonly SettlementLocationOption[]
    route: readonly SettlementLocationOption[]
    asteroid: readonly SettlementLocationOption[]
    surface: readonly SettlementLocationOption[]
    moon: readonly SettlementLocationOption[]
    mobile: readonly SettlementLocationOption[]
    restricted: readonly SettlementLocationOption[]
    gasGiantSpecial: readonly SettlementLocationOption[]
  }
  functionPools: Record<string, readonly string[]>
  guFractureFunctionsBySiteCategory: Record<SettlementSiteCategory, readonly string[]>
  builtForms: {
    bySiteCategory: Record<SettlementSiteCategory, readonly string[]>
    exactLocation: Record<string, string>
    mobileLocationPools: Record<string, readonly string[]>
    miningBySiteCategory: Partial<Record<SettlementSiteCategory, readonly string[]>> & { default: readonly string[] }
  }
  authorities: readonly string[]
  aiSituations: readonly string[]
  conditions: readonly string[]
  tags: readonly SettlementTagOption[]
  tagPairHooks: Record<string, string>
  crises: readonly string[]
  hiddenTruths: readonly string[]
  encounterSites: readonly string[]
  encounterSitesByFunctionKeyword: readonly KeywordSitePool[]
  populationTable: readonly SettlementPopulation[]
  habitationPatternDefaults: Record<SettlementSiteCategory, SettlementHabitationPattern>
  authorityByHabitationPattern: Record<string, readonly string[]>
  conditionByHabitationPattern: Record<string, readonly string[]>
  crisisByHabitationPattern: Record<string, readonly string[]>
  hiddenTruthByHabitationPattern: Record<string, readonly string[]>
  encounterSitesByHabitationPattern: Record<string, readonly string[]>
  encounterSitesByPopulationBand: Record<string, readonly string[]>
  crisisByPopulationBand: Record<string, readonly string[]>
}

const typedSettlementsData = settlementsData as SettlementsData

export const settlementSiteCategories = typedSettlementsData.siteCategories
export const settlementLocations = typedSettlementsData.locations

export const surveyFunctions = typedSettlementsData.functionPools.survey
export const extractionFunctions = typedSettlementsData.functionPools.extraction
export const orbitalFunctions = typedSettlementsData.functionPools.orbital
export const routeFunctions = typedSettlementsData.functionPools.route
export const securityFunctions = typedSettlementsData.functionPools.security
export const civilFunctions = typedSettlementsData.functionPools.civil
export const biosphereFunctions = typedSettlementsData.functionPools.biosphere
export const surfaceIceFunctions = typedSettlementsData.functionPools.surfaceIce
export const giantOrbitalFunctions = typedSettlementsData.functionPools.giantOrbital
export const asteroidBaseFunctions = typedSettlementsData.functionPools.asteroidBase
export const moonBaseFunctions = typedSettlementsData.functionPools.moonBase
export const deepSpaceFunctions = typedSettlementsData.functionPools.deepSpace
export const mobileFunctions = typedSettlementsData.functionPools.mobile
export const restrictedFunctions = typedSettlementsData.functionPools.restricted

export const guFractureFunctionsBySiteCategory = typedSettlementsData.guFractureFunctionsBySiteCategory
export const builtForms = typedSettlementsData.builtForms
export const settlementAuthorities = typedSettlementsData.authorities
export const aiSituations = typedSettlementsData.aiSituations
export const settlementConditions = typedSettlementsData.conditions
export const settlementTagOptions = typedSettlementsData.tags
export const settlementTags = settlementTagOptions.map((tag) => tag.label)
export const settlementTagPressures = Object.fromEntries(
  settlementTagOptions.map((tag) => [tag.label, tag.pressure])
) as Record<string, string>
export const settlementTagPairHooks = typedSettlementsData.tagPairHooks
export const settlementCrises = typedSettlementsData.crises
export const hiddenTruths = typedSettlementsData.hiddenTruths
export const encounterSites = typedSettlementsData.encounterSites
export const encounterSitesByFunctionKeyword = typedSettlementsData.encounterSitesByFunctionKeyword
export const settlementPopulationTable = typedSettlementsData.populationTable
export const habitationPatternDefaults = typedSettlementsData.habitationPatternDefaults
export const settlementAuthorityByHabitationPattern = typedSettlementsData.authorityByHabitationPattern
export const settlementConditionByHabitationPattern = typedSettlementsData.conditionByHabitationPattern
export const settlementCrisisByHabitationPattern = typedSettlementsData.crisisByHabitationPattern
export const hiddenTruthByHabitationPattern = typedSettlementsData.hiddenTruthByHabitationPattern
export const encounterSitesByHabitationPattern = typedSettlementsData.encounterSitesByHabitationPattern
export const encounterSitesByPopulationBand = typedSettlementsData.encounterSitesByPopulationBand
export const settlementCrisisByPopulationBand = typedSettlementsData.crisisByPopulationBand

export type SettlementPopulationBand = 'urban' | 'town' | 'outpost'

export function populationBandFor(population: SettlementPopulation): SettlementPopulationBand | null {
  switch (population) {
    case '10+ million':
    case '1-10 million':
    case '100,001-1 million':
      return 'urban'
    case '10,001-100,000':
    case '1,001-10,000':
      return 'town'
    case '101-1,000':
    case '21-100':
    case '1-20':
    case 'Minimal (<5)':
      return 'outpost'
    case 'Unknown':
      return null
  }
}

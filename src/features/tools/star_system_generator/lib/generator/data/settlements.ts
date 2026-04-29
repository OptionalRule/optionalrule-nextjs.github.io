import settlementsData from '../../../data/settlements.json'

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
  authorityByScale: Record<string, readonly string[]>
  aiSituations: readonly string[]
  conditions: readonly string[]
  conditionByScale: Record<string, readonly string[]>
  tags: readonly SettlementTagOption[]
  tagPairHooks: Record<string, string>
  crises: readonly string[]
  crisisByScale: Record<string, readonly string[]>
  hiddenTruths: readonly string[]
  hiddenTruthByScale: Record<string, readonly string[]>
  encounterSites: readonly string[]
  encounterSitesByScale: Record<string, readonly string[]>
  encounterSitesByFunctionKeyword: readonly KeywordSitePool[]
  scaleTable: readonly string[]
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
export const settlementAuthorityByScale = typedSettlementsData.authorityByScale
export const aiSituations = typedSettlementsData.aiSituations
export const settlementConditions = typedSettlementsData.conditions
export const settlementConditionByScale = typedSettlementsData.conditionByScale
export const settlementTagOptions = typedSettlementsData.tags
export const settlementTags = settlementTagOptions.map((tag) => tag.label)
export const settlementTagPressures = Object.fromEntries(
  settlementTagOptions.map((tag) => [tag.label, tag.pressure])
) as Record<string, string>
export const settlementTagPairHooks = typedSettlementsData.tagPairHooks
export const settlementCrises = typedSettlementsData.crises
export const settlementCrisisByScale = typedSettlementsData.crisisByScale
export const hiddenTruths = typedSettlementsData.hiddenTruths
export const hiddenTruthByScale = typedSettlementsData.hiddenTruthByScale
export const encounterSites = typedSettlementsData.encounterSites
export const encounterSitesByScale = typedSettlementsData.encounterSitesByScale
export const encounterSitesByFunctionKeyword = typedSettlementsData.encounterSitesByFunctionKeyword
export const settlementScaleTable = typedSettlementsData.scaleTable

import type { BodyCategory } from '../../../types'
import namesData from '../../../data/names.json'

export type SystemNamePattern = 'possessive' | 'compound' | 'numeric' | 'catalog' | 'route'

export interface DescriptorRule {
  keywords: readonly string[]
  descriptor: string
}

export interface RuleBackedDescriptorSet {
  rules: readonly DescriptorRule[]
  default: string
}

export interface ScaleDescriptorSet extends RuleBackedDescriptorSet {
  exact: Record<string, string>
}

export interface SettlementNameDescriptors {
  function: RuleBackedDescriptorSet
  category: Record<string, string>
  authority: RuleBackedDescriptorSet
  scale: ScaleDescriptorSet
  population: { exact: Record<string, string>; default: string }
}

interface NamesData {
  systemNameCores: readonly string[]
  systemNameForms: readonly string[]
  systemNamePatterns: readonly SystemNamePattern[]
  systemCatalogLabels: readonly string[]
  bodyNameCores: readonly string[]
  bodyNameFormsByCategory: Record<BodyCategory, readonly string[]>
  moonNameCores: readonly string[]
  moonNameForms: readonly string[]
  settlementNameDescriptors: SettlementNameDescriptors
}

const typedNamesData = namesData as NamesData

export const systemNameCores = typedNamesData.systemNameCores
export const systemNameForms = typedNamesData.systemNameForms
export const systemNamePatterns = typedNamesData.systemNamePatterns
export const systemCatalogLabels = typedNamesData.systemCatalogLabels
export const bodyNameCores = typedNamesData.bodyNameCores
export const bodyNameFormsByCategory = typedNamesData.bodyNameFormsByCategory
export const moonNameCores = typedNamesData.moonNameCores
export const moonNameForms = typedNamesData.moonNameForms
export const settlementNameDescriptors = typedNamesData.settlementNameDescriptors

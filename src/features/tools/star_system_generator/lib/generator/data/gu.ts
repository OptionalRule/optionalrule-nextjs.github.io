import guData from '../../../data/gu.json'
import { isNarrativeDomain, type NarrativeDomain } from '../narrative/domains'

export interface GuIntensityEntry {
  max: number
  value: string
}

interface JsonGuIntensityEntry {
  max: number | null
  value: string
}

export type GuDomainTagTable = 'bleedLocations' | 'bleedBehaviors' | 'resources' | 'hazards'

interface GuData {
  intensityTable: readonly JsonGuIntensityEntry[]
  bleedLocations: readonly string[]
  bleedBehaviors: readonly string[]
  resources: readonly string[]
  hazards: readonly string[]
  domainTags?: Partial<Record<GuDomainTagTable, Record<string, readonly string[]>>>
}

const typedGuData = guData as GuData

export const guIntensityTable: readonly GuIntensityEntry[] = typedGuData.intensityTable.map((entry) => ({
  max: entry.max ?? Number.POSITIVE_INFINITY,
  value: entry.value,
}))
export const bleedLocationTable = typedGuData.bleedLocations
export const bleedBehaviorTable = typedGuData.bleedBehaviors
export const guResourceTable = typedGuData.resources
export const guHazardTable = typedGuData.hazards
export const guDomainTags = typedGuData.domainTags ?? {}

export function domainsForGuValue(table: GuDomainTagTable, value: string, fallback: readonly NarrativeDomain[]): NarrativeDomain[] {
  const tagged = guDomainTags[table]?.[value]
  return tagged ? tagged.filter(isNarrativeDomain) : [...fallback]
}

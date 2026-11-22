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

type GuDomainTags = Partial<Record<GuDomainTagTable, Record<string, readonly NarrativeDomain[]>>>

const typedGuData = guData as GuData

export function parseGuDomainTags(raw: GuData['domainTags']): GuDomainTags {
  const parsed: GuDomainTags = {}
  for (const [table, entries] of Object.entries(raw ?? {}) as Array<[GuDomainTagTable, Record<string, readonly string[]>]>) {
    const typedEntries: Record<string, readonly NarrativeDomain[]> = {}
    for (const [value, domains] of Object.entries(entries)) {
      typedEntries[value] = domains.map((domain) => {
        if (!isNarrativeDomain(domain)) {
          throw new Error(`gu.json domainTags.${table}["${value}"] has unknown narrative domain "${domain}"`)
        }
        return domain
      })
    }
    parsed[table] = typedEntries
  }
  return parsed
}

export const guIntensityTable: readonly GuIntensityEntry[] = typedGuData.intensityTable.map((entry) => ({
  max: entry.max ?? Number.POSITIVE_INFINITY,
  value: entry.value,
}))
export const bleedLocationTable = typedGuData.bleedLocations
export const bleedBehaviorTable = typedGuData.bleedBehaviors
export const guResourceTable = typedGuData.resources
export const guHazardTable = typedGuData.hazards
export const guDomainTags: GuDomainTags = parseGuDomainTags(typedGuData.domainTags)

export function domainsForGuValue(table: GuDomainTagTable, value: string, fallback: readonly NarrativeDomain[]): NarrativeDomain[] {
  const tagged = guDomainTags[table]?.[value]
  return tagged ? [...tagged] : [...fallback]
}

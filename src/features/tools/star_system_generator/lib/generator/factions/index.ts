import type { NarrativeDomain } from '../narrative/domains'

export interface SeedFaction {
  name: string
  kind: string
  domains: readonly NarrativeDomain[]
  publicFace: string
}

export interface FactionBank {
  stems: readonly string[]
  suffixes: readonly string[]
  seedFactions: readonly SeedFaction[]
  kindByDomain: Partial<Record<NarrativeDomain, readonly string[]>>
}

export interface GeneratedFaction {
  id: string
  name: string
  kind: string
  domains: readonly NarrativeDomain[]
  publicFace: string
}

export { generateFactions, getSeedFactionNames } from './generateFactions'
export { buildFactionMetadataByName, type FactionMetadata } from './factionLookup'

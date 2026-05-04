export interface SeedFaction {
  name: string
  kind: string
  domains: readonly string[]
  publicFace: string
}

export interface FactionBank {
  stems: readonly string[]
  suffixes: readonly string[]
  seedFactions: readonly SeedFaction[]
  kindByDomain: Record<string, readonly string[]>
}

export interface GeneratedFaction {
  id: string
  name: string
  kind: string
  domains: readonly string[]
  publicFace: string
}

export { generateFactions } from './generateFactions'
export { buildFactionMetadataByName, type FactionMetadata } from './factionLookup'

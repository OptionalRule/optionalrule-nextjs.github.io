import type { NarrativeFact } from '../../../types'

export interface FactionMetadata {
  domains: readonly string[]
  kind: string
}

export function buildFactionMetadataByName(
  factsByKind: ReadonlyMap<string, ReadonlyArray<NarrativeFact>>,
): ReadonlyMap<string, FactionMetadata> {
  const out = new Map<string, FactionMetadata>()
  const facts = factsByKind.get('namedFaction') ?? []
  for (const fact of facts) {
    if (out.has(fact.value.value)) continue
    out.set(fact.value.value, {
      domains: fact.domains,
      kind: extractKind(fact),
    })
  }
  return out
}

function extractKind(fact: NarrativeFact): string {
  for (const tag of fact.tags) {
    if (tag === 'actor' || tag === 'namedFaction' || tag === 'faction') continue
    return tag
  }
  return 'faction'
}

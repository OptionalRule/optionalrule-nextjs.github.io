import type { NarrativeFact } from '../../../../types'
import type { BuildCtx } from './ruleTypes'
import type { EntityRef } from '../types'
import { containsWord } from './settingPatterns'
import { buildFactionMetadataByName } from '../../factions'

export function getFactionEntities(entities: ReadonlyArray<EntityRef>): EntityRef[] {
  return entities.filter(e => e.kind === 'namedFaction')
}

export function factionFactIdsForName(
  factsByKind: ReadonlyMap<string, ReadonlyArray<NarrativeFact>>,
  name: string,
): string[] {
  const facts = factsByKind.get('namedFaction') ?? []
  const ids: string[] = []
  for (const fact of facts) {
    if (fact.value.value === name) ids.push(fact.id)
  }
  return ids
}

export function findControllingFaction(settlement: EntityRef, ctx: BuildCtx): EntityRef | undefined {
  const authorityFacts = (ctx.factsBySubjectId.get(settlement.id) ?? [])
    .filter(f => f.kind === 'settlement.authority')
  if (authorityFacts.length === 0) return undefined
  const authorityText = authorityFacts[0].value.value
  const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
  const factionEntities = ctx.entities.filter(e => e.kind === 'namedFaction')
  const matched: EntityRef[] = []
  for (const factionEntity of factionEntities) {
    const faction = factionMeta.get(factionEntity.displayName)
    if (!faction) continue
    if (faction.domains.some(d => containsWord(authorityText, d))) {
      matched.push(factionEntity)
    }
  }
  return matched.length === 1 ? matched[0] : undefined
}

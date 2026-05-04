import type { NarrativeFact } from '../../../../types'
import type { EdgeRule, RuleMatch } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import { sharedDomains, containsWord } from './settingPatterns'
import type { EntityRef } from '../types'
import { buildFactionMetadataByName } from '../../factions'

function getFactionEntities(entities: ReadonlyArray<EntityRef>): EntityRef[] {
  return entities.filter(e => e.kind === 'namedFaction')
}

function factionFactIdsForName(
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

export const contestsSharedDomainRule: EdgeRule = {
  id: 'CONTESTS:namedFaction-namedFaction-sharedDomain',
  edgeType: 'CONTESTS',
  baseWeight: 0.55,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const factionEntities = getFactionEntities(ctx.entities)
    if (factionEntities.length < 2) return matches

    const authorityFacts = ctx.factsByKind.get('settlement.authority') ?? []
    if (authorityFacts.length === 0) return matches

    const validAuthorityFacts = authorityFacts.filter(f => {
      if (!f.subjectId) return false
      const ref = ctx.entitiesById.get(f.subjectId)
      return ref?.kind === 'settlement'
    })
    if (validAuthorityFacts.length === 0) return matches

    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
    const sorted = [...factionEntities].sort((a, b) => (a.id < b.id ? -1 : 1))

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        const factionA = factionMeta.get(a.displayName)
        const factionB = factionMeta.get(b.displayName)
        if (!factionA || !factionB) continue
        const overlap = sharedDomains(factionA.domains, factionB.domains)
        if (overlap.length === 0) continue

        const overlapSet = new Set(overlap)
        const authFact = validAuthorityFacts.find(f =>
          f.domains.some(d => overlapSet.has(d)),
        )
        if (!authFact) continue

        const factionAFactIds = factionFactIdsForName(ctx.factsByKind, a.displayName)
        const factionBFactIds = factionFactIdsForName(ctx.factsByKind, b.displayName)

        matches.push({
          subject: a,
          object: b,
          qualifier: overlap[0],
          groundingFactIds: [...factionAFactIds, ...factionBFactIds, authFact.id],
        })
      }
    }
    return matches
  },
  build(match, rule, _ctx) {
    const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
    return {
      id,
      type: rule.edgeType,
      subject: match.subject,
      object: match.object,
      qualifier: match.qualifier,
      visibility: match.visibility ?? rule.defaultVisibility,
      confidence: match.confidence ?? 'derived',
      groundingFactIds: match.groundingFactIds,
      era: 'present',
      weight: match.weight ?? rule.baseWeight,
    }
  },
}

export const contestsAuthorityRule: EdgeRule = {
  id: 'CONTESTS:namedFaction-authority',
  edgeType: 'CONTESTS',
  baseWeight: 0.5,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const factionEntities = getFactionEntities(ctx.entities)
    if (factionEntities.length === 0) return matches

    const authorityFacts = ctx.factsByKind.get('settlement.authority') ?? []
    if (authorityFacts.length === 0) return matches

    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)

    for (const fact of authorityFacts) {
      if (!fact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(fact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue

      for (const factionEntity of factionEntities) {
        const faction = factionMeta.get(factionEntity.displayName)
        if (!faction) continue
        const matchedDomain = faction.domains.find(d =>
          containsWord(fact.value.value, d),
        )
        if (!matchedDomain) continue

        const factionFactIds = factionFactIdsForName(ctx.factsByKind, factionEntity.displayName)
        matches.push({
          subject: factionEntity,
          object: settlementRef,
          qualifier: matchedDomain,
          groundingFactIds: [...factionFactIds, fact.id],
        })
      }
    }

    matches.sort((a, b) => {
      if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
      return a.object.id < b.object.id ? -1 : 1
    })
    return matches
  },
  build(match, rule, _ctx) {
    const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
    return {
      id,
      type: rule.edgeType,
      subject: match.subject,
      object: match.object,
      qualifier: match.qualifier,
      visibility: match.visibility ?? rule.defaultVisibility,
      confidence: match.confidence ?? 'derived',
      groundingFactIds: match.groundingFactIds,
      era: 'present',
      weight: match.weight ?? rule.baseWeight,
    }
  },
}

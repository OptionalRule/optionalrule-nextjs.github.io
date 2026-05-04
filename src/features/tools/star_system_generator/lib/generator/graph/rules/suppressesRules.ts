import type { NarrativeFact } from '../../../../types'
import type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import { containsWord, matchesAny, INTERDICTION_KEYWORDS } from './settingPatterns'
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

function findControllingFaction(settlement: EntityRef, ctx: BuildCtx): EntityRef | undefined {
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

export const suppressesGardenerInterdictionRule: EdgeRule = {
  id: 'SUPPRESSES:gardener-interdiction-target',
  edgeType: 'SUPPRESSES',
  baseWeight: 0.5,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
    const interdictionFactions = getFactionEntities(ctx.entities).filter(f => {
      const faction = factionMeta.get(f.displayName)
      return faction?.domains.includes('gardener-interdiction') ?? false
    })
    if (interdictionFactions.length === 0) return matches

    const candidateKinds = ['phenomenon', 'gu.bleedLocation', 'settlement.hiddenTruth'] as const
    for (const kind of candidateKinds) {
      const facts = ctx.factsByKind.get(kind) ?? []
      for (const fact of facts) {
        if (!matchesAny(fact.value.value, INTERDICTION_KEYWORDS)) continue
        const targetEntity = fact.subjectId ? ctx.entitiesById.get(fact.subjectId) : undefined
        if (!targetEntity) continue

        for (const factionEntity of interdictionFactions) {
          matches.push({
            subject: factionEntity,
            object: targetEntity,
            groundingFactIds: [
              ...factionFactIdsForName(ctx.factsByKind, factionEntity.displayName),
              fact.id,
            ],
          })
        }
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

export const suppressesAuthorityHiddenTruthRule: EdgeRule = {
  id: 'SUPPRESSES:authority-over-hiddenTruth',
  edgeType: 'SUPPRESSES',
  baseWeight: 0.55,
  defaultVisibility: 'hidden',
  match(ctx) {
    const matches: RuleMatch[] = []
    const hiddenTruthFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
    if (hiddenTruthFacts.length === 0) return matches

    for (const hiddenFact of hiddenTruthFacts) {
      if (!hiddenFact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue

      const authorityFacts = (ctx.factsBySubjectId.get(hiddenFact.subjectId) ?? [])
        .filter(f => f.kind === 'settlement.authority')
      if (authorityFacts.length === 0) continue

      const authorityFact = authorityFacts[0]
      const controllingFaction = findControllingFaction(settlementRef, ctx)
      if (!controllingFaction) continue

      matches.push({
        subject: controllingFaction,
        object: settlementRef,
        confidence: 'inferred',
        groundingFactIds: [hiddenFact.id, authorityFact.id],
      })
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

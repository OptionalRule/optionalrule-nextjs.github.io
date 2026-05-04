import type { NarrativeFact } from '../../../../types'
import type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import { containsWord, matchesAny } from './settingPatterns'
import type { EntityRef } from '../types'
import { buildFactionMetadataByName } from '../../factions'

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

export const hidesFromHiddenTruthGardenerRule: EdgeRule = {
  id: 'HIDES_FROM:hiddenTruth-from-gardenerFaction',
  edgeType: 'HIDES_FROM',
  baseWeight: 0.5,
  defaultVisibility: 'hidden',
  match(ctx) {
    const matches: RuleMatch[] = []
    const hiddenFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
    if (hiddenFacts.length === 0) return matches

    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
    const gardenerFactions = ctx.entities.filter(e => {
      if (e.kind !== 'namedFaction') return false
      const faction = factionMeta.get(e.displayName)
      return faction?.domains.includes('gardener-interdiction') ?? false
    })
    if (gardenerFactions.length === 0) return matches

    for (const hiddenFact of hiddenFacts) {
      if (!hiddenFact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue

      for (const factionEntity of gardenerFactions) {
        matches.push({
          subject: settlementRef,
          object: factionEntity,
          groundingFactIds: [
            hiddenFact.id,
            ...factionFactIdsForName(ctx.factsByKind, factionEntity.displayName),
          ],
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

const AI_HIDING_KEYWORDS = ['illegal', 'unregistered', 'unrecorded', 'sealed', 'unsanctioned'] as const

export const hidesFromAiSituationAuthorityRule: EdgeRule = {
  id: 'HIDES_FROM:aiSituation-from-authority',
  edgeType: 'HIDES_FROM',
  baseWeight: 0.5,
  defaultVisibility: 'hidden',
  match(ctx) {
    const matches: RuleMatch[] = []
    const aiFacts = ctx.factsByKind.get('settlement.aiSituation') ?? []
    if (aiFacts.length === 0) return matches

    for (const aiFact of aiFacts) {
      if (!aiFact.subjectId) continue
      if (!matchesAny(aiFact.value.value, AI_HIDING_KEYWORDS)) continue
      const settlementRef = ctx.entitiesById.get(aiFact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue

      const controllingFaction = findControllingFaction(settlementRef, ctx)
      if (!controllingFaction) continue

      matches.push({
        subject: settlementRef,
        object: controllingFaction,
        groundingFactIds: [
          aiFact.id,
          ...factionFactIdsForName(ctx.factsByKind, controllingFaction.displayName),
        ],
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

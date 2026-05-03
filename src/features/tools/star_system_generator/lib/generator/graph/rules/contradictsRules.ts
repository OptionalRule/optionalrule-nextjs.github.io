import type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import {
  containsWord, sharedDomains, matchesAny, CONTRADICTION_KEYWORDS,
} from './settingPatterns'
import type { EntityRef } from '../types'
import { namedFactions, type NamedFaction } from '../../data/narrative'

const FACTIONS_BY_NAME: ReadonlyMap<string, NamedFaction> = new Map(
  namedFactions.map(f => [f.name, f]),
)

function findControllingFaction(settlement: EntityRef, ctx: BuildCtx): EntityRef | undefined {
  const authorityFacts = (ctx.factsBySubjectId.get(settlement.id) ?? [])
    .filter(f => f.kind === 'settlement.authority')
  if (authorityFacts.length === 0) return undefined
  const authorityText = authorityFacts[0].value.value
  const factionEntities = ctx.entities.filter(e => e.kind === 'namedFaction')
  const matched: EntityRef[] = []
  for (const factionEntity of factionEntities) {
    const faction = FACTIONS_BY_NAME.get(factionEntity.displayName)
    if (!faction) continue
    if (faction.domains.some(d => containsWord(authorityText, d))) {
      matched.push(factionEntity)
    }
  }
  return matched.length === 1 ? matched[0] : undefined
}

export const contradictsRuinHookAuthorityRule: EdgeRule = {
  id: 'CONTRADICTS:ruinHook-vs-settlementAuthority',
  edgeType: 'CONTRADICTS',
  baseWeight: 0.45,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const ruinHookFacts = ctx.factsByKind.get('ruin.hook') ?? []
    const authorityFacts = ctx.factsByKind.get('settlement.authority') ?? []
    if (ruinHookFacts.length === 0 || authorityFacts.length === 0) return matches

    for (const ruinFact of ruinHookFacts) {
      if (!ruinFact.subjectId) continue
      const ruinRef = ctx.entitiesById.get(ruinFact.subjectId)
      if (!ruinRef || ruinRef.kind !== 'ruin') continue

      const ruin = ctx.input.ruins.find(r => r.id === ruinFact.subjectId)
      const ruinBodyName = ruin?.location?.value
      if (!ruinBodyName) continue

      for (const authFact of authorityFacts) {
        if (!authFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(authFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue
        const settlement = ctx.input.settlements.find(s => s.id === authFact.subjectId)
        if (!settlement?.bodyId) continue
        const bodyEntity = ctx.entitiesById.get(settlement.bodyId)
        if (!bodyEntity || !containsWord(ruinBodyName, bodyEntity.displayName)) continue

        const overlap = sharedDomains(ruinFact.domains, authFact.domains)
        const hasContradictionKw =
          matchesAny(ruinFact.value.value, CONTRADICTION_KEYWORDS)
          || matchesAny(authFact.value.value, CONTRADICTION_KEYWORDS)
        if (overlap.length === 0 && !hasContradictionKw) continue

        matches.push({
          subject: ruinRef,
          object: settlementRef,
          qualifier: overlap[0],
          groundingFactIds: [ruinFact.id, authFact.id],
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

export const contradictsHiddenPublicRule: EdgeRule = {
  id: 'CONTRADICTS:hiddenTruth-vs-publicSurface',
  edgeType: 'CONTRADICTS',
  baseWeight: 0.5,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const hiddenFacts = ctx.factsByKind.get('settlement.hiddenTruth') ?? []
    const tagHookFacts = ctx.factsByKind.get('settlement.tagHook') ?? []
    if (hiddenFacts.length === 0 || tagHookFacts.length === 0) return matches

    for (const hiddenFact of hiddenFacts) {
      if (!hiddenFact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(hiddenFact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue

      const matchingTagHooks = tagHookFacts.filter(t =>
        t.subjectId === hiddenFact.subjectId
        && sharedDomains(t.domains, hiddenFact.domains).length > 0,
      )
      if (matchingTagHooks.length === 0) continue

      const controllingFaction = findControllingFaction(settlementRef, ctx)
      const objectRef = controllingFaction ?? ctx.entities.find(e => e.kind === 'system')
      if (!objectRef) continue

      matches.push({
        subject: settlementRef,
        object: objectRef,
        qualifier: matchingTagHooks[0].domains[0],
        groundingFactIds: [hiddenFact.id, matchingTagHooks[0].id],
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

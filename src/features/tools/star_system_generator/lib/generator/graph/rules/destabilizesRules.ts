import type { EdgeRule, RuleMatch } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import type { EntityRef } from '../types'
import { CRISIS_DESTABILIZE_KEYWORDS } from './settingPatterns'

function findGuHazard(entities: ReadonlyArray<EntityRef>): EntityRef | undefined {
  return entities.find(e => e.kind === 'guHazard')
}

function firstSharedKeyword(textA: string, textB: string, keywords: ReadonlyArray<string>): string | null {
  const aLower = textA.toLowerCase()
  const bLower = textB.toLowerCase()
  for (const k of keywords) {
    const kLower = k.toLowerCase()
    if (aLower.includes(kLower) && bLower.includes(kLower)) return k
  }
  return null
}

export const destabilizesPhenomenonSettlementRule: EdgeRule = {
  id: 'DESTABILIZES:phenomenon-settlement-via-guLayer',
  edgeType: 'DESTABILIZES',
  baseWeight: 0.5,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const guLayerPhenomena = ctx.input.phenomena.filter(p => p.confidence === 'gu-layer')
    if (guLayerPhenomena.length === 0) return matches

    const crisisFacts = ctx.factsByKind.get('settlement.crisis') ?? []
    if (crisisFacts.length === 0) return matches

    for (const phenomenon of guLayerPhenomena) {
      const phenomenonRef = ctx.entitiesById.get(phenomenon.id)
      if (!phenomenonRef || phenomenonRef.kind !== 'phenomenon') continue
      const phenomenonText = phenomenon.phenomenon.value
      for (const crisisFact of crisisFacts) {
        if (!crisisFact.subjectId) continue
        const settlementRef = ctx.entitiesById.get(crisisFact.subjectId)
        if (!settlementRef || settlementRef.kind !== 'settlement') continue
        const sharedKw = firstSharedKeyword(phenomenonText, crisisFact.value.value, CRISIS_DESTABILIZE_KEYWORDS)
        if (!sharedKw) continue

        const phenomenonFactIds = (ctx.factsBySubjectId.get(phenomenon.id) ?? [])
          .filter(f => f.kind === 'phenomenon')
          .map(f => f.id)

        matches.push({
          subject: phenomenonRef,
          object: settlementRef,
          qualifier: sharedKw,
          confidence: 'gu-layer',
          groundingFactIds: [...phenomenonFactIds, crisisFact.id],
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

export const destabilizesGuHazardSettlementRule: EdgeRule = {
  id: 'DESTABILIZES:guHazard-settlement-via-hazardScore',
  edgeType: 'DESTABILIZES',
  baseWeight: 0.55,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const guHazardRef = findGuHazard(ctx.entities)
    if (!guHazardRef) return matches

    for (const settlement of ctx.input.settlements) {
      const hazardScore = settlement.presence?.hazard?.value
      if (typeof hazardScore !== 'number' || hazardScore < 2) continue
      const settlementRef = ctx.entitiesById.get(settlement.id)
      if (!settlementRef) continue

      const groundingFactIds = (ctx.factsBySubjectId.get(settlement.id) ?? [])
        .filter(f => f.kind === 'settlement.location')
        .map(f => f.id)

      matches.push({
        subject: guHazardRef,
        object: settlementRef,
        confidence: 'gu-layer',
        groundingFactIds,
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

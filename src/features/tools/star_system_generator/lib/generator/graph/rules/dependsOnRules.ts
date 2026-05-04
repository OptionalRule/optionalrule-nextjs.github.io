import type { EdgeRule, RuleMatch } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import {
  matchesAny,
  RESOURCE_KEYWORDS,
  CRISIS_DEPENDENCY_KEYWORDS,
} from './settingPatterns'
import type { EntityRef } from '../types'

function findGuResource(entities: ReadonlyArray<EntityRef>): EntityRef | undefined {
  return entities.find(e => e.kind === 'guResource')
}

function firstMatchingKeyword(text: string, keywords: ReadonlyArray<string>): string | null {
  const lower = text.toLowerCase()
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) return k
  }
  return null
}

export const dependsOnViaFunctionRule: EdgeRule = {
  id: 'DEPENDS_ON:settlement-guResource-via-function',
  edgeType: 'DEPENDS_ON',
  baseWeight: 0.5,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const guResourceRef = findGuResource(ctx.entities)
    if (!guResourceRef) return matches
    const guText = guResourceRef.displayName

    const functionFacts = ctx.factsByKind.get('settlement.function') ?? []
    for (const fact of functionFacts) {
      if (!fact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(fact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue
      const matchedKw = firstMatchingKeyword(fact.value.value, RESOURCE_KEYWORDS)
      if (!matchedKw) continue
      if (!matchesAny(guText, [matchedKw])) continue
      matches.push({
        subject: settlementRef,
        object: guResourceRef,
        groundingFactIds: [fact.id],
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

export const dependsOnViaCrisisRule: EdgeRule = {
  id: 'DEPENDS_ON:settlement-guResource-via-crisis',
  edgeType: 'DEPENDS_ON',
  baseWeight: 0.45,
  defaultVisibility: 'contested',
  match(ctx) {
    const matches: RuleMatch[] = []
    const guResourceRef = findGuResource(ctx.entities)
    if (!guResourceRef) return matches
    const guText = guResourceRef.displayName

    const crisisFacts = ctx.factsByKind.get('settlement.crisis') ?? []
    for (const fact of crisisFacts) {
      if (!fact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(fact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue
      const matchedKw = firstMatchingKeyword(fact.value.value, CRISIS_DEPENDENCY_KEYWORDS)
      if (!matchedKw) continue
      if (!matchesAny(guText, [matchedKw])) continue
      matches.push({
        subject: settlementRef,
        object: guResourceRef,
        confidence: 'inferred',
        groundingFactIds: [fact.id],
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

export const dependsOnViaPresenceRule: EdgeRule = {
  id: 'DEPENDS_ON:settlement-guResource-via-presence',
  edgeType: 'DEPENDS_ON',
  baseWeight: 0.55,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const guResourceRef = findGuResource(ctx.entities)
    if (!guResourceRef) return matches
    for (const settlement of ctx.input.settlements) {
      const guValue = settlement.presence?.guValue?.value
      if (typeof guValue !== 'number' || guValue < 2) continue
      const settlementRef = ctx.entitiesById.get(settlement.id)
      if (!settlementRef) continue
      const groundingFactIds = (ctx.factsBySubjectId.get(settlement.id) ?? [])
        .filter(f => f.kind === 'settlement.location')
        .map(f => f.id)
      matches.push({
        subject: settlementRef,
        object: guResourceRef,
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

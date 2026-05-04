import type { EdgeRule, RuleMatch } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import { containsWord, WITNESS_KEYWORDS } from './settingPatterns'

export const witnessesAiSituationRuinRule: EdgeRule = {
  id: 'WITNESSES:aiSituation-witnesses-ruin',
  edgeType: 'WITNESSES',
  baseWeight: 0.45,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const aiFacts = ctx.factsByKind.get('settlement.aiSituation') ?? []
    if (aiFacts.length === 0) return matches

    for (const aiFact of aiFacts) {
      if (!aiFact.subjectId) continue
      const settlementRef = ctx.entitiesById.get(aiFact.subjectId)
      if (!settlementRef || settlementRef.kind !== 'settlement') continue
      const settlement = ctx.input.settlements.find(s => s.id === aiFact.subjectId)
      if (!settlement?.bodyId) continue
      const body = ctx.entitiesById.get(settlement.bodyId)
      if (!body) continue

      for (const ruin of ctx.input.ruins) {
        if (!ruin.location || !containsWord(ruin.location.value, body.displayName)) continue
        const ruinRef = ctx.entitiesById.get(ruin.id)
        if (!ruinRef) continue

        const ruinHookIds = (ctx.factsBySubjectId.get(ruin.id) ?? [])
          .filter(f => f.kind === 'ruin.hook' || f.kind === 'ruin.type')
          .map(f => f.id)

        matches.push({
          subject: settlementRef,
          object: ruinRef,
          groundingFactIds: [aiFact.id, ...ruinHookIds],
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

export const witnessesRuinHookEventRule: EdgeRule = {
  id: 'WITNESSES:ruinHook-witnesses-historicalEvent',
  edgeType: 'WITNESSES',
  baseWeight: 0.4,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const ruinHookFacts = ctx.factsByKind.get('ruin.hook') ?? []

    for (const ruinFact of ruinHookFacts) {
      if (!ruinFact.subjectId) continue
      const ruinRef = ctx.entitiesById.get(ruinFact.subjectId)
      if (!ruinRef) continue

      const matchedWitnessKw = WITNESS_KEYWORDS.find(k =>
        containsWord(ruinFact.value.value, k),
      )
      if (!matchedWitnessKw) continue

      const allOtherFacts = ctx.facts.filter(f =>
        f.id !== ruinFact.id
        && containsWord(f.value.value, matchedWitnessKw),
      )
      if (allOtherFacts.length === 0) continue

      const systemRef = ctx.entities.find(e => e.kind === 'system')
      if (!systemRef) continue

      matches.push({
        subject: ruinRef,
        object: systemRef,
        qualifier: matchedWitnessKw,
        groundingFactIds: [ruinFact.id, ...allOtherFacts.map(f => f.id)],
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

import { mintEdgeId, type EdgeRule, type RuleMatch } from './ruleTypes'

export const hostsBodySettlementRule: EdgeRule = {
  id: 'HOSTS:body-settlement',
  edgeType: 'HOSTS',
  baseWeight: 0.6,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    for (const settlement of ctx.input.settlements) {
      if (!settlement.bodyId) continue
      const bodyRef = ctx.entitiesById.get(settlement.bodyId)
      if (!bodyRef || bodyRef.kind !== 'body') continue
      const settlementRef = ctx.entitiesById.get(settlement.id)
      if (!settlementRef) continue
      const groundingFactIds = (ctx.factsBySubjectId.get(settlement.id) ?? [])
        .filter(f => f.kind === 'settlement.location')
        .map(f => f.id)
      matches.push({
        subject: bodyRef,
        object: settlementRef,
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

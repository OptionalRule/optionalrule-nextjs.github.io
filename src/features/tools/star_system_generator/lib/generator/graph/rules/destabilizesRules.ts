import type { NarrativeFact } from '../../../../types'
import type { EdgeRule, RuleMatch } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import type { EntityRef } from '../types'
import { CRISIS_DESTABILIZE_KEYWORDS, containsWord } from './settingPatterns'
import { buildFactionMetadataByName } from '../../factions'

function findGuHazard(entities: ReadonlyArray<EntityRef>): EntityRef | undefined {
  return entities.find(e => e.kind === 'guHazard')
}

const PHYSICS_DOMAINS = new Set(['ecology', 'science'])

function getPhenomenonEntities(entities: ReadonlyArray<EntityRef>): EntityRef[] {
  return entities.filter(e => e.kind === 'phenomenon')
}

function phenomenonGroundingFactIds(
  factsBySubjectId: ReadonlyMap<string, ReadonlyArray<NarrativeFact>>,
  phenomenonId: string,
): string[] {
  return (factsBySubjectId.get(phenomenonId) ?? [])
    .filter(f => f.kind === 'phenomenon')
    .map(f => f.id)
}

function firstSharedKeyword(textA: string, textB: string, keywords: ReadonlyArray<string>): string | null {
  for (const k of keywords) {
    if (containsWord(textA, k) && containsWord(textB, k)) return k
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

export const destabilizesPhenomenonSettlementBodyRule: EdgeRule = {
  id: 'DESTABILIZES:phenomenon-settlement-body',
  edgeType: 'DESTABILIZES',
  baseWeight: 0.6,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const phenomena = getPhenomenonEntities(ctx.entities)
    if (phenomena.length === 0) return matches

    const settlementBodyIds = new Set<string>()
    for (const settlement of ctx.input.settlements) {
      if (settlement.bodyId) settlementBodyIds.add(settlement.bodyId)
    }
    if (settlementBodyIds.size === 0) return matches

    for (const phenomenon of phenomena) {
      const phenomenonFactIds = phenomenonGroundingFactIds(ctx.factsBySubjectId, phenomenon.id)
      for (const bodyId of settlementBodyIds) {
        const bodyRef = ctx.entitiesById.get(bodyId)
        if (!bodyRef || bodyRef.kind !== 'body') continue
        matches.push({
          subject: phenomenon,
          object: bodyRef,
          confidence: 'inferred',
          groundingFactIds: phenomenonFactIds,
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

export const destabilizesPhenomenonRouteAssetBodyRule: EdgeRule = {
  id: 'DESTABILIZES:phenomenon-routeAsset-body',
  edgeType: 'DESTABILIZES',
  baseWeight: 0.55,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const phenomena = getPhenomenonEntities(ctx.entities)
    if (phenomena.length === 0) return matches

    const routeAssetFacts: NarrativeFact[] = []
    const candidateFactKinds = ['gu.bleedLocation', 'settlement.location'] as const
    for (const kind of candidateFactKinds) {
      for (const fact of ctx.factsByKind.get(kind) ?? []) {
        if (fact.tags.includes('routeAsset')) routeAssetFacts.push(fact)
      }
    }
    if (routeAssetFacts.length === 0) return matches

    const targetBodies = new Map<string, EntityRef>()
    for (const fact of routeAssetFacts) {
      if (fact.kind === 'settlement.location' && fact.subjectId) {
        const settlement = ctx.input.settlements.find(s => s.id === fact.subjectId)
        if (!settlement?.bodyId) continue
        const bodyRef = ctx.entitiesById.get(settlement.bodyId)
        if (bodyRef && bodyRef.kind === 'body') {
          targetBodies.set(bodyRef.id, bodyRef)
        }
      } else if (fact.kind === 'gu.bleedLocation') {
        for (const entity of ctx.entities) {
          if (entity.kind !== 'body') continue
          if (containsWord(fact.value.value, entity.displayName)) {
            targetBodies.set(entity.id, entity)
          }
        }
      }
    }
    if (targetBodies.size === 0) return matches

    for (const phenomenon of phenomena) {
      const phenomenonFactIds = phenomenonGroundingFactIds(ctx.factsBySubjectId, phenomenon.id)
      for (const bodyRef of targetBodies.values()) {
        matches.push({
          subject: phenomenon,
          object: bodyRef,
          qualifier: 'route',
          confidence: 'inferred',
          groundingFactIds: phenomenonFactIds,
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

export const destabilizesPhenomenonPhysicsFactionRule: EdgeRule = {
  id: 'DESTABILIZES:phenomenon-physicsFaction',
  edgeType: 'DESTABILIZES',
  baseWeight: 0.5,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const phenomena = getPhenomenonEntities(ctx.entities)
    if (phenomena.length === 0) return matches

    const factionEntities = ctx.entities.filter(e => e.kind === 'namedFaction')
    if (factionEntities.length === 0) return matches

    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)
    const physicsFactions: { faction: EntityRef; domain: string }[] = []
    for (const factionEntity of factionEntities) {
      const meta = factionMeta.get(factionEntity.displayName)
      if (!meta) continue
      const matchedDomain = meta.domains.find(d => PHYSICS_DOMAINS.has(d))
      if (matchedDomain) physicsFactions.push({ faction: factionEntity, domain: matchedDomain })
    }
    if (physicsFactions.length === 0) return matches

    const factionFactsByName = new Map<string, string[]>()
    const factionFacts = ctx.factsByKind.get('namedFaction') ?? []
    for (const fact of factionFacts) {
      const arr = factionFactsByName.get(fact.value.value) ?? []
      arr.push(fact.id)
      factionFactsByName.set(fact.value.value, arr)
    }

    for (const phenomenon of phenomena) {
      const phenomenonFactIds = phenomenonGroundingFactIds(ctx.factsBySubjectId, phenomenon.id)
      for (const { faction, domain } of physicsFactions) {
        const factionFactIds = factionFactsByName.get(faction.displayName) ?? []
        matches.push({
          subject: phenomenon,
          object: faction,
          qualifier: domain,
          confidence: 'inferred',
          groundingFactIds: [...phenomenonFactIds, ...factionFactIds],
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

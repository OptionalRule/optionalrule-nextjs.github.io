import type { NarrativeFact } from '../../../../types'
import type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
import { mintEdgeId } from './ruleTypes'
import { containsWord, CONTROL_DOMAINS } from './settingPatterns'
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

export const controlsRouteAssetRule: EdgeRule = {
  id: 'CONTROLS:namedFaction-routeAsset',
  edgeType: 'CONTROLS',
  baseWeight: 0.55,
  defaultVisibility: 'public',
  match(ctx) {
    const matches: RuleMatch[] = []
    const factionEntities = getFactionEntities(ctx.entities)
    if (factionEntities.length === 0) return matches

    const factionMeta = buildFactionMetadataByName(ctx.factsByKind)

    const candidateFactKinds = ['gu.bleedLocation', 'settlement.location'] as const
    const routeAssetFacts: NarrativeFact[] = []
    for (const kind of candidateFactKinds) {
      for (const fact of ctx.factsByKind.get(kind) ?? []) {
        if (fact.tags.includes('routeAsset')) routeAssetFacts.push(fact)
      }
    }
    if (routeAssetFacts.length === 0) return matches

    for (const fact of routeAssetFacts) {
      const targetEntity = resolveControlTarget(fact, ctx)
      if (!targetEntity) continue

      for (const factionEntity of factionEntities) {
        const faction = factionMeta.get(factionEntity.displayName)
        if (!faction) continue
        const controlDomain = faction.domains.find(d =>
          (CONTROL_DOMAINS as ReadonlyArray<string>).includes(d),
        )
        if (!controlDomain) continue

        const factionFactIds = factionFactIdsForName(ctx.factsByKind, factionEntity.displayName)
        matches.push({
          subject: factionEntity,
          object: targetEntity,
          qualifier: controlDomain,
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

export const controlsSettlementUniqueDomainRule: EdgeRule = {
  id: 'CONTROLS:namedFaction-settlement-uniqueDomain',
  edgeType: 'CONTROLS',
  baseWeight: 0.5,
  defaultVisibility: 'public',
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

      const matchingFactions: { faction: EntityRef; domain: string }[] = []
      for (const factionEntity of factionEntities) {
        const faction = factionMeta.get(factionEntity.displayName)
        if (!faction) continue
        const matchedDomain = faction.domains.find(d =>
          containsWord(fact.value.value, d),
        )
        if (matchedDomain) matchingFactions.push({ faction: factionEntity, domain: matchedDomain })
      }
      if (matchingFactions.length !== 1) continue

      const { faction, domain } = matchingFactions[0]
      const factionFactIds = factionFactIdsForName(ctx.factsByKind, faction.displayName)
      matches.push({
        subject: faction,
        object: settlementRef,
        qualifier: domain,
        groundingFactIds: [...factionFactIds, fact.id],
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

function resolveControlTarget(fact: NarrativeFact, ctx: BuildCtx): EntityRef | undefined {
  if (fact.kind === 'settlement.location' && fact.subjectId) {
    const settlement = ctx.input.settlements.find(s => s.id === fact.subjectId)
    if (!settlement?.bodyId) return undefined
    return ctx.entitiesById.get(settlement.bodyId)
  }
  if (fact.kind === 'gu.bleedLocation') {
    for (const entity of ctx.entities) {
      if (entity.kind === 'body' && containsWord(fact.value.value, entity.displayName)) {
        return entity
      }
    }
    return ctx.entities.find(e => e.kind === 'system')
  }
  return undefined
}

import { describe, expect, it } from 'vitest'
import {
  controlsRouteAssetRule,
  controlsSettlementUniqueDomainRule,
} from '../rules/controlsRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'
import { namedFactions } from '../../data/narrative'
import { CONTROL_DOMAINS } from '../rules/settingPatterns'

const singleFaction = namedFactions[0]

const overlappingPair = (() => {
  for (let i = 0; i < namedFactions.length; i++) {
    for (let j = i + 1; j < namedFactions.length; j++) {
      const a = namedFactions[i]
      const b = namedFactions[j]
      const shared = a.domains.find(d => b.domains.includes(d))
      if (shared) return { a, b, shared }
    }
  }
  return null
})()

const factionWithControlDomain = (() => {
  const controlSet = new Set<string>(CONTROL_DOMAINS as ReadonlyArray<string>)
  for (const faction of namedFactions) {
    const domain = faction.domains.find(d => controlSet.has(d))
    if (domain) return { faction, domain }
  }
  return null
})()

const factionWithoutControlDomain = (() => {
  const controlSet = new Set<string>(CONTROL_DOMAINS as ReadonlyArray<string>)
  for (const faction of namedFactions) {
    if (!faction.domains.some(d => controlSet.has(d))) return faction
  }
  return null
})()

function makeFact(overrides: Partial<NarrativeFact> & { id: string; kind: string }): NarrativeFact {
  return {
    id: overrides.id,
    kind: overrides.kind,
    domains: overrides.domains ?? [],
    subjectType: overrides.subjectType ?? 'system',
    subjectId: overrides.subjectId,
    value: overrides.value ?? { value: '', confidence: 'derived' },
    tags: overrides.tags ?? [],
    status: overrides.status ?? 'established',
    sourcePath: overrides.sourcePath ?? 'test',
  }
}

function makeCtx(overrides: Partial<BuildCtx> = {}): BuildCtx {
  const input: EntityInventoryInput = overrides.input ?? {
    systemName: 'Test System',
    primary: { spectralType: { value: 'G2V' } },
    companions: [],
    bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
    settlements: [
      { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' },
    ],
    guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
    phenomena: [],
    ruins: [],
    narrativeFacts: [],
  }
  const entities: EntityRef[] = overrides.entities ?? []
  const facts: NarrativeFact[] = overrides.facts ?? []
  const indexes = buildFactIndexes(facts)
  return {
    facts,
    entities,
    input,
    rng: overrides.rng ?? createSeededRng('controls-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('CONTROLS:namedFaction-settlement-uniqueDomain', () => {
  it('produces a match when exactly one faction domain appears in authority text', () => {
    const factionDomain = singleFaction.domains[0]
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: singleFaction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: singleFaction.name, confidence: 'derived' },
          domains: [...singleFaction.domains],
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: `office of ${factionDomain} oversight`, confidence: 'derived' },
        }),
      ],
    })
    const matches = controlsSettlementUniqueDomainRule.match(ctx)
    expect(matches).toHaveLength(1)
    const match = matches[0]
    expect(match.subject.id).toBe('faction-a')
    expect(match.object.id).toBe('settlement-1')
    expect(match.qualifier).toBe(factionDomain)
    expect(match.groundingFactIds).toContain('f-fac-a')
    expect(match.groundingFactIds).toContain('f-auth-1')

    const edge = controlsSettlementUniqueDomainRule.build(
      match,
      controlsSettlementUniqueDomainRule,
      ctx,
    )
    expect(edge!.type).toBe('CONTROLS')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('CONTROLS:namedFaction-settlement-uniqueDomain')
  })

  it('does not fire when two factions both match the authority text', () => {
    if (!overlappingPair) {
      expect(true).toBe(true)
      return
    }
    const { a, b, shared } = overlappingPair
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: a.name, layer: 'human' },
        { kind: 'namedFaction', id: 'faction-b', displayName: b.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: a.name, confidence: 'derived' },
          domains: [...a.domains],
        }),
        makeFact({
          id: 'f-fac-b',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: b.name, confidence: 'derived' },
          domains: [...b.domains],
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [shared],
          value: { value: `office of ${shared} oversight`, confidence: 'derived' },
        }),
      ],
    })
    expect(controlsSettlementUniqueDomainRule.match(ctx)).toHaveLength(0)
  })

  it('returns matches sorted deterministically by (subject.id, object.id)', () => {
    const factionDomain = singleFaction.domains[0]
    const input: EntityInventoryInput = {
      systemName: 'Test System',
      primary: { spectralType: { value: 'G2V' } },
      companions: [],
      bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
      settlements: [
        { id: 'settlement-b', name: { value: 'Bravo' }, bodyId: 'body-1' },
        { id: 'settlement-a', name: { value: 'Alpha' }, bodyId: 'body-1' },
      ],
      guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
      phenomena: [],
      ruins: [],
      narrativeFacts: [],
    }
    const ctx = makeCtx({
      input,
      entities: [
        { kind: 'settlement', id: 'settlement-b', displayName: 'Bravo', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'Alpha', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-x', displayName: singleFaction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-x',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: singleFaction.name, confidence: 'derived' },
          domains: [...singleFaction.domains],
        }),
        makeFact({
          id: 'f-auth-b',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          domains: [],
          value: { value: `office of ${factionDomain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-a',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          domains: [],
          value: { value: `bureau of ${factionDomain} review`, confidence: 'derived' },
        }),
      ],
    })
    const matches = controlsSettlementUniqueDomainRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].object.id).toBe('settlement-a')
    expect(matches[1].object.id).toBe('settlement-b')
  })
})

describe('CONTROLS:namedFaction-routeAsset', () => {
  it('produces a match when a faction with a control-axis domain coexists with a routeAsset-tagged location fact', () => {
    if (!factionWithControlDomain) {
      expect(true).toBe(true)
      return
    }
    const { faction, domain } = factionWithControlDomain
    const ctx = makeCtx({
      entities: [
        { kind: 'system', id: 'system', displayName: 'Test System', layer: 'physical' },
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: faction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: faction.name, confidence: 'derived' },
          domains: [...faction.domains],
        }),
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          tags: ['routeAsset', 'orbital-platform'],
          value: { value: 'docking ring above Body One', confidence: 'derived' },
        }),
      ],
    })
    const matches = controlsRouteAssetRule.match(ctx)
    expect(matches).toHaveLength(1)
    const match = matches[0]
    expect(match.subject.id).toBe('faction-a')
    expect(match.object.id).toBe('body-1')
    expect(match.qualifier).toBe(domain)
    expect(match.groundingFactIds).toContain('f-fac-a')
    expect(match.groundingFactIds).toContain('f-loc-1')

    const edge = controlsRouteAssetRule.build(match, controlsRouteAssetRule, ctx)
    expect(edge!.type).toBe('CONTROLS')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.55)
    expect(edge!.id).toContain('CONTROLS:namedFaction-routeAsset')
  })

  it('does not fire when the only faction has no control-axis domain', () => {
    if (!factionWithoutControlDomain) {
      expect(true).toBe(true)
      return
    }
    const faction = factionWithoutControlDomain
    const ctx = makeCtx({
      entities: [
        { kind: 'system', id: 'system', displayName: 'Test System', layer: 'physical' },
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: faction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: faction.name, confidence: 'derived' },
          domains: [...faction.domains],
        }),
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          tags: ['routeAsset', 'orbital-platform'],
          value: { value: 'docking ring above Body One', confidence: 'derived' },
        }),
      ],
    })
    expect(controlsRouteAssetRule.match(ctx)).toHaveLength(0)
  })

  it('does not fire when no routeAsset-tagged location facts exist', () => {
    if (!factionWithControlDomain) {
      expect(true).toBe(true)
      return
    }
    const { faction } = factionWithControlDomain
    const ctx = makeCtx({
      entities: [
        { kind: 'system', id: 'system', displayName: 'Test System', layer: 'physical' },
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'namedFaction', id: 'faction-a', displayName: faction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: faction.name, confidence: 'derived' },
          domains: [...faction.domains],
        }),
      ],
    })
    expect(controlsRouteAssetRule.match(ctx)).toHaveLength(0)
  })

  it('falls back to the system entity when a gu.bleedLocation fact references no known body name', () => {
    if (!factionWithControlDomain) {
      expect(true).toBe(true)
      return
    }
    const { faction, domain } = factionWithControlDomain
    const ctx = makeCtx({
      entities: [
        { kind: 'system', id: 'system', displayName: 'Test System', layer: 'physical' },
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'namedFaction', id: 'faction-a', displayName: faction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: faction.name, confidence: 'derived' },
          domains: [...faction.domains],
        }),
        makeFact({
          id: 'f-bleed',
          kind: 'gu.bleedLocation',
          subjectType: 'system',
          tags: ['gu', 'routeAsset'],
          value: { value: 'an unmapped corridor far from any settled world', confidence: 'gu-layer' },
        }),
      ],
    })
    const matches = controlsRouteAssetRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].object.id).toBe('system')
    expect(matches[0].qualifier).toBe(domain)
  })
})

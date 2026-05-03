import { describe, expect, it } from 'vitest'
import {
  contestsSharedDomainRule,
  contestsAuthorityRule,
} from '../rules/contestsRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'
import { namedFactions } from '../../data/narrative'

const factionPair = (() => {
  for (let i = 0; i < namedFactions.length; i++) {
    for (let j = i + 1; j < namedFactions.length; j++) {
      const a = namedFactions[i]
      const b = namedFactions[j]
      const sharedDomain = a.domains.find(d => b.domains.includes(d))
      if (sharedDomain) return { a, b, sharedDomain }
    }
  }
  return null
})()

const singleFaction = namedFactions[0]

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
    rng: overrides.rng ?? createSeededRng('contests-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('CONTESTS:namedFaction-namedFaction-sharedDomain', () => {
  it('produces a match when two factions share a domain and a settlement.authority fact has overlapping domain tags', () => {
    if (!factionPair) {
      expect(true).toBe(true)
      return
    }
    const { a, b, sharedDomain } = factionPair
    const factionAId = `faction-${a.id}-entity`
    const factionBId = `faction-${b.id}-entity`
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: factionAId, displayName: a.name, layer: 'human' },
        { kind: 'namedFaction', id: factionBId, displayName: b.name, layer: 'human' },
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
          domains: [sharedDomain],
          value: { value: 'compliance bureau', confidence: 'derived' },
        }),
      ],
    })
    const matches = contestsSharedDomainRule.match(ctx)
    expect(matches).toHaveLength(1)
    const match = matches[0]
    const orderedIds = [factionAId, factionBId].sort()
    expect(match.subject.id).toBe(orderedIds[0])
    expect(match.object.id).toBe(orderedIds[1])
    expect(match.qualifier).toBe('settlement-1')
    expect(match.groundingFactIds).toContain('f-auth-1')
    expect(match.groundingFactIds).toContain('f-fac-a')
    expect(match.groundingFactIds).toContain('f-fac-b')

    const edge = contestsSharedDomainRule.build(match, contestsSharedDomainRule, ctx)
    expect(edge!.type).toBe('CONTESTS')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.55)
    expect(edge!.id).toContain('CONTESTS:namedFaction-namedFaction-sharedDomain')
  })

  it('produces no match when factions share no domain', () => {
    const noOverlap = (() => {
      for (let i = 0; i < namedFactions.length; i++) {
        for (let j = i + 1; j < namedFactions.length; j++) {
          const a = namedFactions[i]
          const b = namedFactions[j]
          const overlap = a.domains.find(d => b.domains.includes(d))
          if (!overlap) return { a, b }
        }
      }
      return null
    })()
    if (!noOverlap) {
      expect(true).toBe(true)
      return
    }
    const { a, b } = noOverlap
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: a.name, layer: 'human' },
        { kind: 'namedFaction', id: 'faction-b', displayName: b.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [...a.domains, ...b.domains],
          value: { value: 'compliance bureau', confidence: 'derived' },
        }),
      ],
    })
    expect(contestsSharedDomainRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no settlement.authority fact exists', () => {
    if (!factionPair) {
      expect(true).toBe(true)
      return
    }
    const { a, b } = factionPair
    const ctx = makeCtx({
      entities: [
        { kind: 'namedFaction', id: 'faction-a', displayName: a.name, layer: 'human' },
        { kind: 'namedFaction', id: 'faction-b', displayName: b.name, layer: 'human' },
      ],
      facts: [],
    })
    expect(contestsSharedDomainRule.match(ctx)).toHaveLength(0)
  })

  it('shared-domain: skips authority facts with missing subjectId', () => {
    if (!factionPair) {
      expect(true).toBe(true)
      return
    }
    const { a, b, sharedDomain } = factionPair
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
          subjectId: undefined,
          domains: [sharedDomain],
          value: { value: 'compliance bureau', confidence: 'derived' },
        }),
      ],
    })
    expect(contestsSharedDomainRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when settlement.authority fact has no overlapping domain tag', () => {
    if (!factionPair) {
      expect(true).toBe(true)
      return
    }
    const { a, b } = factionPair
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: a.name, layer: 'human' },
        { kind: 'namedFaction', id: 'faction-b', displayName: b.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['unrelated-domain-xyz'],
          value: { value: 'compliance bureau', confidence: 'derived' },
        }),
      ],
    })
    expect(contestsSharedDomainRule.match(ctx)).toHaveLength(0)
  })
})

describe('CONTESTS:namedFaction-authority', () => {
  it('produces a match when authority text contains a faction domain keyword', () => {
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
    const matches = contestsAuthorityRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('faction-a')
    expect(matches[0].object.id).toBe('settlement-1')
    expect(matches[0].qualifier).toBe(factionDomain)
    expect(matches[0].groundingFactIds).toContain('f-auth-1')
    expect(matches[0].groundingFactIds).toContain('f-fac-a')

    const edge = contestsAuthorityRule.build(matches[0], contestsAuthorityRule, ctx)
    expect(edge!.type).toBe('CONTESTS')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('CONTESTS:namedFaction-authority')
  })

  it('produces no match when authority text contains none of the faction domains', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'namedFaction', id: 'faction-a', displayName: singleFaction.name, layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: 'mundane civic council', confidence: 'derived' },
        }),
      ],
    })
    expect(contestsAuthorityRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no faction entities are present', () => {
    const factionDomain = singleFaction.domains[0]
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
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
    expect(contestsAuthorityRule.match(ctx)).toHaveLength(0)
  })
})

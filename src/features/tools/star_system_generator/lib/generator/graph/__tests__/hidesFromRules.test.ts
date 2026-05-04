import { describe, expect, it, vi } from 'vitest'

const SYNTHETIC_GARDENER_FACTION_NAME = 'Synthetic Gardener Warden'

vi.mock('../../data/narrative', async () => {
  const actual = await vi.importActual<typeof import('../../data/narrative')>(
    '../../data/narrative',
  )
  const synthetic = {
    id: 'test-gardener-warden',
    name: 'Synthetic Gardener Warden',
    kind: 'compact',
    domains: ['gardener-interdiction', 'compliance'],
    publicFace: 'public face',
  }
  return {
    ...actual,
    namedFactions: [...actual.namedFactions, synthetic],
  }
})

import { namedFactions as realFactions, type NamedFaction } from '../../data/narrative'
import {
  hidesFromHiddenTruthGardenerRule,
  hidesFromAiSituationAuthorityRule,
} from '../rules/hidesFromRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

const realOnlyFactions = realFactions.filter(
  f => f.name !== SYNTHETIC_GARDENER_FACTION_NAME,
)

const nonGardenerFaction = realOnlyFactions.find(
  f => !f.domains.includes('gardener-interdiction'),
)

const singleDomainFaction = realOnlyFactions.find(f => {
  const otherDomains = new Set<string>()
  for (const other of realOnlyFactions) {
    if (other.id === f.id) continue
    for (const d of other.domains) otherDomains.add(d)
  }
  return f.domains.some(d => !otherDomains.has(d))
})

function uniqueDomainFor(faction: NamedFaction): string {
  const others = new Set<string>()
  for (const other of realOnlyFactions) {
    if (other.id === faction.id) continue
    for (const d of other.domains) others.add(d)
  }
  return faction.domains.find(d => !others.has(d)) ?? faction.domains[0]
}

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
    rng: overrides.rng ?? createSeededRng('hides-from-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('HIDES_FROM:hiddenTruth-from-gardenerFaction', () => {
  it('produces a match when a hiddenTruth and a gardener-interdiction faction are both present', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_GARDENER_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-warden',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: SYNTHETIC_GARDENER_FACTION_NAME, confidence: 'derived' },
          domains: ['gardener-interdiction', 'compliance'],
        }),
        makeFact({
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'records of the original colonists are missing', confidence: 'inferred' },
        }),
      ],
    })
    const matches = hidesFromHiddenTruthGardenerRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('faction-warden')
    expect(matches[0].groundingFactIds).toContain('f-hidden-1')
    expect(matches[0].groundingFactIds).toContain('f-fac-warden')

    const edge = hidesFromHiddenTruthGardenerRule.build(
      matches[0],
      hidesFromHiddenTruthGardenerRule,
      ctx,
    )
    expect(edge!.type).toBe('HIDES_FROM')
    expect(edge!.visibility).toBe('hidden')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('HIDES_FROM:hiddenTruth-from-gardenerFaction')
  })

  it('produces no match when a hiddenTruth is present but no gardener-interdiction faction is present (real-data path)', () => {
    expect(nonGardenerFaction).toBeDefined()
    if (!nonGardenerFaction) return
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-real',
          displayName: nonGardenerFaction.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-real',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: nonGardenerFaction.name, confidence: 'derived' },
          domains: [...nonGardenerFaction.domains],
        }),
        makeFact({
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'records of the original colonists are missing', confidence: 'inferred' },
        }),
      ],
    })
    expect(hidesFromHiddenTruthGardenerRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when a gardener faction is present but no hiddenTruth fact exists', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_GARDENER_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-warden',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: SYNTHETIC_GARDENER_FACTION_NAME, confidence: 'derived' },
          domains: ['gardener-interdiction', 'compliance'],
        }),
      ],
    })
    expect(hidesFromHiddenTruthGardenerRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-b', displayName: 'B', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'A', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_GARDENER_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-warden',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: SYNTHETIC_GARDENER_FACTION_NAME, confidence: 'derived' },
          domains: ['gardener-interdiction', 'compliance'],
        }),
        makeFact({
          id: 'f-hidden-b',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          value: { value: 'a buried truth', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-hidden-a',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          value: { value: 'another buried truth', confidence: 'inferred' },
        }),
      ],
    })
    const matches = hidesFromHiddenTruthGardenerRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].subject.id).toBe('settlement-a')
    expect(matches[1].subject.id).toBe('settlement-b')
  })
})

describe('HIDES_FROM:aiSituation-from-authority', () => {
  it('produces a match when an aiSituation contains a hiding keyword and a unique controlling faction is identifiable', () => {
    expect(singleDomainFaction).toBeDefined()
    if (!singleDomainFaction) return
    const uniqueDomain = uniqueDomainFor(singleDomainFaction)

    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-a',
          displayName: singleDomainFaction.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: singleDomainFaction.name, confidence: 'derived' },
          domains: [...singleDomainFaction.domains],
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: `office of ${uniqueDomain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ai-1',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'an unregistered cogitator runs the life-support stack', confidence: 'inferred' },
        }),
      ],
    })
    const matches = hidesFromAiSituationAuthorityRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('faction-a')
    expect(matches[0].groundingFactIds).toContain('f-ai-1')
    expect(matches[0].groundingFactIds).toContain('f-fac-a')

    const edge = hidesFromAiSituationAuthorityRule.build(
      matches[0],
      hidesFromAiSituationAuthorityRule,
      ctx,
    )
    expect(edge!.type).toBe('HIDES_FROM')
    expect(edge!.visibility).toBe('hidden')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('HIDES_FROM:aiSituation-from-authority')
  })

  it('produces no match when the aiSituation lacks a hiding keyword', () => {
    expect(singleDomainFaction).toBeDefined()
    if (!singleDomainFaction) return
    const uniqueDomain = uniqueDomainFor(singleDomainFaction)

    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-a',
          displayName: singleDomainFaction.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: singleDomainFaction.name, confidence: 'derived' },
          domains: [...singleDomainFaction.domains],
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: `office of ${uniqueDomain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ai-1',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'a fully audited expert system manages crops', confidence: 'inferred' },
        }),
      ],
    })
    expect(hidesFromAiSituationAuthorityRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no unique controlling faction is identifiable', () => {
    const sharedDomain = (() => {
      for (let i = 0; i < realOnlyFactions.length; i++) {
        for (let j = i + 1; j < realOnlyFactions.length; j++) {
          const a = realOnlyFactions[i]
          const b = realOnlyFactions[j]
          const overlap = a.domains.find(d => b.domains.includes(d))
          if (overlap) return { a, b, domain: overlap }
        }
      }
      return null
    })()
    expect(sharedDomain).toBeDefined()
    if (!sharedDomain) return

    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-a',
          displayName: sharedDomain.a.name,
          layer: 'human',
        },
        {
          kind: 'namedFaction',
          id: 'faction-b',
          displayName: sharedDomain.b.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: `office of ${sharedDomain.domain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ai-1',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'an illegal cogitator runs the dome', confidence: 'inferred' },
        }),
      ],
    })
    expect(hidesFromAiSituationAuthorityRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    expect(singleDomainFaction).toBeDefined()
    if (!singleDomainFaction) return
    const uniqueDomain = uniqueDomainFor(singleDomainFaction)

    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-b', displayName: 'B', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'A', layer: 'human' },
        {
          kind: 'namedFaction',
          id: 'faction-a',
          displayName: singleDomainFaction.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-a',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: singleDomainFaction.name, confidence: 'derived' },
          domains: [...singleDomainFaction.domains],
        }),
        makeFact({
          id: 'f-auth-b',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          domains: [],
          value: { value: `office of ${uniqueDomain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-a',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          domains: [],
          value: { value: `office of ${uniqueDomain} oversight`, confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ai-b',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          value: { value: 'an unrecorded daemon haunts the grid', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-ai-a',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          value: { value: 'a sealed cogitator core', confidence: 'inferred' },
        }),
      ],
    })
    const matches = hidesFromAiSituationAuthorityRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].subject.id).toBe('settlement-a')
    expect(matches[1].subject.id).toBe('settlement-b')
  })
})

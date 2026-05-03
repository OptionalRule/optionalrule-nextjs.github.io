import { describe, expect, it, vi } from 'vitest'

const SYNTHETIC_INTERDICTION_FACTION_NAME = 'Synthetic Gardener Warden'

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
  suppressesGardenerInterdictionRule,
  suppressesAuthorityHiddenTruthRule,
} from '../rules/suppressesRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

const realOnlyFactions = realFactions.filter(
  f => f.name !== SYNTHETIC_INTERDICTION_FACTION_NAME,
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
    rng: overrides.rng ?? createSeededRng('suppresses-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('SUPPRESSES:gardener-interdiction-target', () => {
  it('produces a match when an interdiction faction and an interdiction-keyword fact are both present', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'Sealed Bleed', layer: 'gu' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_INTERDICTION_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-warden',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: SYNTHETIC_INTERDICTION_FACTION_NAME, confidence: 'derived' },
          domains: ['gardener-interdiction', 'compliance'],
        }),
        makeFact({
          id: 'f-phen-1',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-1',
          value: { value: 'sealed exclusion bleed under gardener interdiction', confidence: 'gu-layer' },
        }),
      ],
    })
    const matches = suppressesGardenerInterdictionRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('faction-warden')
    expect(matches[0].object.id).toBe('phen-1')
    expect(matches[0].groundingFactIds).toContain('f-phen-1')
    expect(matches[0].groundingFactIds).toContain('f-fac-warden')

    const edge = suppressesGardenerInterdictionRule.build(
      matches[0],
      suppressesGardenerInterdictionRule,
      ctx,
    )
    expect(edge!.type).toBe('SUPPRESSES')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('SUPPRESSES:gardener-interdiction-target')
  })

  it('produces no match when interdiction faction is present but no fact text contains an interdiction keyword', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'Bland Bleed', layer: 'gu' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_INTERDICTION_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-phen-1',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-1',
          value: { value: 'a placid magnetic phenomenon with no flags', confidence: 'gu-layer' },
        }),
      ],
    })
    expect(suppressesGardenerInterdictionRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no interdiction faction is present (real-data path)', () => {
    const realFaction = realOnlyFactions[0]
    const ctx = makeCtx({
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'Sealed Bleed', layer: 'gu' },
        {
          kind: 'namedFaction',
          id: 'faction-real',
          displayName: realFaction.name,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-phen-1',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-1',
          value: { value: 'sealed exclusion bleed under gardener interdiction', confidence: 'gu-layer' },
        }),
      ],
    })
    expect(suppressesGardenerInterdictionRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'phenomenon', id: 'phen-b', displayName: 'B', layer: 'gu' },
        { kind: 'phenomenon', id: 'phen-a', displayName: 'A', layer: 'gu' },
        {
          kind: 'namedFaction',
          id: 'faction-warden',
          displayName: SYNTHETIC_INTERDICTION_FACTION_NAME,
          layer: 'human',
        },
      ],
      facts: [
        makeFact({
          id: 'f-fac-warden',
          kind: 'namedFaction',
          subjectType: 'faction',
          value: { value: SYNTHETIC_INTERDICTION_FACTION_NAME, confidence: 'derived' },
          domains: ['gardener-interdiction', 'compliance'],
        }),
        makeFact({
          id: 'f-phen-b',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-b',
          value: { value: 'sealed bleed', confidence: 'gu-layer' },
        }),
        makeFact({
          id: 'f-phen-a',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-a',
          value: { value: 'gardener exclusion', confidence: 'gu-layer' },
        }),
      ],
    })
    const matches = suppressesGardenerInterdictionRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].object.id).toBe('phen-a')
    expect(matches[1].object.id).toBe('phen-b')
  })
})

describe('SUPPRESSES:authority-over-hiddenTruth', () => {
  it('produces a match when a unique controlling faction and a hiddenTruth fact are both present', () => {
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
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'records of the original colonists are missing', confidence: 'inferred' },
        }),
      ],
    })
    const matches = suppressesAuthorityHiddenTruthRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('faction-a')
    expect(matches[0].object.id).toBe('settlement-1')
    expect(matches[0].groundingFactIds).toContain('f-hidden-1')
    expect(matches[0].groundingFactIds).toContain('f-auth-1')

    const edge = suppressesAuthorityHiddenTruthRule.build(
      matches[0],
      suppressesAuthorityHiddenTruthRule,
      ctx,
    )
    expect(edge!.type).toBe('SUPPRESSES')
    expect(edge!.visibility).toBe('hidden')
    expect(edge!.confidence).toBe('inferred')
    expect(edge!.weight).toBe(0.55)
    expect(edge!.id).toContain('SUPPRESSES:authority-over-hiddenTruth')
  })

  it('produces no match when multiple factions match the authority text (no unique controller)', () => {
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
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'a buried scandal', confidence: 'inferred' },
        }),
      ],
    })
    expect(suppressesAuthorityHiddenTruthRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no settlement.hiddenTruth fact exists', () => {
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
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: [],
          value: { value: `office of ${uniqueDomain} oversight`, confidence: 'derived' },
        }),
      ],
    })
    expect(suppressesAuthorityHiddenTruthRule.match(ctx)).toHaveLength(0)
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
          id: 'f-hidden-b',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          value: { value: 'a buried scandal', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-hidden-a',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          value: { value: 'another buried scandal', confidence: 'inferred' },
        }),
      ],
    })
    const matches = suppressesAuthorityHiddenTruthRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].object.id).toBe('settlement-a')
    expect(matches[1].object.id).toBe('settlement-b')
  })
})

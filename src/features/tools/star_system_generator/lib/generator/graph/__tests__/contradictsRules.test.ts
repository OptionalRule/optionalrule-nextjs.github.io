import { describe, expect, it } from 'vitest'
import { namedFactions as realFactions, type NamedFaction } from '../../data/narrative'
import {
  contradictsRuinHookAuthorityRule,
  contradictsHiddenPublicRule,
} from '../rules/contradictsRules'
import { concretizeDomain } from '../rules/settingPatterns'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

const singleDomainFaction = realFactions.find(f => {
  const otherDomains = new Set<string>()
  for (const other of realFactions) {
    if (other.id === f.id) continue
    for (const d of other.domains) otherDomains.add(d)
  }
  return f.domains.some(d => !otherDomains.has(d))
})

function uniqueDomainFor(faction: NamedFaction): string {
  const others = new Set<string>()
  for (const other of realFactions) {
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
    bodies: [],
    settlements: [],
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
    rng: overrides.rng ?? createSeededRng('contradicts-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

const SYSTEM_ENTITY: EntityRef = {
  kind: 'system',
  id: 'system',
  displayName: 'Test System',
  layer: 'physical',
}

describe('CONTRADICTS:ruinHook-vs-settlementAuthority', () => {
  it('produces a match when ruin and settlement share a body and share a domain', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [
          { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          domains: ['archive'],
          value: { value: 'a buried archive of original logs', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'official archive committee', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsRuinHookAuthorityRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('ruin-1')
    expect(matches[0].object.id).toBe('settlement-1')
    expect(matches[0].groundingFactIds).toContain('f-ruin-hook-1')
    expect(matches[0].groundingFactIds).toContain('f-auth-1')
    expect(matches[0].qualifier).toBe(concretizeDomain('archive'))

    const edge = contradictsRuinHookAuthorityRule.build(
      matches[0],
      contradictsRuinHookAuthorityRule,
      ctx,
    )
    expect(edge!.type).toBe('CONTRADICTS')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.weight).toBe(0.45)
    expect(edge!.id).toContain('CONTRADICTS:ruinHook-vs-settlementAuthority')
  })

  it('produces a match when no shared domain but a contradiction keyword is present', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [
          { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          domains: ['archaeology'],
          value: { value: 'logs were falsified before sealing', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['governance'],
          value: { value: 'civic council', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsRuinHookAuthorityRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('ruin-1')
    expect(matches[0].object.id).toBe('settlement-1')
  })

  it('does not match when ruin and settlement are on different bodies', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [
          { id: 'body-1', name: { value: 'Body One' } },
          { id: 'body-2', name: { value: 'Body Two' } },
        ],
        settlements: [
          { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-2' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'body', id: 'body-2', displayName: 'Body Two', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          domains: ['archive'],
          value: { value: 'a buried archive', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'official archive committee', confidence: 'derived' },
        }),
      ],
    })
    expect(contradictsRuinHookAuthorityRule.match(ctx)).toHaveLength(0)
  })

  it('does not match when same body but no shared domain and no contradiction keyword', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [
          { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          domains: ['archaeology'],
          value: { value: 'a quiet ruin without controversy', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-1',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['governance'],
          value: { value: 'civic council', confidence: 'derived' },
        }),
      ],
    })
    expect(contradictsRuinHookAuthorityRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [
          { id: 'settlement-b', name: { value: 'B Hold' }, bodyId: 'body-1' },
          { id: 'settlement-a', name: { value: 'A Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-b', displayName: 'B Hold', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'A Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          domains: ['archive'],
          value: { value: 'a buried archive', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-b',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          domains: ['archive'],
          value: { value: 'archive court', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-auth-a',
          kind: 'settlement.authority',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          domains: ['archive'],
          value: { value: 'archive court', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsRuinHookAuthorityRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].object.id).toBe('settlement-a')
    expect(matches[1].object.id).toBe('settlement-b')
  })
})

describe('CONTRADICTS:hiddenTruth-vs-publicSurface', () => {
  it('produces a match when hidden-truth and tag-hook share a domain on the same settlement', () => {
    expect(singleDomainFaction).toBeDefined()
    if (!singleDomainFaction) return
    const uniqueDomain = uniqueDomainFor(singleDomainFaction)

    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
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
          domains: ['archive'],
          value: { value: 'records of the original colonists are missing', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-tag-1',
          kind: 'settlement.tagHook',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'public archive open to all', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsHiddenPublicRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('faction-a')
    expect(matches[0].qualifier).toBe(concretizeDomain('archive'))
    expect(matches[0].groundingFactIds).toContain('f-hidden-1')
    expect(matches[0].groundingFactIds).toContain('f-tag-1')

    const edge = contradictsHiddenPublicRule.build(
      matches[0],
      contradictsHiddenPublicRule,
      ctx,
    )
    expect(edge!.type).toBe('CONTRADICTS')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('CONTRADICTS:hiddenTruth-vs-publicSurface')
  })

  it('does not match when hidden-truth and tag-hook share no domain', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'a buried scandal', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-tag-1',
          kind: 'settlement.tagHook',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['trade'],
          value: { value: 'busy market hub', confidence: 'derived' },
        }),
      ],
    })
    expect(contradictsHiddenPublicRule.match(ctx)).toHaveLength(0)
  })

  it('falls back to system entity as object when no controlling faction is identifiable', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-hidden-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'records of the original colonists are missing', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-tag-1',
          kind: 'settlement.tagHook',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          domains: ['archive'],
          value: { value: 'public archive open to all', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsHiddenPublicRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('system')

    const edge = contradictsHiddenPublicRule.build(
      matches[0],
      contradictsHiddenPublicRule,
      ctx,
    )
    expect(edge!.type).toBe('CONTRADICTS')
    expect(edge!.visibility).toBe('contested')
    expect(edge!.weight).toBe(0.5)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'settlement', id: 'settlement-b', displayName: 'B Hold', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'A Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-hidden-b',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          domains: ['archive'],
          value: { value: 'a buried scandal', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-tag-b',
          kind: 'settlement.tagHook',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          domains: ['archive'],
          value: { value: 'public archive', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-hidden-a',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          domains: ['archive'],
          value: { value: 'another buried scandal', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-tag-a',
          kind: 'settlement.tagHook',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          domains: ['archive'],
          value: { value: 'public archive', confidence: 'derived' },
        }),
      ],
    })
    const matches = contradictsHiddenPublicRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].subject.id).toBe('settlement-a')
    expect(matches[1].subject.id).toBe('settlement-b')
    expect(matches[0].groundingFactIds).toContain('f-hidden-a')
    expect(matches[0].groundingFactIds).toContain('f-tag-a')
  })
})

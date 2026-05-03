import { describe, expect, it } from 'vitest'
import { hostsBodySettlementRule, hostsBodyRuinRule } from '../rules/hostsRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

function makeCtx(overrides: Partial<BuildCtx> = {}): BuildCtx {
  const input: EntityInventoryInput = overrides.input ?? {
    systemName: 'Test System',
    primary: { spectralType: { value: 'G2V' } },
    companions: [],
    bodies: [
      { id: 'body-1', name: { value: 'Test Body' } },
    ],
    settlements: [
      { id: 'settlement-1', name: { value: 'Test Settlement' }, bodyId: 'body-1' },
    ],
    guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
    phenomena: [],
    ruins: [],
    narrativeFacts: [],
  }
  const entities: EntityRef[] = overrides.entities ?? [
    { kind: 'body', id: 'body-1', displayName: 'Test Body', layer: 'physical' },
    { kind: 'settlement', id: 'settlement-1', displayName: 'Test Settlement', layer: 'human' },
  ]
  const facts: NarrativeFact[] = overrides.facts ?? []
  const indexes = buildFactIndexes(facts)
  return {
    facts,
    entities,
    input,
    rng: overrides.rng ?? createSeededRng('hosts-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('HOSTS:body-settlement', () => {
  it('produces a HOSTS edge for each settlement with a bodyId', () => {
    const ctx = makeCtx()
    const matches = hostsBodySettlementRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('body-1')
    expect(matches[0].object.id).toBe('settlement-1')
  })

  it('produces no matches when bodyId is missing', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'S' } }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(hostsBodySettlementRule.match(ctx)).toHaveLength(0)
  })

  it('produces no matches when bodyId points to a body not in the inventory', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [],
        settlements: [{ id: 'settlement-1', name: { value: 'S' }, bodyId: 'missing' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'S', layer: 'human' },
      ],
    })
    expect(hostsBodySettlementRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete RelationshipEdge', () => {
    const ctx = makeCtx()
    const [match] = hostsBodySettlementRule.match(ctx)
    const edge = hostsBodySettlementRule.build(match, hostsBodySettlementRule, ctx)
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('HOSTS')
    expect(edge!.era).toBe('present')
    expect(edge!.subject.kind).toBe('body')
    expect(edge!.object.kind).toBe('settlement')
    expect(edge!.id).toContain('HOSTS:body-settlement')
  })
})

describe('HOSTS:body-ruin', () => {
  it('produces a HOSTS edge when a ruin\'s location matches a body name', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-b' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [{ id: 'ruin-1', remnantType: { value: 'Colony shell' }, location: { value: 'Nosaxa IV-b' } }],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Nosaxa IV-b', layer: 'physical' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Colony shell', layer: 'human' },
      ],
    })
    const matches = hostsBodyRuinRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('body-1')
    expect(matches[0].object.id).toBe('ruin-1')
  })

  it('produces no matches when location does not name any body', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-b' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [{ id: 'ruin-1', remnantType: { value: 'Colony shell' }, location: { value: 'Lagrange L1' } }],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Nosaxa IV-b', layer: 'physical' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'Colony shell', layer: 'human' },
      ],
    })
    expect(hostsBodyRuinRule.match(ctx)).toHaveLength(0)
  })

  it('handles ruins with no location field', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [{ id: 'ruin-1', remnantType: { value: 'X' } }],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'B', layer: 'physical' },
        { kind: 'ruin', id: 'ruin-1', displayName: 'X', layer: 'human' },
      ],
    })
    expect(hostsBodyRuinRule.match(ctx)).toHaveLength(0)
  })
})

import { describe, expect, it } from 'vitest'
import {
  dependsOnViaFunctionRule,
  dependsOnViaCrisisRule,
  dependsOnViaPresenceRule,
} from '../rules/dependsOnRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

function makeFact(overrides: Partial<NarrativeFact> = {}): NarrativeFact {
  return {
    id: overrides.id ?? 'f1',
    kind: overrides.kind ?? 'settlement.function',
    domains: overrides.domains ?? ['settlement'],
    subjectType: overrides.subjectType ?? 'settlement',
    subjectId: overrides.subjectId ?? 'settlement-1',
    value: overrides.value ?? { value: 'Chiral harvesting site', confidence: 'derived' },
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
    guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'storms' } },
    phenomena: [],
    ruins: [],
    narrativeFacts: [],
  }
  const entities: EntityRef[] = overrides.entities ?? [
    { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
    { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' },
  ]
  const facts: NarrativeFact[] = overrides.facts ?? []
  const indexes = buildFactIndexes(facts)
  return {
    facts,
    entities,
    input,
    rng: overrides.rng ?? createSeededRng('depends-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('DEPENDS_ON:settlement-guResource-via-function', () => {
  it('produces a match when settlement.function and gu.resource share a resource keyword', () => {
    const ctx = makeCtx({
      facts: [
        makeFact({
          id: 'f-fn-1',
          kind: 'settlement.function',
          subjectId: 'settlement-1',
          value: { value: 'Chiral harvesting site', confidence: 'derived' },
        }),
      ],
    })
    const matches = dependsOnViaFunctionRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('gu-resource')
    expect(matches[0].groundingFactIds).toEqual(['f-fn-1'])
  })

  it('produces no match when function text contains no resource keyword', () => {
    const ctx = makeCtx({
      facts: [
        makeFact({
          id: 'f-fn-1',
          kind: 'settlement.function',
          subjectId: 'settlement-1',
          value: { value: 'Mining outpost', confidence: 'derived' },
        }),
      ],
    })
    expect(dependsOnViaFunctionRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when function keyword does not appear in gu.resource text', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'water reservoir' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'guResource', id: 'gu-resource', displayName: 'water reservoir', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-fn-1',
          kind: 'settlement.function',
          subjectId: 'settlement-1',
          value: { value: 'Chiral harvesting site', confidence: 'derived' },
        }),
      ],
    })
    expect(dependsOnViaFunctionRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete RelationshipEdge with derived confidence and public visibility', () => {
    const ctx = makeCtx({
      facts: [
        makeFact({
          id: 'f-fn-1',
          kind: 'settlement.function',
          subjectId: 'settlement-1',
          value: { value: 'Chiral harvesting site', confidence: 'derived' },
        }),
      ],
    })
    const [match] = dependsOnViaFunctionRule.match(ctx)
    const edge = dependsOnViaFunctionRule.build(match, dependsOnViaFunctionRule, ctx)
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DEPENDS_ON')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('DEPENDS_ON:settlement-guResource-via-function')
  })
})

describe('DEPENDS_ON:settlement-guResource-via-crisis', () => {
  it('produces a match with confidence "inferred" when crisis text and gu.resource share a dependency keyword', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'water reservoir' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'guResource', id: 'gu-resource', displayName: 'water reservoir', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'water rationing imposed by authority', confidence: 'inferred' },
        }),
      ],
    })
    const matches = dependsOnViaCrisisRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].confidence).toBe('inferred')
    expect(matches[0].groundingFactIds).toEqual(['f-cr-1'])

    const edge = dependsOnViaCrisisRule.build(matches[0], dependsOnViaCrisisRule, ctx)
    expect(edge!.visibility).toBe('contested')
    expect(edge!.confidence).toBe('inferred')
    expect(edge!.weight).toBe(0.45)
  })

  it('produces no match when crisis text matches no dependency keyword', () => {
    const ctx = makeCtx({
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Population unrest in the corridors', confidence: 'inferred' },
        }),
      ],
    })
    expect(dependsOnViaCrisisRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when crisis keyword is not present in gu.resource text', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'plasma sheath' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'guResource', id: 'gu-resource', displayName: 'plasma sheath', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'water rationing imposed by authority', confidence: 'inferred' },
        }),
      ],
    })
    expect(dependsOnViaCrisisRule.match(ctx)).toHaveLength(0)
  })
})

describe('DEPENDS_ON:settlement-guResource-via-presence', () => {
  it('produces a match when settlement.presence.guValue >= 2', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { guValue: { value: 3 } },
          },
        ],
        guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
      facts: [
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectId: 'settlement-1',
          value: { value: 'Equatorial belt', confidence: 'derived' },
        }),
      ],
    })
    const matches = dependsOnViaPresenceRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].confidence).toBe('gu-layer')
    expect(matches[0].groundingFactIds).toEqual(['f-loc-1'])

    const edge = dependsOnViaPresenceRule.build(matches[0], dependsOnViaPresenceRule, ctx)
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('gu-layer')
    expect(edge!.weight).toBe(0.55)
  })

  it('produces no match when guValue is below 2', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { guValue: { value: 1 } },
          },
        ],
        guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(dependsOnViaPresenceRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when settlement has no presence field', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(dependsOnViaPresenceRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when there is no gu resource entity', () => {
    const ctx = makeCtx({
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { guValue: { value: 3 } },
          },
        ],
        guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'h' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(dependsOnViaPresenceRule.match(ctx)).toHaveLength(0)
  })
})

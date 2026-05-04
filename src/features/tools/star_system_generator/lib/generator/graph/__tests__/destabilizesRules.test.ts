import { describe, expect, it } from 'vitest'
import {
  destabilizesPhenomenonSettlementRule,
  destabilizesGuHazardSettlementRule,
  destabilizesPhenomenonSettlementBodyRule,
  destabilizesPhenomenonRouteAssetBodyRule,
  destabilizesPhenomenonPhysicsFactionRule,
} from '../rules/destabilizesRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

function makeFact(overrides: Partial<NarrativeFact> = {}): NarrativeFact {
  return {
    id: overrides.id ?? 'f1',
    kind: overrides.kind ?? 'settlement.crisis',
    domains: overrides.domains ?? ['settlement'],
    subjectType: overrides.subjectType ?? 'settlement',
    subjectId: overrides.subjectId ?? 'settlement-1',
    value: overrides.value ?? { value: 'Bleed node changed course', confidence: 'inferred' },
    tags: overrides.tags ?? [],
    status: overrides.status ?? 'inferred',
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
    guOverlay: { resource: { value: 'chiral ice belt' }, hazard: { value: 'flare storms' } },
    phenomena: [],
    ruins: [],
    narrativeFacts: [],
  }
  const entities: EntityRef[] = overrides.entities ?? [
    { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
    { kind: 'guHazard', id: 'gu-hazard', displayName: 'flare storms', layer: 'gu' },
  ]
  const facts: NarrativeFact[] = overrides.facts ?? []
  const indexes = buildFactIndexes(facts)
  return {
    facts,
    entities,
    input,
    rng: overrides.rng ?? createSeededRng('destabilizes-test'),
    ...indexes,
    entitiesById: new Map(entities.map(e => [e.id, e])),
  }
}

describe('DESTABILIZES:phenomenon-settlement-via-guLayer', () => {
  it('produces a match when a gu-layer phenomenon and crisis text share a destabilize keyword', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          {
            id: 'phen-1',
            phenomenon: { value: 'flare-amplified bleed season' },
            confidence: 'gu-layer',
          },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'flare-amplified bleed season', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Bleed node changed course', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-phen-1',
          kind: 'phenomenon',
          subjectType: 'phenomenon',
          subjectId: 'phen-1',
          value: { value: 'flare-amplified bleed season', confidence: 'gu-layer' },
        }),
      ],
    })
    const matches = destabilizesPhenomenonSettlementRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('phen-1')
    expect(matches[0].object.id).toBe('settlement-1')
    expect(matches[0].qualifier).toBe('bleed')
    expect(matches[0].confidence).toBe('gu-layer')
    expect(matches[0].groundingFactIds).toEqual(['f-phen-1', 'f-cr-1'])
  })

  it('produces no match when phenomenon confidence is not gu-layer', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          {
            id: 'phen-1',
            phenomenon: { value: 'flare-amplified bleed season' },
            confidence: 'human-layer',
          },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'flare-amplified bleed season', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Bleed node changed course', confidence: 'inferred' },
        }),
      ],
    })
    expect(destabilizesPhenomenonSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when keyword is in phenomenon but not in crisis text', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          {
            id: 'phen-1',
            phenomenon: { value: 'flare-amplified bleed season' },
            confidence: 'gu-layer',
          },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'flare-amplified bleed season', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Population unrest in the corridors', confidence: 'inferred' },
        }),
      ],
    })
    expect(destabilizesPhenomenonSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when crisis text matches but no phenomena have gu-layer confidence', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Bleed node changed course', confidence: 'inferred' },
        }),
      ],
    })
    expect(destabilizesPhenomenonSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('does not match on substring-only keyword overlap (e.g., "metric" inside "asymmetric")', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' } }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          { id: 'phenomenon-1', phenomenon: { value: 'metric drift' }, confidence: 'gu-layer' },
        ],
        ruins: [],
        narrativeFacts: [],
      },
      entities: [
        { kind: 'phenomenon', id: 'phenomenon-1', displayName: 'metric drift', layer: 'gu' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({ id: 'f1', kind: 'settlement.crisis', subjectType: 'settlement', subjectId: 'settlement-1', value: { value: 'asymmetric thrust failure', confidence: 'derived' } }),
      ],
    })
    expect(destabilizesPhenomenonSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete edge with public visibility and gu-layer confidence', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          {
            id: 'phen-1',
            phenomenon: { value: 'flare-amplified bleed season' },
            confidence: 'gu-layer',
          },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'flare-amplified bleed season', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-cr-1',
          kind: 'settlement.crisis',
          subjectId: 'settlement-1',
          value: { value: 'Bleed node changed course', confidence: 'inferred' },
        }),
      ],
    })
    const [match] = destabilizesPhenomenonSettlementRule.match(ctx)
    const edge = destabilizesPhenomenonSettlementRule.build(
      match,
      destabilizesPhenomenonSettlementRule,
      ctx,
    )
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DESTABILIZES')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('gu-layer')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.qualifier).toBe('bleed')
    expect(edge!.id).toContain('DESTABILIZES:phenomenon-settlement-via-guLayer')
  })
})

describe('DESTABILIZES:guHazard-settlement-via-hazardScore', () => {
  it('produces a match when settlement.presence.hazard.value >= 2', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { hazard: { value: 3 } },
          },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'flare storms' } },
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
    const matches = destabilizesGuHazardSettlementRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('gu-hazard')
    expect(matches[0].object.id).toBe('settlement-1')
    expect(matches[0].confidence).toBe('gu-layer')
    expect(matches[0].groundingFactIds).toEqual(['f-loc-1'])
  })

  it('produces no match when hazard score is below 2', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { hazard: { value: 1 } },
          },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'flare storms' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(destabilizesGuHazardSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when settlement has no presence field', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'flare storms' } },
        phenomena: [], ruins: [], narrativeFacts: [],
      },
    })
    expect(destabilizesGuHazardSettlementRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete edge with gu-layer confidence and guHazard subject', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'B' } }],
        settlements: [
          {
            id: 'settlement-1',
            name: { value: 'Hold' },
            bodyId: 'body-1',
            presence: { hazard: { value: 3 } },
          },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'flare storms' } },
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
    const [match] = destabilizesGuHazardSettlementRule.match(ctx)
    const edge = destabilizesGuHazardSettlementRule.build(
      match,
      destabilizesGuHazardSettlementRule,
      ctx,
    )
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DESTABILIZES')
    expect(edge!.subject.kind).toBe('guHazard')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('gu-layer')
    expect(edge!.weight).toBe(0.55)
    expect(edge!.id).toContain('DESTABILIZES:guHazard-settlement-via-hazardScore')
  })
})

describe('DESTABILIZES:phenomenon-settlement-body', () => {
  it('produces a match for each phenomenon × body-with-settlement pair', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [
          { id: 'body-1', name: { value: 'Body One' } },
          { id: 'body-2', name: { value: 'Body Two' } },
        ],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          { id: 'phen-1', phenomenon: { value: 'Bonn-Tycho aurora' }, confidence: 'inferred' },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'body', id: 'body-2', displayName: 'Body Two', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'Bonn-Tycho aurora', layer: 'gu' },
      ],
      facts: [],
    })
    const matches = destabilizesPhenomenonSettlementBodyRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('phen-1')
    expect(matches[0].object.id).toBe('body-1')
  })

  it('produces no match when no settlements have bodies', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' } }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [
          { id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' },
        ],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
      ],
      facts: [],
    })
    expect(destabilizesPhenomenonSettlementBodyRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete edge with phenomenon subject and body object', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'Bonn-Tycho aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'Bonn-Tycho aurora', layer: 'gu' },
      ],
      facts: [],
    })
    const [match] = destabilizesPhenomenonSettlementBodyRule.match(ctx)
    const edge = destabilizesPhenomenonSettlementBodyRule.build(
      match,
      destabilizesPhenomenonSettlementBodyRule,
      ctx,
    )
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DESTABILIZES')
    expect(edge!.subject.kind).toBe('phenomenon')
    expect(edge!.object.kind).toBe('body')
    expect(edge!.weight).toBe(0.6)
    expect(edge!.id).toContain('DESTABILIZES:phenomenon-settlement-body')
  })
})

describe('DESTABILIZES:phenomenon-routeAsset-body', () => {
  it('produces a match for phenomenon × body when settlement.location fact is tagged routeAsset', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectId: 'settlement-1',
          value: { value: 'Equatorial belt', confidence: 'derived' },
          tags: ['routeAsset'],
        }),
      ],
    })
    const matches = destabilizesPhenomenonRouteAssetBodyRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('phen-1')
    expect(matches[0].object.id).toBe('body-1')
    expect(matches[0].qualifier).toBe('route')
  })

  it('produces no match when no facts carry the routeAsset tag', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectId: 'settlement-1',
          value: { value: 'Equatorial belt', confidence: 'derived' },
          tags: [],
        }),
      ],
    })
    expect(destabilizesPhenomenonRouteAssetBodyRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete edge with route qualifier', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [{ id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' }],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
      ],
      facts: [
        makeFact({
          id: 'f-loc-1',
          kind: 'settlement.location',
          subjectId: 'settlement-1',
          value: { value: 'Equatorial belt', confidence: 'derived' },
          tags: ['routeAsset'],
        }),
      ],
    })
    const [match] = destabilizesPhenomenonRouteAssetBodyRule.match(ctx)
    const edge = destabilizesPhenomenonRouteAssetBodyRule.build(
      match,
      destabilizesPhenomenonRouteAssetBodyRule,
      ctx,
    )
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DESTABILIZES')
    expect(edge!.subject.kind).toBe('phenomenon')
    expect(edge!.object.kind).toBe('body')
    expect(edge!.qualifier).toBe('route')
    expect(edge!.weight).toBe(0.55)
    expect(edge!.id).toContain('DESTABILIZES:phenomenon-routeAsset-body')
  })
})

describe('DESTABILIZES:phenomenon-physicsFaction', () => {
  it('produces a match when a faction has an ecology or science domain', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
        { kind: 'namedFaction', id: 'faction-1', displayName: 'Glasshouse Compact', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-1',
          kind: 'namedFaction',
          subjectType: 'system',
          subjectId: 'system',
          value: { value: 'Glasshouse Compact', confidence: 'derived' },
          domains: ['ecology'],
          tags: ['biosafety'],
        }),
      ],
    })
    const matches = destabilizesPhenomenonPhysicsFactionRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('phen-1')
    expect(matches[0].object.id).toBe('faction-1')
    expect(matches[0].qualifier).toBe('ecology')
  })

  it('produces no match when factions exist but none have ecology or science domains', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
        { kind: 'namedFaction', id: 'faction-1', displayName: 'Trade Guild', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-1',
          kind: 'namedFaction',
          subjectType: 'system',
          subjectId: 'system',
          value: { value: 'Trade Guild', confidence: 'derived' },
          domains: ['economy'],
          tags: ['guild'],
        }),
      ],
    })
    expect(destabilizesPhenomenonPhysicsFactionRule.match(ctx)).toHaveLength(0)
  })

  it('build() produces a complete edge with phenomenon subject and namedFaction object', () => {
    const ctx = makeCtx({
      input: {
        systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [{ id: 'phen-1', phenomenon: { value: 'aurora' }, confidence: 'inferred' }],
        ruins: [], narrativeFacts: [],
      },
      entities: [
        { kind: 'phenomenon', id: 'phen-1', displayName: 'aurora', layer: 'gu' },
        { kind: 'namedFaction', id: 'faction-1', displayName: 'Survey Cohort', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-fac-1',
          kind: 'namedFaction',
          subjectType: 'system',
          subjectId: 'system',
          value: { value: 'Survey Cohort', confidence: 'derived' },
          domains: ['science'],
          tags: ['cohort'],
        }),
      ],
    })
    const [match] = destabilizesPhenomenonPhysicsFactionRule.match(ctx)
    const edge = destabilizesPhenomenonPhysicsFactionRule.build(
      match,
      destabilizesPhenomenonPhysicsFactionRule,
      ctx,
    )
    expect(edge).not.toBeNull()
    expect(edge!.type).toBe('DESTABILIZES')
    expect(edge!.subject.kind).toBe('phenomenon')
    expect(edge!.object.kind).toBe('namedFaction')
    expect(edge!.qualifier).toBe('science')
    expect(edge!.weight).toBe(0.5)
    expect(edge!.id).toContain('DESTABILIZES:phenomenon-physicsFaction')
  })
})

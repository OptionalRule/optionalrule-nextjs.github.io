import { describe, expect, it } from 'vitest'
import {
  witnessesAiSituationRuinRule,
  witnessesRuinHookEventRule,
} from '../rules/witnessesRules'
import { buildFactIndexes } from '../rules/ruleTypes'
import type { BuildCtx } from '../rules/ruleTypes'
import type { EntityRef } from '../types'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../../types'

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
    rng: overrides.rng ?? createSeededRng('witnesses-test'),
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

describe('WITNESSES:aiSituation-witnesses-ruin', () => {
  it('produces a match when AI settlement and ruin share a body', () => {
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
          id: 'f-ai-1',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'a watchful caretaker AI presides', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          value: { value: 'sealed door hides what was lost', confidence: 'inferred' },
        }),
      ],
    })
    const matches = witnessesAiSituationRuinRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('settlement-1')
    expect(matches[0].object.id).toBe('ruin-1')
    expect(matches[0].groundingFactIds).toContain('f-ai-1')
    expect(matches[0].groundingFactIds).toContain('f-ruin-hook-1')

    const edge = witnessesAiSituationRuinRule.build(
      matches[0],
      witnessesAiSituationRuinRule,
      ctx,
    )
    expect(edge!.type).toBe('WITNESSES')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.45)
    expect(edge!.id).toContain('WITNESSES:aiSituation-witnesses-ruin')
  })

  it('produces no match when ruin and settlement are on different bodies', () => {
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
          { id: 'settlement-1', name: { value: 'Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-1', remnantType: { value: 'Sealed Vault' }, location: { value: 'Surface of Body Two' } },
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
          id: 'f-ai-1',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'a watchful caretaker AI presides', confidence: 'derived' },
        }),
      ],
    })
    expect(witnessesAiSituationRuinRule.match(ctx)).toHaveLength(0)
  })

  it('produces no match when no AI fact exists', () => {
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
      facts: [],
    })
    expect(witnessesAiSituationRuinRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      input: {
        systemName: 'Test System',
        primary: { spectralType: { value: 'G2V' } },
        companions: [],
        bodies: [{ id: 'body-1', name: { value: 'Body One' } }],
        settlements: [
          { id: 'settlement-b', name: { value: 'B-Hold' }, bodyId: 'body-1' },
          { id: 'settlement-a', name: { value: 'A-Hold' }, bodyId: 'body-1' },
        ],
        guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
        phenomena: [],
        ruins: [
          { id: 'ruin-b', remnantType: { value: 'Vault B' }, location: { value: 'Surface of Body One' } },
          { id: 'ruin-a', remnantType: { value: 'Vault A' }, location: { value: 'Surface of Body One' } },
        ],
        narrativeFacts: [],
      },
      entities: [
        SYSTEM_ENTITY,
        { kind: 'body', id: 'body-1', displayName: 'Body One', layer: 'physical' },
        { kind: 'settlement', id: 'settlement-b', displayName: 'B-Hold', layer: 'human' },
        { kind: 'settlement', id: 'settlement-a', displayName: 'A-Hold', layer: 'human' },
        { kind: 'ruin', id: 'ruin-b', displayName: 'Vault B', layer: 'human' },
        { kind: 'ruin', id: 'ruin-a', displayName: 'Vault A', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ai-b',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-b',
          value: { value: 'caretaker AI', confidence: 'derived' },
        }),
        makeFact({
          id: 'f-ai-a',
          kind: 'settlement.aiSituation',
          subjectType: 'settlement',
          subjectId: 'settlement-a',
          value: { value: 'caretaker AI', confidence: 'derived' },
        }),
      ],
    })
    const matches = witnessesAiSituationRuinRule.match(ctx)
    expect(matches).toHaveLength(4)
    expect(matches[0].subject.id).toBe('settlement-a')
    expect(matches[0].object.id).toBe('ruin-a')
    expect(matches[1].subject.id).toBe('settlement-a')
    expect(matches[1].object.id).toBe('ruin-b')
    expect(matches[2].subject.id).toBe('settlement-b')
    expect(matches[2].object.id).toBe('ruin-a')
    expect(matches[3].subject.id).toBe('settlement-b')
    expect(matches[3].object.id).toBe('ruin-b')
  })
})

describe('WITNESSES:ruinHook-witnesses-historicalEvent', () => {
  it('produces a match when ruin.hook and another fact share a WITNESS_KEYWORDS marker', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          value: { value: 'the first wave records are sealed inside', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-other-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'survivors of the first wave still whisper', confidence: 'inferred' },
        }),
      ],
    })
    const matches = witnessesRuinHookEventRule.match(ctx)
    expect(matches).toHaveLength(1)
    expect(matches[0].subject.id).toBe('ruin-1')
    expect(matches[0].object.id).toBe('system')
    expect(matches[0].qualifier).toBe('first wave')
    expect(matches[0].groundingFactIds).toContain('f-ruin-hook-1')
    expect(matches[0].groundingFactIds).toContain('f-other-1')

    const edge = witnessesRuinHookEventRule.build(
      matches[0],
      witnessesRuinHookEventRule,
      ctx,
    )
    expect(edge!.type).toBe('WITNESSES')
    expect(edge!.visibility).toBe('public')
    expect(edge!.confidence).toBe('derived')
    expect(edge!.weight).toBe(0.4)
    expect(edge!.id).toContain('WITNESSES:ruinHook-witnesses-historicalEvent')
  })

  it('produces no match when only the ruin.hook contains the keyword', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'ruin', id: 'ruin-1', displayName: 'Sealed Vault', layer: 'human' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-1',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-1',
          value: { value: 'the first wave records are sealed inside', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-other-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'a routine inventory dispute', confidence: 'inferred' },
        }),
      ],
    })
    expect(witnessesRuinHookEventRule.match(ctx)).toHaveLength(0)
  })

  it('sorts matches deterministically by subject id then object id', () => {
    const ctx = makeCtx({
      entities: [
        SYSTEM_ENTITY,
        { kind: 'ruin', id: 'ruin-b', displayName: 'Vault B', layer: 'human' },
        { kind: 'ruin', id: 'ruin-a', displayName: 'Vault A', layer: 'human' },
        { kind: 'settlement', id: 'settlement-1', displayName: 'Hold', layer: 'human' },
      ],
      facts: [
        makeFact({
          id: 'f-ruin-hook-b',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-b',
          value: { value: 'before the quarantine this place sang', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-ruin-hook-a',
          kind: 'ruin.hook',
          subjectType: 'ruin',
          subjectId: 'ruin-a',
          value: { value: 'before the quarantine this hall stood', confidence: 'inferred' },
        }),
        makeFact({
          id: 'f-other-1',
          kind: 'settlement.hiddenTruth',
          subjectType: 'settlement',
          subjectId: 'settlement-1',
          value: { value: 'logs from before the quarantine survive', confidence: 'inferred' },
        }),
      ],
    })
    const matches = witnessesRuinHookEventRule.match(ctx)
    expect(matches).toHaveLength(2)
    expect(matches[0].subject.id).toBe('ruin-a')
    expect(matches[1].subject.id).toBe('ruin-b')
  })
})

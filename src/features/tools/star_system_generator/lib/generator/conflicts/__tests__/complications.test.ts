import { describe, expect, it } from 'vitest'
import { bindComplication } from '../complications'
import type { ConflictParty } from '../types'
import type { SeededRng } from '../../rng'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'
import type { Settlement } from '../../../types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlementRef: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const phenomenonRef: EntityRef = { kind: 'phenomenon', id: 'phen-1', displayName: 'Moving bleed-node river', layer: 'gu' }

function edge(partial: Partial<RelationshipEdge> & Pick<RelationshipEdge, 'id' | 'type' | 'subject' | 'object'>): RelationshipEdge {
  return {
    visibility: 'public', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
    ...partial,
  }
}

function graph(entities: EntityRef[], edges: RelationshipEdge[]): SystemRelationshipGraph {
  const edgesByEntity: Record<string, string[]> = {}
  for (const e of edges) {
    for (const ref of [e.subject, e.object]) {
      edgesByEntity[ref.id] = edgesByEntity[ref.id] ?? []
      edgesByEntity[ref.id].push(e.id)
    }
  }
  const edgesByType = Object.fromEntries(EDGE_TYPES.map(t => [t, edges.filter(e => e.type === t).map(e => e.id)])) as SystemRelationshipGraph['edgesByType']
  return {
    entities, edges, edgesByEntity, edgesByType,
    spineEdgeIds: [], settlementSpineEdgeIds: [], historicalEdgeIds: [],
  }
}

function makeSettlement(id: string, hiddenTruth: string): Settlement {
  const f = (value: string) => ({ value, confidence: 'inferred' as const })
  const n = (value: number) => ({ value, confidence: 'inferred' as const })
  return {
    id,
    name: f('Orison Hold'),
    anchorKind: f('body'), anchorName: f('Body One'), anchorDetail: f(''),
    siteCategory: f('Surface settlement'), location: f('surface'), function: f('Salvage yard'),
    population: { value: 'Hundreds', confidence: 'inferred' },
    habitationPattern: { value: 'Inhabited', confidence: 'inferred' },
    authority: f('Salvage court'), builtForm: f('Dome'), aiSituation: f('None'), condition: f('Stable'),
    tags: [], tagHook: f(''), crisis: f('Ship full of dead arrives'), hiddenTruth: f(hiddenTruth),
    encounterSites: [], whyHere: f(''), methodNotes: [],
    presence: {
      score: n(0), roll: n(0), tier: f('outpost'), resource: n(0), access: n(0),
      strategic: n(0), guValue: n(0), habitability: n(0), hazard: n(0), legalHeat: n(0),
    },
  } as Settlement
}

function stubRng(values: readonly number[]): { rng: SeededRng; calls: () => number } {
  let i = 0
  const next = (): number => {
    const v = values[Math.min(i, values.length - 1)]
    i += 1
    return v
  }
  const rng: SeededRng = {
    seed: 'stub', next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: p => next() < p,
    fork: () => rng,
  }
  return { rng, calls: () => i }
}

const noSkip = 0.9

describe('bindComplication', () => {
  const parties: ConflictParty[] = [
    { ref: factionA, role: 'aggressor', stake: 's' },
    { ref: settlementRef, role: 'defender', stake: 's' },
  ]

  it('returns undefined on the skip branch, drawing chance first', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: settlementRef })
    const g = graph([factionA, settlementRef], [contested])
    const { rng, calls } = stubRng([0.1])
    const result = bindComplication(contested, parties, g, [makeSettlement('set-1', 'The quarantine is political')], rng)
    expect(result).toBeUndefined()
    expect(calls()).toBe(1)
  })

  it('binds a settlement hiddenTruth as a secret with sourceRef', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: settlementRef })
    const g = graph([factionA, settlementRef], [contested])
    const { rng } = stubRng([noSkip])
    const result = bindComplication(contested, parties, g, [makeSettlement('set-1', 'The quarantine is political')], rng)
    expect(result).toMatchObject({ kind: 'secret', text: 'the quarantine is political', sourceRef: settlementRef })
  })

  it('binds a historical consequence as third-party when no settlement party has a secret', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const betrayal = edge({
      id: 'h1', type: 'BETRAYED', subject: factionA, object: factionB,
      era: 'historical', summary: 'The compact broke before the gate cooled.', consequenceEdgeIds: ['e1'],
    })
    const g = graph([factionA, factionB], [contested, betrayal])
    const { rng } = stubRng([noSkip])
    const result = bindComplication(contested, [
      { ref: factionA, role: 'aggressor', stake: 's' },
      { ref: factionB, role: 'defender', stake: 's' },
    ], g, [], rng)
    expect(result).toMatchObject({ kind: 'third-party', text: 'The compact broke before the gate cooled.' })
  })

  it('binds gu-anomaly only when a phenomenon or guHazard participates, else deadline', () => {
    const contestedPlain = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const gPlain = graph([factionA, factionB], [contestedPlain])
    const { rng: rng1 } = stubRng([noSkip, 0.3])
    const plain = bindComplication(contestedPlain, [
      { ref: factionA, role: 'aggressor', stake: 's' },
      { ref: factionB, role: 'defender', stake: 's' },
    ], gPlain, [], rng1)
    expect(plain?.kind).toBe('deadline')

    const contestedGu = edge({ id: 'e2', type: 'DESTABILIZES', subject: phenomenonRef, object: factionB })
    const gGu = graph([phenomenonRef, factionB], [contestedGu])
    const { rng: rng2 } = stubRng([noSkip, 0.3])
    const anomalous = bindComplication(contestedGu, [
      { ref: phenomenonRef, role: 'aggressor', stake: 's' },
      { ref: factionB, role: 'defender', stake: 's' },
    ], gGu, [], rng2)
    expect(anomalous?.kind).toBe('gu-anomaly')
  })
})

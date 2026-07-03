import { describe, expect, it } from 'vitest'
import { CLOSING_POOLS, settlementHookSynthesis } from '../settlementProse'
import { HOOK_REWRITE_POOLS, graphAwareSettlementHook } from '../graphAwareSettlementHook'
import { createSeededRng } from '../../rng'
import type { GeneratorTone, Settlement } from '../../../types'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'

const TONES: readonly GeneratorTone[] = ['balanced', 'cinematic', 'astronomy']

describe('closing pools', () => {
  it('has at least 6 closers per tone, each using the {function} slot', () => {
    for (const tone of TONES) {
      expect(CLOSING_POOLS[tone].length, tone).toBeGreaterThanOrEqual(6)
      for (const closer of CLOSING_POOLS[tone]) {
        expect(closer).toContain('{function}')
      }
    }
  })

  it('has at least 6 rewrite variants per eligible edge type', () => {
    for (const type of ['CONTESTS', 'DEPENDS_ON', 'SUPPRESSES'] as const) {
      expect(HOOK_REWRITE_POOLS[type].length, type).toBeGreaterThanOrEqual(6)
      for (const variant of HOOK_REWRITE_POOLS[type]) {
        expect(variant).toContain('{other}')
      }
    }
  })
})

describe('closer distribution', () => {
  it('no single closer dominates across 30 syntheses', () => {
    const counts = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const hook = settlementHookSynthesis(
        createSeededRng(`closer-${i}`),
        'Air Is Money',
        'Debt Labor',
        {
          habitationPattern: 'Inhabited',
          siteCategory: 'Surface settlement',
          settlementFunction: 'Salvage yard',
          condition: 'Stable',
          crisis: 'Labor strike',
          hiddenTruth: 'The workers are legally trapped',
          encounterSites: ['public ration office'],
          guIntensity: 'Low bleed',
          tone: 'balanced',
        },
      )
      const sentences = hook.split(/(?<=\.)\s+/)
      const closer = sentences[sentences.length - 1]
      counts.set(closer, (counts.get(closer) ?? 0) + 1)
    }
    const max = Math.max(...counts.values())
    expect(max / 30).toBeLessThanOrEqual(0.4)
  })
})

describe('graphAwareSettlementHook rewrite variety', () => {
  const settlementRef: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
  const faction: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
  const resource: EntityRef = { kind: 'guResource', id: 'gu-1', displayName: 'Chiral ice belt', layer: 'gu' }

  function graphWith(edge: RelationshipEdge): SystemRelationshipGraph {
    const edgesByType = Object.fromEntries(EDGE_TYPES.map(t => [t, edge.type === t ? [edge.id] : []])) as SystemRelationshipGraph['edgesByType']
    return {
      entities: [settlementRef, faction, resource],
      edges: [edge],
      edgesByEntity: { [edge.subject.id]: [edge.id], [edge.object.id]: [edge.id] },
      edgesByType,
      spineEdgeIds: [],
      settlementSpineEdgeIds: [edge.id],
      historicalEdgeIds: [],
    }
  }

  const settlement = { id: 'set-1' } as Settlement

  it('varies across rng seeds and binds the other endpoint', () => {
    const edge: RelationshipEdge = {
      id: 'e1', type: 'CONTESTS', subject: faction, object: settlementRef,
      visibility: 'contested', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
    }
    const outputs = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const result = graphAwareSettlementHook(settlement, graphWith(edge), createSeededRng(`hook-${i}`))
      expect(result).not.toBeNull()
      expect(result).toContain('Kestrel Free Compact')
      outputs.add(result as string)
    }
    expect(outputs.size).toBeGreaterThanOrEqual(3)
  })

  it('articleizes noun-phrase endpoints like gu resources', () => {
    const edge: RelationshipEdge = {
      id: 'e2', type: 'DEPENDS_ON', subject: settlementRef, object: resource,
      visibility: 'public', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
    }
    const result = graphAwareSettlementHook(settlement, graphWith(edge), createSeededRng('article'))
    expect(result).not.toBeNull()
    expect(result).toMatch(/the chiral ice belt/)
    expect(result).not.toMatch(/[a-z] Chiral ice belt/)
  })
})

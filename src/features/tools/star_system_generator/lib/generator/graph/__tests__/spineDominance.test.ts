import { describe, expect, it } from 'vitest'
import { scoreCandidates, selectEdges } from '../score'
import type { EntityRef, RelationshipEdge } from '../types'
import { balancedBank } from '../../factions/banks/balancedBank'
import { generateSystem } from '../../index'
import type { GenerationOptions } from '../../../types'

function makeEdge(overrides: Partial<RelationshipEdge> & Pick<RelationshipEdge, 'subject' | 'object'>): RelationshipEdge {
  return {
    id: overrides.id ?? 'edge-x',
    type: overrides.type ?? 'CONTESTS',
    visibility: 'public',
    confidence: 'derived',
    groundingFactIds: [],
    era: 'present',
    weight: 0.5,
    ...overrides,
  }
}

describe('balanced faction bank size (Task 19)', () => {
  it('has at least 24 seed factions', () => {
    expect(balancedBank.seedFactions.length).toBeGreaterThanOrEqual(24)
  })

  it('has all unique seed faction names', () => {
    const names = balancedBank.seedFactions.map(f => f.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('selectEdges seed-faction spine dominance cap', () => {
  const seedA: EntityRef = { kind: 'namedFaction', id: 'seed-a', displayName: 'Helion Debt Synod', layer: 'human' }
  const seedB: EntityRef = { kind: 'namedFaction', id: 'seed-b', displayName: 'Veyra-Locke Concession', layer: 'human' }
  const seedC: EntityRef = { kind: 'namedFaction', id: 'seed-c', displayName: 'Orison Route Authority', layer: 'human' }
  const genFaction: EntityRef = { kind: 'namedFaction', id: 'gen-a', displayName: 'Made-Up Combine', layer: 'human' }
  const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
  const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }

  const seedFactionNames = new Set(['Helion Debt Synod', 'Veyra-Locke Concession', 'Orison Route Authority'])

  function countSeedTouchingSpine(edges: RelationshipEdge[]): number {
    return edges.filter(e =>
      (e.subject.kind === 'namedFaction' && seedFactionNames.has(e.subject.displayName))
      || (e.object.kind === 'namedFaction' && seedFactionNames.has(e.object.displayName)),
    ).length
  }

  it('allows at most 1 spine edge with a seed-bank faction endpoint when the cap is active', () => {
    const candidates: RelationshipEdge[] = [
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: seedA, object: seedB, weight: 0.9 }),
      makeEdge({ id: 'c2', type: 'CONTESTS', subject: seedB, object: seedC, weight: 0.85 }),
      makeEdge({ id: 'c3', type: 'DESTABILIZES', subject: seedC, object: settlement, weight: 0.8 }),
      makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: body, weight: 0.5 }),
    ]
    const scored = scoreCandidates(candidates)
    const result = selectEdges(scored, { numSettlements: 1, numPhenomena: 0 }, 'normal', seedFactionNames)
    expect(countSeedTouchingSpine(result.spine)).toBeLessThanOrEqual(1)
  })

  it('does not cap when seedFactionNames is omitted (backward compatible default)', () => {
    const candidates: RelationshipEdge[] = [
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: seedA, object: seedB, weight: 0.9 }),
      makeEdge({ id: 'c2', type: 'CONTESTS', subject: seedB, object: seedC, weight: 0.85 }),
      makeEdge({ id: 'c3', type: 'DESTABILIZES', subject: seedC, object: settlement, weight: 0.8 }),
    ]
    const scored = scoreCandidates(candidates)
    const result = selectEdges(scored, { numSettlements: 1, numPhenomena: 0 })
    expect(countSeedTouchingSpine(result.spine)).toBeGreaterThan(1)
  })

  it('still fills the spine up to SPINE_MAX with non-seed-touching candidates after the cap trims one', () => {
    const candidates: RelationshipEdge[] = [
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: seedA, object: seedB, weight: 0.9 }),
      makeEdge({ id: 'c2', type: 'CONTESTS', subject: seedB, object: seedC, weight: 0.85 }),
      makeEdge({ id: 'c3', type: 'CONTESTS', subject: genFaction, object: settlement, weight: 0.8 }),
      makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: body, weight: 0.5 }),
    ]
    const scored = scoreCandidates(candidates)
    const result = selectEdges(scored, { numSettlements: 1, numPhenomena: 0 }, 'normal', seedFactionNames)
    expect(result.spine.length).toBe(3)
    expect(countSeedTouchingSpine(result.spine)).toBeLessThanOrEqual(1)
  })
})

describe('faction spine dominance across a corpus (buildRelationshipGraph via generateSystem)', () => {
  it('no single seed-bank faction name appears in more than 30% of spines across 30 seeds', () => {
    const seedNameSet = new Set(balancedBank.seedFactions.map(f => f.name))
    const countsByName = new Map<string, number>()
    const total = 30
    for (let i = 0; i < total; i++) {
      const options: GenerationOptions = {
        seed: `spine-dominance-${i}`,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      }
      const system = generateSystem(options)
      const spineIds = new Set(system.relationshipGraph.spineEdgeIds)
      const spineEdges = system.relationshipGraph.edges.filter(e => spineIds.has(e.id))
      const namesInThisSpine = new Set<string>()
      for (const edge of spineEdges) {
        for (const ref of [edge.subject, edge.object]) {
          if (ref.kind === 'namedFaction' && seedNameSet.has(ref.displayName)) {
            namesInThisSpine.add(ref.displayName)
          }
        }
      }
      for (const name of namesInThisSpine) {
        countsByName.set(name, (countsByName.get(name) ?? 0) + 1)
      }
    }
    for (const [name, count] of countsByName) {
      expect(count / total, `"${name}" appeared in ${count}/${total} spines`).toBeLessThanOrEqual(0.3)
    }
  })
})

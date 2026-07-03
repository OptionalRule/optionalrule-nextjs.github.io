import { describe, expect, it } from 'vitest'
import { buildConflicts } from '../buildConflicts'
import { DEFAULT_SIGNS, SIGNS, composeVisibleSign } from '../visibleSigns'
import { createSeededRng } from '../../rng'
import type { BuildGraphOptions, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'
import type { ConflictTemperature } from '../types'

const TEMPERATURES: readonly ConflictTemperature[] = ['simmering', 'open', 'aftermath', 'frozen']
const ALLOWED_SLOTS = new Set(['aggressor', 'defender', 'bystander', 'stake'])

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const resource: EntityRef = { kind: 'guResource', id: 'gu-1', displayName: 'Chiral ice belt', layer: 'gu' }

function edge(partial: Partial<RelationshipEdge> & Pick<RelationshipEdge, 'id' | 'type' | 'subject' | 'object'>): RelationshipEdge {
  return {
    visibility: 'public', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
    ...partial,
  }
}

function graph(entities: EntityRef[], edges: RelationshipEdge[], spineEdgeIds: string[]): SystemRelationshipGraph {
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
    spineEdgeIds, settlementSpineEdgeIds: [], historicalEdgeIds: [],
  }
}

const OPTIONS: BuildGraphOptions = { tone: 'balanced', gu: 'normal', distribution: 'frontier', settlements: 'normal' }

describe('visible sign pools', () => {
  it('has at least 4 default signs per temperature', () => {
    for (const t of TEMPERATURES) {
      expect(DEFAULT_SIGNS[t].length, t).toBeGreaterThanOrEqual(4)
    }
  })

  it('has at least 3 signs per temperature for spine-eligible edge types', () => {
    for (const type of ['CONTESTS', 'DESTABILIZES', 'DEPENDS_ON', 'CONTROLS'] as const) {
      for (const t of TEMPERATURES) {
        expect(SIGNS[type]?.[t]?.length ?? 0, `${type}/${t}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('uses only allowed slots in every sign', () => {
    const all = [
      ...Object.values(DEFAULT_SIGNS).flat(),
      ...Object.values(SIGNS).flatMap(byTemp => Object.values(byTemp ?? {}).flat()),
    ]
    for (const sign of all) {
      for (const m of sign.matchAll(/\{(\w+)\}/g)) {
        expect(ALLOWED_SLOTS.has(m[1]), `${m[1]} in "${sign}"`).toBe(true)
      }
    }
  })

  it('composeVisibleSign returns a template from the right pool', () => {
    const sign = composeVisibleSign('CONTESTS', 'open', createSeededRng('s'))
    const pool = [...(SIGNS.CONTESTS?.open ?? []), ...DEFAULT_SIGNS.open]
    expect(pool).toContain(sign)
  })
})

describe('buildConflicts', () => {
  function fixture(): SystemRelationshipGraph {
    const spine1 = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const spine2 = edge({ id: 'e2', type: 'DEPENDS_ON', subject: settlement, object: resource })
    const periph = edge({ id: 'e3', type: 'CONTROLS', subject: factionB, object: settlement })
    return graph([factionA, factionB, settlement, resource], [spine1, spine2, periph], ['e1', 'e2'])
  }

  it('returns one fully populated conflict per spine edge, in spine order', () => {
    const conflicts = buildConflicts({ graph: fixture(), settlements: [], options: OPTIONS }, createSeededRng('c'))
    expect(conflicts).toHaveLength(2)
    expect(conflicts[0].edgeId).toBe('e1')
    expect(conflicts[1].edgeId).toBe('e2')
    for (const c of conflicts) {
      expect(c.id).toBe(`conflict-${c.edgeId}`)
      expect(c.parties.length).toBeGreaterThanOrEqual(2)
      expect(c.pressure.length).toBeGreaterThan(0)
      expect(c.visibleSign.length).toBeGreaterThan(0)
      expect(['simmering', 'open', 'aftermath', 'frozen']).toContain(c.temperature)
    }
  })

  it('is deterministic for the same seed', () => {
    const a = buildConflicts({ graph: fixture(), settlements: [], options: OPTIONS }, createSeededRng('same'))
    const b = buildConflicts({ graph: fixture(), settlements: [], options: OPTIONS }, createSeededRng('same'))
    expect(a).toEqual(b)
  })

  it('builds each conflict from an edge-id fork so spine order does not change per-edge results', () => {
    const g1 = fixture()
    const g2 = { ...fixture(), spineEdgeIds: ['e2', 'e1'] }
    const rngSeed = 'fork-check'
    const fromOrder1 = buildConflicts({ graph: g1, settlements: [], options: OPTIONS }, createSeededRng(rngSeed))
    const fromOrder2 = buildConflicts({ graph: g2, settlements: [], options: OPTIONS }, createSeededRng(rngSeed))
    const e1FromOrder1 = fromOrder1.find(c => c.edgeId === 'e1')
    const e1FromOrder2 = fromOrder2.find(c => c.edgeId === 'e1')
    expect(e1FromOrder1).toEqual(e1FromOrder2)
  })
})

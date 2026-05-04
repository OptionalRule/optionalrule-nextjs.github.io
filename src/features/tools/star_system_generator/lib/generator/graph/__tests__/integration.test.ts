import { describe, expect, it } from 'vitest'
import { generateSystem } from '../../index'
import type { GenerationOptions } from '../../../../types'

const baseOptions: GenerationOptions = {
  seed: 'phase2-task7-spot',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('relationshipGraph integration with generateSystem', () => {
  it('produces at least one HOSTS edge for any system with settlements that have bodyId', () => {
    const system = generateSystem(baseOptions)
    const settlementsWithBody = system.settlements.filter(s => s.bodyId)
    if (settlementsWithBody.length > 0) {
      const hostsEdges = system.relationshipGraph.edges.filter(e => e.type === 'HOSTS')
      expect(hostsEdges.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('keeps narrative prose populated for the same seed', () => {
    const system = generateSystem(baseOptions)
    expect(system.name.value.length).toBeGreaterThan(0)
    for (const settlement of system.settlements) {
      expect(settlement.tagHook?.value.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('is deterministic — the same seed produces the same graph', () => {
    const a = generateSystem({ ...baseOptions, seed: 'phase2-determinism' })
    const b = generateSystem({ ...baseOptions, seed: 'phase2-determinism' })
    expect(a.relationshipGraph.edges.map(e => e.id))
      .toEqual(b.relationshipGraph.edges.map(e => e.id))
  })
})

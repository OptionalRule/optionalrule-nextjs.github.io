import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

const SEEDS: ReadonlyArray<{ name: string; seed: string; distribution: 'frontier' | 'realistic' }> = [
  { name: 'realistic-default',  seed: 'snap-001', distribution: 'realistic' },
  { name: 'frontier-default',   seed: 'snap-002', distribution: 'frontier' },
  { name: 'realistic-multi',    seed: 'snap-003', distribution: 'realistic' },
  { name: 'frontier-multi',     seed: 'snap-004', distribution: 'frontier' },
]

describe('buildSceneGraph snapshot corpus', () => {
  for (const sample of SEEDS) {
    it(`${sample.name} produces a coherent graph`, () => {
      const system = generateSystem({
        seed: sample.seed,
        distribution: sample.distribution,
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      const graph = buildSceneGraph(system)

      expect(graph.star.coronaRadius).toBeGreaterThan(0)
      expect(graph.bodies.length + graph.belts.length).toBe(system.bodies.length)
      expect(graph.guBleeds.length).toBe(1)
      expect(graph.hazards.length + graph.systemLevelHazards.length).toBe(system.majorHazards.length)
      expect(graph.systemLevelPhenomena.length).toBe(system.phenomena.length)
      expect(graph.phenomena.length).toBe(0)
      expect(graph.sceneRadius).toBeGreaterThan(0)
      // every BodyVisual has an existing OrbitingBody source
      for (const bv of graph.bodies) {
        expect(system.bodies.find((b) => b.id === bv.id)).toBeTruthy()
      }
    })
  }
})

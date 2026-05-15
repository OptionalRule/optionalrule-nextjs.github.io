import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

const SUB_SYSTEM_EXTENT_FRACTION = 0.85

describe('sub-system orbit-ring scene radius is capped against companion offset', () => {
  it('seed probe-frontier-astronomy-fracture-crowded-11-3: no sub-body scene radius exceeds 85% of companion offset', () => {
    const system = generateSystem({
      seed: 'probe-frontier-astronomy-fracture-crowded-11-3',
      distribution: 'frontier',
      tone: 'astronomy',
      gu: 'fracture',
      settlements: 'crowded',
    })
    const graph = buildSceneGraph(system)

    for (const sub of graph.subSystems) {
      const [px, py, pz] = sub.star.position
      const offset = Math.hypot(px, py, pz)
      const cap = offset * SUB_SYSTEM_EXTENT_FRACTION
      for (const body of sub.bodies) {
        expect(body.orbitRadius, `${body.id} radius ${body.orbitRadius} exceeds cap ${cap}`).toBeLessThanOrEqual(cap)
      }
    }
  })
})

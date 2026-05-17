import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import { separationToBucketAu } from '../../../lib/generator/companionGeometry'
import { siblingOuterAuLimit } from '../../../lib/generator/companionStability'

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

  it('seed 99115be26a09a4f4: sibling systems render inside a binary-stability visual envelope', () => {
    const system = generateSystem({
      seed: '99115be26a09a4f4',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const graph = buildSceneGraph(system)
    const sibling = system.companions.find((c) => c.mode === 'orbital-sibling' && c.subSystem)
    expect(sibling).toBeTruthy()
    if (!sibling) return

    const sub = graph.subSystems.find((entry) => entry.star.id === sibling.id)
    expect(sub).toBeTruthy()
    if (!sub) return

    const offset = Math.hypot(...sub.star.position)
    const separationAu = separationToBucketAu(sibling.separation.value)
    const primaryLimitAu = siblingOuterAuLimit(separationAu, system.primary.massSolar.value, sibling.star.massSolar.value)
    const subLimitAu = siblingOuterAuLimit(separationAu, sibling.star.massSolar.value, system.primary.massSolar.value)
    const visualAllowance = 1.1

    const primaryMax = Math.max(...graph.bodies.map((body) => body.orbitRadius), 0)
    const subMax = Math.max(...sub.bodies.map((body) => body.orbitRadius), 0)

    expect(primaryMax / offset).toBeLessThanOrEqual(Math.sqrt(primaryLimitAu / separationAu) * visualAllowance)
    expect(subMax / offset).toBeLessThanOrEqual(Math.sqrt(subLimitAu / separationAu) * visualAllowance)
    expect(graph.bodies.length).toBe(system.bodies.filter((body) => body.category.value !== 'belt').length)
    expect(sub.bodies.length).toBe(sibling.subSystem!.bodies.filter((body) => body.category.value !== 'belt').length)
  })
})

import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import type { GenerationOptions } from '../../../types'
import type { MoonVisual } from '../../types'

const BASE: GenerationOptions = {
  seed: '',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function nonCircumbinaryCompanionOffset(graph: ReturnType<typeof buildSceneGraph>, system: ReturnType<typeof generateSystem>): number | null {
  const inScene = system.companions.filter((c) => c.mode !== 'linked-independent' && c.mode !== 'orbital-sibling' && c.mode !== 'circumbinary')
  if (inScene.length === 0) return null
  const firstId = inScene[0].id
  const visual = graph.companions.find((c) => c.id === firstId)
  if (!visual) return null
  const pos = visual.position
  return Math.hypot(pos[0], pos[1], pos[2])
}

function findSeedOutermostMoonCrossesCompanion(max = 300): string | null {
  for (let i = 0; i < max; i++) {
    const seed = `moon-env-probe-${i}`
    const system = generateSystem({ ...BASE, seed })
    const companionOffset = nonCircumbinaryCompanionOffset(buildSceneGraph(system), system)
    if (companionOffset === null) continue
    const graph = buildSceneGraph(system)
    if (graph.bodies.length === 0) continue
    const outermost = graph.bodies[graph.bodies.length - 1]
    if (outermost.moons.length === 0) continue
    const outerMoonRelative = Math.max(...outermost.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
    const reach = outermost.orbitRadius + outerMoonRelative
    if (reach >= companionOffset) return seed
  }
  return null
}

describe('moon envelope is capped against next neighbour', () => {
  it('outermost body moon envelope must not cross the companion star (fixed seed)', () => {
    const fixedSeed = 'probe-frontier-balanced-normal-normal-0-60'
    const system = generateSystem({ ...BASE, seed: fixedSeed })
    const graph = buildSceneGraph(system)
    if (graph.bodies.length === 0) return
    const outermost = graph.bodies[graph.bodies.length - 1]
    if (outermost.moons.length === 0) return
    const companionOffset = nonCircumbinaryCompanionOffset(graph, system)
    if (companionOffset === null) return
    const outerMoonRelative = Math.max(...outermost.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
    const reach = outermost.orbitRadius + outerMoonRelative
    expect(reach, `body+moons reach ${reach} crosses companion at ${companionOffset}`).toBeLessThan(companionOffset)
  })

  it('outermost body moon envelope (seed sweep) must not cross the companion star', () => {
    const probeSeed = findSeedOutermostMoonCrossesCompanion()
    if (!probeSeed) {
      return
    }
    const system = generateSystem({ ...BASE, seed: probeSeed })
    const graph = buildSceneGraph(system)
    const outermost = graph.bodies[graph.bodies.length - 1]
    const companionOffset = nonCircumbinaryCompanionOffset(graph, system)!
    const outerMoonRelative = Math.max(...outermost.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
    const reach = outermost.orbitRadius + outerMoonRelative
    expect(reach, `seed ${probeSeed}: body+moons reach ${reach} crosses companion at ${companionOffset}`).toBeLessThan(companionOffset)
  })

  it('inner-body moons cap against next body, not the companion', () => {
    const system = generateSystem({ ...BASE, seed: 'moon-envelope-seed-2' })
    const graph = buildSceneGraph(system)
    for (let i = 0; i < graph.bodies.length - 1; i++) {
      const body = graph.bodies[i]
      const next = graph.bodies[i + 1]
      if (body.moons.length === 0) continue
      const outerMoonRelative = Math.max(...body.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
      const gap = (next.orbitRadius - body.orbitRadius) / 2
      expect(
        outerMoonRelative,
        `${body.id} moons reach ${outerMoonRelative} beyond half-gap ${gap} to ${next.id}`,
      ).toBeLessThanOrEqual(gap + 0.001)
    }
  })
})

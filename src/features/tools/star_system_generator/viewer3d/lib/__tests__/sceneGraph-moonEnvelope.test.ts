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

const VOLATILE_COMPANION_SEED = 'moon-env-probe-9'

type GeneratedSystem = ReturnType<typeof generateSystem>

function outermostReach(graph: ReturnType<typeof buildSceneGraph>): number | null {
  if (graph.bodies.length === 0) return null
  const outermost = graph.bodies[graph.bodies.length - 1]
  if (outermost.moons.length === 0) return null
  return outermost.orbitRadius + Math.max(...outermost.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
}

function distantVolatileCompanion(): GeneratedSystem['companions'][number] {
  const source = generateSystem({ ...BASE, seed: VOLATILE_COMPANION_SEED })
  const companion = source.companions.find((c) => c.mode === 'volatile')
  expect(companion, `${VOLATILE_COMPANION_SEED} must still roll a volatile companion`).toBeDefined()
  return { ...companion!, separation: { ...companion!.separation, value: 'Distant binary' } }
}

describe('moon envelope is capped against next neighbour', () => {
  it('outermost body moon envelope must not cross the companion star (fixed fixture)', () => {
    const generated = generateSystem({ ...BASE, seed: 'moon-env-probe-1' })
    const system = { ...generated, companions: [distantVolatileCompanion()] }
    const graph = buildSceneGraph(system)
    const companionOffset = nonCircumbinaryCompanionOffset(graph, system)
    const reach = outermostReach(graph)
    expect(companionOffset, 'companion must be in scene').not.toBeNull()
    expect(reach, 'outermost scene body must carry moons').not.toBeNull()
    expect(reach!, `body+moons reach ${reach} crosses companion at ${companionOffset}`).toBeLessThan(companionOffset!)
  })

  it('generated volatile-companion systems keep every scene body and its moons inside the companion (seed sweep)', () => {
    let volatileSystems = 0
    for (let i = 0; i < 300; i++) {
      const seed = `moon-env-probe-${i}`
      const system = generateSystem({ ...BASE, seed })
      const graph = buildSceneGraph(system)
      const companionOffset = nonCircumbinaryCompanionOffset(graph, system)
      if (companionOffset === null) continue
      volatileSystems++
      for (const body of graph.bodies) {
        const moonReach = body.moons.length === 0 ? 0 : Math.max(...body.moons.map((m: MoonVisual) => m.parentRelativeOrbit))
        expect(body.orbitRadius + moonReach, `seed ${seed}: ${body.id} crosses companion at ${companionOffset}`).toBeLessThan(companionOffset)
      }
    }
    expect(volatileSystems, 'sweep must reach systems with an in-scene companion').toBeGreaterThan(0)
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

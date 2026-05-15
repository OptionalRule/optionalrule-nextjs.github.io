import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import type { StellarCompanion } from '../../../types'

function fact<T>(value: T): { value: T; confidence: 'derived' } {
  return { value, confidence: 'derived' }
}

function makeVolatileCompanion(_base: ReturnType<typeof generateSystem>): StellarCompanion {
  return {
    id: 'synthetic-volatile',
    companionType: fact('Contact binary companion'),
    separation: fact('Contact / near-contact'),
    planetaryConsequence: fact('none'),
    guConsequence: fact('none'),
    rollMargin: fact(0),
    mode: 'volatile',
    star: {
      id: 'synthetic-volatile-star',
      name: fact('Volatile Star'),
      spectralType: fact('M5'),
      massSolar: fact(0.3),
      luminositySolar: fact(0.01),
      ageState: fact('main sequence'),
      metallicity: fact('solar'),
      activity: fact('moderate'),
      activityRoll: fact(0.5),
      activityModifiers: [],
    },
    linkedSeed: undefined,
    subSystem: undefined,
  } satisfies StellarCompanion
}

describe('clearance inflation does not push bodies past the companion', () => {
  it('injected volatile companion: bodies that would be inflated past the companion are dropped', () => {
    const system = generateSystem({
      seed: 'plan-test-001',
      distribution: 'realistic',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })

    expect(system.bodies.filter((b) => b.category.value !== 'belt').length).toBeGreaterThan(0)

    const patchedSystem = {
      ...system,
      companions: [makeVolatileCompanion(system)],
    }

    const graph = buildSceneGraph(patchedSystem)
    const companionVisual = graph.companions.find((c) => c.id === 'synthetic-volatile')
    expect(companionVisual, 'volatile companion should appear in graph.companions').toBeDefined()

    const companionOffset = Math.hypot(...(companionVisual!.position))
    expect(companionOffset).toBeGreaterThan(0)

    for (const body of graph.bodies) {
      expect(body.orbitRadius, `body ${body.id} orbitRadius ${body.orbitRadius} >= companionOffset ${companionOffset}`)
        .toBeLessThan(companionOffset)
    }
  })

  it('orbital-sibling sub-system companion: no primary body inflates past its scene position', () => {
    // The empirical investigation documented probe-frontier-astronomy-low-normal-7-211
    // as a moderate-binary case where clearance inflation pushed a primary body's
    // scene radius (20.3) past the orbital-sibling companion's scene offset (17.1).
    const seeds = [
      'probe-frontier-astronomy-low-normal-7-211',
      'clearance-sibling-1',
      'clearance-sibling-2',
      'clearance-sibling-3',
      'clearance-sibling-4',
      'clearance-sibling-5',
    ]
    let exercised = false
    for (const seed of seeds) {
      const system = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'astronomy',
        gu: 'low',
        settlements: 'normal',
      })
      const graph = buildSceneGraph(system)
      const sub = graph.subSystems[0]
      if (!sub) continue
      const subOffset = Math.hypot(...sub.star.position)
      if (subOffset === 0 || !Number.isFinite(subOffset)) continue
      exercised = true
      for (const body of graph.bodies) {
        expect(body.orbitRadius, `${seed} primary body ${body.id} radius ${body.orbitRadius} >= sub-system companion offset ${subOffset}`)
          .toBeLessThan(subOffset)
      }
    }
    expect(exercised, 'No orbital-sibling sub-system available in probe seeds').toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import type { Fact, GeneratedSystem, GuOverlay } from '../../../types'
import { classifyGuBleed } from '../guBleedClassifier'

function fact<T>(value: T): Fact<T> { return { value, confidence: 'gu-layer' } }

function makeSystem(): GeneratedSystem {
  return {
    id: 'sys-1',
    seed: 'test',
    zones: { habitableInnerAu: fact(0.8), habitableCenterAu: fact(1), habitableOuterAu: fact(1.5), snowLineAu: fact(5) },
    bodies: [
      { id: 'b-rocky',  orbitAu: fact(1.0),  category: fact('rocky-planet'), name: fact('Marrow') },
      { id: 'b-outer',  orbitAu: fact(28),   category: fact('ice-giant'),    name: fact('Ostara') },
    ],
    guOverlay: {
      intensity: fact('moderate'),
      bleedLocation: fact('near outer system'),
      bleedBehavior: fact('caustic'),
      resource: fact(''),
      hazard: fact(''),
      intensityRoll: fact(50),
      intensityModifiers: [],
    } as GuOverlay,
  } as unknown as GeneratedSystem
}

describe('classifyGuBleed', () => {
  it('places outer-system bleeds near the outermost orbit', () => {
    const sys = makeSystem()
    const v = classifyGuBleed(sys.guOverlay, sys)
    expect(v.unclassified).toBe(false)
    expect(Math.abs(v.center[0]) + Math.abs(v.center[2])).toBeGreaterThan(0)
  })

  it('returns unclassified=true for an unrecognizable bleed location', () => {
    const sys = makeSystem()
    const guOverlay: GuOverlay = { ...sys.guOverlay, bleedLocation: fact('quizzical undefined hand-wave') }
    const v = classifyGuBleed(guOverlay, sys)
    expect(v.unclassified).toBe(true)
  })

  it('scales intensity with the intensity word', () => {
    const sys = makeSystem()
    const calm = classifyGuBleed({ ...sys.guOverlay, intensity: fact('low') }, sys)
    const fracture = classifyGuBleed({ ...sys.guOverlay, intensity: fact('fracture') }, sys)
    expect(fracture.intensity).toBeGreaterThan(calm.intensity)
    expect(fracture.radius).toBeGreaterThan(calm.radius)
  })

  it('produces deterministic ids', () => {
    const sys = makeSystem()
    expect(classifyGuBleed(sys.guOverlay, sys).id).toBe(classifyGuBleed(sys.guOverlay, sys).id)
  })
})

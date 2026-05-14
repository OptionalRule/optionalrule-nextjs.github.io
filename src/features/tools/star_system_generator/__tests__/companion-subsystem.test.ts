import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'subsys-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `subsys-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('orbital-sibling sub-system', () => {
  it('populates subSystem with zones and bodies', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const sub = sys.companions[0].subSystem
    expect(sub).toBeDefined()
    expect(sub!.bodies.length).toBeGreaterThan(0)
    expect(sub!.zones.habitableCenterAu.value).toBeGreaterThan(0)
  })

  it('sub-system bodies do not appear in the top-level bodies array', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const topIds = new Set(sys.bodies.map((b) => b.id))
    for (const subBody of sys.companions[0].subSystem!.bodies) {
      expect(topIds.has(subBody.id)).toBe(false)
    }
  })

  it('is deterministic for the same seed', () => {
    const seed = findOrbitalSiblingSeed()
    const a = generateSystem({ ...baseOptions, seed })
    const b = generateSystem({ ...baseOptions, seed })
    expect(a.companions[0].subSystem!.bodies.map((b) => b.id)).toEqual(
      b.companions[0].subSystem!.bodies.map((b) => b.id),
    )
  })
})

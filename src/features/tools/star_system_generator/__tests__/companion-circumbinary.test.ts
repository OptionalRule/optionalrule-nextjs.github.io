import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'circumbinary-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findCircumbinarySeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `circumbinary-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'circumbinary') return seed
  }
  throw new Error('No circumbinary seed found')
}

describe('circumbinary companion mode', () => {
  it('inner habitable edge is pushed outward by at least the binary separation', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const innerEdge = sys.zones.habitableInnerAu.value
    expect(innerEdge).toBeGreaterThanOrEqual(1.0)
  })

  it('no body orbits inside the keep-out zone', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const minOrbit = Math.min(...sys.bodies.map((b) => b.orbitAu.value), Infinity)
    expect(minOrbit).toBeGreaterThanOrEqual(1.0)
  })

  it('combined luminosity inflates the habitable center compared to the primary alone', () => {
    const seed = findCircumbinarySeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const expectedCombined = sys.primary.luminositySolar.value + sys.companions[0].star.luminositySolar.value
    expect(expectedCombined).toBeGreaterThan(sys.primary.luminositySolar.value)
  })
})

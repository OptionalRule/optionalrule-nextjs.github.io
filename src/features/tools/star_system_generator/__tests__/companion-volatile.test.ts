import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'volatile-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findVolatileSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `volatile-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'volatile') return seed
  }
  throw new Error('No volatile seed found')
}

describe('volatile companion mode', () => {
  it('replaces ordinary bodies with a single hazard belt', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.bodies).toHaveLength(1)
    expect(sys.bodies[0].category.value).toBe('belt')
    expect(sys.bodies[0].name.value.toLowerCase()).toContain('contact')
  })

  it('emits a binary-contact phenomenon', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const hasBinaryContact = sys.phenomena.some((p) => p.phenomenon.value.toLowerCase().includes('binary contact'))
    expect(hasBinaryContact).toBe(true)
  })

  it('produces no settlements or gates (no habitable anchors)', () => {
    const seed = findVolatileSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.settlements).toHaveLength(0)
    expect(sys.gates).toHaveLength(0)
  })
})

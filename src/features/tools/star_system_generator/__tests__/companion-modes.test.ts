import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'mode-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedWithSeparation(target: string, max = 400): string {
  for (let i = 0; i < max; i++) {
    const seed = `companion-search-${target.replace(/[^a-z]/gi, '')}-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.separation.value === target) return seed
  }
  throw new Error(`No seed found producing separation "${target}" within ${max} tries`)
}

describe('companion modes', () => {
  it('sets mode = circumbinary for Close/Tight binaries', () => {
    const seed = findSeedWithSeparation('Close binary')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('circumbinary')
    expect(sys.companions[0].star).toBeDefined()
    expect(sys.companions[0].linkedSeed).toBeUndefined()
  })

  it('sets mode = orbital-sibling for Moderate/Wide binaries', () => {
    const seed = findSeedWithSeparation('Wide binary')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('orbital-sibling')
    expect(sys.companions[0].star).toBeDefined()
  })

  it('sets mode = linked-independent and linkedSeed for Very wide', () => {
    const seed = findSeedWithSeparation('Very wide')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('linked-independent')
    expect(sys.companions[0].linkedSeed?.value).toBe(`${seed}:c1`)
  })

  it('sets mode = volatile for Contact / near-contact', () => {
    const seed = findSeedWithSeparation('Contact / near-contact')
    const sys = generateSystem({ ...baseOptions, seed })
    expect(sys.companions[0].mode).toBe('volatile')
  })
})

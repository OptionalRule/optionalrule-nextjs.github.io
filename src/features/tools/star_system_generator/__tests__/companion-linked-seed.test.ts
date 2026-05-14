import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'linked-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findLinkedSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `linked-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'linked-independent') return seed
  }
  throw new Error('No linked-independent seed found')
}

describe('linked-independent companion seed convention', () => {
  it('uses derived seed <parent>:c1', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    expect(parent.companions[0].linkedSeed?.value).toMatch(/:c1$/)
  })

  it('parent companion.star matches the linked system primary star (preview-vs-linked consistency)', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    const linked = generateSystem({ ...baseOptions, seed: parent.companions[0].linkedSeed!.value })

    expect(parent.companions[0].star.spectralType.value).toBe(linked.primary.spectralType.value)
    expect(parent.companions[0].star.massSolar.value).toBe(linked.primary.massSolar.value)
    expect(parent.companions[0].star.luminositySolar.value).toBe(linked.primary.luminositySolar.value)
  })

  it('visiting the derived seed deterministically produces the same system every time', () => {
    const parentSeed = findLinkedSeed()
    const parent = generateSystem({ ...baseOptions, seed: parentSeed })
    const linkedSeed = parent.companions[0].linkedSeed!.value
    const a = generateSystem({ ...baseOptions, seed: linkedSeed })
    const b = generateSystem({ ...baseOptions, seed: linkedSeed })
    expect(a.primary).toEqual(b.primary)
  })
})

import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import { exportSystemMarkdown } from '../lib/export/markdown'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'md-companion',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `md-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('markdown export with companions', () => {
  it('emits a Companion System section for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const md = exportSystemMarkdown(sys)
    expect(md).toMatch(/##\s+Companion System/i)
    expect(md).toContain(sys.companions[0].star.name.value)
  })

  it('emits a Linked System line with the derived seed for linked-independent', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    const md = exportSystemMarkdown(sys)
    expect(md).toMatch(/Linked system:\s+`/i)
    expect(md).toContain(sys.companions[0].linkedSeed!.value)
  })
})

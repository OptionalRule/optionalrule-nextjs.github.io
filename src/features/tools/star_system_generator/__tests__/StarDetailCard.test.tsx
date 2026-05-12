import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StarDetailCard } from '../viewer3d/chrome/StarDetailCard'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'star-card',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `card-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('StarDetailCard', () => {
  it('shows Open linked system link for linked-independent companion', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<StarDetailCard system={sys} />)
    expect(screen.getByText(/Open linked system/i)).toBeTruthy()
  })

  it('does not show the link for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<StarDetailCard system={sys} />)
    expect(screen.queryByText(/Open linked system/i)).toBeNull()
  })
})

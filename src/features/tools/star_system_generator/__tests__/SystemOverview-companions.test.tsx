import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemOverview } from '../components/SystemOverview'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'sysov-companions',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `sysov-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for mode ${mode}`)
}

describe('SystemOverview with companions', () => {
  it('shows a link affordance for linked-independent companions', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Open linked system/i)).toBeTruthy()
  })

  it('shows orbital-sibling caption referring to generated bodies', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Generated below/i)).toBeTruthy()
  })

  it('shows the barycenter note for circumbinary companions', () => {
    const seed = findSeedForMode('circumbinary')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/orbit the binary's barycenter/i)).toBeTruthy()
  })

  it('shows the contact note for volatile companions', () => {
    const seed = findSeedForMode('volatile')
    const sys = generateSystem({ ...baseOptions, seed })
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/Stars are contact-touching/i)).toBeTruthy()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompanionSubSystem } from '../components/CompanionSubSystem'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'subsys-render',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `subsys-render-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('CompanionSubSystem', () => {
  it('renders a section header naming the companion', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    render(<CompanionSubSystem system={sys} companion={sys.companions[0]} />)
    expect(screen.getByText(sys.companions[0].star.name.value)).toBeTruthy()
  })

  it('renders companion body count', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    render(<CompanionSubSystem system={sys} companion={sys.companions[0]} />)
    const bodyCount = sys.companions[0].subSystem!.bodies.length
    expect(screen.getByText(new RegExp(`${bodyCount}\\s+(bod(?:y|ies))`, 'i'))).toBeTruthy()
  })
})

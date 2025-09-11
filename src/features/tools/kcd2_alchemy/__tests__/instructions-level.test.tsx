import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { PotionCard } from '../components/PotionCard'
import type { NormalizedPotionRecipe } from '../types'

const potion: NormalizedPotionRecipe = {
  id: 'p1',
  name: 'Test Tonic',
  ingredients: { liquid: 'Water', items: [{ id: 'mint', name: 'Mint', quantity: 1 }] },
  instructions: {
    default: ['Boil water', 'Add mint'],
    optimized: { minLevel: 10, steps: ['Boil briefly', 'Add mint at end'] },
  },
  quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
  effects: [{ quality: 'Standard', description: 'Smells fresh.' }],
}

describe('Instructions display by alchemy skill', () => {
  it('shows default instructions when level below optimized min', () => {
    render(<PotionCard potion={potion} playerAlchemyLevel={5} />)
    expect(screen.getByText('Boil water')).toBeInTheDocument()
    expect(screen.queryByText('Boil briefly')).toBeNull()
  })

  it('shows optimized instructions when level at or above min', () => {
    render(<PotionCard potion={potion} playerAlchemyLevel={10} />)
    expect(screen.getByText('Boil briefly')).toBeInTheDocument()
    expect(screen.queryByText('Boil water')).toBeNull()
  })
})


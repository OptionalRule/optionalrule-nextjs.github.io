import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import React from 'react'
import { FiltersPanel } from '../components/FiltersPanel'
import { PotionCard } from '../components/PotionCard'
import type { NormalizedPotionRecipe } from '../types'

expect.extend(toHaveNoViolations)

// No Next.js mocks needed; components are pure React.

describe('KCD2 Alchemy — Accessibility', () => {
  it('FiltersPanel has no axe violations', async () => {
    const { container } = render(
      <FiltersPanel
        ingredientOptions={[
          { id: 'mint', name: 'Mint' },
          { id: 'belladonna', name: 'Belladonna' },
        ]}
        selectedIngredientIds={['mint']}
        ingredientMode="any"
        onChangeIngredients={() => {}}
        onChangeIngredientMode={() => {}}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('PotionCard (default + optimized) has no axe violations', async () => {
    const potion: NormalizedPotionRecipe = {
      id: 'p1',
      name: 'Artemisia',
      ingredients: {
        liquid: 'Spirits',
        items: [
          { id: 'sage', name: 'Sage', quantity: 1 },
          { id: 'wormwood', name: 'Wormwood', quantity: 2 },
        ],
      },
      instructions: { default: ['Add spirits'], optimized: { minLevel: 12, steps: ['Add spirits', 'Distil'] } },
      quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
      effects: [
        { quality: 'Standard', description: 'Increases Strength by 4.' },
      ],
    }

    const { container } = render(<PotionCard potion={potion} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

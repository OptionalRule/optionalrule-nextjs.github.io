import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FiltersPanel } from '../components/FiltersPanel'

describe('FiltersPanel save toggle placement', () => {
  it('does not render a local save switch (moved to header)', async () => {
    render(
      <FiltersPanel
        ingredientOptions={[{ id: 'mint', name: 'Mint' }]}
        selectedIngredientIds={[]}
        ingredientMode="any"
        onChangeIngredients={() => {}}
        onChangeIngredientMode={() => {}}
        alchemyLevel={0}
        onChangeAlchemyLevel={() => {}}
      />,
    )
    const switchBtn = screen.queryByRole('switch', { name: /save/i })
    expect(switchBtn).toBeNull()
  })
})

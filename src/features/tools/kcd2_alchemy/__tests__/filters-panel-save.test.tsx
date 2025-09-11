import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FiltersPanel } from '../components/FiltersPanel'

describe('FiltersPanel save toggle', () => {
  it('renders save switch and calls toggle', async () => {
    const { user } = await import('@testing-library/user-event').then((m) => ({ user: m.default.setup() }))
    const onToggleSave = vi.fn()
    render(
      <FiltersPanel
        ingredientOptions={[{ id: 'mint', name: 'Mint' }]}
        selectedIngredientIds={[]}
        ingredientMode="any"
        onChangeIngredients={() => {}}
        onChangeIngredientMode={() => {}}
        alchemyLevel={0}
        onChangeAlchemyLevel={() => {}}
        saveEnabled={false}
        onToggleSave={onToggleSave}
      />,
    )
    const switchBtn = screen.getByRole('switch', { name: /saving filters/i })
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')
    await user.click(switchBtn)
    expect(onToggleSave).toHaveBeenCalled()
  })

  // No separate clear button now; disabling the switch clears persisted data
})

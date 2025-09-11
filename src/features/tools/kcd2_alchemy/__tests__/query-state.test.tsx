import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { useQueryState } from '../hooks/useQueryState'

function Harness() {
  const [state, setState] = useQueryState()
  return (
    <div>
      <div data-testid="q">{state.q}</div>
      <div data-testid="ingredients">{state.ingredients.join(',')}</div>
      <div data-testid="ingMode">{state.ingMode}</div>
      <button onClick={() => setState({ q: 'mint', ingredients: ['mint'], ingMode: 'only' })}>set</button>
    </div>
  )
}

describe('useQueryState', () => {
  it('initializes from URL and updates URL without navigation', async () => {
    // Start with a baseline URL
    window.history.replaceState(null, '', '/tools/kcd2_alchemy/')
    const { user } = await import('@testing-library/user-event').then((m) => ({ user: m.default.setup() }))

    render(<Harness />)
    expect(screen.getByTestId('q').textContent).toBe('')

    // Trigger state update
    await user.click(screen.getByText('set'))
    expect(screen.getByTestId('q').textContent).toBe('mint')
    expect(window.location.search).toContain('q=mint')
    expect(window.location.search).toContain('ingredients=mint')
    expect(window.location.search).toContain('ingMode=only')
  })
})

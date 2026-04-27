import React from 'react'
import { waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useGeneratorQueryState } from '../hooks/useGeneratorQueryState'

function Harness() {
  const [state, setState] = useGeneratorQueryState()
  return (
    <div>
      <div data-testid="seed">{state.seed}</div>
      <div data-testid="distribution">{state.distribution}</div>
      <button onClick={() => setState({ seed: 'ABC123!!', distribution: 'realistic' })}>set</button>
    </div>
  )
}

describe('useGeneratorQueryState', () => {
  it('initializes from URL and writes query-string share state', async () => {
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7F3A9C2E&tone=cinematic')

    render(<Harness />)

    expect(screen.getByTestId('seed').textContent).toBe('7f3a9c2e')

    await userEvent.click(screen.getByText('set'))

    expect(screen.getByTestId('seed').textContent).toBe('abc123')
    expect(screen.getByTestId('distribution').textContent).toBe('realistic')
    await waitFor(() => {
      expect(window.location.search).toContain('seed=abc123')
      expect(window.location.search).toContain('distribution=realistic')
    })
  })

})

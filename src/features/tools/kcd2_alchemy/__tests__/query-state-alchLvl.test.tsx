import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { useQueryState } from '../hooks/useQueryState'

function Harness() {
  const [state, setState] = useQueryState()
  return (
    <div>
      <div data-testid="alch">{state.alchLvl}</div>
      <button onClick={() => setState({ alchLvl: 12 })}>set</button>
    </div>
  )
}

describe('useQueryState alchLvl', () => {
  it('writes alchLvl to URL when > 0', async () => {
    window.history.replaceState(null, '', '/tools/kcd2_alchemy/')
    const { user } = await import('@testing-library/user-event').then((m) => ({ user: m.default.setup() }))
    render(<Harness />)
    await user.click(screen.getByText('set'))
    expect(window.location.search).toContain('alchLvl=12')
  })
})


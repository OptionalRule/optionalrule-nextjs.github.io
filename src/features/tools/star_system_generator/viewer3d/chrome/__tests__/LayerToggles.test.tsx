import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerToggles } from '../LayerToggles'
import { ViewerContextProvider, useLayers } from '../ViewerContext'

function ProbeLayers() {
  const { layers } = useLayers()
  return <div data-testid="probe">{`${layers.physical}|${layers.gu}|${layers.human}|${layers.moonOrbits}`}</div>
}

function renderWithProvider() {
  return render(
    <ViewerContextProvider>
      <LayerToggles />
      <ProbeLayers />
    </ViewerContextProvider>,
  )
}

describe('LayerToggles', () => {
  it('renders layer pills with moon orbits off by default', () => {
    renderWithProvider()
    expect(screen.getByRole('button', { name: /physical/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /gu/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /human/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /moon orbits/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles a layer off when clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByRole('button', { name: /physical/i }))
    expect(screen.getByRole('button', { name: /physical/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('probe').textContent).toBe('false|true|true|false')
  })

  it('toggles all layers independently', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    await user.click(screen.getByRole('button', { name: /gu/i }))
    await user.click(screen.getByRole('button', { name: /human/i }))
    await user.click(screen.getByRole('button', { name: /moon orbits/i }))
    expect(screen.getByTestId('probe').textContent).toBe('true|false|false|true')
  })
})

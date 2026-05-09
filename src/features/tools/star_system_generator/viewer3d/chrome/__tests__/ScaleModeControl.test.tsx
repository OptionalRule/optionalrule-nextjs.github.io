import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScaleModeControl } from '../ScaleModeControl'
import { ViewerContextProvider, useScaleMode } from '../ViewerContext'

function ProbeScaleMode() {
  const { scaleMode } = useScaleMode()
  return <div data-testid="scale-mode">{scaleMode}</div>
}

function renderWithProvider() {
  return render(
    <ViewerContextProvider>
      <ScaleModeControl />
      <ProbeScaleMode />
    </ViewerContextProvider>,
  )
}

describe('ScaleModeControl', () => {
  it('defaults to readable log scale', () => {
    renderWithProvider()
    expect(screen.getByRole('button', { name: /readable/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('scale-mode')).toHaveTextContent('readable-log')
  })

  it('switches scale modes', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('button', { name: /relative au/i }))
    expect(screen.getByTestId('scale-mode')).toHaveTextContent('relative-au')

    await user.click(screen.getByRole('button', { name: /schematic/i }))
    expect(screen.getByTestId('scale-mode')).toHaveTextContent('schematic')
  })
})

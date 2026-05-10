import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import type { BodyVisual } from '../../types'
import type { GeneratedSystem } from '../../../types'
import { Body } from '../Body'
import { BodyLookupProvider } from '../bodyLookup'
import { LayerToggles } from '../../chrome/LayerToggles'
import { ViewerContextProvider } from '../../chrome/ViewerContext'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}))

vi.mock('../Ring', () => ({
  Ring: () => <div data-testid="ring" />,
}))

vi.mock('../Moon', () => ({
  Moon: () => <div data-testid="moon" />,
}))

vi.mock('../MoonOrbit', () => ({
  MoonOrbit: () => <div data-testid="moon-orbit" />,
}))

vi.mock('../SettlementPin', () => ({
  SettlementPin: () => <div data-testid="settlement-pin" />,
}))

const body: BodyVisual = {
  id: 'body-1',
  orbitRadius: 12,
  orbitTiltY: 0,
  phase0: 0,
  angularSpeed: 0.1,
  visualSize: 1.2,
  shading: 'rocky-warm',
  renderArchetype: 'rocky',
  category: 'rocky-planet',
  rings: {
    innerRadius: 1.6,
    outerRadius: 2.2,
    tilt: 0,
    bandCount: 3,
    color: '#d6a96b',
  },
  moons: [{
    id: 'moon-1',
    parentBodyId: 'body-1',
    parentRelativeOrbit: 2.5,
    phase0: 0,
    angularSpeed: 0.2,
    orbitTilt: 0,
    visualSize: 0.2,
    shading: 'dwarf',
  }],
  guAccent: false,
  hasSettlements: true,
  settlementIds: ['settlement-1'],
  ruinIds: [],
}

function renderBody(ui: ReactNode) {
  const system = { bodies: [] } as unknown as GeneratedSystem
  return render(
    <ViewerContextProvider>
      <LayerToggles />
      <BodyLookupProvider system={system}>
        {ui}
      </BodyLookupProvider>
    </ViewerContextProvider>,
  )
}

describe('Body layer rendering', () => {
  it('hides physical satellites and rings without hiding human pins', async () => {
    const user = userEvent.setup()
    renderBody(<Body body={body} />)

    expect(screen.getByTestId('ring')).toBeInTheDocument()
    expect(screen.getByTestId('moon')).toBeInTheDocument()
    expect(screen.getByTestId('settlement-pin')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /physical/i }))

    expect(screen.queryByTestId('ring')).not.toBeInTheDocument()
    expect(screen.queryByTestId('moon')).not.toBeInTheDocument()
    expect(screen.getByTestId('settlement-pin')).toBeInTheDocument()
  })

  it('shows all moon orbit rings when the moon orbit layer is enabled', async () => {
    const user = userEvent.setup()
    renderBody(<Body body={body} />)

    expect(screen.queryByTestId('moon-orbit')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /moon orbits/i }))

    expect(screen.getByTestId('moon-orbit')).toBeInTheDocument()
  })
})

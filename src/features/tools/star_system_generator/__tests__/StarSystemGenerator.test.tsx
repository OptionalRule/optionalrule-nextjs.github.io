import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StarSystemGenerator from '..'

describe('StarSystemGenerator', () => {
  it('renders a seeded system profile', () => {
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7f3a9c2e41b8d09a')

    render(<StarSystemGenerator />)

    expect(screen.getByText('Sci-Fi TTRPG Star System Generator')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'System summary' })).toBeInTheDocument()
    expect(screen.getAllByText(/star/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Stellar class note:/)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Star system sections' })).toBeInTheDocument()
    expect(screen.getByText('Confidence labels')).toBeInTheDocument()
    expect(screen.getByText('Orbital Profile')).toBeInTheDocument()
    expect(screen.getByText('Geometric Unity Overlay')).toBeInTheDocument()
    expect(screen.getByText('Sites & Settlements')).toBeInTheDocument()
    expect(screen.getByText('Human layer')).toBeInTheDocument()
    expect(screen.getByText('Atmosphere')).toBeInTheDocument()
    expect(screen.getByText('Orbital Companions')).toBeInTheDocument()
    expect(screen.getByText('Survey Notes')).toBeInTheDocument()
    expect(screen.getByText('Rings, Economy, Sites')).toBeInTheDocument()
    expect(screen.getAllByText('Why It Exists').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trouble').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adventure Texture').length).toBeGreaterThan(0)
    expect(screen.getByText('Human Remnants')).toBeInTheDocument()
    expect(screen.getByText('System Phenomena')).toBeInTheDocument()
    expect(screen.getByDisplayValue('7f3a9c2e41b8d09a')).toBeInTheDocument()
  })

  it('randomizes the seed without triggering a render-phase update warning', async () => {
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7f3a9c2e41b8d09a')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<StarSystemGenerator />)
    await userEvent.click(screen.getByText('Random'))

    expect(consoleError.mock.calls.flat().join('\n')).not.toContain('Cannot update a component')

    consoleError.mockRestore()
  })
})

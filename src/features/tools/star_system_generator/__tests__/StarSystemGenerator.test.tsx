import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StarSystemGenerator from '..'

describe('StarSystemGenerator', () => {
  it('renders a seeded system profile', async () => {
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7f3a9c2e41b8d09a')

    render(<StarSystemGenerator />)

    expect(screen.getByText('Sci-Fi TTRPG Star System Generator')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'System summary' })).toBeInTheDocument()
    expect(screen.getAllByText(/star/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Stellar class note:/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Star system sections' })).not.toBeInTheDocument()
    expect(screen.queryByText('Confidence labels')).not.toBeInTheDocument()
    expect(screen.getByText('Orbital Bodies')).toBeInTheDocument()
    expect(screen.getByText('Geometric Unity Overlay')).toBeInTheDocument()
    expect(screen.getByText('Sites & Settlements')).toBeInTheDocument()
    expect(screen.getByText('Human Remnants')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeDisabled()
    expect(screen.queryByText('Orbital Companions')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }))

    expect(screen.getAllByText('Atmosphere').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Orbital Companions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Survey Notes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Rings, Economy, Sites').length).toBeGreaterThan(0)
    expect(screen.queryByText('Why It Exists')).not.toBeInTheDocument()
    expect(screen.getAllByText('Activity level:').length).toBeGreaterThan(0)
    expect(screen.queryByText('Presence roll:')).not.toBeInTheDocument()
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trouble').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adventure Texture').length).toBeGreaterThan(0)
    expect(screen.getByText('System Phenomena')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Export' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show exports' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Copy Markdown' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Markdown export')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show exports' }))

    expect(screen.getByRole('button', { name: 'Hide exports' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Copy Markdown' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
    expect((screen.getByLabelText('Markdown export') as HTMLTextAreaElement).value).toContain('## Orbital Bodies')
    expect((screen.getByLabelText('JSON export') as HTMLTextAreaElement).value).toContain('"bodies"')
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

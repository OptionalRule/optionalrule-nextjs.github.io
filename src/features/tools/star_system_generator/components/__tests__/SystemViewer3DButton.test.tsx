import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GeneratedSystem } from '../../types'
import { SystemViewer3DButton } from '../SystemViewer3DButton'

vi.mock('next/dynamic', () => ({
  default: () => function MockedModal({ onClose }: { onClose: () => void }) {
    return (
      <div role="dialog" aria-label="3D system viewer">
        Mocked viewer
        <button onClick={onClose}>close-mock</button>
      </div>
    )
  },
}))

const fakeSystem = {} as unknown as GeneratedSystem

describe('SystemViewer3DButton', () => {
  it('renders a button with an accessible label', () => {
    render(<SystemViewer3DButton system={fakeSystem} />)
    expect(screen.getByRole('button', { name: /3d viewer|view in 3d|open 3d/i })).toBeInTheDocument()
  })

  it('opens the modal when clicked', async () => {
    const user = userEvent.setup()
    render(<SystemViewer3DButton system={fakeSystem} />)
    await user.click(screen.getByRole('button', { name: /3d/i }))
    expect(await screen.findByRole('dialog', { name: /3d system viewer/i })).toBeInTheDocument()
  })

  it('closes the modal via onClose', async () => {
    const user = userEvent.setup()
    render(<SystemViewer3DButton system={fakeSystem} />)
    await user.click(screen.getByRole('button', { name: /3d/i }))
    await user.click(await screen.findByText('close-mock'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

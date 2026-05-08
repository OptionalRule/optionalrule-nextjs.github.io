import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewerModal } from '../ViewerModal'

describe('ViewerModal', () => {
  it('renders into a portal with role=dialog and aria-modal', () => {
    render(<ViewerModal title="Test System" onClose={() => undefined}><p>body</p></ViewerModal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Test System')
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('locks page scroll while open and restores on unmount', () => {
    const original = document.body.style.overflow
    const { unmount } = render(<ViewerModal title="X" onClose={() => undefined}><p>body</p></ViewerModal>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe(original)
  })
})

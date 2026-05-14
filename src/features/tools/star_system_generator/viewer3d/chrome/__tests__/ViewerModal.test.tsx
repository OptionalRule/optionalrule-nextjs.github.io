import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ViewerModal } from '../ViewerModal'
import { ViewerContextProvider } from '../ViewerContext'

function renderModal(ui: ReactNode) {
  return render(<ViewerContextProvider>{ui}</ViewerContextProvider>)
}

describe('ViewerModal', () => {
  it('renders into a portal with role=dialog and aria-modal', () => {
    renderModal(<ViewerModal title="Test System" onClose={() => undefined}><p>body</p></ViewerModal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Test System')
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when a close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(<ViewerModal title="X" onClose={onClose}><p>body</p></ViewerModal>)
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    expect(closeButtons.length).toBeGreaterThan(0)
    await user.click(closeButtons[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('renders a single close button in the header', () => {
    renderModal(<ViewerModal title="X" onClose={() => undefined}><p>body</p></ViewerModal>)
    expect(screen.getAllByRole('button', { name: /close/i })).toHaveLength(1)
  })

  it('locks page scroll while open and restores on unmount', () => {
    const original = document.body.style.overflow
    const { unmount } = renderModal(<ViewerModal title="X" onClose={() => undefined}><p>body</p></ViewerModal>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe(original)
  })
})

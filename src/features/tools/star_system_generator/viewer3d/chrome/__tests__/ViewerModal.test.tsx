import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ViewerModal } from '../ViewerModal'
import { ViewerContextProvider, useLayers } from '../ViewerContext'

function LayersProbe() {
  const { layers } = useLayers()
  return <output data-testid="layers">{JSON.stringify(layers)}</output>
}

function layerState(): Record<string, boolean> {
  return JSON.parse(screen.getByTestId('layers').textContent ?? '{}') as Record<string, boolean>
}

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

  it.each([
    ['1', 'physical'],
    ['2', 'gu'],
    ['3', 'human'],
    ['4', 'moonOrbits'],
  ])('toggles a layer when %s is pressed', (key, layer) => {
    renderModal(<ViewerModal title="X" onClose={() => undefined}><LayersProbe /></ViewerModal>)
    const before = layerState()[layer]
    expect(typeof before).toBe('boolean')
    fireEvent.keyDown(window, { key })
    expect(layerState()[layer]).toBe(!before)
    fireEvent.keyDown(window, { key })
    expect(layerState()[layer]).toBe(before)
  })

  it('wraps Tab focus from the last focusable element to the first', () => {
    renderModal(<ViewerModal title="X" onClose={() => undefined}><button type="button">Inner</button></ViewerModal>)
    const close = screen.getByRole('button', { name: /close/i })
    const inner = screen.getByRole('button', { name: 'Inner' })
    inner.focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
  })

  it('wraps Shift+Tab focus from the first focusable element to the last', () => {
    renderModal(<ViewerModal title="X" onClose={() => undefined}><button type="button">Inner</button></ViewerModal>)
    const close = screen.getByRole('button', { name: /close/i })
    const inner = screen.getByRole('button', { name: 'Inner' })
    close.focus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(inner)
  })

  it('leaves Tab alone when focus is not on an edge element', () => {
    renderModal(
      <ViewerModal title="X" onClose={() => undefined}>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </ViewerModal>,
    )
    const middle = screen.getByRole('button', { name: 'Middle' })
    middle.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(middle)
  })
})

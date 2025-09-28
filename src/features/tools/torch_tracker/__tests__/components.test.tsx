import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { lightSourceCatalog } from '../data/lightSources'
import { createActiveSourceFromCatalog } from '../lib/catalog'
import { CatalogButton } from '../components/CatalogButton'
import { CatalogPanel } from '../components/CatalogPanel'
import { ActiveLightCard } from '../components/ActiveLightCard'
import { TorchTrackerHeader } from '../components/TorchTrackerHeader'
import type { ActiveLightSource } from '../types'
import type { CentralTimerSnapshot } from '../types'

const sampleEntry = lightSourceCatalog[0]
const buildActive = (overrides: Partial<ActiveLightSource> = {}): ActiveLightSource => ({
  ...createActiveSourceFromCatalog(sampleEntry, {
    instanceId: 'torch-1',
    remainingSeconds: 600,
  }),
  ...overrides,
})

describe('CatalogButton', () => {
  it('calls onSelect when clicked and reflects selection state', () => {
    const handleSelect = vi.fn()
    render(<CatalogButton entry={sampleEntry} onSelect={handleSelect} selected />)

    const button = screen.getByRole('button', { name: new RegExp(sampleEntry.name, 'i') })
    expect(button).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(button)
    expect(handleSelect).toHaveBeenCalledWith(sampleEntry)
  })
})

describe('CatalogPanel', () => {
  it('renders grouped catalog entries and forwards selection', () => {
    const handleSelect = vi.fn()
    render(<CatalogPanel entries={lightSourceCatalog} onSelect={handleSelect} />)

    expect(screen.getByRole('navigation', { name: /catalog/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(sampleEntry.name, 'i') }))
    expect(handleSelect).toHaveBeenCalled()
  })
})

describe('ActiveLightCard', () => {
  it('toggles pause via click and reports pressed state', () => {
    const onPause = vi.fn()
    const onResume = vi.fn()
    const onRemove = vi.fn()
    const source = buildActive()

    render(
      <ActiveLightCard source={source} onPause={onPause} onResume={onResume} onRemove={onRemove} />,
    )

    const card = screen.getByRole('button', { name: source.label })
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveAttribute('data-state', 'active')

    fireEvent.click(card)
    expect(onPause).toHaveBeenCalledWith(source)
    expect(onResume).not.toHaveBeenCalled()
  })

  it('resumes a paused light when triggering keyboard interaction', () => {
    const onResume = vi.fn()
    const pausedSource = buildActive({ status: 'paused', isPaused: true })

    render(
      <ActiveLightCard
        source={pausedSource}
        onPause={vi.fn()}
        onResume={onResume}
        onRemove={vi.fn()}
      />,
    )

    const card = screen.getByRole('button', { name: pausedSource.label })
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(card).toHaveAttribute('data-state', 'inactive')

    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onResume).toHaveBeenCalledWith(pausedSource)
  })

  it('exposes remove control without toggling the card state', () => {
    const onPause = vi.fn()
    const onRemove = vi.fn()
    const source = buildActive()

    render(
      <ActiveLightCard source={source} onPause={onPause} onResume={vi.fn()} onRemove={onRemove} />,
    )

    const removeButton = screen.getByRole('button', { name: `Remove ${source.label}` })
    fireEvent.click(removeButton)
    expect(onRemove).toHaveBeenCalledWith(source)
    expect(onPause).not.toHaveBeenCalled()
  })

  it('falls back to icon display when the image fails to load', () => {
    const source = buildActive()

    render(
      <ActiveLightCard source={source} onPause={vi.fn()} onResume={vi.fn()} onRemove={vi.fn()} />,
    )

    const image = screen.getByAltText(`Lit ${source.label}`)
    fireEvent.error(image)

    const card = screen.getByRole('button', { name: source.label })
    expect(card).toHaveAttribute('data-image-state', 'fallback')
    expect(screen.getByRole('img', { name: `Lit ${source.label}` })).toBeInTheDocument()
  })
})

describe('TorchTrackerHeader', () => {
  it('exposes clock and auto advance controls', () => {
    const toggleClock = vi.fn()
    const resetAll = vi.fn()
    const toggleAuto = vi.fn()
    const centralTimer: CentralTimerSnapshot = {
      isInitialized: true,
      totalSeconds: 600,
      remainingSeconds: 540,
      elapsedSeconds: 60,
    }

    render(
      <TorchTrackerHeader
        activeCount={2}
        isClockRunning={false}
        centralTimer={centralTimer}
        autoAdvance={true}
        onToggleClock={toggleClock}
        onResetAll={resetAll}
        onToggleAutoAdvance={toggleAuto}
        catalog={<div>catalog</div>}
      />,
    )

    expect(screen.getByText(/torch tracker/i)).toBeInTheDocument()
    expect(screen.getAllByText(/central timer/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/9:00 remaining/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start clock/i }))
    expect(toggleClock).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /reset all/i }))
    expect(resetAll).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('switch', { name: /auto advance/i }))
    expect(toggleAuto).toHaveBeenCalledWith(false)
  })
})

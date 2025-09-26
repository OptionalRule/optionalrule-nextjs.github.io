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
  it('fires pause, resume, and remove callbacks', () => {
    const onPause = vi.fn()
    const onResume = vi.fn()
    const onRemove = vi.fn()

    render(
      <ActiveLightCard
        source={buildActive()}
        onPause={onPause}
        onResume={onResume}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByText(/time active/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(onPause).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalled()
  })

  it('shows resume button and visibility control when paused and handler provided', () => {
    const onResume = vi.fn()
    const onToggleVisibility = vi.fn()
    const pausedSource = buildActive({ status: 'paused', isPaused: true })

    render(
      <ActiveLightCard
        source={pausedSource}
        onPause={vi.fn()}
        onResume={onResume}
        onRemove={vi.fn()}
        onToggleVisibility={onToggleVisibility}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /resume/i }))
    expect(onResume).toHaveBeenCalledWith(pausedSource)

    fireEvent.click(screen.getByRole('button', { name: /affects visibility|lone light/i }))
    expect(onToggleVisibility).toHaveBeenCalledWith(pausedSource)
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

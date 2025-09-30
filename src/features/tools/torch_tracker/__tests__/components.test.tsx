import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { lightSourceCatalog } from '../data/lightSources'
import { createActiveSourceFromCatalog } from '../lib/catalog'
import { CatalogButton } from '../components/CatalogButton'
import { CatalogPanel } from '../components/CatalogPanel'
import { ActiveLightCard } from '../components/ActiveLightCard'
import { CircularCountdownTimer } from '../components/CircularCountdownTimer'
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
    vi.useFakeTimers()
    try {
      const onPause = vi.fn()
      const onRemove = vi.fn()
      const source = buildActive()

      render(
        <ActiveLightCard source={source} onPause={onPause} onResume={vi.fn()} onRemove={onRemove} />,
      )

      const removeButton = screen.getByRole('button', { name: `Remove ${source.label}` })
      fireEvent.click(removeButton)
      expect(onRemove).not.toHaveBeenCalled()
      vi.runAllTimers()
      expect(onRemove).toHaveBeenCalledWith(source)
      expect(onPause).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
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

  it('hides bright radius metric on inactive face', () => {
    const pausedSource = buildActive({ status: 'paused', isPaused: true })

    render(
      <ActiveLightCard
        source={pausedSource}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    const metrics = screen.getAllByLabelText(/Bright radius/i, {
      selector: '.torch-card-metric',
      hidden: true,
    })

    metrics.forEach((metric) => {
      expect(metric).toHaveAttribute('aria-hidden', 'true')
    })
  })
})

describe('TorchTrackerHeader', () => {
  it('renders clock controls, catalog bar, and countdown timer', () => {
    const toggleClock = vi.fn()
    const resetAll = vi.fn()
    const advanceTimer = vi.fn()
    const centralTimer: CentralTimerSnapshot = {
      isInitialized: true,
      totalSeconds: 600,
      remainingSeconds: 540,
      elapsedSeconds: 60,
    }

    render(
      <TorchTrackerHeader
        isClockRunning={false}
        centralTimer={centralTimer}
        onToggleClock={toggleClock}
        onResetAll={resetAll}
        onAdvance={advanceTimer}
        canAdvance={true}
        canToggleClock={true}
        canReset={true}
        isPersistenceEnabled
        onTogglePersistence={vi.fn()}
        persistenceTooltip="Auto-save stores this session in your browser"
        catalog={<div>catalog</div>}
      />,
    )

    expect(screen.getByText(/torch tracker/i)).toBeInTheDocument()
    expect(screen.getByText(/catalog/i)).toBeInTheDocument()
    expect(screen.getByText('9:00')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start clock/i }))
    expect(toggleClock).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /reset all light sources/i }))
    expect(resetAll).toHaveBeenCalled()

    const skipButton = screen.getByRole('button', { name: /skip 1 minute/i })
    expect(skipButton).not.toBeDisabled()
    expect(skipButton).toHaveAttribute('title', 'Skip 1 min')
    fireEvent.click(skipButton)
    expect(advanceTimer).toHaveBeenCalled()

    const persistenceButton = screen.getByRole('button', { name: /auto-save enabled/i })
    expect(persistenceButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables clock and reset controls with explanatory tooltips', () => {
    const centralTimer: CentralTimerSnapshot = {
      isInitialized: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      elapsedSeconds: 0,
    }

    render(
      <TorchTrackerHeader
        isClockRunning={false}
        centralTimer={centralTimer}
        onToggleClock={vi.fn()}
        onResetAll={vi.fn()}
        onAdvance={vi.fn()}
        canAdvance={false}
        canToggleClock={false}
        clockDisabledReason="Add a light to use the clock"
        canReset={false}
        resetDisabledReason="No lights to reset"
        isPersistenceEnabled={false}
        onTogglePersistence={vi.fn()}
        persistenceTooltip="Auto-save is off for this session"
      />,
    )

    const clockButton = screen.getByRole('button', { name: /start clock/i })
    expect(clockButton).toBeDisabled()
    expect(clockButton).toHaveAttribute('title', 'Add a light to use the clock')

    const resetButton = screen.getByRole('button', { name: /reset all light sources/i })
    expect(resetButton).toBeDisabled()
    expect(resetButton).toHaveAttribute('title', 'No lights to reset')

    const persistenceButton = screen.getByRole('button', { name: /auto-save disabled/i })
    expect(persistenceButton).toHaveAttribute('aria-pressed', 'false')
    expect(persistenceButton).toHaveAttribute('title', 'Auto-save is off for this session')

    const skipButton = screen.getByRole('button', { name: /skip 1 minute/i })
    expect(skipButton).toBeDisabled()
  })
})

describe('CircularCountdownTimer', () => {
  it('announces progress and displays formatted time', async () => {
    const initialTimer: CentralTimerSnapshot = {
      isInitialized: true,
      totalSeconds: 1200,
      remainingSeconds: 1200,
      elapsedSeconds: 0,
    }

    const { rerender } = render(<CircularCountdownTimer timer={initialTimer} />)

    expect(screen.getByText('20:00')).toBeInTheDocument()

    await screen.findByText(/20 minutes remaining/i)

    rerender(
      <CircularCountdownTimer
        timer={{ ...initialTimer, remainingSeconds: 0, elapsedSeconds: 1200 }}
      />,
    )

    await screen.findByText(/timer expired/i)
  })
})

describe('TorchTrackerHeader disabled states', () => {
  it('disables skip forward when cannot advance', () => {
    render(
      <TorchTrackerHeader
        isClockRunning={true}
        centralTimer={{ isInitialized: true, totalSeconds: 600, remainingSeconds: 600, elapsedSeconds: 0 }}
        onToggleClock={vi.fn()}
        onResetAll={vi.fn()}
        onAdvance={vi.fn()}
        canAdvance={false}
        catalog={<div>catalog</div>}
      />,
    )

    expect(screen.getByRole('button', { name: /skip 1 minute/i })).toBeDisabled()
  })
})

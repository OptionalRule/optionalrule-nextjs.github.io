'use client'

import type { ReactNode } from 'react'
import { CirclePause, CirclePlay as CircleStart, TimerReset } from 'lucide-react'

import type { CentralTimerSnapshot } from '../types'
import { CircularCountdownTimer } from './CircularCountdownTimer'

export interface TorchTrackerHeaderProps {
  isClockRunning: boolean
  centralTimer: CentralTimerSnapshot
  onToggleClock: (nextRunning: boolean) => void
  onResetAll: () => void
  onOpenHelp?: () => void
  catalog?: ReactNode
  className?: string
}

export function TorchTrackerHeader({
  isClockRunning,
  centralTimer,
  onToggleClock,
  onResetAll,
  onOpenHelp,
  catalog,
  className,
}: TorchTrackerHeaderProps) {
  const clockLabel = isClockRunning ? 'Pause clock' : 'Start clock'

  return (
    <header
      className={`flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/70 p-6 shadow ${className ?? ''}`.trim()}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3 md:max-w-2xl">
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              Torch Tracker
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Coordinate every flame from one countdown. Add a light to begin the shared burn timer.
            </p>
          </div>
          {onOpenHelp && (
            <button
              type="button"
              className="inline-flex w-fit items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              onClick={onOpenHelp}
            >
              Quick Tutorial
            </button>
          )}
        </div>
        <CircularCountdownTimer
          timer={centralTimer}
          className="order-last md:order-none md:ml-auto md:self-start"
          size={104}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            onClick={() => onToggleClock(!isClockRunning)}
            aria-pressed={isClockRunning}
            aria-label={clockLabel}
            title={clockLabel}
          >
            {isClockRunning ? (
              <CirclePause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <CircleStart className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            onClick={onResetAll}
            aria-label="Reset all light sources"
            title="Reset all light sources"
          >
            <TimerReset className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {catalog ? <div className="w-full md:w-auto">{catalog}</div> : null}
      </div>
    </header>
  )
}

export default TorchTrackerHeader

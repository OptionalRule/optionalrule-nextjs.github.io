'use client'

import type { ReactNode } from 'react'
import { CirclePause, CirclePlay as CircleStart, TimerReset } from 'lucide-react'

import type { CentralTimerSnapshot } from '../types'
import { formatSecondsAsClock } from '../utils/time'

export interface TorchTrackerHeaderProps {
  activeCount: number
  isClockRunning: boolean
  centralTimer: CentralTimerSnapshot
  autoAdvance: boolean
  onToggleClock: (nextRunning: boolean) => void
  onResetAll: () => void
  onToggleAutoAdvance: (nextValue: boolean) => void
  onOpenHelp?: () => void
  catalog?: ReactNode
  className?: string
}

export function TorchTrackerHeader({
  activeCount,
  isClockRunning,
  centralTimer,
  autoAdvance,
  onToggleClock,
  onResetAll,
  onToggleAutoAdvance,
  onOpenHelp,
  catalog,
  className,
}: TorchTrackerHeaderProps) {
  const timerIsActive = centralTimer.isInitialized && centralTimer.totalSeconds > 0
  const remainingLabel = formatSecondsAsClock(centralTimer.remainingSeconds)
  const totalLabel = formatSecondsAsClock(centralTimer.totalSeconds)
  const elapsedLabel = formatSecondsAsClock(centralTimer.elapsedSeconds)
  const timerStatusLabel = isClockRunning ? 'Running' : 'Paused'
  const percentElapsed =
    centralTimer.totalSeconds === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round((centralTimer.elapsedSeconds / centralTimer.totalSeconds) * 100)),
        )
  return (
    <header
      className={`flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/70 p-6 shadow ${className ?? ''}`.trim()}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wide text-[var(--text-primary)]">
            Torch Tracker
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Monitor torches, lanterns, spells, and fires with unified turn tracking.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-3)] bg-[var(--surface-1)] px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>{activeCount} active</span>
          </span>
        </div>
      </div>

      <section className="space-y-2" aria-label="Central torch timer">
        {timerIsActive ? (
          <>
            <div className="flex flex-wrap items-baseline gap-3 text-sm text-[var(--text-secondary)]">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                Central Timer
              </span>
              <span aria-live="polite">{remainingLabel} remaining</span>
              <span className="text-[var(--text-tertiary)]">/ {totalLabel} total</span>
              <span className="text-[var(--text-tertiary)]">({timerStatusLabel})</span>
              <span className="text-[var(--text-tertiary)]">{elapsedLabel} elapsed</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent)] transition-[width]"
                style={{ width: `${percentElapsed}%` }}
                aria-hidden="true"
              />
              <span className="sr-only">Central timer {percentElapsed}% complete</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Add a light source to start the central timer and track total party burn time.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          onClick={() => onToggleClock(!isClockRunning)}
          aria-pressed={isClockRunning}
          aria-label={isClockRunning ? 'Pause Clock' : 'Start Clock'}
          title={isClockRunning ? 'Pause Clock' : 'Start Clock'}
        >
          {isClockRunning ? (
            <CirclePause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <CircleStart className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          onClick={onResetAll}
          aria-label="Reset All"
          title="Reset All"
        >
          <TimerReset className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={autoAdvance}
          className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            autoAdvance ? 'bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[var(--accent)]' : 'bg-[var(--surface-1)] text-[var(--text-secondary)]'
          }`}
          onClick={() => onToggleAutoAdvance(!autoAdvance)}
        >
          <span className="inline-flex h-4 w-8 items-center rounded-full bg-[var(--surface-3)]">
            <span
              className="mx-1 h-3 w-3 rounded-full bg-white transition-transform"
              style={{ transform: autoAdvance ? 'translateX(12px)' : 'translateX(0)' }}
            />
          </span>
          Auto Advance
        </button>
        {onOpenHelp && (
          <button
            type="button"
            className="ml-auto inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            onClick={onOpenHelp}
          >
            Quick Tutorial
          </button>
        )}
      </div>
      {catalog ? <div className="pt-1">{catalog}</div> : null}
    </header>
  )
}

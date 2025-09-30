'use client'

import type { ReactNode } from 'react'
import { FastForward, Pause, Play, Save, SaveOff, TimerReset } from 'lucide-react'

import type { CentralTimerSnapshot } from '../types'
import { CircularCountdownTimer } from './CircularCountdownTimer'

export interface TorchTrackerHeaderProps {
  isClockRunning: boolean
  centralTimer: CentralTimerSnapshot
  onToggleClock: (nextRunning: boolean) => void
  onResetAll: () => void
  onAdvance: () => void
  canAdvance: boolean
  canToggleClock: boolean
  clockDisabledReason?: string
  canReset: boolean
  resetDisabledReason?: string
  isPersistenceEnabled: boolean
  onTogglePersistence: (nextEnabled: boolean) => void
  persistenceTooltip?: string
  onOpenHelp?: () => void
  catalog?: ReactNode
  className?: string
}

export function TorchTrackerHeader({
  isClockRunning,
  centralTimer,
  onToggleClock,
  onResetAll,
  onAdvance,
  canAdvance,
  canToggleClock,
  clockDisabledReason,
  canReset,
  resetDisabledReason,
  isPersistenceEnabled,
  onTogglePersistence,
  persistenceTooltip,
  onOpenHelp,
  catalog,
  className,
}: TorchTrackerHeaderProps) {
  const clockLabel = isClockRunning ? 'Pause clock' : 'Start clock'
  const clockTitle = !canToggleClock && clockDisabledReason ? clockDisabledReason : clockLabel
  const resetTitle = !canReset && resetDisabledReason ? resetDisabledReason : 'Reset all light sources'
  const persistenceLabel = isPersistenceEnabled ? 'Auto-save enabled' : 'Auto-save disabled'
  const persistenceTitle = persistenceTooltip ?? persistenceLabel

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
              Manage your party&apos;s light sources in real time. Add a light to begin.
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
            className={
              canToggleClock
                ? 'inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-warm)] border-2 border-[var(--accent-warm-hover)] text-white shadow-lg transition-all duration-200 hover:bg-[var(--accent-warm-hover)] hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]'
                : 'inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--state-disabled)] border-2 border-[var(--border)] text-[var(--text-muted)] shadow-none cursor-not-allowed opacity-50'
            }
            onClick={() => onToggleClock(!isClockRunning)}
            aria-pressed={isClockRunning}
            aria-label={clockLabel}
            title={clockTitle}
            disabled={!canToggleClock}
          >
            {isClockRunning ? (
              <Pause className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Play className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onResetAll}
            aria-label="Reset all light sources"
            title={resetTitle}
            disabled={!canReset}
          >
            <TimerReset className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAdvance}
            aria-label="Skip 1 minute"
            title="Skip 1 min"
            disabled={!canAdvance}
          >
            <FastForward className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={
              isPersistenceEnabled
                ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--success)] bg-[var(--success-light)] text-[var(--success)] transition-all duration-200 hover:border-[var(--success)] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]'
                : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--text-tertiary)] hover:text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]'
            }
            onClick={() => onTogglePersistence(!isPersistenceEnabled)}
            aria-pressed={isPersistenceEnabled}
            aria-label={persistenceLabel}
            title={persistenceTitle}
          >
            {isPersistenceEnabled ? (
              <Save className="h-5 w-5" aria-hidden="true" />
            ) : (
              <SaveOff className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {catalog ? <div className="w-full md:w-auto">{catalog}</div> : null}
      </div>
    </header>
  )
}

export default TorchTrackerHeader

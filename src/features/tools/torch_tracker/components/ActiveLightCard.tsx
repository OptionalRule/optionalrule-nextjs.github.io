'use client'

import type { ActiveLightSource } from '../types'
import { formatSecondsAsClock } from '../utils/time'

export interface ActiveLightCardProps {
  source: ActiveLightSource
  onPause: (source: ActiveLightSource) => void
  onResume: (source: ActiveLightSource) => void
  onRemove: (source: ActiveLightSource) => void
  onToggleVisibility?: (source: ActiveLightSource) => void
  className?: string
}

export function ActiveLightCard({
  source,
  onPause,
  onResume,
  onRemove,
  onToggleVisibility,
  className,
}: ActiveLightCardProps) {
  const isPaused = source.status === 'paused'
  const statusLabel = isPaused ? 'Paused' : 'Active'
  const elapsedSeconds = source.elapsedSeconds
  const timeActiveLabel = formatSecondsAsClock(elapsedSeconds)

  const handlePauseResume = () => {
    if (isPaused) onResume(source)
    else onPause(source)
  }

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/75 p-5 shadow-sm transition hover:border-[var(--accent)] hover:shadow-md ${className ?? ''}`.trim()}
      aria-label={`${source.label} light source card`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-xl">
            {source.icon || '🔥'}
          </span>
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--text-primary)]">{source.label}</h3>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              {statusLabel} • {source.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-3)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} aria-hidden="true" />
            <span>{source.brightRadius} ft</span>
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isPaused
              ? 'bg-[color-mix(in_oklab,var(--warning)_18%,transparent)] text-[var(--warning)]'
              : 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[var(--accent)]'
          }`}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Time active</span>
          <span aria-live="polite">{timeActiveLabel}</span>
        </div>
      </div>

      {source.description && (
        <p className="text-sm leading-5 text-[var(--text-secondary)]">{source.description}</p>
      )}
      {source.mishapNote && (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{source.mishapNote}</p>
      )}

      <footer className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-transparent bg-[var(--destructive)] px-3 py-1.5 text-sm text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--destructive)]"
          onClick={() => onRemove(source)}
        >
          Remove
        </button>
        {onToggleVisibility && (
          <button
            type="button"
            className="ml-auto inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            onClick={() => onToggleVisibility(source)}
            aria-pressed={source.isAffectingVisibility}
          >
            {source.isAffectingVisibility ? 'Affects Visibility' : 'Lone Light'}
          </button>
        )}
      </footer>
    </article>
  )
}

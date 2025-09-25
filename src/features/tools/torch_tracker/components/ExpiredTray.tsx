'use client'

import type { ActiveLightSource } from '../types'

export interface ExpiredTrayProps {
  sources: ActiveLightSource[]
  onRestore?: (source: ActiveLightSource) => void
  onRemove?: (source: ActiveLightSource) => void
  className?: string
}

export function ExpiredTray({ sources, onRestore, onRemove, className }: ExpiredTrayProps) {
  const hasItems = sources.length > 0

  return (
    <section
      className={`rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)]/50 p-5 ${
        hasItems ? 'shadow-inner' : ''
      } ${className ?? ''}`.trim()}
      aria-label="Expired light sources"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Expired Sources
        </h2>
        <span className="text-xs text-[var(--text-secondary)]">{sources.length}</span>
      </header>

      {!hasItems && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          No expired lights right now. Keep an eye on the clock!
        </p>
      )}

          {hasItems && (
            <ul className="mt-4 space-y-3">
              {sources.map((source) => (
                <li key={source.instanceId} className="flex items-center gap-3 rounded-xl border border-[var(--surface-3)] bg-[var(--surface-1)]/80 p-3">
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{source.label}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Burned out after {source.totalRounds} rounds ({Math.round((source.elapsedSeconds ?? source.totalSeconds) / 60)} minutes active)
                    </span>
                  </div>
              {onRestore && (
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-xs text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  onClick={() => onRestore(source)}
                >
                  Restore
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-transparent bg-[var(--destructive)] px-3 py-1 text-xs text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--destructive)]"
                  onClick={() => onRemove(source)}
                >
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

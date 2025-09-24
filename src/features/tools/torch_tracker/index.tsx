'use client'

import { useCallback, useMemo, useState } from 'react'

import { lightSourceCatalog, DEFAULT_TURN_MINUTES } from './data/lightSources'
import { useTorchTrackerState } from './hooks/useTorchTrackerState'
import { useGameClock } from './hooks/useGameClock'
import {
  CatalogPanel,
  ActiveLightCard,
  ExpiredTray,
  TorchTrackerHeader,
  TorchTrackerLayout,
} from './components'
import type { ActiveLightSource, TorchCatalogEntry } from './types'
import { formatSourceSummary } from './utils/accessibility'
import './styles.css'

const ROUND_SECONDS = DEFAULT_TURN_MINUTES * 60

export interface TorchTrackerProps {
  className?: string
}

export default function TorchTracker({ className }: TorchTrackerProps) {
  const { state, controller, nextExpiration, brightestRadius } = useTorchTrackerState(lightSourceCatalog)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)

  const addEntry = useCallback(
    (entry: TorchCatalogEntry) => {
      const instance = controller.addFromCatalog(entry.id)
      if (instance) {
        setSelectedCatalogId(entry.id)
        if (state.settings.autoAdvance && !state.settings.isClockRunning) {
          controller.setClockRunning(true, Date.now())
        }
      }
    },
    [controller, state.settings.autoAdvance, state.settings.isClockRunning],
  )

  const handlePause = useCallback(
    (source: ActiveLightSource) => controller.pauseInstance(source.instanceId),
    [controller],
  )

  const handleResume = useCallback(
    (source: ActiveLightSource) => controller.resumeInstance(source.instanceId),
    [controller],
  )

  const handleAdvanceSingle = useCallback(
    (source: ActiveLightSource) => {
      controller.updateInstance(source.instanceId, {
        remainingSeconds: Math.max(0, source.remainingSeconds - source.turnLengthMinutes * 60),
      })
    },
    [controller],
  )

  const handleReset = useCallback(
    (source: ActiveLightSource) => controller.resetInstance(source.instanceId),
    [controller],
  )

  const handleRemove = useCallback(
    (source: ActiveLightSource) => controller.removeInstance(source.instanceId),
    [controller],
  )

  const handleToggleVisibility = useCallback(
    (source: ActiveLightSource) =>
      controller.updateInstance(source.instanceId, {
        isAffectingVisibility: !source.isAffectingVisibility,
      }),
    [controller],
  )

  useGameClock({
    isRunning: state.settings.isClockRunning,
    autoAdvance: state.settings.autoAdvance,
    onTick: (deltaSeconds, now) => controller.tick(deltaSeconds, now),
  })

  const uniqueDisabledIds = useMemo(() => {
    const disabled = new Set<string>()
    state.active.forEach((source) => {
      if (source.catalogId === 'custom-template') {
        disabled.add(source.catalogId)
      }
    })
    return Array.from(disabled)
  }, [state.active])

  const header = (
    <TorchTrackerHeader
      activeCount={state.active.length}
      expiredCount={state.expired.length}
      isClockRunning={state.settings.isClockRunning}
      autoAdvance={state.settings.autoAdvance}
      onToggleClock={(next) => controller.setClockRunning(next, next ? Date.now() : null)}
      onAdvanceRound={() => controller.tick(ROUND_SECONDS)}
      onResetAll={() => controller.resetAll()}
      onToggleAutoAdvance={(next) => controller.toggleAutoAdvance(next)}
    />
  )

  const catalog = (
    <CatalogPanel
      entries={state.catalog}
      selectedId={selectedCatalogId}
      disabledIds={uniqueDisabledIds}
      onSelect={addEntry}
    />
  )

  const activeSection = (
    <section aria-label="Active light sources" className="space-y-4">
      {state.active.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)]/40 p-6 text-sm text-[var(--text-secondary)]">
          No active lights yet. Add one from the catalog to begin tracking.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.active.map((source) => (
          <ActiveLightCard
            key={source.instanceId}
            source={source}
            onPause={handlePause}
            onResume={handleResume}
            onAdvanceRound={handleAdvanceSingle}
            onReset={handleReset}
            onRemove={handleRemove}
            onToggleVisibility={handleToggleVisibility}
          />
        ))}
      </div>
    </section>
  )

  const expiredSection = (
    <ExpiredTray
      sources={state.expired}
      onRestore={(source) => controller.resetInstance(source.instanceId)}
      onRemove={(source) => controller.removeInstance(source.instanceId)}
    />
  )

  const nextExpirationSummary = nextExpiration ? formatSourceSummary(nextExpiration) : 'No active expiration pending'
  const brightestSummary = brightestRadius ? `${brightestRadius.bright}/${brightestRadius.dim} ft` : 'No light radius'

  const insights = (
    <section aria-live="polite" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/60 p-4 text-sm text-[var(--text-secondary)]">
      <div className="flex flex-wrap items-center gap-4">
        <span>Next expiration: {nextExpirationSummary}</span>
        <span>Brightest radius: {brightestSummary}</span>
      </div>
    </section>
  )

  return (
    <div className={`torch-tracker-surface ${className ?? ''}`}>
      <TorchTrackerLayout
        header={header}
        catalog={catalog}
        activeList={
          <div className="space-y-4">
            {insights}
            {activeSection}
          </div>
        }
        expired={expiredSection}
      />
    </div>
  )
}

export { TorchTracker as TorchTrackerComponent }

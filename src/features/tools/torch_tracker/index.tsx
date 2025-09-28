'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { lightSourceCatalog } from './data/lightSources'
import { useTorchTrackerState } from './hooks/useTorchTrackerState'
import { useGameClock } from './hooks/useGameClock'
import { CatalogPanel, ActiveLightCard, TorchTrackerHeader, TorchTrackerLayout } from './components'
import type { ActiveLightSource, TorchCatalogEntry } from './types'
import { getAllImageVariants } from './utils/images'
import './styles.css'

export interface TorchTrackerProps {
  className?: string
}

export default function TorchTracker({ className }: TorchTrackerProps) {
  const { state, controller, centralTimer } = useTorchTrackerState(lightSourceCatalog)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)
  const centrallyPausedIdsRef = useRef<Set<string>>(new Set())

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

  const handleRemove = useCallback(
    (source: ActiveLightSource) => controller.removeInstance(source.instanceId),
    [controller],
  )

  const handleToggleClock = useCallback(
    (nextRunning: boolean) => {
      const now = Date.now()
      if (!nextRunning) {
        const pausedByCentral = new Set(centrallyPausedIdsRef.current)
        state.active.forEach((source) => {
          if (source.status === 'active') {
            pausedByCentral.add(source.instanceId)
            controller.pauseInstance(source.instanceId, now)
          }
        })
        centrallyPausedIdsRef.current = pausedByCentral
        controller.setClockRunning(false, null)
        return
      }

      controller.setClockRunning(true, now)
      if (centrallyPausedIdsRef.current.size === 0) return

      const ids = Array.from(centrallyPausedIdsRef.current)
      centrallyPausedIdsRef.current.clear()
      ids.forEach((instanceId) => {
        const target = state.active.find((source) => source.instanceId === instanceId)
        if (target && target.status === 'paused') {
          controller.resumeInstance(instanceId, now)
        }
      })
    },
    [controller, state.active],
  )

  useEffect(() => {
    if (centrallyPausedIdsRef.current.size === 0) return
    const activeIndex = new Map(state.active.map((source) => [source.instanceId, source]))
    centrallyPausedIdsRef.current.forEach((id) => {
      const target = activeIndex.get(id)
      if (!target || target.status !== 'paused') {
        centrallyPausedIdsRef.current.delete(id)
      }
    })
  }, [state.active])

  useGameClock({
    isRunning: state.settings.isClockRunning,
    autoAdvance: state.settings.autoAdvance,
    onTick: (deltaSeconds, now) => controller.tick(deltaSeconds, now),
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const preloadSources = getAllImageVariants()
    const images: HTMLImageElement[] = []
    preloadSources.forEach((src) => {
      const img = new Image()
      img.src = src
      images.push(img)
    })
    return () => {
      images.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [])

  const catalogBar = (
    <CatalogPanel
      entries={state.catalog}
      selectedId={selectedCatalogId}
      onSelect={addEntry}
      className="w-full"
    />
  )

  const header = (
    <TorchTrackerHeader
      activeCount={state.active.length}
      isClockRunning={state.settings.isClockRunning}
      centralTimer={centralTimer}
      autoAdvance={state.settings.autoAdvance}
      onToggleClock={handleToggleClock}
      onResetAll={() => controller.resetAll()}
      onToggleAutoAdvance={(next) => controller.toggleAutoAdvance(next)}
      catalog={catalogBar}
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
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div className={`torch-tracker-surface ${className ?? ''}`}>
      <TorchTrackerLayout header={header} main={<div className="space-y-4">{activeSection}</div>} />
    </div>
  )
}

export { TorchTracker as TorchTrackerComponent }

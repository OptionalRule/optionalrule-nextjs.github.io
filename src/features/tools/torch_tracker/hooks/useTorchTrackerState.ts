'use client'

import { useMemo, useReducer } from 'react'

import { lightSourceCatalog } from '../data/lightSources'
import { cloneCatalogEntry, createActiveSourceFromCatalog, createCatalogIndex } from '../lib/catalog'
import { selectCentralTimer, selectSettings } from '../lib/selectors'
import type {
  ActiveLightSource,
  CentralTimerSnapshot,
  TorchCatalogEntry,
  TorchTrackerHydrationSnapshot,
  TorchTrackerReducerAction,
  TorchTrackerSettings,
  TorchTrackerState,
} from '../types'

const DEFAULT_SETTINGS: TorchTrackerSettings = {
  isClockRunning: false,
  lastTickTimestamp: null,
}

const minutesToSeconds = (minutes: number) => Math.max(0, Math.round(minutes * 60))

const createInitialCentralTimer = (): CentralTimerSnapshot => ({
  isInitialized: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  elapsedSeconds: 0,
})

const normalizeCentralTimer = (timer: CentralTimerSnapshot | null | undefined): CentralTimerSnapshot => {
  if (!timer || !timer.isInitialized) {
    return createInitialCentralTimer()
  }
  const total = Math.max(0, Math.round(timer.totalSeconds))
  if (total <= 0) {
    return createInitialCentralTimer()
  }
  const remainingRaw = Math.max(0, Math.round(timer.remainingSeconds))
  const remainingSeconds = Math.min(total, remainingRaw)
  const elapsedSeconds = total - remainingSeconds
  return {
    isInitialized: true,
    totalSeconds: total,
    remainingSeconds,
    elapsedSeconds,
  }
}

const normalizeActiveSource = (source: ActiveLightSource): ActiveLightSource => {
  const totalSeconds = minutesToSeconds(source.baseDurationMinutes)
  const remainingSeconds = Math.max(0, Math.min(totalSeconds, source.remainingSeconds))
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds)
  const isPaused = source.isPaused
  const status: ActiveLightSource['status'] = isPaused ? 'paused' : 'active'

  return {
    ...source,
    totalSeconds,
    remainingSeconds,
    elapsedSeconds,
    status,
  }
}

export const createInitialTorchTrackerState = (
  catalogEntries: TorchCatalogEntry[] = lightSourceCatalog,
): TorchTrackerState => ({
  catalog: catalogEntries.map((entry) => cloneCatalogEntry(entry)),
  active: [],
  settings: { ...DEFAULT_SETTINGS },
  centralTimer: createInitialCentralTimer(),
})

const resetActiveSource = (source: ActiveLightSource, timestamp: number): ActiveLightSource =>
  normalizeActiveSource({
    ...source,
    remainingSeconds: source.totalSeconds,
    elapsedSeconds: 0,
    status: 'active',
    isPaused: false,
    lastTickTimestamp: null,
    updatedAt: timestamp,
  })

const updateCollection = (
  collection: ActiveLightSource[],
  instanceId: string,
  updater: (source: ActiveLightSource) => ActiveLightSource,
) => collection.map((item) => (item.instanceId === instanceId ? updater(item) : item))

const removeFromCollection = (collection: ActiveLightSource[], instanceId: string) =>
  collection.filter((item) => item.instanceId !== instanceId)

const applyDeltaToTorchState = (
  state: TorchTrackerState,
  deltaSeconds: number,
  now: number,
): TorchTrackerState => {
  if (deltaSeconds <= 0) {
    return {
      ...state,
      settings: {
        ...state.settings,
        lastTickTimestamp: now,
      },
    }
  }

  let nextActive: ActiveLightSource[] = []
  for (const source of state.active) {
    if (source.isPaused || source.status === 'paused') {
      nextActive.push({ ...source, lastTickTimestamp: now })
      continue
    }
    const nextRemaining = Math.max(0, source.remainingSeconds - deltaSeconds)
    if (nextRemaining <= 0) {
      continue
    }
    const updated: ActiveLightSource = normalizeActiveSource({
      ...source,
      remainingSeconds: nextRemaining,
      updatedAt: now,
      lastTickTimestamp: now,
    })
    nextActive.push(updated)
  }

  let nextCentral: CentralTimerSnapshot = state.centralTimer
  if (state.centralTimer.isInitialized) {
    const remaining = Math.max(0, state.centralTimer.remainingSeconds - deltaSeconds)
    const elapsed = Math.max(0, state.centralTimer.totalSeconds - remaining)
    nextCentral = {
      ...state.centralTimer,
      remainingSeconds: remaining,
      elapsedSeconds: elapsed,
    }
  }

  let isClockRunning = state.settings.isClockRunning
  if (nextCentral.isInitialized && nextCentral.remainingSeconds <= 0) {
    nextActive = []
    isClockRunning = false
    nextCentral = {
      ...nextCentral,
      remainingSeconds: 0,
      elapsedSeconds: nextCentral.totalSeconds,
    }
  }

  if (nextActive.length === 0) {
    nextCentral = createInitialCentralTimer()
    isClockRunning = false
  }

  return {
    ...state,
    active: nextActive,
    centralTimer: nextCentral,
    settings: {
      ...state.settings,
      lastTickTimestamp: now,
      isClockRunning,
    },
  }
}

export const torchTrackerReducer = (
  state: TorchTrackerState,
  action: TorchTrackerReducerAction,
): TorchTrackerState => {
  switch (action.type) {
    case 'catalog/register':
    case 'catalog/refresh': {
      const catalog = action.payload.map((entry) => cloneCatalogEntry(entry))
      return {
        ...state,
        catalog,
      }
    }
    case 'active/add': {
      const normalized = normalizeActiveSource(action.payload)
      const timerSeed = normalized.remainingSeconds > 0 ? normalized.remainingSeconds : normalized.totalSeconds
      const nextCentralTimer = state.centralTimer.isInitialized
        ? state.centralTimer
        : {
            isInitialized: true,
            totalSeconds: timerSeed,
            remainingSeconds: timerSeed,
            elapsedSeconds: 0,
          }

      return {
        ...state,
        active: [...state.active, normalized],
        centralTimer: nextCentralTimer,
      }
    }
    case 'active/update': {
      const { instanceId, ...patch } = action.payload
      const timestamp = Date.now()
      const updateFn = (source: ActiveLightSource): ActiveLightSource => {
        const merged: ActiveLightSource = {
          ...source,
          ...patch,
          baseDurationMinutes: patch.baseDurationMinutes ?? source.baseDurationMinutes,
          turnLengthMinutes: patch.turnLengthMinutes ?? source.turnLengthMinutes,
          updatedAt: timestamp,
        }
        if (patch.baseDurationMinutes !== undefined) {
          merged.totalSeconds = minutesToSeconds(merged.baseDurationMinutes)
        }
        if (patch.remainingSeconds !== undefined) {
          merged.remainingSeconds = patch.remainingSeconds
        }
        return normalizeActiveSource(merged)
      }
      return {
        ...state,
        active: updateCollection(state.active, instanceId, updateFn),
      }
    }
    case 'active/remove': {
      const { instanceId } = action.payload
      const nextActive = removeFromCollection(state.active, instanceId)
      const shouldResetTimer = nextActive.length === 0
      return {
        ...state,
        active: nextActive,
        centralTimer: shouldResetTimer ? createInitialCentralTimer() : state.centralTimer,
        settings: shouldResetTimer
          ? { ...state.settings, isClockRunning: false, lastTickTimestamp: null }
          : state.settings,
      }
    }
    case 'active/reset': {
      const timestamp = Date.now()
      if ('scope' in action.payload) {
        if (action.payload.scope !== 'all') {
          return state
        }
        const restored = state.active.map((source) => resetActiveSource(source, timestamp))
        const hasRestored = restored.length > 0
        let nextCentral = state.centralTimer
        if (hasRestored) {
          const existingTotal = nextCentral.totalSeconds
          const derivedTotal = restored.reduce((max, source) => Math.max(max, source.totalSeconds), 0)
          const totalSeconds = existingTotal > 0 ? existingTotal : derivedTotal
          if (totalSeconds > 0) {
            nextCentral = {
              isInitialized: true,
              totalSeconds,
              remainingSeconds: totalSeconds,
              elapsedSeconds: 0,
            }
          } else {
            nextCentral = createInitialCentralTimer()
          }
        } else {
          nextCentral = createInitialCentralTimer()
        }
        const wasRunning = state.settings.isClockRunning
        return {
          ...state,
          active: restored,
          centralTimer: nextCentral,
          settings: {
            ...state.settings,
            lastTickTimestamp: wasRunning && hasRestored ? timestamp : null,
            isClockRunning: wasRunning && hasRestored,
          },
        }
      }
      const { instanceId } = action.payload
      return {
        ...state,
        active: updateCollection(state.active, instanceId, (source) =>
          resetActiveSource(source, timestamp),
        ),
      }
    }
    case 'active/pause': {
      const { instanceId, pausedAt } = action.payload
      const updater = (source: ActiveLightSource): ActiveLightSource => ({
        ...source,
        isPaused: true,
        status: 'paused',
        lastTickTimestamp: pausedAt,
        updatedAt: pausedAt,
      })
      return {
        ...state,
        active: updateCollection(state.active, instanceId, updater),
      }
    }
    case 'active/resume': {
      const { instanceId, resumedAt } = action.payload
      const updater = (source: ActiveLightSource): ActiveLightSource => {
        const resumed: ActiveLightSource = {
          ...source,
          isPaused: false,
          updatedAt: resumedAt,
          lastTickTimestamp: resumedAt,
        }
        return normalizeActiveSource(resumed)
      }
      return {
        ...state,
        active: updateCollection(state.active, instanceId, updater),
      }
    }
    case 'active/tick': {
      const { deltaSeconds, now } = action.payload
      return applyDeltaToTorchState(state, deltaSeconds, now)
    }
    case 'timer/advance': {
      const { deltaSeconds, now } = action.payload
      return applyDeltaToTorchState(state, deltaSeconds, now)
    }
    case 'settings/setClockRunning': {
      const { isRunning, now } = action.payload
      return {
        ...state,
        settings: {
          ...state.settings,
          isClockRunning: isRunning,
          lastTickTimestamp: isRunning ? now : null,
        },
      }
    }
    case 'settings/syncTimestamp': {
      return {
        ...state,
        settings: {
          ...state.settings,
          lastTickTimestamp: action.payload.now,
        },
      }
    }
    case 'state/replace': {
      const nextActive = action.payload.active.map((source) => normalizeActiveSource(source))
      const normalizedTimer = normalizeCentralTimer(action.payload.centralTimer)
      const hasLights = nextActive.length > 0
      const hasActiveRunning = nextActive.some((source) => source.status === 'active')

      let centralTimer = normalizedTimer
      if (hasLights) {
        if (centralTimer.totalSeconds <= 0) {
          const totalSeconds = nextActive.reduce((max, source) => Math.max(max, source.totalSeconds), 0)
          const remainingSeconds = nextActive.reduce((max, source) => Math.max(max, source.remainingSeconds), 0)
          centralTimer = {
            isInitialized: totalSeconds > 0,
            totalSeconds,
            remainingSeconds,
            elapsedSeconds: Math.max(0, totalSeconds - remainingSeconds),
          }
        } else {
          centralTimer = {
            ...centralTimer,
            isInitialized: true,
          }
        }
      } else {
        centralTimer = createInitialCentralTimer()
      }

      const lastTickTimestamp = action.payload.settings.lastTickTimestamp ?? null
      const canRunClock =
        hasActiveRunning && centralTimer.isInitialized && centralTimer.remainingSeconds > 0
      const nextSettings: TorchTrackerSettings = {
        isClockRunning: canRunClock ? Boolean(action.payload.settings.isClockRunning) : false,
        lastTickTimestamp: canRunClock ? lastTickTimestamp : null,
      }

      return {
        ...state,
        active: nextActive,
        centralTimer,
        settings: nextSettings,
      }
    }
    default:
      return state
  }
}

export interface TorchTrackerController {
  registerCatalog: (entries: TorchCatalogEntry[]) => void
  refreshCatalog: (entries: TorchCatalogEntry[]) => void
  addFromCatalog: (
    catalogId: string,
    options?: Parameters<typeof createActiveSourceFromCatalog>[1],
  ) => ActiveLightSource | null
  updateInstance: (
    instanceId: string,
    patch: Partial<ActiveLightSource>,
  ) => void
  removeInstance: (instanceId: string) => void
  resetInstance: (instanceId: string) => void
  resetAll: () => void
  pauseInstance: (instanceId: string, pausedAt?: number) => void
  resumeInstance: (instanceId: string, resumedAt?: number) => void
  tick: (deltaSeconds: number, now?: number) => void
  advanceTimer: (deltaSeconds?: number, now?: number) => void
  setClockRunning: (isRunning: boolean, now?: number | null) => void
  syncTimestamp: (now: number | null) => void
  replaceState: (payload: TorchTrackerHydrationSnapshot) => void
}

export interface TorchTrackerHookResult {
  state: TorchTrackerState
  controller: TorchTrackerController
  centralTimer: ReturnType<typeof selectCentralTimer>
}

export const useTorchTrackerState = (
  catalog: TorchCatalogEntry[] = lightSourceCatalog,
): TorchTrackerHookResult => {
  const [state, dispatch] = useReducer(torchTrackerReducer, catalog, createInitialTorchTrackerState)

  const catalogIndex = useMemo(() => createCatalogIndex(state.catalog), [state.catalog])

  const controller: TorchTrackerController = useMemo(() => ({
    registerCatalog(entries) {
      dispatch({ type: 'catalog/register', payload: entries })
    },
    refreshCatalog(entries) {
      dispatch({ type: 'catalog/refresh', payload: entries })
    },
    addFromCatalog(catalogId, options) {
      const entry = catalogIndex.get(catalogId)
      if (!entry) return null
      const instance = createActiveSourceFromCatalog(entry, options)
      dispatch({ type: 'active/add', payload: instance })
      return instance
    },
    updateInstance(instanceId, patch) {
      dispatch({ type: 'active/update', payload: { instanceId, ...patch } })
    },
    removeInstance(instanceId) {
      dispatch({ type: 'active/remove', payload: { instanceId } })
    },
    resetInstance(instanceId) {
      dispatch({ type: 'active/reset', payload: { instanceId } })
    },
    resetAll() {
      dispatch({ type: 'active/reset', payload: { scope: 'all' } })
    },
    pauseInstance(instanceId, pausedAt = Date.now()) {
      dispatch({ type: 'active/pause', payload: { instanceId, pausedAt } })
    },
    resumeInstance(instanceId, resumedAt = Date.now()) {
      dispatch({ type: 'active/resume', payload: { instanceId, resumedAt } })
    },
    tick(deltaSeconds, now = Date.now()) {
      dispatch({ type: 'active/tick', payload: { deltaSeconds, now } })
    },
    advanceTimer(deltaSeconds = 60, now = Date.now()) {
      dispatch({ type: 'timer/advance', payload: { deltaSeconds, now } })
    },
    setClockRunning(isRunning, now = isRunning ? Date.now() : null) {
      dispatch({ type: 'settings/setClockRunning', payload: { isRunning, now } })
    },
    syncTimestamp(now) {
      dispatch({ type: 'settings/syncTimestamp', payload: { now } })
    },
    replaceState(payload) {
      dispatch({ type: 'state/replace', payload })
    },
  }), [catalogIndex])

  const centralTimer = useMemo(() => selectCentralTimer(state), [state])

  return { state, controller, centralTimer }
}

export const useTorchTrackerSettings = (state: TorchTrackerState) => {
  const settings = selectSettings(state)
  return useMemo(
    () => ({
      settings,
    }),
    [settings],
  )
}

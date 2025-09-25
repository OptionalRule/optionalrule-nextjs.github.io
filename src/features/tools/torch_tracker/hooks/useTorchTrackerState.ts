'use client'

import { useMemo, useReducer } from 'react'

import { lightSourceCatalog } from '../data/lightSources'
import { cloneCatalogEntry, createActiveSourceFromCatalog, createCatalogIndex } from '../lib/catalog'
import {
  selectAutoAdvance,
  selectBrightestRadius,
  selectCentralTimer,
  selectNextExpiration,
  selectSettings,
} from '../lib/selectors'
import type {
  ActiveLightSource,
  LightInstanceStatus,
  TorchCatalogEntry,
  TorchTrackerReducerAction,
  TorchTrackerSettings,
  TorchTrackerState,
} from '../types'

const DEFAULT_SETTINGS: TorchTrackerSettings = {
  autoAdvance: true,
  isClockRunning: false,
  lastTickTimestamp: null,
}

const minutesToSeconds = (minutes: number) => Math.max(0, Math.round(minutes * 60))

const deriveRoundsFromSeconds = (seconds: number, turnLengthMinutes: number) => {
  const turnSeconds = Math.max(1, minutesToSeconds(turnLengthMinutes))
  if (seconds <= 0) return 0
  return Math.max(0, Math.ceil(seconds / turnSeconds))
}

const normalizeStatus = (source: ActiveLightSource): LightInstanceStatus => {
  if (source.remainingSeconds <= 0) return 'expired'
  if (source.isPaused) return 'paused'
  return 'active'
}

const normalizeActiveSource = (source: ActiveLightSource): ActiveLightSource => {
  const totalSeconds = minutesToSeconds(source.baseDurationMinutes)
  const totalRounds = deriveRoundsFromSeconds(totalSeconds, source.turnLengthMinutes)
  const remainingSeconds = Math.max(0, Math.min(totalSeconds, source.remainingSeconds))
  const remainingRounds = deriveRoundsFromSeconds(remainingSeconds, source.turnLengthMinutes)
  const status = normalizeStatus({ ...source, remainingSeconds, totalSeconds, totalRounds })
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds)

  return {
    ...source,
    totalSeconds,
    totalRounds,
    remainingSeconds,
    remainingRounds,
    elapsedSeconds,
    status,
  }
}

export const createInitialTorchTrackerState = (
  catalogEntries: TorchCatalogEntry[] = lightSourceCatalog,
): TorchTrackerState => ({
  catalog: catalogEntries.map((entry) => cloneCatalogEntry(entry)),
  active: [],
  expired: [],
  settings: { ...DEFAULT_SETTINGS },
})

const resetActiveSource = (source: ActiveLightSource, timestamp: number): ActiveLightSource => ({
  ...source,
  remainingSeconds: source.totalSeconds,
  remainingRounds: source.totalRounds,
  elapsedSeconds: 0,
  status: 'active',
  isPaused: false,
  lastTickTimestamp: null,
  updatedAt: timestamp,
})

const expireActiveSource = (
  source: ActiveLightSource,
  expiredAt: number,
): ActiveLightSource => ({
    ...source,
    remainingSeconds: 0,
    remainingRounds: 0,
    elapsedSeconds: source.totalSeconds,
    status: 'expired',
    isPaused: false,
    updatedAt: expiredAt,
    lastTickTimestamp: expiredAt,
  })

const updateCollection = (
  collection: ActiveLightSource[],
  instanceId: string,
  updater: (source: ActiveLightSource) => ActiveLightSource,
) => collection.map((item) => (item.instanceId === instanceId ? updater(item) : item))

const removeFromCollection = (collection: ActiveLightSource[], instanceId: string) =>
  collection.filter((item) => item.instanceId !== instanceId)

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
      return {
        ...state,
        active: [...state.active, normalized],
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
          merged.totalRounds = deriveRoundsFromSeconds(
            merged.totalSeconds,
            merged.turnLengthMinutes,
          )
        }
        if (patch.remainingSeconds !== undefined) {
          merged.remainingSeconds = patch.remainingSeconds
        }
        if (patch.remainingRounds !== undefined) {
          merged.remainingRounds = patch.remainingRounds
          merged.remainingSeconds = Math.min(
            merged.totalSeconds,
            Math.max(0, patch.remainingRounds * minutesToSeconds(merged.turnLengthMinutes)),
          )
        }
        return normalizeActiveSource(merged)
      }
      return {
        ...state,
        active: updateCollection(state.active, instanceId, updateFn),
        expired: updateCollection(state.expired, instanceId, updateFn),
      }
    }
    case 'active/remove': {
      const { instanceId } = action.payload
      return {
        ...state,
        active: removeFromCollection(state.active, instanceId),
        expired: removeFromCollection(state.expired, instanceId),
      }
    }
    case 'active/expire': {
      const { instanceId, expiredAt } = action.payload
      let expiredSource: ActiveLightSource | null = null
      const nextActive = state.active.filter((source) => {
        if (source.instanceId !== instanceId) return true
        expiredSource = expireActiveSource(source, expiredAt)
        return false
      })
      if (!expiredSource) {
        return {
          ...state,
          expired: updateCollection(state.expired, instanceId, (item) => expireActiveSource(item, expiredAt)),
        }
      }
      const filteredExpired = removeFromCollection(state.expired, instanceId)
      return {
        ...state,
        active: nextActive,
        expired: [...filteredExpired, expiredSource],
      }
    }
    case 'active/reset': {
      const timestamp = Date.now()
      if ('scope' in action.payload) {
        if (action.payload.scope !== 'all') {
          return state
        }
        const restored = [...state.active, ...state.expired].map((source) =>
          normalizeActiveSource(resetActiveSource(source, timestamp)),
        )
        return {
          ...state,
          active: restored,
          expired: [],
          settings: {
            ...state.settings,
            lastTickTimestamp: null,
          },
        }
      }
      const { instanceId } = action.payload
      return {
        ...state,
        active: updateCollection(state.active, instanceId, (source) =>
          normalizeActiveSource(resetActiveSource(source, timestamp)),
        ),
        expired: removeFromCollection(state.expired, instanceId),
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
      if (deltaSeconds <= 0) {
        return {
          ...state,
          settings: {
            ...state.settings,
            lastTickTimestamp: now,
          },
        }
      }
      const nextActive: ActiveLightSource[] = []
      const newlyExpired: ActiveLightSource[] = []
      for (const source of state.active) {
        if (source.isPaused || source.status === 'paused') {
          nextActive.push({ ...source })
          continue
        }
        const nextRemaining = Math.max(0, source.remainingSeconds - deltaSeconds)
        const updated: ActiveLightSource = normalizeActiveSource({
          ...source,
          remainingSeconds: nextRemaining,
          updatedAt: now,
          lastTickTimestamp: now,
        })
        if (updated.status === 'expired') {
          newlyExpired.push(expireActiveSource(updated, now))
        } else {
          nextActive.push(updated)
        }
      }
      return {
        ...state,
        active: nextActive,
        expired: [...state.expired, ...newlyExpired],
        settings: {
          ...state.settings,
          lastTickTimestamp: now,
        },
      }
    }
    case 'settings/toggleAutoAdvance': {
      const nextValue =
        action.payload.value !== undefined
          ? Boolean(action.payload.value)
          : !state.settings.autoAdvance
      return {
        ...state,
        settings: {
          ...state.settings,
          autoAdvance: nextValue,
        },
      }
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
  expireInstance: (instanceId: string, expiredAt?: number) => void
  resetInstance: (instanceId: string) => void
  resetAll: () => void
  pauseInstance: (instanceId: string, pausedAt?: number) => void
  resumeInstance: (instanceId: string, resumedAt?: number) => void
  tick: (deltaSeconds: number, now?: number) => void
  toggleAutoAdvance: (value?: boolean) => void
  setClockRunning: (isRunning: boolean, now?: number | null) => void
  syncTimestamp: (now: number | null) => void
}

export interface TorchTrackerHookResult {
  state: TorchTrackerState
  controller: TorchTrackerController
  nextExpiration: ReturnType<typeof selectNextExpiration>
  brightestRadius: ReturnType<typeof selectBrightestRadius>
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
    expireInstance(instanceId, expiredAt = Date.now()) {
      dispatch({ type: 'active/expire', payload: { instanceId, expiredAt } })
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
    toggleAutoAdvance(value) {
      dispatch({ type: 'settings/toggleAutoAdvance', payload: { value } })
    },
    setClockRunning(isRunning, now = isRunning ? Date.now() : null) {
      dispatch({ type: 'settings/setClockRunning', payload: { isRunning, now } })
    },
    syncTimestamp(now) {
      dispatch({ type: 'settings/syncTimestamp', payload: { now } })
    },
  }), [catalogIndex])

  const nextExpiration = useMemo(() => selectNextExpiration(state), [state])
  const brightestRadius = useMemo(() => selectBrightestRadius(state), [state])
  const centralTimer = useMemo(() => selectCentralTimer(state), [state])

  return { state, controller, nextExpiration, brightestRadius, centralTimer }
}

export const useTorchTrackerSettings = (state: TorchTrackerState) => {
  const settings = selectSettings(state)
  const autoAdvance = selectAutoAdvance(state)
  const nextExpiration = selectNextExpiration(state)
  return useMemo(
    () => ({
      settings,
      autoAdvance,
      nextExpiration,
    }),
    [settings, autoAdvance, nextExpiration],
  )
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { lightSourceCatalog } from '../data/lightSources'
import { createActiveSourceFromCatalog } from '../lib/catalog'
import {
  createInitialTorchTrackerState,
  torchTrackerReducer,
} from '../hooks/useTorchTrackerState'
import { selectCentralTimer } from '../lib/selectors'
import type { TorchTrackerState } from '../types'

const FIXED_DATE = new Date('2024-01-01T12:00:00Z').getTime()

const getInitialState = (): TorchTrackerState => createInitialTorchTrackerState(lightSourceCatalog)

let instanceCounter = 0

const addInstance = (
  state: TorchTrackerState,
  index = 0,
  overrides: Parameters<typeof createActiveSourceFromCatalog>[1] = {},
) => {
  const entry = lightSourceCatalog[index]
  const instance = createActiveSourceFromCatalog(entry, {
    instanceId: overrides.instanceId ?? `${entry.id}-instance-${instanceCounter++}`,
    createdAt: FIXED_DATE,
    ...overrides,
  })
  return torchTrackerReducer(state, { type: 'active/add', payload: instance })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
  instanceCounter = 0
})

afterEach(() => {
  vi.useRealTimers()
})

describe('torchTrackerReducer', () => {
  it('adds active instances and initializes the central timer on first add', () => {
    const state = addInstance(getInitialState(), 0, { remainingSeconds: 600 })
    expect(state.active.length).toBe(1)
    expect(state.centralTimer.isInitialized).toBe(true)
    expect(state.centralTimer.totalSeconds).toBe(600)
    expect(state.centralTimer.remainingSeconds).toBe(600)
  })

  it('does not reset the central timer when additional sources are added', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 600 })
    const existingTimer = state.centralTimer
    state = addInstance(state, 1, { remainingSeconds: 900 })

    expect(state.centralTimer.totalSeconds).toBe(existingTimer.totalSeconds)
    expect(state.centralTimer.remainingSeconds).toBe(existingTimer.remainingSeconds)
  })

  it('pauses and resumes an active instance', () => {
    let state = addInstance(getInitialState())
    state = torchTrackerReducer(state, {
      type: 'active/pause',
      payload: { instanceId: state.active[0].instanceId, pausedAt: FIXED_DATE + 1000 },
    })
    expect(state.active[0].isPaused).toBe(true)
    expect(state.active[0].status).toBe('paused')

    state = torchTrackerReducer(state, {
      type: 'active/resume',
      payload: { instanceId: state.active[0].instanceId, resumedAt: FIXED_DATE + 2000 },
    })
    expect(state.active[0].isPaused).toBe(false)
    expect(state.active[0].status).toBe('active')
  })

  it('ticks timers, removes depleted sources, and resets timer when no lights remain', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 120 })
    state = torchTrackerReducer(state, {
      type: 'active/tick',
      payload: { deltaSeconds: 180, now: FIXED_DATE + 180000 },
    })

    expect(state.active.length).toBe(0)
    expect(state.centralTimer.isInitialized).toBe(false)
    expect(state.settings.isClockRunning).toBe(false)
  })

  it('advances timer when skipping forward and expires lights at zero', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 180 })
    state = torchTrackerReducer(state, {
      type: 'settings/setClockRunning',
      payload: { isRunning: true, now: FIXED_DATE },
    })

    state = torchTrackerReducer(state, {
      type: 'timer/advance',
      payload: { deltaSeconds: 60, now: FIXED_DATE + 60000 },
    })
    expect(state.centralTimer.remainingSeconds).toBe(120)
    expect(state.active[0].remainingSeconds).toBe(120)

    state = torchTrackerReducer(state, {
      type: 'timer/advance',
      payload: { deltaSeconds: 60, now: FIXED_DATE + 120000 },
    })
    expect(state.centralTimer.remainingSeconds).toBe(60)
    expect(state.active[0].remainingSeconds).toBe(60)

    state = torchTrackerReducer(state, {
      type: 'timer/advance',
      payload: { deltaSeconds: 60, now: FIXED_DATE + 180000 },
    })

    expect(state.active.length).toBe(0)
    expect(state.centralTimer.isInitialized).toBe(false)
    expect(state.settings.isClockRunning).toBe(false)
    expect(state.settings.lastTickTimestamp).toBe(FIXED_DATE + 180000)
  })

  it('updates remaining time and clamps to totals', () => {
    let state = addInstance(getInitialState())
    const instanceId = state.active[0].instanceId
    state = torchTrackerReducer(state, {
      type: 'active/update',
      payload: { instanceId, remainingSeconds: 300 },
    })
    expect(state.active[0].remainingSeconds).toBe(300)
    expect(state.active[0].elapsedSeconds).toBe(state.active[0].totalSeconds - 300)
  })

  it('removes instances from the tracker and resets timer when the roster empties', () => {
    let state = addInstance(getInitialState())
    const instanceId = state.active[0].instanceId

    state = torchTrackerReducer(state, {
      type: 'active/remove',
      payload: { instanceId },
    })

    expect(state.active.length).toBe(0)
    expect(state.centralTimer.isInitialized).toBe(false)
  })

  it('resets single instances and clears the central timer when resetting all', () => {
    let state = addInstance(getInitialState())
    const instanceId = state.active[0].instanceId

    state = torchTrackerReducer(state, {
      type: 'active/update',
      payload: { instanceId, remainingSeconds: 60 },
    })
    expect(state.active[0].remainingSeconds).toBe(60)

    state = torchTrackerReducer(state, {
      type: 'active/reset',
      payload: { instanceId },
    })
    expect(state.active[0].remainingSeconds).toBe(state.active[0].totalSeconds)

    state = torchTrackerReducer(state, {
      type: 'active/reset',
      payload: { scope: 'all' },
    })
    expect(state.centralTimer.isInitialized).toBe(false)
    expect(state.settings.isClockRunning).toBe(false)
  })

  it('updates clock running state', () => {
    let state = getInitialState()
    state = torchTrackerReducer(state, {
      type: 'settings/setClockRunning',
      payload: { isRunning: true, now: FIXED_DATE + 2000 },
    })
    expect(state.settings.isClockRunning).toBe(true)
    expect(state.settings.lastTickTimestamp).toBe(FIXED_DATE + 2000)
  })
})

describe('selectors', () => {
  it('returns the central timer snapshot from state', () => {
    let state = getInitialState()
    let snapshot = selectCentralTimer(state)
    expect(snapshot.isInitialized).toBe(false)

    state = addInstance(state, 0, { remainingSeconds: 300 })
    snapshot = selectCentralTimer(state)
    expect(snapshot.isInitialized).toBe(true)
    expect(snapshot.totalSeconds).toBe(300)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { lightSourceCatalog } from '../data/lightSources'
import { createActiveSourceFromCatalog } from '../lib/catalog'
import {
  createInitialTorchTrackerState,
  torchTrackerReducer,
} from '../hooks/useTorchTrackerState'
import { selectBrightestRadius, selectNextExpiration } from '../lib/selectors'
import type { TorchTrackerState } from '../types'

const FIXED_DATE = new Date('2024-01-01T12:00:00Z').getTime()

const getInitialState = (): TorchTrackerState => createInitialTorchTrackerState(lightSourceCatalog)

let instanceCounter = 0

const addInstance = (state: TorchTrackerState, index = 0, overrides: Parameters<typeof createActiveSourceFromCatalog>[1] = {}) => {
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
  it('adds active instances from catalog data', () => {
    const state = addInstance(getInitialState())
    expect(state.active.length).toBe(1)
    expect(state.active[0].catalogId).toBe(lightSourceCatalog[0].id)
    expect(state.active[0].status).toBe('active')
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

  it('ticks timers and moves expired sources', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 120 })
    state = torchTrackerReducer(state, {
      type: 'active/tick',
      payload: { deltaSeconds: 180, now: FIXED_DATE + 180000 },
    })
    expect(state.active.length).toBe(0)
    expect(state.expired.length).toBe(1)
    expect(state.expired[0].status).toBe('expired')
  })

  it('updates remaining time and clamps to totals', () => {
    let state = addInstance(getInitialState())
    const instanceId = state.active[0].instanceId
    state = torchTrackerReducer(state, {
      type: 'active/update',
      payload: { instanceId, remainingSeconds: 300 },
    })
    expect(state.active[0].remainingSeconds).toBe(300)
    expect(state.active[0].remainingRounds).toBeGreaterThan(0)
  })

  it('removes instances from active and expired collections', () => {
    let state = addInstance(getInitialState())
    const instanceId = state.active[0].instanceId
    state = torchTrackerReducer(state, {
      type: 'active/expire',
      payload: { instanceId, expiredAt: FIXED_DATE + 5000 },
    })
    expect(state.active.length).toBe(0)
    expect(state.expired.length).toBe(1)

    state = torchTrackerReducer(state, {
      type: 'active/remove',
      payload: { instanceId },
    })
    expect(state.active.length).toBe(0)
    expect(state.expired.length).toBe(0)
  })

  it('resets single instances and clears expired when resetting all', () => {
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
      type: 'active/expire',
      payload: { instanceId, expiredAt: FIXED_DATE + 8000 },
    })
    expect(state.expired.length).toBe(1)

    state = torchTrackerReducer(state, {
      type: 'active/reset',
      payload: { scope: 'all' },
    })
    expect(state.expired.length).toBe(0)
    expect(state.active[0].status).toBe('active')
  })

  it('toggles auto advance and clock running state', () => {
    let state = getInitialState()
    state = torchTrackerReducer(state, {
      type: 'settings/toggleAutoAdvance',
      payload: {},
    })
    expect(state.settings.autoAdvance).toBe(false)

    state = torchTrackerReducer(state, {
      type: 'settings/setClockRunning',
      payload: { isRunning: true, now: FIXED_DATE + 2000 },
    })
    expect(state.settings.isClockRunning).toBe(true)
    expect(state.settings.lastTickTimestamp).toBe(FIXED_DATE + 2000)
  })
})

describe('selectors', () => {
  it('identifies next expiration ignoring paused sources', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 600 })
    state = addInstance(state, 1, { remainingSeconds: 120 })
    const pausedId = state.active[0].instanceId

    state = torchTrackerReducer(state, {
      type: 'active/pause',
      payload: { instanceId: pausedId, pausedAt: FIXED_DATE + 1000 },
    })

    const nextExpiration = selectNextExpiration(state)
    expect(nextExpiration?.instanceId).toBe(state.active[1].instanceId)
  })

  it('derives brightest radius from active sources', () => {
    let state = addInstance(getInitialState(), 0, { remainingSeconds: 600 })
    state = addInstance(state, 3, { remainingSeconds: 300 })

    const radius = selectBrightestRadius(state)
    expect(radius).toEqual(state.active[1].radius)
  })
})

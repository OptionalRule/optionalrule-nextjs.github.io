import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useGameClock } from '../hooks/useGameClock'
import { useTorchTrackerState } from '../hooks/useTorchTrackerState'
import { lightSourceCatalog } from '../data/lightSources'

const FIXED_DATE = new Date('2024-01-01T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useGameClock', () => {
  it('ticks once per interval while running', () => {
    const onTick = vi.fn()
    renderHook(() => useGameClock({ isRunning: true, onTick }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onTick).toHaveBeenCalledTimes(3)
    expect(onTick).toHaveBeenLastCalledWith(1, FIXED_DATE + 3000)
  })

  it('keeps elapsed time across frequent re-renders with a new onTick each render', () => {
    let total = 0
    const { rerender } = renderHook(() =>
      useGameClock({
        isRunning: true,
        onTick: (deltaSeconds) => {
          total += deltaSeconds
        },
      }),
    )

    for (let step = 1; step <= 18; step += 1) {
      act(() => {
        vi.advanceTimersByTime(500)
      })
      rerender()
    }

    expect(total).toBeCloseTo(9, 5)
  })

  it('stops ticking when paused and does not count paused time', () => {
    const onTick = vi.fn()
    const { rerender } = renderHook(
      ({ isRunning }: { isRunning: boolean }) => useGameClock({ isRunning, onTick }),
      { initialProps: { isRunning: true } },
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    rerender({ isRunning: false })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onTick).toHaveBeenCalledTimes(2)

    rerender({ isRunning: true })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onTick).toHaveBeenCalledTimes(3)
    expect(onTick).toHaveBeenLastCalledWith(1, FIXED_DATE + 8000)
  })

  it('exposes tickOnce and reset', () => {
    const onTick = vi.fn()
    const { result } = renderHook(() => useGameClock({ isRunning: false, onTick }))

    act(() => {
      result.current.tickOnce(30)
      result.current.reset()
    })

    expect(onTick).toHaveBeenCalledWith(30, FIXED_DATE)
    expect(result.current.isRunning).toBe(false)
  })
})

describe('useTorchTrackerState', () => {
  const entry = lightSourceCatalog[0]

  it('adds, pauses, resumes, ticks and removes through the controller', () => {
    const { result } = renderHook(() => useTorchTrackerState(lightSourceCatalog))

    let instanceId = ''
    act(() => {
      const instance = result.current.controller.addFromCatalog(entry.id, { instanceId: 'a' })
      instanceId = instance?.instanceId ?? ''
      result.current.controller.setClockRunning(true, FIXED_DATE)
    })
    expect(result.current.state.active).toHaveLength(1)
    expect(result.current.state.settings.isClockRunning).toBe(true)
    const startRemaining = result.current.centralTimer.remainingSeconds

    act(() => {
      result.current.controller.tick(10, FIXED_DATE + 10_000)
    })
    expect(result.current.centralTimer.remainingSeconds).toBe(startRemaining - 10)

    act(() => {
      result.current.controller.advanceTimer(60, FIXED_DATE + 20_000)
    })
    expect(result.current.centralTimer.remainingSeconds).toBe(startRemaining - 70)

    act(() => {
      result.current.controller.pauseInstance(instanceId, FIXED_DATE + 30_000)
    })
    expect(result.current.state.active[0].status).toBe('paused')

    act(() => {
      result.current.controller.resumeInstance(instanceId, FIXED_DATE + 40_000)
    })
    expect(result.current.state.active[0].status).toBe('active')

    act(() => {
      result.current.controller.syncTimestamp(FIXED_DATE + 50_000)
      result.current.controller.updateInstance(instanceId, { label: 'Renamed' })
      result.current.controller.resetInstance(instanceId)
    })
    expect(result.current.state.active[0].label).toBe('Renamed')

    act(() => {
      result.current.controller.removeInstance(instanceId)
    })
    expect(result.current.state.active).toHaveLength(0)
  })

  it('returns null for an unknown catalog id and supports resetAll and catalog updates', () => {
    const { result } = renderHook(() => useTorchTrackerState(lightSourceCatalog))

    let missing: unknown = 'unset'
    act(() => {
      missing = result.current.controller.addFromCatalog('does-not-exist')
    })
    expect(missing).toBeNull()

    act(() => {
      result.current.controller.addFromCatalog(entry.id)
      result.current.controller.addFromCatalog(entry.id)
    })
    expect(result.current.state.active).toHaveLength(2)

    act(() => {
      result.current.controller.resetAll()
      result.current.controller.registerCatalog([entry])
      result.current.controller.refreshCatalog([entry])
    })
    expect(result.current.state.catalog.map((item) => item.id)).toContain(entry.id)
  })
})

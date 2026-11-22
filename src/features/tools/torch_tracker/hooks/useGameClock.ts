'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface UseGameClockOptions {
  isRunning: boolean
  tickIntervalMs?: number
  onTick: (deltaSeconds: number, now: number) => void
}

export interface GameClockControls {
  tickOnce: (deltaSeconds: number) => void
  reset: () => void
  isRunning: boolean
}

const ONE_SECOND_MS = 1000

export function useGameClock({
  isRunning,
  tickIntervalMs = ONE_SECOND_MS,
  onTick,
}: UseGameClockOptions): GameClockControls {
  const lastTickRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTickRef = useRef(onTick)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafRef.current)
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }
    rafRef.current = null
    intervalRef.current = null
  }, [])

  const cleanup = useCallback(() => {
    clearTimers()
    lastTickRef.current = null
  }, [clearTimers])

  const handleTick = useCallback(
    (deltaMs: number, now: number) => {
      const deltaSeconds = deltaMs / 1000
      if (deltaSeconds <= 0) return
      onTickRef.current(deltaSeconds, now)
      lastTickRef.current = now
    },
    [],
  )

  const tickOnce = useCallback(
    (deltaSeconds: number) => {
      const now = Date.now()
      onTickRef.current(deltaSeconds, now)
      lastTickRef.current = now
    },
    [],
  )

  const startInterval = useCallback(() => {
    const useAnimationFrame = tickIntervalMs < 30 && typeof requestAnimationFrame !== 'undefined'
    lastTickRef.current = Date.now()
    if (useAnimationFrame) {
      const tick = () => {
        const now = Date.now()
        const previous = lastTickRef.current ?? now
        handleTick(now - previous, now)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const previous = lastTickRef.current ?? now
      handleTick(now - previous, now)
    }, tickIntervalMs)
  }, [handleTick, tickIntervalMs])

  useEffect(() => {
    if (!isRunning) {
      cleanup()
      return
    }
    startInterval()
    return cleanup
  }, [cleanup, isRunning, startInterval])

  const reset = useCallback(() => {
    cleanup()
  }, [cleanup])

  return {
    tickOnce,
    reset,
    isRunning,
  }
}

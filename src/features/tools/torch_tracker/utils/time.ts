import type { CentralTimerSnapshot } from '../types'

export const formatSecondsAsClock = (seconds: number): string => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export const formatMinutesFromSeconds = (seconds: number): number => {
  if (!Number.isFinite(seconds)) {
    return 0
  }
  return Math.max(0, Math.round(seconds / 60))
}

export const getRemainingTime = (timer: CentralTimerSnapshot | null | undefined): number => {
  if (!timer || !timer.isInitialized) {
    return 0
  }
  if (!Number.isFinite(timer.remainingSeconds)) {
    return 0
  }
  return Math.max(0, Math.floor(timer.remainingSeconds))
}

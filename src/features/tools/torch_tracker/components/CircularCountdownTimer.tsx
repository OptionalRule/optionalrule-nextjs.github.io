'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { CentralTimerSnapshot } from '../types'
import { formatSecondsAsClock, getRemainingTime } from '../utils/time'

export interface CircularCountdownTimerProps {
  timer: CentralTimerSnapshot
  className?: string
  size?: number
  strokeWidth?: number
}

const TRACK_COLOR = 'var(--surface-3)'
const TEXT_COLOR = 'var(--text-primary)'

const COLOR_BLUE = 'var(--accent)'
const COLOR_AMBER = 'var(--accent-warm)'
const COLOR_RED = 'var(--error)'

const TEN_MINUTES_SECONDS = 600

const getTimerColor = (percentRemaining: number): string => {
  if (percentRemaining > 50) {
    return COLOR_BLUE
  }
  if (percentRemaining > 25) {
    return COLOR_AMBER
  }
  return COLOR_RED
}

const formatAnnouncement = (remainingSeconds: number) => {
  if (remainingSeconds <= 0) {
    return 'Timer expired'
  }
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  if (seconds === 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`
  }

  return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'} remaining`
}

export function CircularCountdownTimer({
  timer,
  className,
  size = 120,
  strokeWidth = 6,
}: CircularCountdownTimerProps) {
  const remainingSeconds = getRemainingTime(timer)
  const totalSeconds = useMemo(() => {
    if (!timer.isInitialized || !Number.isFinite(timer.totalSeconds)) {
      return 0
    }
    return Math.max(0, Math.floor(timer.totalSeconds))
  }, [timer])

  const progress = useMemo(() => {
    if (totalSeconds <= 0) {
      return 0
    }
    return Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
  }, [remainingSeconds, totalSeconds])

  const percentRemaining = useMemo(() => progress * 100, [progress])
  const timerColor = useMemo(() => getTimerColor(percentRemaining), [percentRemaining])
  const isCritical = percentRemaining < 10 && timer.isInitialized && remainingSeconds > 0

  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth])
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius])
  const dashOffset = useMemo(() => circumference * (1 - progress), [circumference, progress])
  const displayLabel = timer.isInitialized ? formatSecondsAsClock(remainingSeconds) : '00:00'

  const [announcement, setAnnouncement] = useState('Timer inactive')
  const lastBucketRef = useRef<number | null>(null)

  useEffect(() => {
    if (!timer.isInitialized) {
      lastBucketRef.current = null
      setAnnouncement('Timer inactive')
      return
    }

    const bucket = Math.floor(remainingSeconds / TEN_MINUTES_SECONDS)
    const previousBucket = lastBucketRef.current
    const shouldAnnounce =
      previousBucket === null || bucket !== previousBucket || remainingSeconds === 0

    if (shouldAnnounce) {
      lastBucketRef.current = bucket
      setAnnouncement(formatAnnouncement(remainingSeconds))
    }
  }, [remainingSeconds, timer.isInitialized])

  return (
    <div
      className={`relative flex flex-col items-center text-sm ${className ?? ''}`.trim()}
      role="group"
      aria-label={`Central timer ${displayLabel}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
          aria-hidden="true"
        >
          <circle
            className="transition-opacity duration-300"
            stroke={TRACK_COLOR}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`transition-all duration-300 ease-out ${
              isCritical
                ? 'motion-safe:animate-pulse motion-reduce:animate-none'
                : ''
            }`}
            stroke={timerColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transform: `rotate(-90deg)`, transformOrigin: '50% 50%' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex flex-col items-center justify-center text-lg font-semibold"
          style={{ color: TEXT_COLOR }}
        >
          {displayLabel}
        </span>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}

export default CircularCountdownTimer

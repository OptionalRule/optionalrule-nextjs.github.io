export const VIEWER_SECONDS_PER_EARTH_YEAR = 240
const MIN_ORBIT_PERIOD_SEC = 12
const FALLBACK_HZ_PERIOD_SEC = VIEWER_SECONDS_PER_EARTH_YEAR

export function hashToUnit(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h >>> 0) / 0x100000000
}

export function phase0ForBody(bodyId: string, seed: string): number {
  return hashToUnit(`${seed}#${bodyId}`) * Math.PI * 2
}

export function angularSpeedFromPeriod(periodDays: number | null | undefined): number {
  const days = typeof periodDays === 'number' && periodDays > 0 ? periodDays : 365
  const periodSec = Math.max(MIN_ORBIT_PERIOD_SEC, (days / 365) * VIEWER_SECONDS_PER_EARTH_YEAR)
  return (2 * Math.PI) / periodSec
}

export const FALLBACK_ORBIT_PERIOD_SEC = FALLBACK_HZ_PERIOD_SEC

import { describe, it, expect } from 'vitest'
import { hashToUnit, phase0ForBody, angularSpeedFromPeriod, VIEWER_SECONDS_PER_EARTH_YEAR } from '../motion'

describe('hashToUnit', () => {
  it('returns a value in [0, 1)', () => {
    for (const s of ['a', 'body-3', 'b1#seed42', '']) {
      const n = hashToUnit(s)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it('is deterministic', () => {
    expect(hashToUnit('seed42#body-3')).toBe(hashToUnit('seed42#body-3'))
  })

  it('produces different outputs for different inputs', () => {
    expect(hashToUnit('a')).not.toBe(hashToUnit('b'))
  })
})

describe('phase0ForBody', () => {
  it('is deterministic per (bodyId, seed)', () => {
    expect(phase0ForBody('body-3', 'seed42')).toBe(phase0ForBody('body-3', 'seed42'))
  })

  it('returns a radian value in [0, 2π)', () => {
    const p = phase0ForBody('body-3', 'seed42')
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThan(2 * Math.PI)
  })

  it('differs when seed changes', () => {
    expect(phase0ForBody('body-3', 'seedA')).not.toBe(phase0ForBody('body-3', 'seedB'))
  })
})

describe('angularSpeedFromPeriod', () => {
  it('uses VIEWER_SECONDS_PER_EARTH_YEAR as the 365-day baseline', () => {
    expect(angularSpeedFromPeriod(365)).toBeCloseTo((2 * Math.PI) / VIEWER_SECONDS_PER_EARTH_YEAR, 5)
  })

  it('shorter periods produce higher angular speeds', () => {
    expect(angularSpeedFromPeriod(88)).toBeGreaterThan(angularSpeedFromPeriod(365))
    expect(angularSpeedFromPeriod(365)).toBeGreaterThan(angularSpeedFromPeriod(4332))
  })

  it('caps speed so very-close-in bodies do not strobe', () => {
    expect(angularSpeedFromPeriod(0.5)).toBeLessThanOrEqual(angularSpeedFromPeriod(2))
  })

  it('falls back to a sane speed for null/zero periodDays', () => {
    expect(angularSpeedFromPeriod(null)).toBeGreaterThan(0)
    expect(angularSpeedFromPeriod(0)).toBeGreaterThan(0)
  })
})

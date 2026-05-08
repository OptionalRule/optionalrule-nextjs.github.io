import { describe, it, expect } from 'vitest'
import { hashToUnit, phase0ForBody, angularSpeedFromAu, AMBIENT_YEAR_SECONDS } from '../motion'

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

describe('angularSpeedFromAu', () => {
  it('uses AMBIENT_YEAR_SECONDS for 1 AU baseline', () => {
    expect(angularSpeedFromAu(1)).toBeCloseTo((2 * Math.PI) / AMBIENT_YEAR_SECONDS, 5)
  })

  it('inner orbits move faster than outer', () => {
    expect(angularSpeedFromAu(0.4)).toBeGreaterThan(angularSpeedFromAu(5))
    expect(angularSpeedFromAu(5)).toBeGreaterThan(angularSpeedFromAu(30))
  })

  it('caps inner-orbit speed so close-in bodies do not strobe', () => {
    expect(angularSpeedFromAu(0.01)).toBeLessThan(angularSpeedFromAu(0.001) * 10)
  })
})

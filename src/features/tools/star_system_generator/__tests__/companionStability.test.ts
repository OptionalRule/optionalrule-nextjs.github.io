import { describe, expect, it } from 'vitest'
import {
  circumbinaryInnerAuLimit,
  siblingOuterAuLimit,
} from '../lib/generator/companionStability'

describe('siblingOuterAuLimit (S-type Holman-Wiegert)', () => {
  it('returns 0 for non-positive separation', () => {
    expect(siblingOuterAuLimit(0, 1, 1)).toBe(0)
    expect(siblingOuterAuLimit(-5, 1, 1)).toBe(0)
  })

  it('returns 0 for non-positive total mass', () => {
    expect(siblingOuterAuLimit(10, 0, 0)).toBeGreaterThan(0)
  })

  it('produces ~0.21 fraction for equal-mass binary at e=0.3', () => {
    const limit = siblingOuterAuLimit(10, 1, 1, 0.3)
    expect(limit / 10).toBeGreaterThan(0.17)
    expect(limit / 10).toBeLessThan(0.24)
  })

  it('produces ~0.27 fraction for equal-mass circular binary', () => {
    const limit = siblingOuterAuLimit(10, 1, 1, 0)
    expect(limit / 10).toBeGreaterThan(0.25)
    expect(limit / 10).toBeLessThan(0.31)
  })

  it('shrinks the stable zone as the companion gets more massive', () => {
    const lightCompanion = siblingOuterAuLimit(10, 1.0, 0.1, 0.3)
    const heavyCompanion = siblingOuterAuLimit(10, 1.0, 1.0, 0.3)
    expect(lightCompanion).toBeGreaterThan(heavyCompanion)
  })

  it('shrinks the stable zone as eccentricity grows', () => {
    const circular = siblingOuterAuLimit(10, 1, 1, 0)
    const eccentric = siblingOuterAuLimit(10, 1, 1, 0.6)
    expect(circular).toBeGreaterThan(eccentric)
  })

  it('scales linearly with separation', () => {
    const ten = siblingOuterAuLimit(10, 1, 1, 0.3)
    const fifty = siblingOuterAuLimit(50, 1, 1, 0.3)
    expect(fifty / ten).toBeCloseTo(5, 5)
  })
})

describe('circumbinaryInnerAuLimit (P-type Holman-Wiegert)', () => {
  it('returns 0 for non-positive separation', () => {
    expect(circumbinaryInnerAuLimit(0, 1, 1)).toBe(0)
    expect(circumbinaryInnerAuLimit(-5, 1, 1)).toBe(0)
  })

  it('produces ~3.36 fraction for equal-mass binary at e=0.3', () => {
    const limit = circumbinaryInnerAuLimit(1, 1, 1, 0.3)
    expect(limit).toBeGreaterThan(3.0)
    expect(limit).toBeLessThan(3.7)
  })

  it('produces ~2.39 fraction for equal-mass circular binary', () => {
    const limit = circumbinaryInnerAuLimit(1, 1, 1, 0)
    expect(limit).toBeGreaterThan(2.2)
    expect(limit).toBeLessThan(2.6)
  })

  it('grows with eccentricity', () => {
    const circular = circumbinaryInnerAuLimit(1, 1, 1, 0)
    const eccentric = circumbinaryInnerAuLimit(1, 1, 1, 0.5)
    expect(eccentric).toBeGreaterThan(circular)
  })

  it('scales linearly with separation', () => {
    const one = circumbinaryInnerAuLimit(1, 1, 1, 0.3)
    const five = circumbinaryInnerAuLimit(5, 1, 1, 0.3)
    expect(five / one).toBeCloseTo(5, 5)
  })

  it('default eccentricity is 0.3', () => {
    const explicit = circumbinaryInnerAuLimit(1, 1, 1, 0.3)
    const implicit = circumbinaryInnerAuLimit(1, 1, 1)
    expect(implicit).toBeCloseTo(explicit, 10)
  })
})

import { describe, it, expect } from 'vitest'
import { auToScene, bodyVisualSize, SCENE_UNIT, ORBIT_MIN_OFFSET } from '../scale'

describe('auToScene', () => {
  it('places 0 AU at the origin', () => {
    expect(auToScene(0)).toBe(0)
  })

  it('is monotonically increasing', () => {
    const samples = [0.1, 0.4, 1, 5, 10, 30, 100]
    for (let i = 1; i < samples.length; i++) {
      expect(auToScene(samples[i])).toBeGreaterThan(auToScene(samples[i - 1]))
    }
  })

  it('compresses outer-system spacing logarithmically', () => {
    const inner = auToScene(1) - auToScene(0.4)
    const outer = auToScene(40) - auToScene(30)
    expect(inner).toBeGreaterThan(outer)
  })

  it('uses SCENE_UNIT as its multiplier with ORBIT_MIN_OFFSET applied', () => {
    expect(auToScene(1)).toBeCloseTo(ORBIT_MIN_OFFSET + Math.log10(2) * SCENE_UNIT, 5)
  })

  it('keeps any non-zero orbit outside the star margin', () => {
    expect(auToScene(0.001)).toBeGreaterThanOrEqual(ORBIT_MIN_OFFSET)
  })
})

describe('bodyVisualSize', () => {
  it('returns category-bucketed sizes', () => {
    expect(bodyVisualSize('gas-giant')).toBeGreaterThan(bodyVisualSize('rocky-planet'))
    expect(bodyVisualSize('rocky-planet')).toBeGreaterThan(bodyVisualSize('dwarf-body'))
    expect(bodyVisualSize('ice-giant')).toBeGreaterThan(bodyVisualSize('sub-neptune'))
  })

  it('returns a stable size for unknown-but-typed categories', () => {
    expect(bodyVisualSize('belt')).toBeGreaterThan(0)
    expect(bodyVisualSize('anomaly')).toBeGreaterThan(0)
  })
})

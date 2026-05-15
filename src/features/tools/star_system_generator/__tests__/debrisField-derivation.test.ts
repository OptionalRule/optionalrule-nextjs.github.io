import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'

const baseOptions = {
  distribution: 'frontier' as const,
  tone: 'balanced' as const,
  gu: 'normal' as const,
  settlements: 'normal' as const,
}

describe('deriveDebrisFields end-to-end', () => {
  it('volatile companion systems produce a mass-transfer-stream debris field', () => {
    let found = false
    for (let i = 0; i < 200; i++) {
      const sys = generateSystem({ ...baseOptions, tone: 'cinematic', seed: `debris-volatile-${i}` })
      const volatile = sys.companions.find(c => c.mode === 'volatile')
      if (!volatile) continue
      found = true
      expect(sys.debrisFields.length, `seed debris-volatile-${i}`).toBeGreaterThan(0)
      const stream = sys.debrisFields.find(d => d.shape.value === 'mass-transfer-stream')
      expect(stream, `seed debris-volatile-${i}: expected mass-transfer-stream`).toBeDefined()
      expect(stream!.spawnedPhenomenonId, `seed debris-volatile-${i}: missing phenomenon link`).not.toBeNull()
      expect(sys.phenomena.some(p => p.id === stream!.spawnedPhenomenonId)).toBe(true)
      break
    }
    expect(found, 'no volatile seed found in sweep').toBe(true)
  })

  it('every debris field has a paired phenomenon with all four beats populated', () => {
    const seeds = ['debris-corpus-1', 'debris-corpus-2', 'debris-corpus-3', 'debris-corpus-4', 'debris-corpus-5', 'debris-corpus-6']
    let exercised = 0
    for (const seed of seeds) {
      const sys = generateSystem({ ...baseOptions, seed })
      for (const field of sys.debrisFields) {
        exercised++
        expect(field.spawnedPhenomenonId, `${seed} ${field.id}`).not.toBeNull()
        const phen = sys.phenomena.find(p => p.id === field.spawnedPhenomenonId)
        expect(phen, `${seed} ${field.id} phenomenon missing`).toBeDefined()
        expect(phen!.travelEffect.value.length).toBeGreaterThan(0)
        expect(phen!.surveyQuestion.value.length).toBeGreaterThan(0)
        expect(phen!.conflictHook.value.length).toBeGreaterThan(0)
        expect(phen!.sceneAnchor.value.length).toBeGreaterThan(0)
      }
    }
    expect(exercised, 'no debris fields generated across probe seeds').toBeGreaterThan(0)
  })

  it('linked-independent companion alone produces zero debris fields', () => {
    for (let i = 0; i < 100; i++) {
      const sys = generateSystem({ ...baseOptions, seed: `debris-linked-${i}` })
      const hasNonLinked = sys.companions.some(c => c.mode !== 'linked-independent')
      const hasLinked = sys.companions.some(c => c.mode === 'linked-independent')
      if (hasLinked && !hasNonLinked) {
        expect(sys.debrisFields.length).toBe(0)
        return
      }
    }
  })

  it('debris field spatial extent is within plausible AU bounds', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ ...baseOptions, seed: `debris-extent-${i}` })
      for (const field of sys.debrisFields) {
        expect(field.spatialExtent.innerAu.value, `${field.id} innerAu`).toBeGreaterThanOrEqual(0)
        expect(field.spatialExtent.outerAu.value, `${field.id} outerAu`).toBeGreaterThan(field.spatialExtent.innerAu.value)
        expect(field.spatialExtent.outerAu.value, `${field.id} outerAu sanity bound`).toBeLessThan(10000)
      }
    }
  })
})

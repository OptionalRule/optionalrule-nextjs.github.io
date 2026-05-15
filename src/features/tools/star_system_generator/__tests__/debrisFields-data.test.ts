import { describe, it, expect } from 'vitest'
import { allDebrisArchetypes, debrisArchetypeData } from '../lib/generator/data/debrisFields'

describe('debrisFields data loader', () => {
  it('returns all ten archetypes', () => {
    expect(allDebrisArchetypes()).toHaveLength(10)
  })

  it('each archetype meets the authored pool minimums', () => {
    for (const [shape, data] of allDebrisArchetypes()) {
      expect(data.label, shape).toBeDefined()
      expect(data.whyHerePool.length, `${shape}.whyHerePool`).toBeGreaterThanOrEqual(5)
      expect(data.prizePool.length, `${shape}.prizePool`).toBeGreaterThanOrEqual(5)
      expect(data.guCharacterPool.length, `${shape}.guCharacterPool`).toBeGreaterThanOrEqual(5)
      expect(data.phenomenon.labelPool.length, `${shape}.phenomenon.labelPool`).toBeGreaterThanOrEqual(3)
      expect(data.phenomenon.notePool.length, `${shape}.phenomenon.notePool`).toBeGreaterThanOrEqual(5)
      expect(data.phenomenon.travelEffectPool.length, `${shape}.phenomenon.travelEffectPool`).toBeGreaterThanOrEqual(5)
      expect(data.phenomenon.surveyQuestionPool.length, `${shape}.phenomenon.surveyQuestionPool`).toBeGreaterThanOrEqual(5)
      expect(data.phenomenon.conflictHookPool.length, `${shape}.phenomenon.conflictHookPool`).toBeGreaterThanOrEqual(5)
      expect(data.phenomenon.sceneAnchorPool.length, `${shape}.phenomenon.sceneAnchorPool`).toBeGreaterThanOrEqual(5)
    }
  })

  it('no entry contains the "placeholder" stub from Phase 1', () => {
    for (const [shape, data] of allDebrisArchetypes()) {
      const allPools = [
        data.whyHerePool, data.prizePool, data.guCharacterPool,
        data.phenomenon.labelPool, data.phenomenon.notePool,
        data.phenomenon.travelEffectPool, data.phenomenon.surveyQuestionPool,
        data.phenomenon.conflictHookPool, data.phenomenon.sceneAnchorPool,
      ]
      for (const pool of allPools) {
        for (const entry of pool) {
          expect(entry.toLowerCase(), `${shape}: placeholder still present in pool`).not.toBe('placeholder')
        }
      }
    }
  })

  it('debrisArchetypeData throws on unknown shape', () => {
    expect(() => debrisArchetypeData('nope' as never)).toThrow()
  })
})

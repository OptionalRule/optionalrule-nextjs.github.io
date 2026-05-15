import { describe, it, expect } from 'vitest'
import { allDebrisArchetypes, debrisArchetypeData } from '../lib/generator/data/debrisFields'

describe('debrisFields data loader', () => {
  it('returns all ten archetypes', () => {
    expect(allDebrisArchetypes()).toHaveLength(10)
  })

  it('each archetype has all required pool keys with at least one entry', () => {
    for (const [shape, data] of allDebrisArchetypes()) {
      expect(data.label, shape).toBeDefined()
      expect(data.whyHerePool.length, `${shape}.whyHerePool`).toBeGreaterThan(0)
      expect(data.prizePool.length, `${shape}.prizePool`).toBeGreaterThan(0)
      expect(data.guCharacterPool.length, `${shape}.guCharacterPool`).toBeGreaterThan(0)
      expect(data.phenomenon.labelPool.length, `${shape}.phenomenon.labelPool`).toBeGreaterThan(0)
      expect(data.phenomenon.notePool.length, `${shape}.phenomenon.notePool`).toBeGreaterThan(0)
      expect(data.phenomenon.travelEffectPool.length, `${shape}.phenomenon.travelEffectPool`).toBeGreaterThan(0)
      expect(data.phenomenon.surveyQuestionPool.length, `${shape}.phenomenon.surveyQuestionPool`).toBeGreaterThan(0)
      expect(data.phenomenon.conflictHookPool.length, `${shape}.phenomenon.conflictHookPool`).toBeGreaterThan(0)
      expect(data.phenomenon.sceneAnchorPool.length, `${shape}.phenomenon.sceneAnchorPool`).toBeGreaterThan(0)
    }
  })

  it('debrisArchetypeData throws on unknown shape', () => {
    expect(() => debrisArchetypeData('nope' as never)).toThrow()
  })
})

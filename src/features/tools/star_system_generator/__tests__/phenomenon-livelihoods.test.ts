import { describe, expect, it } from 'vitest'
import { phenomena } from '../lib/generator/data/narrative'

describe('phenomenon livelihoods and variants', () => {
  it('every phenomenon has at least 2 livelihoods with non-empty fields', () => {
    for (const entry of phenomena) {
      expect(entry.livelihoods?.length ?? 0, entry.label).toBeGreaterThanOrEqual(2)
      for (const livelihood of entry.livelihoods ?? []) {
        expect(livelihood.actor.length, entry.label).toBeGreaterThan(0)
        expect(livelihood.dependence.length, entry.label).toBeGreaterThan(0)
        expect(livelihood.friction.length, entry.label).toBeGreaterThan(0)
      }
    }
  })

  it('every phenomenon has at least 3 variants for travelEffect, surveyQuestion, and sceneAnchor', () => {
    for (const entry of phenomena) {
      for (const field of ['travelEffect', 'surveyQuestion', 'sceneAnchor'] as const) {
        expect(entry.variants?.[field]?.length ?? 0, `${entry.label}.${field}`).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

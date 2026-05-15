import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'

describe('debris-field determinism', () => {
  it('same seed produces identical debris fields across 20 runs', () => {
    const seed = 'debris-determinism-seed'
    const reference = generateSystem({
      seed,
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const refJson = JSON.stringify(reference.debrisFields)

    for (let i = 0; i < 20; i++) {
      const again = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      expect(JSON.stringify(again.debrisFields)).toBe(refJson)
    }
  })

  it('same seed produces identical settlement attachments across 20 runs', () => {
    const seed = 'debris-attach-determinism-seed'
    const ref = generateSystem({
      seed,
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'crowded',
    })
    const refAnchors = ref.settlements.map(s => ({ id: s.id, body: s.bodyId, debris: s.debrisFieldId }))

    for (let i = 0; i < 20; i++) {
      const again = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'crowded',
      })
      const againAnchors = again.settlements.map(s => ({ id: s.id, body: s.bodyId, debris: s.debrisFieldId }))
      expect(againAnchors).toEqual(refAnchors)
    }
  })

  it('different seeds produce different debris fields', () => {
    const sigs = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const sys = generateSystem({
        seed: `debris-vary-seed-${i}`,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      sigs.add(JSON.stringify(sys.debrisFields.map(d => d.shape.value).sort()))
    }
    expect(sigs.size, `seed variety: got ${sigs.size} distinct signatures across 10 seeds`).toBeGreaterThan(1)
  })
})

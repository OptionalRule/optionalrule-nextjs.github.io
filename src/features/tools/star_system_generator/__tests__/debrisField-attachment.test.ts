import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'

const baseOptions = {
  distribution: 'frontier' as const,
  tone: 'balanced' as const,
  gu: 'normal' as const,
}

describe('settlement and ruin attachment to debris fields', () => {
  it('unanchorable fields never receive settlements', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ ...baseOptions, settlements: 'crowded' as const, seed: `attach-unanchorable-${i}` })
      const unanchorable = sys.debrisFields.filter(d => d.anchorMode.value === 'unanchorable')
      for (const field of unanchorable) {
        const attached = sys.settlements.filter(s => s.debrisFieldId === field.id)
        expect(attached.length, `${field.id} (unanchorable) should have zero attached settlements`).toBe(0)
      }
    }
  })

  it('ruins do not gain debrisFieldId in v1 (HumanRemnant has no body-id reference for orbit lookup)', () => {
    let scanned = 0
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ ...baseOptions, settlements: 'crowded' as const, seed: `attach-ruin-${i}` })
      for (const r of sys.ruins) {
        scanned++
        expect(r.debrisFieldId, `ruin ${r.id} unexpectedly carries debrisFieldId — ruin attachment was deferred (spec §Pipeline)`).toBeUndefined()
      }
    }
    expect(scanned, 'sweep generated no ruins to scan').toBeGreaterThan(0)
  })

  it('transient-only fields only attract mobile habitation patterns', () => {
    const MOBILE = new Set(['Mobile site', 'Distributed swarm'])
    for (let i = 0; i < 80; i++) {
      const sys = generateSystem({ ...baseOptions, settlements: 'crowded' as const, seed: `attach-transient-${i}` })
      const transient = sys.debrisFields.filter(d => d.anchorMode.value === 'transient-only')
      for (const field of transient) {
        for (const s of sys.settlements.filter(s => s.debrisFieldId === field.id)) {
          expect(MOBILE.has(s.habitationPattern.value), `${s.id} on ${field.id} (transient-only) has non-mobile pattern ${s.habitationPattern.value}`).toBe(true)
        }
      }
    }
  })

  it('attached settlements have bodyId cleared (mutually exclusive)', () => {
    for (let i = 0; i < 80; i++) {
      const sys = generateSystem({ ...baseOptions, settlements: 'crowded' as const, seed: `attach-exclusive-${i}` })
      for (const s of sys.settlements) {
        if (s.debrisFieldId) {
          expect(s.bodyId, `${s.id} should not have both debrisFieldId and bodyId`).toBeUndefined()
        }
      }
    }
  })

  it('at least one embedded/edge-only field attracts a settlement somewhere in the sweep', () => {
    // Soft assertion: across 80 seeds with crowded settlement density, some attachment should occur
    let totalAttached = 0
    for (let i = 0; i < 80; i++) {
      const sys = generateSystem({ ...baseOptions, settlements: 'crowded' as const, seed: `attach-positive-${i}` })
      totalAttached += sys.settlements.filter(s => s.debrisFieldId).length
    }
    expect(totalAttached, 'no settlements ever attach to debris fields across 80 seeds').toBeGreaterThan(0)
  })
})

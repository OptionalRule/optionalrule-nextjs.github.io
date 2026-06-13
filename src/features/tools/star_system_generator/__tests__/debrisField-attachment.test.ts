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

  it('ruins attached to debris fields lie within the field spatial extent', () => {
    for (let i = 0; i < 200; i++) {
      const sys = generateSystem({ ...baseOptions, gu: 'fracture' as const, settlements: 'crowded' as const, seed: `attach-ruin-extent-${i}` })
      const orbitByName = new Map(sys.bodies.map(b => [b.name.value, b.orbitAu.value]))
      for (const r of sys.ruins) {
        if (!r.debrisFieldId) continue
        const field = sys.debrisFields.find(d => d.id === r.debrisFieldId)
        expect(field, `ruin ${r.id} references missing field ${r.debrisFieldId}`).toBeTruthy()
        const orbit = orbitByName.get(r.location.value)
        expect(orbit, `ruin ${r.id} location ${r.location.value} matches no body`).toBeDefined()
        expect(orbit!).toBeGreaterThanOrEqual(field!.spatialExtent.innerAu.value)
        expect(orbit!).toBeLessThanOrEqual(field!.spatialExtent.outerAu.value)
        expect(field!.anchorMode.value, `ruin on unanchorable field ${field!.id}`).not.toBe('unanchorable')
      }
    }
  })

  it('at least one ruin attaches to a debris field somewhere in the sweep', () => {
    let totalAttached = 0
    for (let i = 0; i < 200; i++) {
      const sys = generateSystem({ ...baseOptions, gu: 'fracture' as const, settlements: 'crowded' as const, seed: `attach-ruin-sweep-${i}` })
      totalAttached += sys.ruins.filter(r => r.debrisFieldId).length
    }
    expect(totalAttached, 'no ruin attached across 200 fracture-gu seeds').toBeGreaterThan(0)
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

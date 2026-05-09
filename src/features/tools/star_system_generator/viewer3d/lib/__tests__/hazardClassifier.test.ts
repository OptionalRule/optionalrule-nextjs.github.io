import { describe, it, expect } from 'vitest'
import type { Fact, GeneratedSystem } from '../../../types'
import { guHazardTable } from '../../../lib/generator/data/gu'
import { classifyHazard } from '../hazardClassifier'

function fact<T>(value: T): Fact<T> { return { value, confidence: 'derived' } }

const minimalSystem = {
  id: 'sys-1',
  seed: 'test',
  zones: { habitableInnerAu: fact(0.8), habitableCenterAu: fact(1), habitableOuterAu: fact(1.5), snowLineAu: fact(5) },
  bodies: [
    { id: 'b-jovian',  orbitAu: fact(5.2),  category: fact('gas-giant'),    name: fact('Bessel') },
    { id: 'b-rocky',   orbitAu: fact(1.0),  category: fact('rocky-planet'), name: fact('Marrow') },
    { id: 'b-outer',   orbitAu: fact(28),   category: fact('ice-giant'),    name: fact('Ostara') },
  ],
  settlements: [{ id: 's-1', bodyId: 'b-rocky', location: fact('Orbital station') }],
} as unknown as GeneratedSystem

describe('classifyHazard', () => {
  it('anchors radiation hazards near gas giants', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.unclassified).toBe(false)
    expect(v.anchorDescription).toMatch(/Bessel/)
  })

  it('anchors pinch/route hazards at the outer edge', () => {
    const v = classifyHazard(fact('Pinch field along outer route'), minimalSystem)
    expect(v.unclassified).toBe(false)
    expect(v.anchorDescription).toMatch(/outer/i)
  })

  it('returns unclassified=true for unmatched text', () => {
    const v = classifyHazard(fact('Some entirely unforeseen hazard text'), minimalSystem)
    expect(v.unclassified).toBe(true)
  })

  it('preserves the source text for sidebar display', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.sourceText).toBe('Severe magnetospheric radiation belt')
  })

  it('returns intensity in [0,1]', () => {
    const v = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(v.intensity).toBeGreaterThanOrEqual(0)
    expect(v.intensity).toBeLessThanOrEqual(1)
  })

  it('produces deterministic ids per text+system', () => {
    const a = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    const b = classifyHazard(fact('Severe magnetospheric radiation belt'), minimalSystem)
    expect(a.id).toBe(b.id)
  })

  it.each(guHazardTable)('classifies GU hazard vocabulary: %s', (hazard) => {
    const v = classifyHazard(fact(hazard), minimalSystem)
    expect(v.unclassified).toBe(false)
    expect(v.anchorDescription).not.toBe('')
  })
})

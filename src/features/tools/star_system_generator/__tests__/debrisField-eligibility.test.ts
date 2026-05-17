import { describe, it, expect } from 'vitest'
import { deriveDebrisFields, selectArchetypeForCompanion } from '../lib/generator/debrisFields'
import { fact } from '../lib/generator'
import { createSeededRng } from '../lib/generator/rng'
import type { StellarCompanion, Star } from '../types'

function fakeStar(massSolar: number, activity: string = 'Quiet', ageState: string = 'Mature'): Star {
  return {
    id: 'fake',
    name: fact('Fake', 'human-layer', 'test'),
    spectralType: fact('K star', 'inferred', 'test'),
    massSolar: fact(massSolar, 'derived', 'test'),
    luminositySolar: fact(0.5, 'derived', 'test'),
    ageState: fact(ageState, 'inferred', 'test'),
    metallicity: fact('Average', 'inferred', 'test'),
    activity: fact(activity, 'inferred', 'test'),
    activityRoll: fact(7, 'derived', 'test'),
    activityModifiers: [],
  }
}

function fakeCompanion(mode: StellarCompanion['mode'], separation: string, companionMass: number, activity: string = 'Quiet', id: string = 'companion-1', ageState: string = 'Mature'): StellarCompanion {
  return {
    id,
    companionType: fact('Test', 'inferred', 'test'),
    separation: fact(separation, 'inferred', 'test'),
    planetaryConsequence: fact('test', 'inferred', 'test'),
    guConsequence: fact('test', 'gu-layer', 'test'),
    rollMargin: fact(0, 'derived', 'test'),
    mode,
    star: fakeStar(companionMass, activity, ageState),
  }
}

describe('selectArchetypeForCompanion eligibility', () => {
  it('volatile companions select mass-transfer-stream', () => {
    const c = fakeCompanion('volatile', 'Contact / near-contact', 0.5)
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-1' }, c, primary, { hierarchicalTriple: false })
    expect(r?.shape).toBe('mass-transfer-stream')
  })

  it('circumbinary close binary with high mass ratio selects polar-ring', () => {
    const c = fakeCompanion('circumbinary', 'Close binary', 0.7)
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-2' }, c, primary, { hierarchicalTriple: false })
    expect(r?.shape).toBe('polar-ring')
  })

  it('circumbinary with very low mass ratio selects trojan-camp', () => {
    const c = fakeCompanion('circumbinary', 'Close binary', 0.10)
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-3' }, c, primary, { hierarchicalTriple: false })
    expect(r?.shape).toBe('trojan-camp')
  })

  it('hierarchical-triple always selects inner-pair-halo for inner companion', () => {
    const c = fakeCompanion('circumbinary', 'Tight binary', 0.4, 'Quiet', 'companion-1')
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-4' }, c, primary, { hierarchicalTriple: true })
    expect(r?.shape).toBe('inner-pair-halo')
  })

  it('orbital-sibling with flare-prone companion selects kozai-scattered-halo', () => {
    const c = fakeCompanion('orbital-sibling', 'Moderate binary', 0.3, 'Flare-prone')
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-5' }, c, primary, { hierarchicalTriple: false })
    expect(r?.shape).toBe('kozai-scattered-halo')
  })

  it('orbital-sibling moderate without flare selects hill-sphere-capture-cone or exocomet-swarm', () => {
    const c = fakeCompanion('orbital-sibling', 'Moderate binary', 0.5)
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-6' }, c, primary, { hierarchicalTriple: false })
    expect(['hill-sphere-capture-cone', 'exocomet-swarm']).toContain(r?.shape)
  })

  it('linked-independent never produces a debris archetype', () => {
    const c = fakeCompanion('linked-independent', 'Very wide', 0.3)
    const primary = fakeStar(1.0)
    const r = selectArchetypeForCompanion({ seed: 'eligibility-test-7' }, c, primary, { hierarchicalTriple: false })
    expect(r).toBeNull()
  })

  it('volatile + evolved primary can select accretion-bridge or common-envelope-shell', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const c = fakeCompanion('volatile', 'Contact / near-contact', 0.5, 'Quiet', 'companion-1', 'Very old')
      const primary = fakeStar(1.0, 'Quiet', 'Very old')
      const r = selectArchetypeForCompanion({ seed: `eligibility-evolved-${i}` }, c, primary, { hierarchicalTriple: false })
      if (r) seen.add(r.shape)
    }
    expect(seen.has('accretion-bridge'), 'accretion-bridge must be reachable').toBe(true)
    expect(seen.has('common-envelope-shell'), 'common-envelope-shell must be reachable').toBe(true)
  })

  it('circumbinary + aging primary can select common-envelope-shell', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const c = fakeCompanion('circumbinary', 'Tight binary', 0.5, 'Quiet', 'companion-1', 'Old')
      const primary = fakeStar(1.0, 'Quiet', 'Old')
      const r = selectArchetypeForCompanion({ seed: `eligibility-aging-${i}` }, c, primary, { hierarchicalTriple: false })
      if (r) seen.add(r.shape)
    }
    expect(seen.has('common-envelope-shell'), 'common-envelope-shell must be reachable').toBe(true)
  })

  it('young systems can produce a system-origin debris field without companions', () => {
    const result = deriveDebrisFields(
      createSeededRng('system-origin-debris'),
      { seed: 'system-origin-debris', primary: fakeStar(1.0, 'Quiet', 'Young'), companions: [] },
      { seed: 'system-origin-debris', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' },
      { architectureName: 'Debris-dominated', habitableOuterAu: 1.8, snowLineAu: 4.5 },
    )

    const field = result.debrisFields.find((d) => d.companionId === null)
    expect(field).toBeDefined()
    expect(field?.anchorMode.value).toBe('transient-only')
    expect(field?.spawnedPhenomenonId).toBeNull()
    expect(result.spawnedPhenomena.length).toBe(0)
  })

  it('gardener-cordon is reachable at the ~3% base rate across companion modes', () => {
    let cordonHits = 0
    const iterations = 500
    for (let i = 0; i < iterations; i++) {
      const c = fakeCompanion('circumbinary', 'Close binary', 0.5)
      const primary = fakeStar(1.0)
      const r = selectArchetypeForCompanion({ seed: `eligibility-cordon-${i}` }, c, primary, { hierarchicalTriple: false })
      if (r?.shape === 'gardener-cordon') cordonHits++
    }
    expect(cordonHits, `expected ~3% cordons, got ${cordonHits}/${iterations}`).toBeGreaterThan(0)
    expect(cordonHits / iterations, `cordon rate should be roughly 3%`).toBeLessThan(0.08)
  })
})

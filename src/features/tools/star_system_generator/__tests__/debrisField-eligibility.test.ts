import { describe, it, expect } from 'vitest'
import { selectArchetypeForCompanion } from '../lib/generator/debrisFields'
import { fact } from '../lib/generator'
import type { StellarCompanion, Star } from '../types'

function fakeStar(massSolar: number, activity: string = 'Quiet'): Star {
  return {
    id: 'fake',
    name: fact('Fake', 'human-layer', 'test'),
    spectralType: fact('K star', 'inferred', 'test'),
    massSolar: fact(massSolar, 'derived', 'test'),
    luminositySolar: fact(0.5, 'derived', 'test'),
    ageState: fact('Mature', 'inferred', 'test'),
    metallicity: fact('Average', 'inferred', 'test'),
    activity: fact(activity, 'inferred', 'test'),
    activityRoll: fact(7, 'derived', 'test'),
    activityModifiers: [],
  }
}

function fakeCompanion(mode: StellarCompanion['mode'], separation: string, companionMass: number, activity: string = 'Quiet', id: string = 'companion-1'): StellarCompanion {
  return {
    id,
    companionType: fact('Test', 'inferred', 'test'),
    separation: fact(separation, 'inferred', 'test'),
    planetaryConsequence: fact('test', 'inferred', 'test'),
    guConsequence: fact('test', 'gu-layer', 'test'),
    rollMargin: fact(0, 'derived', 'test'),
    mode,
    star: fakeStar(companionMass, activity),
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
})

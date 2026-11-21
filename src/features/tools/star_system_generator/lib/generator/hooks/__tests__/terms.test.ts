import { describe, expect, it } from 'vitest'
import { detectHookTerms, type HookTermContext } from '../terms'
import type { Fact, HumanRemnant } from '../../../../types'

function fact<T>(value: T): Fact<T> {
  return { value, confidence: 'human-layer' }
}

function blandContext(overrides: Partial<HookTermContext> = {}): HookTermContext {
  return {
    guOverlay: {
      intensity: fact('quiet'),
      bleedLocation: fact('none recorded'),
      bleedBehavior: fact('dormant'),
      resource: fact('water ice'),
      hazard: fact('dust'),
      intensityRoll: fact(1),
      intensityModifiers: [],
    },
    settlements: [],
    ruins: [],
    phenomena: [],
    architecture: { name: fact('Plain system'), description: fact('A quiet place.') },
    reachability: {
      className: fact('Q-class'),
      routeNote: fact('a long haul'),
      pinchDifficulty: fact('moderate'),
      roll: fact(5),
      modifiers: [],
    },
    ...overrides,
  }
}

describe('detectHookTerms', () => {
  it('detects nothing in a context with no setting vocabulary', () => {
    expect([...detectHookTerms(blandContext())]).toEqual([])
  })

  it('does not seed GU or Bleed on its own', () => {
    const terms = detectHookTerms(blandContext())
    expect(terms.has('GU')).toBe(false)
    expect(terms.has('Bleed')).toBe(false)
  })

  it('detects terms from the GU overlay', () => {
    const base = blandContext()
    const terms = detectHookTerms({
      ...base,
      guOverlay: { ...base.guOverlay, resource: fact('chiral ice'), hazard: fact('metric shear') },
    })
    expect(terms.has('Chirality')).toBe(true)
    expect(terms.has('Metric storm')).toBe(true)
  })

  it('detects terms from ruins', () => {
    const ruin: HumanRemnant = {
      id: 'ruin-1',
      location: fact('outer moon'),
      remnantType: fact('first-wave depot'),
      hook: fact('a sealed vault'),
    }
    const terms = detectHookTerms(blandContext({ ruins: [ruin] }))
    expect(terms.has('First-wave')).toBe(true)
  })

  it('matches on word boundaries where the pattern requires it', () => {
    const base = blandContext()
    const terms = detectHookTerms({
      ...base,
      architecture: { name: fact('Plain system'), description: fact('pinches and nodes everywhere') },
    })
    expect(terms.has('Pinchdrive')).toBe(false)
    expect(terms.has('Bleed')).toBe(false)
  })
})

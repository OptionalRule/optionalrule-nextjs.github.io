import { describe, expect, it } from 'vitest'
import {
  HOOK_SELECTION_PROFILE_V2,
  selectSystemHooks,
  type HookContext,
  type HookSelectionProfile,
} from '..'
import { createSeededRng, type SeededRng } from '../../rng'
import type { Fact } from '../../../../types'

function fact<T>(value: T): Fact<T> {
  return { value, confidence: 'human-layer' }
}

function blandContext(): HookContext {
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
    conflicts: [],
    entities: [],
  }
}

function recordingRng(inner: SeededRng, log: string[], path = ''): SeededRng {
  return {
    seed: inner.seed,
    next: () => inner.next(),
    int: (min, max) => inner.int(min, max),
    float: (min, max) => inner.float(min, max),
    chance: (p) => inner.chance(p),
    fork: (label) => {
      const childPath = path ? `${path}/${label}` : label
      log.push(childPath)
      return recordingRng(inner.fork(label), log, childPath)
    },
  }
}

function profile(overrides: Partial<HookSelectionProfile> = {}): HookSelectionProfile {
  return { alwaysActiveTerms: [], steps: [], ...overrides }
}

describe('HOOK_SELECTION_PROFILE_V2', () => {
  it('pins the v2 counts, bias, term sources and resonance', () => {
    expect(HOOK_SELECTION_PROFILE_V2).toEqual({
      alwaysActiveTerms: ['GU', 'Bleed'],
      steps: [
        { category: 'contract', count: 1, bias: 0.7, preferredTerms: 'active', feedsResonance: true },
        { category: 'npc', count: 2, bias: 0.4, preferredTerms: 'resonant', feedsResonance: true },
        { category: 'encounter', count: 1, bias: 0.7, preferredTerms: 'resonant', feedsResonance: false },
        { category: 'rumor', count: 3, bias: 0.35, preferredTerms: 'active', feedsResonance: false },
        { category: 'twist', count: 1, bias: 0.8, preferredTerms: 'resonant', feedsResonance: false },
      ],
    })
  })

  it('is the default profile', () => {
    const ctx = blandContext()
    expect(selectSystemHooks({ rng: createSeededRng('default'), context: ctx })).toEqual(
      selectSystemHooks({ rng: createSeededRng('default'), context: ctx, profile: HOOK_SELECTION_PROFILE_V2 }),
    )
  })

  it('forks one rng per category in profile order, each with its own binds fork', () => {
    const log: string[] = []
    selectSystemHooks({ rng: recordingRng(createSeededRng('forks'), log), context: blandContext() })
    expect(log).toEqual([
      'contracts', 'contracts/binds',
      'npcs', 'npcs/binds',
      'encounters', 'encounters/binds',
      'rumors', 'rumors/binds',
      'twists', 'twists/binds',
    ])
  })

  it('fills each category to its count', () => {
    const hooks = selectSystemHooks({ rng: createSeededRng('counts'), context: blandContext() })
    expect([hooks.contracts.length, hooks.npcs.length, hooks.encounters.length, hooks.rumors.length, hooks.twists.length])
      .toEqual([1, 2, 1, 3, 1])
  })
})

describe('selectSystemHooks with a stub profile', () => {
  it('leaves categories absent from the profile empty', () => {
    const hooks = selectSystemHooks({
      rng: createSeededRng('stub'),
      context: blandContext(),
      profile: profile({ steps: [{ category: 'rumor', count: 4, bias: 0, preferredTerms: 'active', feedsResonance: false }] }),
    })
    expect(hooks.rumors).toHaveLength(4)
    expect(hooks.contracts).toEqual([])
    expect(hooks.npcs).toEqual([])
    expect(hooks.encounters).toEqual([])
    expect(hooks.twists).toEqual([])
    expect(hooks.rumors.every((hook) => hook.category === 'rumor')).toBe(true)
  })

  it('never repeats an entry across categories or within one', () => {
    const hooks = selectSystemHooks({
      rng: createSeededRng('unique'),
      context: blandContext(),
      profile: profile({ steps: [{ category: 'npc', count: 20, bias: 0, preferredTerms: 'active', feedsResonance: false }] }),
    })
    const texts = hooks.npcs.map((hook) => hook.text.value)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('with bias 1 draws only entries tagged with an always-active term', () => {
    for (let i = 0; i < 10; i += 1) {
      const hooks = selectSystemHooks({
        rng: createSeededRng(`bias-${i}`),
        context: blandContext(),
        profile: profile({
          alwaysActiveTerms: ['Gardener'],
          steps: [{ category: 'rumor', count: 3, bias: 1, preferredTerms: 'active', feedsResonance: false }],
        }),
      })
      expect(hooks.rumors.every((hook) => hook.tags.includes('Gardener'))).toBe(true)
    }
  })

  it('skips the bias draw entirely when no terms are active', () => {
    const step = { category: 'twist', count: 2, preferredTerms: 'active', feedsResonance: false } as const
    const unbiased = selectSystemHooks({
      rng: createSeededRng('no-terms'),
      context: blandContext(),
      profile: profile({ steps: [{ ...step, bias: 0 }] }),
    })
    const biased = selectSystemHooks({
      rng: createSeededRng('no-terms'),
      context: blandContext(),
      profile: profile({ steps: [{ ...step, bias: 1 }] }),
    })
    expect(biased).toEqual(unbiased)
  })

  it('feeds resonant terms from an earlier step into a later resonant step', () => {
    for (let i = 0; i < 10; i += 1) {
      const hooks = selectSystemHooks({
        rng: createSeededRng(`resonance-${i}`),
        context: blandContext(),
        profile: profile({
          steps: [
            { category: 'contract', count: 1, bias: 0, preferredTerms: 'active', feedsResonance: true },
            { category: 'twist', count: 1, bias: 1, preferredTerms: 'resonant', feedsResonance: false },
          ],
        }),
      })
      const contractTags = new Set(hooks.contracts[0].tags)
      expect(hooks.twists[0].tags.some((tag) => contractTags.has(tag))).toBe(true)
    }
  })
})

describe('selection is independent of rng draws outside its forks', () => {
  it('does not draw from the root rng directly', () => {
    const root = createSeededRng('root-draws')
    const probe = createSeededRng('root-draws')
    selectSystemHooks({ rng: root, context: blandContext() })
    expect(root.next()).toBe(probe.next())
  })
})

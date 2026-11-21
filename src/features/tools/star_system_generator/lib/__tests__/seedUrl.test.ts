import { describe, it, expect } from 'vitest'
import { OPTION_DEFAULTS, buildSeedLink, decodeSeedLink, sameGenerationOptions, seedLinkFrom } from '../seedUrl'
import type { SeedLink } from '../seedUrl'
import { normalizeSeed } from '../generator/rng'
import { GENERATOR_VERSION } from '../generator'
import type {
  GenerationOptions,
  GeneratorDistribution,
  GeneratorTone,
  GuPreference,
  SettlementDensity,
} from '../../types'

const defaults: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

const DISTRIBUTIONS: readonly GeneratorDistribution[] = ['frontier', 'realistic']
const TONES: readonly GeneratorTone[] = ['balanced', 'astronomy', 'cinematic']
const GU_PREFERENCES: readonly GuPreference[] = ['normal', 'low', 'high', 'fracture']
const SETTLEMENT_DENSITIES: readonly SettlementDensity[] = ['normal', 'sparse', 'crowded', 'hub']

function legacyDecode(search: string): GenerationOptions {
  const params = new URLSearchParams(search)
  const distribution = params.get('distribution')
  const tone = params.get('tone')
  const gu = params.get('gu')
  const settlements = params.get('settlements')
  return {
    seed: normalizeSeed(params.get('seed')),
    distribution: distribution === 'realistic' ? 'realistic' : 'frontier',
    tone: tone === 'astronomy' || tone === 'cinematic' ? tone : 'balanced',
    gu: gu === 'low' || gu === 'high' || gu === 'fracture' ? gu : 'normal',
    settlements: settlements === 'sparse' || settlements === 'crowded' || settlements === 'hub' ? settlements : 'normal',
  }
}

describe('OPTION_DEFAULTS', () => {
  it('keeps the shipped defaults', () => {
    expect(OPTION_DEFAULTS).toEqual({ distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
  })
})

describe('buildSeedLink', () => {
  it('emits only the seed and version when all options are default', () => {
    expect(buildSeedLink({ options: defaults, generatorVersion: 2 })).toBe('?seed=abc123&v=2')
  })

  it('includes only non-default options in a fixed order with the version last', () => {
    const href = buildSeedLink({
      options: { seed: 'abc123', distribution: 'realistic', tone: 'cinematic', gu: 'fracture', settlements: 'crowded' },
      generatorVersion: 2,
    })
    expect(href).toBe('?seed=abc123&distribution=realistic&tone=cinematic&gu=fracture&settlements=crowded&v=2')
  })

  it('omits default options among non-default ones', () => {
    const href = buildSeedLink({ options: { ...defaults, gu: 'fracture', settlements: 'crowded' }, generatorVersion: 2 })
    expect(href).toBe('?seed=abc123&gu=fracture&settlements=crowded&v=2')
  })

  it('percent-encodes a derived companion seed and round-trips it', () => {
    const href = buildSeedLink({ options: { ...defaults, seed: 'abc123:c1' }, generatorVersion: 2 })
    expect(href).toContain('seed=abc123%3Ac1')
    expect(new URLSearchParams(href).get('seed')).toBe('abc123:c1')
  })
})

describe('decodeSeedLink', () => {
  it('round-trips every option combination', () => {
    for (const distribution of DISTRIBUTIONS) {
      for (const tone of TONES) {
        for (const gu of GU_PREFERENCES) {
          for (const settlements of SETTLEMENT_DENSITIES) {
            const link: SeedLink = {
              options: { seed: 'deadbeef:c1', distribution, tone, gu, settlements },
              generatorVersion: GENERATOR_VERSION,
            }
            expect(decodeSeedLink(buildSeedLink(link))).toEqual(link)
          }
        }
      }
    }
  })

  const legacyTable: ReadonlyArray<readonly [string, GenerationOptions]> = [
    ['?seed=7F3A9C2E&tone=cinematic', { ...defaults, seed: '7f3a9c2e', tone: 'cinematic' }],
    ['?seed=abc123', defaults],
    ['seed=abc123', defaults],
    ['?seed=abc123&distribution=frontier&tone=balanced&gu=normal&settlements=normal', defaults],
    ['?seed=abc123&distribution=realistic&tone=astronomy&gu=low&settlements=sparse', { seed: 'abc123', distribution: 'realistic', tone: 'astronomy', gu: 'low', settlements: 'sparse' }],
    ['?seed=abc123&gu=high&settlements=hub', { ...defaults, gu: 'high', settlements: 'hub' }],
    ['?seed=abc123&distribution=REALISTIC&tone=Cinematic&gu=FRACTURE&settlements=Hub', defaults],
    ['?seed=abc123&settlements=hub%20&gu=%20low', defaults],
    ['?seed=abc123&distribution=&tone=&gu=&settlements=', defaults],
    ['?seed=abc123&tone=constructor&gu=__proto__&settlements=toString&distribution=hasOwnProperty', defaults],
    ['?seed=abc123&tone=cinematic&tone=astronomy', { ...defaults, tone: 'cinematic' }],
    ['?seed=abc123&seed=ffff', defaults],
    ['?seed=abc123%3Ac1&distribution=realistic', { ...defaults, seed: 'abc123:c1', distribution: 'realistic' }],
    ['?seed=%20xyzABC-123!!%20', { ...defaults, seed: 'abc123' }],
    ['?seed=0123456789abcdef0123456789abcdef0123456789', { ...defaults, seed: '0123456789abcdef0123456789abcdef01234567' }],
    ['?seed=abc123&unrelated=1&gu=fracture', { ...defaults, gu: 'fracture' }],
  ]

  it.each(legacyTable)('decodes legacy link %s identically', (search, expected) => {
    const decoded = decodeSeedLink(search)
    expect(decoded.options).toEqual(expected)
    expect(decoded.options).toEqual(legacyDecode(search))
    expect(decoded.generatorVersion).toBe(2)
  })

  it('decodes a URLSearchParams instance', () => {
    expect(decodeSeedLink(new URLSearchParams('seed=abc123&tone=astronomy')).options).toEqual({ ...defaults, tone: 'astronomy' })
  })

  it.each(['?tone=cinematic', '?seed=', '?seed=zzz', '?seed=::'])('still generates a random seed for %s', (search) => {
    const decoded = decodeSeedLink(search)
    expect(decoded.options.seed).toMatch(/^[0-9a-f]+$/)
  })

  it('decodes a link without v as version 2', () => {
    expect(decodeSeedLink('?seed=abc123').generatorVersion).toBe(2)
  })

  it('decodes a supported v as that version', () => {
    expect(decodeSeedLink('?seed=abc123&v=2').generatorVersion).toBe(2)
  })

  it.each(['3', '99', '02', 'abc', '', '-1', '2.0', ' 2'])('falls back to the current version for v=%s', (v) => {
    const decoded = decodeSeedLink(`?seed=abc123&v=${encodeURIComponent(v)}`)
    expect(decoded.generatorVersion).toBe(GENERATOR_VERSION)
    expect(decoded.options).toEqual(defaults)
  })
})

describe('seedLinkFrom', () => {
  it('links another seed with the source system options and version', () => {
    const system = { options: { ...defaults, tone: 'cinematic' as const }, generatorVersion: 2 as const }
    expect(seedLinkFrom(system, 'abc123:c1')).toBe('?seed=abc123%3Ac1&tone=cinematic&v=2')
  })
})

describe('sameGenerationOptions', () => {
  it('is true for equal options', () => {
    expect(sameGenerationOptions(defaults, { ...defaults })).toBe(true)
  })

  it.each([
    { seed: 'abc124' },
    { distribution: 'realistic' as const },
    { tone: 'cinematic' as const },
    { gu: 'low' as const },
    { settlements: 'hub' as const },
  ])('is false when %o differs', (change) => {
    expect(sameGenerationOptions(defaults, { ...defaults, ...change })).toBe(false)
  })
})

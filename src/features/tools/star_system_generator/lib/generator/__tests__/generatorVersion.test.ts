import { describe, expect, it } from 'vitest'
import { generateSystem, GENERATOR_VERSION, SUPPORTED_GENERATOR_VERSIONS } from '../index'
import { HOOK_SELECTION_PROFILE_V2, HOOK_SELECTION_PROFILE_V3 } from '../hooks'
import { classifyNarrativeDomainsV2, classifyNarrativeDomainsV3 } from '../narrative/domainClassifier'
import { generatorRules } from '../rules'
import type {
  GeneratedSystem,
  GenerationOptions,
  GeneratorDistribution,
  GeneratorTone,
  GeneratorVersion,
  GuPreference,
  SettlementDensity,
} from '../../../types'

const base: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

const SEEDS = ['version-a', 'version-b', 'version-c', 'version-d', 'version-e', 'version-f']

function untaggedAiFacts(system: GeneratedSystem) {
  return system.narrativeFacts.filter(
    (fact) =>
      fact.kind !== 'settlement.aiSituation' &&
      fact.domains.includes('ai') &&
      !/\b(?:ai|ais|narrow-ai|automation|simulation|root credentials|memory|memories)\b/i.test(`${fact.kind} ${fact.value.value} ${fact.tags.join(' ')}`),
  )
}

describe('generator version dispatch', () => {
  it('makes version 3 current and keeps version 2 supported', () => {
    expect(GENERATOR_VERSION).toBe(3)
    expect([...SUPPORTED_GENERATOR_VERSIONS].sort()).toEqual([2, 3])
  })

  it('keeps the v2 Hook Selection Profile for version 2 and uses the v3 profile for version 3', () => {
    expect(generatorRules(2).hookSelectionProfile).toBe(HOOK_SELECTION_PROFILE_V2)
    expect(generatorRules(3).hookSelectionProfile).toBe(HOOK_SELECTION_PROFILE_V3)
  })

  it('runs the current version by default and stamps it', () => {
    expect(generateSystem({ ...base, seed: 'version-a' }).generatorVersion).toBe(GENERATOR_VERSION)
  })

  it('stamps the version it was asked to run', () => {
    expect(generateSystem({ ...base, seed: 'version-a' }, { generatorVersion: 2 }).generatorVersion).toBe(2)
    expect(generateSystem({ ...base, seed: 'version-a' }, { generatorVersion: 3 }).generatorVersion).toBe(3)
  })

  it('runs and stamps the current version when given an unsupported one at runtime', () => {
    const system = generateSystem({ ...base, seed: 'version-a' }, { generatorVersion: 99 as GeneratorVersion })
    expect(system.generatorVersion).toBe(GENERATOR_VERSION)
    expect(system).toEqual(generateSystem({ ...base, seed: 'version-a' }))
  })

  it('tags AI only where AI vocabulary appears under version 3, unlike version 2', () => {
    const v2Leaks = SEEDS.flatMap((seed) => untaggedAiFacts(generateSystem({ ...base, seed }, { generatorVersion: 2 })))
    const v3Leaks = SEEDS.flatMap((seed) => untaggedAiFacts(generateSystem({ ...base, seed }, { generatorVersion: 3 })))
    expect(v2Leaks.length).toBeGreaterThan(0)
    expect(v3Leaks).toEqual([])
  })

  it('changes nothing upstream of narrative domains and hook selection', () => {
    const v2 = generateSystem({ ...base, seed: 'version-b' }, { generatorVersion: 2 })
    const v3 = generateSystem({ ...base, seed: 'version-b' }, { generatorVersion: 3 })
    expect(v3.primary).toEqual(v2.primary)
    expect(v3.bodies).toEqual(v2.bodies)
    expect(v3.guOverlay).toEqual(v2.guOverlay)
    expect(v3.narrativeFacts.map((fact) => fact.id)).toEqual(v2.narrativeFacts.map((fact) => fact.id))
    expect(v3.narrativeFacts.map((fact) => fact.value)).toEqual(v2.narrativeFacts.map((fact) => fact.value))
  })

  it('only ever removes domains that version 2 found, across every option combination', () => {
    const distributions: GeneratorDistribution[] = ['frontier', 'realistic']
    const tones: GeneratorTone[] = ['balanced', 'astronomy', 'cinematic']
    const gus: GuPreference[] = ['normal', 'low', 'high', 'fracture']
    const densities: SettlementDensity[] = ['normal', 'sparse', 'crowded', 'hub']
    const added: string[] = []
    for (const distribution of distributions) for (const tone of tones) for (const gu of gus) for (const settlements of densities) {
      const system = generateSystem({ seed: `subset-${distribution}-${tone}-${gu}-${settlements}`, distribution, tone, gu, settlements }, { generatorVersion: 2 })
      for (const fact of system.narrativeFacts) {
        for (const text of [fact.value.value, `${fact.kind} ${fact.value.value} ${fact.tags.join(' ')}`]) {
          const v2 = new Set(classifyNarrativeDomainsV2(text))
          const v3 = classifyNarrativeDomainsV3(text)
          if (v3.length === 1 && v3[0] === 'public-life') continue
          for (const domain of v3) if (!v2.has(domain)) added.push(`${domain}: ${text}`)
        }
      }
    }
    expect(added).toEqual([])
  }, 60_000)
})

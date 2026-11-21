import { describe, expect, it } from 'vitest'
import {
  CLOSING_POOLS,
  SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
  SETTLEMENT_TAG_HOOK_TEMPLATES_V3,
  fillSettlementTagHookTemplate,
  settlementHookSynthesis,
  settlementTagHook,
} from '../settlementProse'
import { settlementTagPairHooks, settlementTagPressures, settlementTags } from '../../data/settlements'
import { generatorRules } from '../../rules'
import { createSeededRng } from '../../rng'
import type { SettlementHabitationPattern } from '../../../../types'

describe('settlementHookSynthesis', () => {
  it('produces a four-sentence hook for a regular habitationPattern settlement', () => {
    const rng = createSeededRng('test-seed-1')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      habitationPattern: 'Orbital station',
      siteCategory: 'orbital',
      settlementFunction: 'Iggygate control station',
      condition: 'Cramped and noisy',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'The route weather board sells safe windows twice',
      encounterSites: ['cargo dock', 'maintenance bay'],
      guIntensity: 'normal',
      tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
    })
    const sentences = result.split(/(?<=[.])\s+/)
    expect(sentences.length).toBeGreaterThanOrEqual(3)
    expect(sentences.length).toBeLessThanOrEqual(4)
    const closers = CLOSING_POOLS.balanced.map(c => c.replaceAll('{function}', 'the Iggygate control station'))
    expect(closers.some(c => result.endsWith(c))).toBe(true)
    expect(result).toMatch(/Privately, the route weather board sells safe windows twice\./)
  })

  it('uses automation-specific pressure for "Automated" habitationPattern', () => {
    const rng = createSeededRng('test-seed-2')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      habitationPattern: 'Automated',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Dormant',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Maintenance airlock'],
      guIntensity: 'normal',
      tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
    })
    expect(result).toMatch(/Automation failure turns maintenance airlock into the key scene\./)
  })

  it('uses salvage pressure for "Abandoned" habitationPattern', () => {
    const rng = createSeededRng('test-seed-3')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      habitationPattern: 'Abandoned',
      siteCategory: 'orbital',
      settlementFunction: 'survey rig',
      condition: 'Stripped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A community funeral compact protects the site',
      encounterSites: ['Skeleton hab'],
      guIntensity: 'normal',
      tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
    })
    expect(result).toMatch(/Salvage pressure centers on skeleton hab\./)
  })

  it('uses fracture-specific consequence when guIntensity contains "fracture"', () => {
    const rng = createSeededRng('test-seed-4')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      habitationPattern: 'Orbital station',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Cramped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Cargo dock'],
      guIntensity: 'major fracture',
      tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
    })
    expect(result).toContain('makes the GU work impossible to treat as routine')
  })
})

describe('settlementHookSynthesis — habitation-pattern variants', () => {
  const cases: Array<{ pattern: SettlementHabitationPattern; needle: string }> = [
    { pattern: 'Distributed swarm', needle: 'Coordination drift across the swarm' },
    { pattern: 'Ring station', needle: 'Ring-rotation politics' },
    { pattern: "O'Neill cylinder", needle: 'Centripetal-axis politics' },
    { pattern: 'Modular island station', needle: 'shuttle schedule between modules' },
    { pattern: 'Hub complex', needle: 'satellite outposts will refuse to accept' },
    { pattern: 'Hollow asteroid', needle: 'Spin-axis vibrations' },
    { pattern: 'Belt cluster', needle: "tether-bridges are fraying" },
    { pattern: 'Underground city', needle: 'Surface signals never reach' },
    { pattern: 'Sealed arcology', needle: 'Internal-weather faults' },
    { pattern: 'Sky platform', needle: 'one storm from rebuild' },
    { pattern: 'Tethered tower', needle: 'Tether-tension reports' },
    { pattern: 'Drift colony', needle: 'no gate, no route, and no rescue lane' },
    { pattern: 'Generation ship', needle: 'mid-voyage politics' },
  ]

  for (const { pattern, needle } of cases) {
    it(`uses pattern-specific pressure for ${pattern}`, () => {
      const rng = createSeededRng(`pattern-${pattern}`)
      const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
        habitationPattern: pattern,
        siteCategory: 'orbital',
        settlementFunction: 'fueling depot',
        condition: 'Cramped',
        crisis: 'Bleed node changed course',
        hiddenTruth: 'A debt ledger nobody wants audited',
        encounterSites: ['Cargo dock', 'Maintenance airlock'],
        guIntensity: 'normal',
        tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
      })
      expect(result).toContain(needle)
    })
  }
})

describe('settlementTagHook', () => {
  it('returns the authored hook for a known tag pair', () => {
    const rng = createSeededRng('tag-hook-1')
    const result = settlementTagHook(rng, 'Gate Shadow', 'Archive War', SETTLEMENT_TAG_HOOK_TEMPLATES_V2)
    expect(result).toContain('Gate Shadow')
    expect(result).toContain('Archive War')
    expect(result).toContain('decides who can leave')
    expect(result).toMatch(/[.;!?]$|with a fragment ending without punctuation/)
    expect(result.length).toBeGreaterThan(20)
  })

  it('falls back to a deterministic template when no authored pair exists', () => {
    const rng = createSeededRng('tag-hook-2')
    const result = settlementTagHook(rng, 'Synthetic Tag One', 'Synthetic Tag Two', SETTLEMENT_TAG_HOOK_TEMPLATES_V2)
    expect(result).toContain('Synthetic Tag One')
    expect(result).toContain('Synthetic Tag Two')
  })

  it('produces deterministic output for the same seed', () => {
    const a = settlementTagHook(createSeededRng('tag-hook-3', SETTLEMENT_TAG_HOOK_TEMPLATES_V2), 'Gate Shadow', 'Archive War')
    const b = settlementTagHook(createSeededRng('tag-hook-3', SETTLEMENT_TAG_HOOK_TEMPLATES_V2), 'Gate Shadow', 'Archive War')
    expect(a).toBe(b)
  })
})

describe('settlement Tag Hook template pools', () => {
  const hasPairHook = (a: string, b: string) =>
    Boolean(settlementTagPairHooks[`${a} + ${b}`] ?? settlementTagPairHooks[`${b} + ${a}`])
  const obviousTags = settlementTags.slice(0, 3)
  const representativePairs = obviousTags.flatMap((obviousTag) =>
    settlementTags
      .filter((deeperTag) => deeperTag !== obviousTag && !hasPairHook(obviousTag, deeperTag))
      .map((deeperTag) => [obviousTag, deeperTag] as const),
  )

  it('resolves the pool through the version rules', () => {
    expect(generatorRules(2).settlementTagHookTemplates).toBe(SETTLEMENT_TAG_HOOK_TEMPLATES_V2)
    expect(generatorRules(3).settlementTagHookTemplates).toBe(SETTLEMENT_TAG_HOOK_TEMPLATES_V3)
    expect(SETTLEMENT_TAG_HOOK_TEMPLATES_V2).toHaveLength(4)
    expect(SETTLEMENT_TAG_HOOK_TEMPLATES_V3).toHaveLength(16)
    expect(new Set(SETTLEMENT_TAG_HOOK_TEMPLATES_V3).size).toBe(16)
    expect(SETTLEMENT_TAG_HOOK_TEMPLATES_V3.slice(0, 4)).toEqual(SETTLEMENT_TAG_HOOK_TEMPLATES_V2)
  })

  it('renders every template as one sentence ending in exactly one period with all slots filled', () => {
    expect(representativePairs.length).toBeGreaterThan(20)
    for (const template of SETTLEMENT_TAG_HOOK_TEMPLATES_V3) {
      expect(template).toContain('{obviousTag}')
      expect(template).toContain('{deeperText}')
      for (const [obviousTag, deeperTag] of representativePairs) {
        const deeperText = settlementTagPressures[deeperTag]
        expect(deeperText, deeperTag).toBeTruthy()
        const hook = fillSettlementTagHookTemplate(template, { obviousTag, deeperTag, deeperText })
        expect(hook, template).not.toMatch(/[{}]/)
        expect(hook).toContain(obviousTag)
        expect(hook).toContain(deeperText)
        expect(hook.match(/\./g), hook).toHaveLength(1)
        expect(hook.endsWith('.'), hook).toBe(true)
        expect(hook[0], hook).toBe(hook[0].toUpperCase())
      }
    }
  })

  it('lets v3 produce each of its 16 templates and v2 only its 4', () => {
    const [obviousTag, deeperTag] = representativePairs[0]
    const deeperText = settlementTagPressures[deeperTag]
    const render = (templates: readonly string[]) =>
      new Set(templates.map((template) => fillSettlementTagHookTemplate(template, { obviousTag, deeperTag, deeperText })))
    const seen = (templates: readonly string[]) => {
      const outputs = new Set<string>()
      for (let i = 0; i < 400; i++) outputs.add(settlementTagHook(createSeededRng(`pool-${i}`), obviousTag, deeperTag, templates))
      return outputs
    }
    expect(seen(SETTLEMENT_TAG_HOOK_TEMPLATES_V3)).toEqual(render(SETTLEMENT_TAG_HOOK_TEMPLATES_V3))
    expect(seen(SETTLEMENT_TAG_HOOK_TEMPLATES_V2)).toEqual(render(SETTLEMENT_TAG_HOOK_TEMPLATES_V2))
  })

  it('keeps hand-written pair hooks ahead of the templates', () => {
    const v3 = settlementTagHook(createSeededRng('pair'), 'Gate Shadow', 'Archive War', SETTLEMENT_TAG_HOOK_TEMPLATES_V3)
    expect(v3).toBe(settlementTagPairHooks['Gate Shadow + Archive War'] ?? settlementTagPairHooks['Archive War + Gate Shadow'])
  })
})

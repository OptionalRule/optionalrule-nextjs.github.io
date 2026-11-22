import { describe, expect, it } from 'vitest'
import { CLOSING_POOLS, SETTLEMENT_TAG_HOOK_TEMPLATES_V2, settlementHookSynthesis } from '../settlementProse'
import { createSeededRng } from '../../rng'
import type { GeneratorTone } from '../../../../types'

const TONES: readonly GeneratorTone[] = ['balanced', 'cinematic', 'astronomy']

describe('closing pools', () => {
  it('has at least 6 closers per tone, each using the {function} slot', () => {
    for (const tone of TONES) {
      expect(CLOSING_POOLS[tone].length, tone).toBeGreaterThanOrEqual(6)
      for (const closer of CLOSING_POOLS[tone]) {
        expect(closer).toContain('{function}')
      }
    }
  })
})

describe('closer distribution', () => {
  it('no single closer dominates across 30 syntheses', () => {
    const counts = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const hook = settlementHookSynthesis(
        createSeededRng(`closer-${i}`),
        'Air Is Money',
        'Debt Labor',
        {
          habitationPattern: 'Surface settlement',
          siteCategory: 'Surface settlement',
          settlementFunction: 'Salvage yard',
          condition: 'Stable',
          crisis: 'Labor strike',
          hiddenTruth: 'The workers are legally trapped',
          encounterSites: ['public ration office'],
          guIntensity: 'Low bleed',
          tone: 'balanced',
          tagHookTemplates: SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
        },
      )
      const sentences = hook.split(/(?<=\.)\s+/)
      const closer = sentences[sentences.length - 1]
      counts.set(closer, (counts.get(closer) ?? 0) + 1)
    }
    const max = Math.max(...counts.values())
    expect(max / 30).toBeLessThanOrEqual(0.4)
  })
})

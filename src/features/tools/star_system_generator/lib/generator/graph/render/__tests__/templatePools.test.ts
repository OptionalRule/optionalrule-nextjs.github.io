import { describe, expect, it } from 'vitest'
import { templateFor } from '../templates'
import type { EdgeTemplate } from '../templates'
import type { EdgeType } from '../../types'
import type { GeneratorTone } from '../../../../../types'

const PRESENT_TYPES: readonly EdgeType[] = [
  'HOSTS', 'CONTROLS', 'DEPENDS_ON', 'CONTESTS', 'DESTABILIZES',
  'SUPPRESSES', 'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
]
const HISTORICAL_TYPES: readonly EdgeType[] = ['FOUNDED_BY', 'BETRAYED', 'DISPLACED']
const TONES: readonly GeneratorTone[] = ['balanced', 'cinematic', 'astronomy']

function slotNames(template: EdgeTemplate): string[] {
  return [...template.text.matchAll(/\{([a-zA-Z]+)(?::[a-zA-Z]+)?(?:\|[^}]*)?\}/g)].map(m => m[1])
}

function allTemplates(type: EdgeType): EdgeTemplate[] {
  const family = templateFor(type)
  return [
    ...family.body,
    ...Object.values(family.bodyByTone ?? {}).flat(),
    family.spineSummary,
    ...Object.values(family.spineSummaryByTone ?? {}).flat(),
    ...family.historicalBridge,
    ...family.hook,
  ]
}

describe('template pool floors', () => {
  for (const type of PRESENT_TYPES) {
    it(`${type} meets body and summary floors for every tone`, () => {
      const family = templateFor(type)
      expect(family.body.length, `${type} balanced body`).toBeGreaterThanOrEqual(8)
      expect(family.bodyByTone?.cinematic?.length ?? 0, `${type} cinematic body`).toBeGreaterThanOrEqual(8)
      expect(family.bodyByTone?.astronomy?.length ?? 0, `${type} astronomy body`).toBeGreaterThanOrEqual(8)
      for (const tone of TONES) {
        expect(family.spineSummaryByTone?.[tone]?.length ?? 0, `${type} ${tone} spine summary`).toBeGreaterThanOrEqual(4)
      }
    })
  }

  for (const type of HISTORICAL_TYPES) {
    it(`${type} meets the historical body floor`, () => {
      expect(templateFor(type).body.length).toBeGreaterThanOrEqual(6)
    })
  }
})

describe('template slot integrity', () => {
  for (const type of [...PRESENT_TYPES, ...HISTORICAL_TYPES]) {
    it(`${type} declares expects for every slot and uses every declared slot`, () => {
      for (const template of allTemplates(type)) {
        if (template.text === '') continue
        const used = new Set(slotNames(template))
        for (const declared of Object.keys(template.expects)) {
          expect(used.has(declared), `${type}: expects '${declared}' unused in "${template.text}"`).toBe(true)
        }
        for (const slot of used) {
          if (slot === 'historical') continue
          expect(
            Object.hasOwn(template.expects, slot),
            `${type}: slot '${slot}' lacks expects in "${template.text}"`,
          ).toBe(true)
        }
      }
    })
  }
})

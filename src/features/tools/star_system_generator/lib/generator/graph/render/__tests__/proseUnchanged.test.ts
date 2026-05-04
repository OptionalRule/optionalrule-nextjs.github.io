import { describe, expect, it } from 'vitest'
import { generateSystem } from '../../../index'
import type { GenerationOptions } from '../../../../types'

const baseOptions: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

const seeds = ['phase3-prose-1', 'phase3-prose-2', 'phase3-prose-3'] as const

describe('Phase 3 existing prose remains byte-identical', () => {
  for (const seed of seeds) {
    it(`seed ${seed} produces stable existing-prose surfaces`, () => {
      const sys = generateSystem({ seed, ...baseOptions })

      const surfaces = {
        systemName: sys.name.value,
        settlementTagHooks: sys.settlements.map(s => s.tagHook?.value ?? ''),
        settlementWhyHere: sys.settlements.map(s => s.whyHere?.value ?? ''),
        phenomenonNotes: sys.phenomena.map(p => p.note?.value ?? ''),
      }

      expect(surfaces).toMatchSnapshot()
    })
  }
})

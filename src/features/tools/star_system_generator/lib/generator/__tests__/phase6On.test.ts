import { describe, expect, it } from 'vitest'
import { generateSystem } from '..'
import type { GenerationOptions } from '../../../types'

const baseOptions: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
  graphAware: {
    settlementWhyHere: true,
    phenomenonNote: true,
    settlementHookSynthesis: true,
  },
}

const seeds = ['phase6-on-1', 'phase6-on-2', 'phase6-on-3'] as const

describe('Phase 6 graph-aware prose surfaces (all flags on)', () => {
  for (const seed of seeds) {
    it(`seed ${seed} produces stable graph-aware output`, () => {
      const sys = generateSystem({ seed, ...baseOptions })

      const surfaces = {
        settlementTagHooks: sys.settlements.map(s => s.tagHook?.value ?? ''),
        settlementWhyHere: sys.settlements.map(s => s.whyHere?.value ?? ''),
        phenomenonNotes: sys.phenomena.map(p => p.note?.value ?? ''),
      }

      expect(surfaces).toMatchSnapshot()
    })
  }
})

describe('Phase 6 isolation: flag toggles only affect their own surface', () => {
  it('settlementWhyHere flag alone does not change tagHook or note', () => {
    const allOff = generateSystem({ seed: 'isolate-1', ...baseOptions, graphAware: {} })
    const onlyWhy = generateSystem({
      seed: 'isolate-1', ...baseOptions,
      graphAware: { settlementWhyHere: true },
    })
    expect(onlyWhy.settlements.map(s => s.tagHook.value))
      .toEqual(allOff.settlements.map(s => s.tagHook.value))
    expect(onlyWhy.phenomena.map(p => p.note.value))
      .toEqual(allOff.phenomena.map(p => p.note.value))
  })

  it('phenomenonNote flag alone does not change settlement surfaces', () => {
    const allOff = generateSystem({ seed: 'isolate-2', ...baseOptions, graphAware: {} })
    const onlyNote = generateSystem({
      seed: 'isolate-2', ...baseOptions,
      graphAware: { phenomenonNote: true },
    })
    expect(onlyNote.settlements.map(s => s.tagHook.value))
      .toEqual(allOff.settlements.map(s => s.tagHook.value))
    expect(onlyNote.settlements.map(s => s.whyHere.value))
      .toEqual(allOff.settlements.map(s => s.whyHere.value))
  })

  it('settlementHookSynthesis flag alone does not change whyHere or note', () => {
    const allOff = generateSystem({ seed: 'isolate-3', ...baseOptions, graphAware: {} })
    const onlyHook = generateSystem({
      seed: 'isolate-3', ...baseOptions,
      graphAware: { settlementHookSynthesis: true },
    })
    expect(onlyHook.settlements.map(s => s.whyHere.value))
      .toEqual(allOff.settlements.map(s => s.whyHere.value))
    expect(onlyHook.phenomena.map(p => p.note.value))
      .toEqual(allOff.phenomena.map(p => p.note.value))
  })
})

describe('Phase 6 determinism', () => {
  it('same seed + same flags produces identical output across runs', () => {
    const a = generateSystem({ seed: 'det-1', ...baseOptions })
    const b = generateSystem({ seed: 'det-1', ...baseOptions })
    expect(a.settlements.map(s => s.whyHere.value))
      .toEqual(b.settlements.map(s => s.whyHere.value))
    expect(a.settlements.map(s => s.tagHook.value))
      .toEqual(b.settlements.map(s => s.tagHook.value))
    expect(a.phenomena.map(p => p.note.value))
      .toEqual(b.phenomena.map(p => p.note.value))
  })
})

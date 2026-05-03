import { describe, expect, it } from 'vitest'
import type { GenerationOptions } from '../types'

describe('GenerationOptions', () => {
  it('accepts graphAware field with all subflags optional', () => {
    const opts: GenerationOptions = {
      seed: 't1',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    }
    expect(opts).toBeDefined()

    const optsWithFlags: GenerationOptions = {
      ...opts,
      graphAware: { settlementWhyHere: true },
    }
    expect(optsWithFlags.graphAware?.settlementWhyHere).toBe(true)

    const optsAllFlags: GenerationOptions = {
      ...opts,
      graphAware: {
        settlementWhyHere: true,
        phenomenonNote: true,
        settlementHookSynthesis: true,
      },
    }
    expect(Object.keys(optsAllFlags.graphAware ?? {})).toHaveLength(3)
  })
})

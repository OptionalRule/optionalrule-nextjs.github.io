import { describe, expect, it } from 'vitest'
import { settlementHookSynthesis, settlementWhyHere, settlementTagHook } from '../settlementProse'
import { createSeededRng } from '../../rng'

describe('settlementHookSynthesis', () => {
  it('produces a four-sentence hook for a regular-scale settlement', () => {
    const rng = createSeededRng('test-seed-1')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Outpost',
      siteCategory: 'orbital',
      settlementFunction: 'Iggygate control station',
      condition: 'Cramped and noisy',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'The route weather board sells safe windows twice',
      encounterSites: ['cargo dock', 'maintenance bay'],
      guIntensity: 'normal',
    })
    const sentences = result.split(/(?<=[.])\s+/)
    expect(sentences.length).toBeGreaterThanOrEqual(3)
    expect(sentences.length).toBeLessThanOrEqual(4)
    expect(result).toMatch(/Control of the Iggygate control station decides who has leverage\.$/)
    expect(result).toMatch(/Privately, the route weather board sells safe windows twice\./)
  })

  it('uses automation-specific pressure for "Automated only" scale', () => {
    const rng = createSeededRng('test-seed-2')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Automated only',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Dormant',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Maintenance airlock'],
      guIntensity: 'normal',
    })
    expect(result).toMatch(/Automation failure turns maintenance airlock into the key scene\./)
  })

  it('uses salvage pressure for "Abandoned" scale', () => {
    const rng = createSeededRng('test-seed-3')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Abandoned',
      siteCategory: 'orbital',
      settlementFunction: 'survey rig',
      condition: 'Stripped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A community funeral compact protects the site',
      encounterSites: ['Skeleton hab'],
      guIntensity: 'normal',
    })
    expect(result).toMatch(/Salvage pressure centers on skeleton hab\./)
  })

  it('uses fracture-specific consequence when guIntensity contains "fracture"', () => {
    const rng = createSeededRng('test-seed-4')
    const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
      scale: 'Outpost',
      siteCategory: 'orbital',
      settlementFunction: 'fueling depot',
      condition: 'Cramped',
      crisis: 'Bleed node changed course',
      hiddenTruth: 'A debt ledger nobody wants audited',
      encounterSites: ['Cargo dock'],
      guIntensity: 'major fracture',
    })
    expect(result).toContain('makes the GU work impossible to treat as routine')
  })
})

describe('settlementWhyHere', () => {
  it('is exported as a function from settlementProse', () => {
    expect(typeof settlementWhyHere).toBe('function')
  })

  it('produces a non-empty string for a typical settlement', async () => {
    const { generateSystem } = await import('../../index')
    const system = generateSystem({ seed: 'phase0-whyhere-1' })
    const settlement = system.settlements[0]
    expect(settlement.whyHere?.value).toBeTruthy()
    expect(settlement.whyHere?.value.length).toBeGreaterThan(20)
  })

  it('produces deterministic output for the same seed', async () => {
    const { generateSystem } = await import('../../index')
    const a = generateSystem({ seed: 'phase0-whyhere-2' })
    const b = generateSystem({ seed: 'phase0-whyhere-2' })
    expect(a.settlements[0]?.whyHere?.value).toBe(b.settlements[0]?.whyHere?.value)
  })
})

describe('settlementTagHook', () => {
  it('returns the authored hook for a known tag pair', () => {
    const rng = createSeededRng('tag-hook-1')
    const result = settlementTagHook(rng, 'Gate Shadow', 'Archive War')
    expect(result).toContain('Gate Shadow')
    expect(result).toContain('Archive War')
    expect(result).toMatch(/[.;!?]$|with a fragment ending without punctuation/)
    expect(result.length).toBeGreaterThan(20)
  })

  it('falls back to a deterministic template when no authored pair exists', () => {
    const rng = createSeededRng('tag-hook-2')
    const result = settlementTagHook(rng, 'Synthetic Tag One', 'Synthetic Tag Two')
    expect(result).toContain('Synthetic Tag One')
    expect(result).toContain('Synthetic Tag Two')
  })

  it('produces deterministic output for the same seed', () => {
    const a = settlementTagHook(createSeededRng('tag-hook-3'), 'Gate Shadow', 'Archive War')
    const b = settlementTagHook(createSeededRng('tag-hook-3'), 'Gate Shadow', 'Archive War')
    expect(a).toBe(b)
  })
})

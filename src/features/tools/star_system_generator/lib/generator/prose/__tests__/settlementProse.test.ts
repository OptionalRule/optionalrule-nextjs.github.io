import { describe, expect, it } from 'vitest'
import { settlementHookSynthesis, settlementTagHook } from '../settlementProse'
import { createSeededRng } from '../../rng'

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
    })
    const sentences = result.split(/(?<=[.])\s+/)
    expect(sentences.length).toBeGreaterThanOrEqual(3)
    expect(sentences.length).toBeLessThanOrEqual(4)
    expect(result).toMatch(/Control of the Iggygate control station decides who has leverage\.$/)
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
    })
    expect(result).toContain('makes the GU work impossible to treat as routine')
  })
})

describe('settlementTagHook', () => {
  it('returns the authored hook for a known tag pair', () => {
    const rng = createSeededRng('tag-hook-1')
    const result = settlementTagHook(rng, 'Gate Shadow', 'Archive War')
    expect(result).toContain('Gate Shadow')
    expect(result).toContain('Archive War')
    expect(result).toContain('decides who can leave')
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

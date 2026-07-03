import { describe, expect, it } from 'vitest'
import { composePhenomenonConflict } from '../phenomenonConflict'
import { createSeededRng } from '../../rng'
import type { PhenomenonEntry } from '../../data/narrative'

const entryWithLivelihoods: PhenomenonEntry = {
  label: 'Dense debris disk',
  confidence: 'inferred',
  travelEffect: 'Approach vectors require slow burns.',
  surveyQuestion: 'Which fragments carry isotopes?',
  conflictHook: 'Insurers, salvagers, and GU traffic auditors dispute who must clear safe lanes.',
  sceneAnchor: 'A cutter drifts beside a glittering wall.',
  livelihoods: [
    {
      actor: 'lane-clearing co-ops',
      dependence: 'bill insurers by the cubic kilometer of certified-clear corridor',
      friction: 'every corridor they certify silts back up before the invoice clears',
    },
    {
      actor: 'fragment prospectors',
      dependence: 'chase transponder ghosts and industrial isotopes through the thick bands',
      friction: 'the richest fragments sit in lanes the clearing co-ops are paid to keep empty',
    },
  ],
}

const entryWithoutLivelihoods: PhenomenonEntry = {
  label: 'Fallback phenomenon',
  confidence: 'inferred',
  travelEffect: 'Nothing changes course.',
  surveyQuestion: 'What is out there?',
  conflictHook: 'Nobody can agree on jurisdiction.',
  sceneAnchor: 'A beacon blinks in the dark.',
}

describe('composePhenomenonConflict', () => {
  it('produces different hooks for different rng streams on the same phenomenon', () => {
    const outputs = new Set<string>()
    for (let i = 0; i < 20; i++) {
      outputs.add(composePhenomenonConflict(entryWithLivelihoods, createSeededRng(`conflict-${i}`)))
    }
    expect(outputs.size).toBeGreaterThanOrEqual(3)
  })

  it('produces output with no unresolved template braces', () => {
    for (let i = 0; i < 20; i++) {
      const result = composePhenomenonConflict(entryWithLivelihoods, createSeededRng(`brace-${i}`))
      expect(result).not.toMatch(/[{}]/)
    }
  })

  it('includes the chosen livelihood actor and friction text', () => {
    const result = composePhenomenonConflict(entryWithLivelihoods, createSeededRng('content-check'))
    const matchedLivelihood = entryWithLivelihoods.livelihoods?.find(
      (livelihood) => result.includes(livelihood.friction),
    )
    expect(matchedLivelihood).toBeDefined()
  })

  it('falls back to the static conflictHook when the entry has no livelihoods', () => {
    for (let i = 0; i < 5; i++) {
      const result = composePhenomenonConflict(entryWithoutLivelihoods, createSeededRng(`fallback-${i}`))
      expect(result).toBe(entryWithoutLivelihoods.conflictHook)
    }
  })

  it('falls back to the static conflictHook when livelihoods is an empty array', () => {
    const emptyEntry: PhenomenonEntry = { ...entryWithoutLivelihoods, livelihoods: [] }
    const result = composePhenomenonConflict(emptyEntry, createSeededRng('empty-livelihoods'))
    expect(result).toBe(emptyEntry.conflictHook)
  })
})

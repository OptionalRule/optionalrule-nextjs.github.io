import { describe, expect, it } from 'vitest'
import { conditionAsPressure, crisisAsPressure, crisisPressureSentence } from '../crisisShaping'
import settlementsData from '../../../../data/settlements.json'

describe('conditionAsPressure', () => {
  it('maps "recently evacuated" condition with place', () => {
    expect(conditionAsPressure('recently evacuated', 'Orison Hold'))
      .toBe('the recent evacuation of Orison Hold')
  })
  it('maps "under quarantine" with place', () => {
    expect(conditionAsPressure('under quarantine', 'Orison Hold'))
      .toBe('the quarantine at Orison Hold')
  })
  it('maps "divided by class zones"', () => {
    expect(conditionAsPressure('divided by class zones', 'Orison Hold'))
      .toBe('class-zone divisions at Orison Hold')
  })
  it('maps "pristine and overfunded"', () => {
    expect(conditionAsPressure('pristine and overfunded', 'Orison Hold'))
      .toBe('the overfunded order at Orison Hold')
  })
  it('maps "efficient but joyless"', () => {
    expect(conditionAsPressure('efficient but joyless', 'Orison Hold'))
      .toBe('joyless efficiency at Orison Hold')
  })
  it('maps "population unknown" / falsified', () => {
    expect(conditionAsPressure('population unknown', 'Orison Hold'))
      .toBe('falsified population records at Orison Hold')
    expect(conditionAsPressure('records falsified', 'Orison Hold'))
      .toBe('falsified population records at Orison Hold')
  })
  it('falls through to "<condition> conditions at <place>"', () => {
    expect(conditionAsPressure('Cramped and noisy', 'Orison Hold'))
      .toBe('cramped and noisy conditions at Orison Hold')
  })
})

describe('crisisAsPressure', () => {
  it('maps "the base broadcasts two contradictory distress calls"', () => {
    expect(crisisAsPressure('The base broadcasts two contradictory distress calls'))
      .toBe('contradictory distress calls from the base')
  })
  it('maps "a whole district goes silent"', () => {
    expect(crisisAsPressure('A whole district goes silent'))
      .toBe('a silent district')
  })
  it('maps "ship full of dead arrives"', () => {
    expect(crisisAsPressure('Ship full of dead arrives'))
      .toBe('the arrival of a ship full of dead')
  })
  it('maps "bleed node changed course"', () => {
    expect(crisisAsPressure('Bleed node changed course'))
      .toBe('a drifting bleed node')
  })
  it('maps "Sol/Gardener warning sign detected"', () => {
    expect(crisisAsPressure('Sol/Gardener warning sign detected'))
      .toBe('a detected Sol or Gardener warning sign')
  })
  it('handles labor strike with article injection', () => {
    expect(crisisAsPressure('Labor strike'))
      .toBe('a labor strike')
  })
  it('handles unknown native microbial hazard with vowel article', () => {
    expect(crisisAsPressure('Unknown native microbial hazard'))
      .toBe('an unknown native microbial hazard')
  })
  it('passes unmatched crisis through after lowercase + smoothing', () => {
    expect(crisisAsPressure('Sol/Gardener compliance team seizes the port'))
      .toBe('Sol or Gardener compliance team seizes the port')
  })
})

describe('crisisPressureSentence', () => {
  it('handles "ships trapped" with plural-shifted consequence', () => {
    expect(crisisPressureSentence('Metric storm trapped ships', 'keeps the lane closed'))
      .toBe('Ships trapped by a metric storm keep the lane closed.')
  })
  it('handles "trapped civilians" with plural-shifted consequence', () => {
    expect(crisisPressureSentence('Children or civilians trapped', 'makes evacuation urgent'))
      .toBe('Trapped civilians make evacuation urgent.')
  })
  it('handles is/are/was/were verbs with comma-which clause', () => {
    expect(crisisPressureSentence('Hull breach hidden from public', 'forces silence on the crew'))
      .toBe('A hidden hull breach forces silence on the crew.')
  })
  it('handles sabotage', () => {
    expect(crisisPressureSentence('Sabotage of life support', 'keeps tempers raw'))
      .toBe('Sabotage against life support keeps tempers raw.')
  })
  it('handles articled crises', () => {
    expect(crisisPressureSentence('Bleed node changed course', 'keeps gate politics under stress'))
      .toBe('A drifting bleed node keeps gate politics under stress.')
  })
  it('wraps clause-shaped crises with "When X, the situation Y" (verb-collision fix)', () => {
    expect(crisisPressureSentence('Sol/Gardener compliance team seizes the port', 'keeps trade frozen'))
      .toBe('When Sol or Gardener compliance team seizes the port, the situation keeps trade frozen.')
  })
  it('wraps another lexical-verb crisis', () => {
    expect(crisisPressureSentence('Archive court releases two incompatible rulings', 'keeps litigation alive'))
      .toBe('When archive court releases two incompatible rulings, the situation keeps litigation alive.')
  })
  it('still falls back to "The crisis around X" when crisis has no detectable verb shape', () => {
    expect(crisisPressureSentence('general unrest', 'shapes politics'))
      .toBe('The crisis around general unrest shapes politics.')
  })
  it('does not over-wrap noun-phrase rewrites with plural nouns', () => {
    expect(crisisPressureSentence('The base broadcasts two contradictory distress calls', 'keeps gate politics under stress'))
      .toBe('The crisis around contradictory distress calls from the base keeps gate politics under stress.')
  })
  it('routes recognized AI rewrites to noun-phrase fallback', () => {
    expect(crisisPressureSentence('AI refuses unsafe operation', 'keeps gate politics under stress'))
      .toBe('The crisis around AI refusal to operate unsafely keeps gate politics under stress.')
  })
  it('falls back for capitalized noun-phrase crises with no verb shape', () => {
    expect(crisisPressureSentence('Food culture contamination', 'keeps tensions high'))
      .toBe('The crisis around food culture contamination keeps tensions high.')
    expect(crisisPressureSentence('Water ration failure', 'keeps tensions high'))
      .toBe('The crisis around water ration failure keeps tensions high.')
  })
})

describe('crisisPressureSentence — full pool characterization', () => {
  const allCrises = (() => {
    const set = new Set<string>()
    const data = settlementsData as { crises: string[]; crisisByScale: Record<string, string[]> }
    for (const c of data.crises ?? []) set.add(c)
    for (const arr of Object.values(data.crisisByScale ?? {})) {
      for (const c of arr) set.add(c)
    }
    return Array.from(set).sort()
  })()

  it('produces a sentence ending with a period for every pool entry', () => {
    for (const crisis of allCrises) {
      const result = crisisPressureSentence(crisis, 'keeps tensions high')
      expect(result).toMatch(/\.$/)
      expect(result).not.toMatch(/\b(\w+)\s+\1\b/i)
    }
  })

  it('snapshots all pool outputs for visual review', () => {
    const outputs: Record<string, string> = {}
    for (const crisis of allCrises) {
      outputs[crisis] = crisisPressureSentence(crisis, 'keeps tensions high')
    }
    expect(outputs).toMatchSnapshot()
  })
})

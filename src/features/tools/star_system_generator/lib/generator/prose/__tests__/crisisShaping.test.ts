import { describe, expect, it } from 'vitest'
import { conditionAsPressure, crisisAsPressure } from '../crisisShaping'

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

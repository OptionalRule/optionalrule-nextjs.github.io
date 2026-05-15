import { describe, expect, it } from 'vitest'
import { selectBand } from '../lib/generator/population'
import type { BandSelectionInput } from '../lib/generator/population'

const baseInput: BandSelectionInput = {
  habitability: 'hostile',
  resource: 'minimal',
  strategic: 'none',
  load: 'empty',
  modifiers: {
    stabilizedTerraform: false,
    hubReachability: false,
    failedTerraform: false,
    severeGu: false,
    flareStressed: false,
    settlementDensityHub: false,
  },
}

describe('selectBand', () => {
  it('returns "empty" for a hostile body with no signals', () => {
    expect(selectBand(baseInput)).toBe('empty')
  })

  it('returns "automated" for a body with minor strategic value but no settlement load', () => {
    expect(
      selectBand({
        ...baseInput,
        strategic: 'minor',
      }),
    ).toBe('automated')
  })

  it('returns "transient" for a body with light load and modest resource', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'harsh',
        resource: 'modest',
        load: 'light',
      }),
    ).toBe('transient')
  })

  it('returns "outpost" for a frontier-scale body', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'harsh',
        resource: 'substantial',
        strategic: 'minor',
        load: 'light',
      }),
    ).toBe('outpost')
  })

  it('returns "frontier" for a shielded-viable body with substantial resource and a named settlement', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'shielded-viable',
        resource: 'substantial',
        strategic: 'notable',
        load: 'moderate',
      }),
    ).toBe('frontier')
  })

  it('returns "colony" for a viable body with rich resources and several settlements', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'viable',
        resource: 'rich',
        strategic: 'notable',
        load: 'heavy',
      }),
    ).toBe('colony')
  })

  it('returns "established" for a comfortable body with strong settlement load', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'comfortable',
        resource: 'rich',
        strategic: 'notable',
        load: 'heavy',
      }),
    ).toBe('established')
  })

  it('promotes to "populous" with hub reachability + stable atmosphere + heavy load', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'comfortable',
        resource: 'rich',
        strategic: 'critical',
        load: 'heavy',
        modifiers: { ...baseInput.modifiers, hubReachability: true },
      }),
    ).toBe('populous')
  })

  it('unlocks "dense-world" only with stabilized terraform on a comfortable body in a hub system', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'comfortable',
        resource: 'rich',
        strategic: 'critical',
        load: 'heavy',
        modifiers: {
          ...baseInput.modifiers,
          stabilizedTerraform: true,
          hubReachability: true,
          settlementDensityHub: true,
        },
      }),
    ).toBe('dense-world')
  })

  it('does NOT promote to "populous" or above when atmosphere is hostile', () => {
    const band = selectBand({
      ...baseInput,
      habitability: 'hostile',
      resource: 'rich',
      strategic: 'critical',
      load: 'heavy',
      modifiers: { ...baseInput.modifiers, hubReachability: true },
    })
    expect(['empty', 'automated', 'transient', 'outpost', 'frontier', 'colony'].includes(band)).toBe(true)
  })

  it('caps band at "colony" when terraform has failed, even with otherwise strong signals', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'viable',
        resource: 'rich',
        strategic: 'critical',
        load: 'heavy',
        modifiers: {
          ...baseInput.modifiers,
          failedTerraform: true,
          hubReachability: true,
        },
      }),
    ).toBe('colony')
  })

  it('drops one band on severe GU exposure', () => {
    const withoutGu = selectBand({
      ...baseInput,
      habitability: 'shielded-viable',
      resource: 'substantial',
      strategic: 'notable',
      load: 'moderate',
    })
    const withGu = selectBand({
      ...baseInput,
      habitability: 'shielded-viable',
      resource: 'substantial',
      strategic: 'notable',
      load: 'moderate',
      modifiers: { ...baseInput.modifiers, severeGu: true },
    })
    expect(withGu).not.toBe(withoutGu)
  })

  it('caps band at "frontier" when tidally locked + flare-stressed', () => {
    expect(
      selectBand({
        ...baseInput,
        habitability: 'viable',
        resource: 'rich',
        strategic: 'critical',
        load: 'heavy',
        modifiers: {
          ...baseInput.modifiers,
          flareStressed: true,
          hubReachability: true,
        },
      }),
    ).toBe('frontier')
  })
})

import { describe, it, expect } from 'vitest'
import {
  debrisShapeLabel, densityBandLabel, anchorModeLabel,
  formatDebrisExtentLine, formatDebrisRegionSuffix,
} from '../lib/debrisFieldDisplay'

describe('debris field display helpers', () => {
  it('debrisShapeLabel maps shape to human label', () => {
    expect(debrisShapeLabel('polar-ring')).toBe('Polar circumbinary ring')
    expect(debrisShapeLabel('mass-transfer-stream')).toBe('Mass-transfer stream')
    expect(debrisShapeLabel('common-envelope-shell')).toBe('Common-envelope ejecta shell')
    expect(debrisShapeLabel('inner-pair-halo')).toBe('Hierarchical inner-pair halo')
    expect(debrisShapeLabel('trojan-camp')).toBe('Binary Trojan camp')
    expect(debrisShapeLabel('kozai-scattered-halo')).toBe('Kozai-Lidov scattered halo')
    expect(debrisShapeLabel('hill-sphere-capture-cone')).toBe('Hill-sphere capture cone')
    expect(debrisShapeLabel('exocomet-swarm')).toBe('Resonance-pumped exocomet swarm')
    expect(debrisShapeLabel('accretion-bridge')).toBe('Accretion bridge')
    expect(debrisShapeLabel('gardener-cordon')).toBe('Gardener-quarantine cordon')
  })

  it('densityBandLabel maps band to label', () => {
    expect(densityBandLabel('dust')).toBe('dust haze')
    expect(densityBandLabel('sparse')).toBe('sparse field')
    expect(densityBandLabel('asteroid-fleet')).toBe('asteroid-fleet density')
    expect(densityBandLabel('shell-dense')).toBe('dense shell')
    expect(densityBandLabel('stream')).toBe('narrow stream')
  })

  it('anchorModeLabel maps anchor mode to label', () => {
    expect(anchorModeLabel('embedded')).toBe('settlements can be embedded')
    expect(anchorModeLabel('edge-only')).toBe('rim settlements only')
    expect(anchorModeLabel('transient-only')).toBe('mobile camps only')
    expect(anchorModeLabel('unanchorable')).toBe('no settlements possible')
  })

  it('formatDebrisExtentLine reads inner/outer/inclination', () => {
    expect(formatDebrisExtentLine({ inner: 2.5, outer: 7.5, inclinationDeg: 90 })).toBe('2.5 - 7.5 AU, perpendicular')
    expect(formatDebrisExtentLine({ inner: 0.3, outer: 1.2, inclinationDeg: 0 })).toBe('0.3 - 1.2 AU, in plane')
    expect(formatDebrisExtentLine({ inner: 0.3, outer: 1.2, inclinationDeg: 45 })).toBe('0.3 - 1.2 AU, 45 deg inclined')
  })

  it('formatDebrisRegionSuffix is short and GM-readable', () => {
    expect(formatDebrisRegionSuffix({ archetypeName: 'Polar Crown' })).toBe('near Polar Crown')
  })
})

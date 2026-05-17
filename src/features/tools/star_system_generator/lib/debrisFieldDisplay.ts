import type { DebrisFieldShape, DebrisDensityBand, DebrisAnchorMode } from '../types'

const SHAPE_LABELS: Record<DebrisFieldShape, string> = {
  'polar-ring': 'Polar circumbinary ring',
  'mass-transfer-stream': 'Mass-transfer stream',
  'common-envelope-shell': 'Common-envelope ejecta shell',
  'inner-pair-halo': 'Hierarchical inner-pair halo',
  'trojan-camp': 'Binary Trojan camp',
  'kozai-scattered-halo': 'Kozai-Lidov scattered halo',
  'hill-sphere-capture-cone': 'Hill-sphere capture cone',
  'exocomet-swarm': 'Resonance-pumped exocomet swarm',
  'accretion-bridge': 'Accretion bridge',
  'gardener-cordon': 'Gardener-quarantine cordon',
}

const DENSITY_LABELS: Record<DebrisDensityBand, string> = {
  dust: 'dust haze',
  sparse: 'sparse field',
  'asteroid-fleet': 'asteroid-fleet density',
  'shell-dense': 'dense shell',
  stream: 'narrow stream',
}

const ANCHOR_LABELS: Record<DebrisAnchorMode, string> = {
  unanchorable: 'no settlements possible',
  'transient-only': 'mobile camps only',
  'edge-only': 'rim settlements only',
  embedded: 'settlements can be embedded',
}

export function debrisShapeLabel(shape: DebrisFieldShape): string {
  return SHAPE_LABELS[shape]
}

export function densityBandLabel(band: DebrisDensityBand): string {
  return DENSITY_LABELS[band]
}

export function anchorModeLabel(mode: DebrisAnchorMode): string {
  return ANCHOR_LABELS[mode]
}

export function formatDebrisExtentLine(args: { inner: number; outer: number; inclinationDeg: number }): string {
  const orientation =
    args.inclinationDeg >= 80 ? 'perpendicular' :
    args.inclinationDeg >= 30 ? `${Math.round(args.inclinationDeg)} deg inclined` :
    'in plane'
  return `${args.inner.toFixed(1)} - ${args.outer.toFixed(1)} AU, ${orientation}`
}

export function formatDebrisRegionSuffix(args: { archetypeName: string }): string {
  return `near ${args.archetypeName}`
}

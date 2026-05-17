import type { DebrisFieldShape, DebrisDensityBand } from '../../../types'
import type { DebrisFieldVisual } from '../../types'

export type DebrisVisualStyle =
  | 'settled-ring'
  | 'trojan-cluster'
  | 'chaotic-disk'
  | 'ejecta-shell'
  | 'scattered-halo'
  | 'plasma-stream'

export interface DebrisVisualProfile {
  style: DebrisVisualStyle
  chaos: number
  clumpiness: number
  filamentCount: number
  knotCount: number
  outlierFraction: number
  dustOpacity: number
  glintFraction: number
  chunkScale: number
  verticalScatter: number
  hazeOpacity: number
}

function densityMultiplier(density: DebrisDensityBand): number {
  if (density === 'shell-dense') return 1.25
  if (density === 'asteroid-fleet') return 1.05
  if (density === 'stream') return 0.9
  if (density === 'dust') return 0.7
  return 0.85
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function profileForShape(shape: DebrisFieldShape): DebrisVisualProfile {
  switch (shape) {
    case 'polar-ring':
      return {
        style: 'settled-ring',
        chaos: 0.18,
        clumpiness: 0.38,
        filamentCount: 3,
        knotCount: 7,
        outlierFraction: 0.04,
        dustOpacity: 0.34,
        glintFraction: 0.04,
        chunkScale: 0.82,
        verticalScatter: 0.55,
        hazeOpacity: 0.24,
      }
    case 'trojan-camp':
      return {
        style: 'trojan-cluster',
        chaos: 0.34,
        clumpiness: 0.72,
        filamentCount: 2,
        knotCount: 5,
        outlierFraction: 0.06,
        dustOpacity: 0.28,
        glintFraction: 0.05,
        chunkScale: 0.95,
        verticalScatter: 0.8,
        hazeOpacity: 0.16,
      }
    case 'inner-pair-halo':
      return {
        style: 'chaotic-disk',
        chaos: 0.58,
        clumpiness: 0.68,
        filamentCount: 5,
        knotCount: 8,
        outlierFraction: 0.1,
        dustOpacity: 0.42,
        glintFraction: 0.06,
        chunkScale: 1.05,
        verticalScatter: 1.25,
        hazeOpacity: 0.3,
      }
    case 'common-envelope-shell':
      return {
        style: 'ejecta-shell',
        chaos: 0.86,
        clumpiness: 0.9,
        filamentCount: 8,
        knotCount: 14,
        outlierFraction: 0.18,
        dustOpacity: 0.56,
        glintFraction: 0.03,
        chunkScale: 1.28,
        verticalScatter: 2.0,
        hazeOpacity: 0.42,
      }
    case 'kozai-scattered-halo':
      return {
        style: 'scattered-halo',
        chaos: 0.82,
        clumpiness: 0.82,
        filamentCount: 7,
        knotCount: 12,
        outlierFraction: 0.2,
        dustOpacity: 0.48,
        glintFraction: 0.04,
        chunkScale: 1.22,
        verticalScatter: 2.15,
        hazeOpacity: 0.34,
      }
    case 'hill-sphere-capture-cone':
      return {
        style: 'scattered-halo',
        chaos: 0.76,
        clumpiness: 0.86,
        filamentCount: 5,
        knotCount: 9,
        outlierFraction: 0.16,
        dustOpacity: 0.44,
        glintFraction: 0.04,
        chunkScale: 1.18,
        verticalScatter: 1.65,
        hazeOpacity: 0.28,
      }
    case 'exocomet-swarm':
      return {
        style: 'chaotic-disk',
        chaos: 0.78,
        clumpiness: 0.78,
        filamentCount: 7,
        knotCount: 10,
        outlierFraction: 0.2,
        dustOpacity: 0.4,
        glintFraction: 0.05,
        chunkScale: 1.08,
        verticalScatter: 1.55,
        hazeOpacity: 0.3,
      }
    case 'mass-transfer-stream':
    case 'accretion-bridge':
      return {
        style: 'plasma-stream',
        chaos: shape === 'accretion-bridge' ? 0.5 : 0.36,
        clumpiness: 0.58,
        filamentCount: 3,
        knotCount: 4,
        outlierFraction: 0.03,
        dustOpacity: 0.36,
        glintFraction: 0.12,
        chunkScale: 0.72,
        verticalScatter: 0.65,
        hazeOpacity: 0.18,
      }
    case 'gardener-cordon':
      return {
        style: 'settled-ring',
        chaos: 0.04,
        clumpiness: 0.18,
        filamentCount: 1,
        knotCount: 4,
        outlierFraction: 0.01,
        dustOpacity: 0.18,
        glintFraction: 0.02,
        chunkScale: 0.42,
        verticalScatter: 0.22,
        hazeOpacity: 0.08,
      }
  }
}

export function defaultDebrisVisualProfile(
  shape: DebrisFieldShape,
  density: DebrisDensityBand = 'asteroid-fleet',
): DebrisVisualProfile {
  const base = profileForShape(shape)
  const densityScale = densityMultiplier(density)
  return {
    ...base,
    dustOpacity: clamp01(base.dustOpacity * densityScale),
    hazeOpacity: clamp01(base.hazeOpacity * densityScale),
  }
}

const CHAOS_TEXT_MARKERS = ['chaos', 'primordial', 'young']

function shouldElevateChaos(v: DebrisFieldVisual): boolean {
  if (v.field.companionId === null) return true
  // Authored prose tagged with chaos/primordial/young keywords signals an intent
  // for elevated visual turbulence even when the field is companion-anchored.
  const title = `${v.field.archetypeName.value} ${v.field.whyHere.value}`.toLowerCase()
  return CHAOS_TEXT_MARKERS.some((m) => title.includes(m))
}

export function debrisVisualProfile(v: DebrisFieldVisual): DebrisVisualProfile {
  const shape = v.field.shape.value
  const base = profileForShape(shape)
  const densityScale = densityMultiplier(v.field.densityBand.value)
  if (!shouldElevateChaos(v)) {
    return {
      ...base,
      dustOpacity: clamp01(base.dustOpacity * densityScale),
      hazeOpacity: clamp01(base.hazeOpacity * densityScale),
    }
  }
  return {
    ...base,
    style: base.style === 'ejecta-shell' ? 'ejecta-shell' : 'chaotic-disk',
    chaos: Math.max(base.chaos, 0.9),
    clumpiness: Math.max(base.clumpiness, 0.88),
    filamentCount: Math.max(base.filamentCount, 9),
    knotCount: Math.max(base.knotCount, 16),
    outlierFraction: Math.max(base.outlierFraction, 0.22),
    dustOpacity: clamp01(Math.max(base.dustOpacity, 0.52) * densityScale),
    glintFraction: Math.max(base.glintFraction, 0.05),
    chunkScale: Math.max(base.chunkScale, 1.35),
    verticalScatter: Math.max(base.verticalScatter, 2.2),
    hazeOpacity: clamp01(Math.max(base.hazeOpacity, 0.42) * densityScale),
  }
}

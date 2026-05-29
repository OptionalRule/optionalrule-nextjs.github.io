import type { BodyCategory } from '../../types'
import type { OrbitScaleMode } from '../types'

export const SCENE_UNIT = 60
export const ORBIT_MIN_OFFSET = 8
export const DEFAULT_ORBIT_SCALE_MODE: OrbitScaleMode = 'readable-log'

export function auToScene(au: number, hzCenterAu = 1, mode: OrbitScaleMode = DEFAULT_ORBIT_SCALE_MODE): number {
  if (au <= 0) return 0
  const ref = hzCenterAu > 0 ? hzCenterAu : 1
  if (mode === 'relative-au') {
    return ORBIT_MIN_OFFSET + Math.sqrt(au / ref) * SCENE_UNIT * 0.85
  }
  return ORBIT_MIN_OFFSET + Math.log10(1 + au / ref) * SCENE_UNIT
}

export function schematicOrbitRadius(index: number): number {
  return ORBIT_MIN_OFFSET + (index + 1) * 8
}

// Visual radii are capped well below the smallest star core (see STAR_MIN_CORE_RADIUS
// in stellarColor.ts) so a planet can never out-size its host star on screen, while
// the gas-giant → dwarf ordering stays clearly legible.
const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 1.45,
  'ice-giant': 1.2,
  'sub-neptune': 0.92,
  'super-earth': 0.78,
  'rocky-planet': 0.6,
  'dwarf-body': 0.42,
  'rogue-captured': 0.55,
  belt: 0.42,
  anomaly: 0.7,
}

const REFERENCE_RADIUS_EARTH_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 11,
  'ice-giant': 4.5,
  'sub-neptune': 2.7,
  'super-earth': 1.5,
  'rocky-planet': 1,
  'dwarf-body': 0.3,
  'rogue-captured': 1.2,
  belt: 0.12,
  anomaly: 1.5,
}

const VISUAL_SIZE_CLAMP_BY_CATEGORY: Record<BodyCategory, [number, number]> = {
  'gas-giant': [1.15, 1.55],
  'ice-giant': [0.95, 1.35],
  'sub-neptune': [0.78, 1.1],
  'super-earth': [0.62, 0.95],
  'rocky-planet': [0.34, 0.72],
  'dwarf-body': [0.2, 0.52],
  'rogue-captured': [0.4, 0.95],
  belt: [0.3, 0.5],
  anomaly: [0.5, 1.0],
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function bodyVisualSize(category: BodyCategory, radiusEarth?: number | null): number {
  const bucketSize = VISUAL_SIZE_BY_CATEGORY[category]
  if (typeof radiusEarth !== 'number' || radiusEarth <= 0) return bucketSize

  const referenceRadius = REFERENCE_RADIUS_EARTH_BY_CATEGORY[category]
  const [min, max] = VISUAL_SIZE_CLAMP_BY_CATEGORY[category]
  const radiusScaled = bucketSize * (radiusEarth / referenceRadius) ** 0.55
  return clamp(radiusScaled, min, max)
}

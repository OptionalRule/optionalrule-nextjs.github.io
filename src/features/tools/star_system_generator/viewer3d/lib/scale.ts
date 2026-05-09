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

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 2.4,
  'ice-giant': 2.0,
  'sub-neptune': 1.4,
  'super-earth': 1.1,
  'rocky-planet': 0.85,
  'dwarf-body': 0.6,
  'rogue-captured': 0.75,
  belt: 0.55,
  anomaly: 0.95,
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
  'gas-giant': [1.9, 3.0],
  'ice-giant': [1.45, 2.3],
  'sub-neptune': [1.15, 1.8],
  'super-earth': [0.85, 1.35],
  'rocky-planet': [0.38, 0.98],
  'dwarf-body': [0.22, 0.5],
  'rogue-captured': [0.5, 1.35],
  belt: [0.35, 0.55],
  anomaly: [0.65, 1.45],
}

function clamp(value: number, min: number, max: number): number {
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

import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60
export const ORBIT_MIN_OFFSET = 8

export function auToScene(au: number, hzCenterAu = 1): number {
  if (au <= 0) return 0
  const ref = hzCenterAu > 0 ? hzCenterAu : 1
  return ORBIT_MIN_OFFSET + Math.log10(1 + au / ref) * SCENE_UNIT
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

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}

import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60

export function auToScene(au: number): number {
  if (au <= 0) return 0
  return Math.log10(1 + au) * SCENE_UNIT
}

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 2.0,
  'ice-giant': 1.7,
  'sub-neptune': 1.1,
  'super-earth': 0.9,
  'rocky-planet': 0.7,
  'dwarf-body': 0.45,
  'rogue-captured': 0.6,
  belt: 0.45,
  anomaly: 0.8,
}

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}

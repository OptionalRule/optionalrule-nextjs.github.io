import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60

export function auToScene(au: number): number {
  if (au <= 0) return 0
  return Math.log10(1 + au) * SCENE_UNIT
}

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 5.0,
  'ice-giant': 4.0,
  'sub-neptune': 2.6,
  'super-earth': 2.1,
  'rocky-planet': 1.6,
  'dwarf-body': 1.0,
  'rogue-captured': 1.4,
  belt: 0.7,
  anomaly: 1.8,
}

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}

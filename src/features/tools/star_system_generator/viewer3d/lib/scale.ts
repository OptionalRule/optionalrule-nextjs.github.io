import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60

export function auToScene(au: number): number {
  if (au <= 0) return 0
  return Math.log10(1 + au) * SCENE_UNIT
}

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 3.5,
  'ice-giant': 3.0,
  'sub-neptune': 1.8,
  'super-earth': 1.4,
  'rocky-planet': 1.0,
  'dwarf-body': 0.6,
  'rogue-captured': 0.9,
  belt: 0.4,
  anomaly: 1.2,
}

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}

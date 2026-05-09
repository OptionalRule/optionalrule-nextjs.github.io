import type { BodyCategory } from '../../types'

export const SCENE_UNIT = 60

export function auToScene(au: number): number {
  if (au <= 0) return 0
  return Math.log10(1 + au) * SCENE_UNIT
}

const VISUAL_SIZE_BY_CATEGORY: Record<BodyCategory, number> = {
  'gas-giant': 9.0,
  'ice-giant': 7.5,
  'sub-neptune': 4.5,
  'super-earth': 3.6,
  'rocky-planet': 2.6,
  'dwarf-body': 1.6,
  'rogue-captured': 2.4,
  belt: 1.0,
  anomaly: 3.0,
}

export function bodyVisualSize(category: BodyCategory): number {
  return VISUAL_SIZE_BY_CATEGORY[category]
}

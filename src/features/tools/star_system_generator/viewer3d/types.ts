import type { BodyCategory } from '../types'

export type SceneVec3 = [number, number, number]

export type BodyShadingKey =
  | 'rocky-warm'
  | 'rocky-cool'
  | 'earthlike'
  | 'desert'
  | 'sub-neptune'
  | 'gas-giant'
  | 'ice-giant'
  | 'dwarf'
  | 'anomaly'

export interface StarVisual {
  id: string
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
  position: SceneVec3
}

export interface RingVisual {
  innerRadius: number
  outerRadius: number
  tilt: number
  bandCount: number
  color: string
}

export interface MoonVisual {
  id: string
  parentBodyId: string
  parentRelativeOrbit: number
  phase0: number
  angularSpeed: number
  orbitTilt: number
  visualSize: number
  shading: BodyShadingKey
}

export interface BodyVisual {
  id: string
  orbitRadius: number
  orbitTiltY: number
  phase0: number
  angularSpeed: number
  visualSize: number
  shading: BodyShadingKey
  category: BodyCategory
  rings?: RingVisual
  moons: MoonVisual[]
  guAccent: boolean
  hasSettlements: boolean
  settlementIds: string[]
  ruinIds: string[]
}

export interface BeltVisual {
  id: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  jitter: number
  color: string
}

export interface HazardVisual {
  id: string
  center: SceneVec3
  radius: number
  intensity: number
  sourceText: string
  anchorDescription: string
  unclassified: boolean
}

export interface GuBleedVisual {
  id: string
  center: SceneVec3
  radius: number
  pulsePhase: number
  pulsePeriodSec: number
  intensity: number
  unclassified: boolean
}

export interface PhenomenonMarker {
  id: string
  position: SceneVec3
  kind: string
}

export interface RuinMarker {
  id: string
  attachedBodyId?: string
  attachedMoonId?: string
  position: SceneVec3
}

export interface SystemSceneGraph {
  star: StarVisual
  companions: StarVisual[]
  zones: { habitableInner: number; habitable: number; snowLine: number }
  bodies: BodyVisual[]
  belts: BeltVisual[]
  hazards: HazardVisual[]
  guBleeds: GuBleedVisual[]
  phenomena: PhenomenonMarker[]
  ruins: RuinMarker[]
  sceneRadius: number
}

export type LayerKey = 'physical' | 'gu' | 'human'

export interface LayerVisibility {
  physical: boolean
  gu: boolean
  human: boolean
}

export const ALL_LAYERS_ON: LayerVisibility = { physical: true, gu: true, human: true }

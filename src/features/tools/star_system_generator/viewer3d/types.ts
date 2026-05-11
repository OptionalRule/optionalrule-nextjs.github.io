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

export type RenderArchetype =
  | 'rocky'
  | 'earthlike'
  | 'desert'
  | 'sub-neptune'
  | 'gas-giant'
  | 'ice-giant'
  | 'dwarf'
  | 'anomaly'
  | 'belt'
  | 'ruin-marker'
  | 'phenomenon-marker'

export type SurfaceFamily =
  | 'airless'
  | 'anomaly'
  | 'carbon'
  | 'desert'
  | 'gas-banded'
  | 'ice'
  | 'iron'
  | 'magma'
  | 'ocean'
  | 'rocky'
  | 'settled'
  | 'volatile'

export type VolumeShape = 'sphere' | 'ellipsoid' | 'shell' | 'torus' | 'ribbon'

export interface BodySurfaceVisual {
  profileVersion: 1
  family: SurfaceFamily
  atmosphereColor: string
  atmosphereStrength: number
  atmosphereThickness: number
  cloudColor: string
  cloudStrength: number
  cloudRotationSpeed: number
  normalStrength: number
  reliefStrength: number
  nightLightStrength: number
  cityLightColor: string
  surfaceSeed: number
  cloudSeed: number
  cloudTraceTint: string
  cloudTraceBlend: number
  cloudBandStrength: number
  cloudRotationMultiplier: number
  atmospherePressureMultiplier: number
  auroraIntensity: number
  auroraColor: string
  auroraMode: number
  auroraPulse: number
  auroraAxisOffset: number
}

export interface MoonSurfaceVisual {
  profileVersion: 1
  family: SurfaceFamily
  baseColor: string
  secondaryColor: string
  accentColor: string
  atmosphereStrength: number
  craterStrength: number
  iceCoverage: number
  volcanicStrength: number
  surfaceSeed: number
}

export interface StarVisual {
  id: string
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
  flareStrength: number
  pulseSpeed: number
  rayColor: string
  position: SceneVec3
}

export interface RingVisual {
  innerRadius: number
  outerRadius: number
  tilt: number
  bandCount: number
  color: string
  secondaryColor: string
  opacity: number
  gapCount: number
  gapSeed: number
  arcStrength: number
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
  surface: MoonSurfaceVisual
}

export interface BodyVisual {
  id: string
  orbitRadius: number
  orbitTiltY: number
  phase0: number
  angularSpeed: number
  visualSize: number
  shading: BodyShadingKey
  renderArchetype: RenderArchetype
  category: BodyCategory
  surface: BodySurfaceVisual
  rings?: RingVisual
  moons: MoonVisual[]
  guAccent: boolean
  hasSettlements: boolean
  settlementIds: string[]
  ruinIds: string[]
  gateIds: string[]
}

export interface BeltVisual {
  id: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  jitter: number
  color: string
  colors: string[]
  gapCount: number
  clumpiness: number
  inclination: number
  particleSizeScale: number
  renderArchetype: 'belt'
}

export interface HazardVisual {
  id: string
  center: SceneVec3
  radius: number
  intensity: number
  sourceText: string
  anchorDescription: string
  unclassified: boolean
  shape: VolumeShape
  color: string
  tilt: number
  stretch: SceneVec3
}

export interface GuBleedVisual {
  id: string
  center: SceneVec3
  radius: number
  pulsePhase: number
  pulsePeriodSec: number
  intensity: number
  unclassified: boolean
  shape: VolumeShape
  color: string
  distortion: number
  tilt: number
  stretch: SceneVec3
}

export interface PhenomenonMarker {
  id: string
  position: SceneVec3
  kind: string
  color: string
  glowColor: string
  scale: number
  renderArchetype: 'phenomenon-marker'
}

export interface RuinMarker {
  id: string
  attachedBodyId?: string
  attachedBeltId?: string
  attachedMoonId?: string
  position: SceneVec3
  renderArchetype: 'ruin-marker'
}

export interface SystemSceneGraph {
  star: StarVisual
  companions: StarVisual[]
  zones: { habitableInner: number; habitable: number; habitableOuter: number; snowLine: number }
  bodies: BodyVisual[]
  belts: BeltVisual[]
  hazards: HazardVisual[]
  guBleeds: GuBleedVisual[]
  phenomena: PhenomenonMarker[]
  ruins: RuinMarker[]
  sceneRadius: number
}

export type LayerKey = 'physical' | 'gu' | 'human' | 'moonOrbits'
export type OrbitScaleMode = 'readable-log' | 'relative-au' | 'schematic'

export interface LayerVisibility {
  physical: boolean
  gu: boolean
  human: boolean
  moonOrbits: boolean
}

export const ALL_LAYERS_ON: LayerVisibility = { physical: true, gu: true, human: true, moonOrbits: false }

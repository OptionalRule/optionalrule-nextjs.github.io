import { hashToUnit } from '../../lib/motion'
import type { DebrisVisualProfile } from './debrisVisualProfile'

export interface DebrisDustSample {
  position: [number, number, number]
  sizeMul: number
  rotation: number
  tintHeat: number
  opacity: number
  aspect: [number, number]
  spriteIndex: number
}

export interface DebrisChunkSample {
  position: [number, number, number]
  sizeMul: number
  rotation: [number, number, number]
  brightness: number
  stretch: [number, number, number]
}

interface RingSampleArgs {
  fieldId: string
  count: number
  innerRadius: number
  radialThickness: number
  startRad: number
  spanRad: number
  verticalThickness: number
  profile: DebrisVisualProfile
  kind: 'dust' | 'chunk'
}

interface VolumeSampleArgs {
  fieldId: string
  count: number
  innerRadius: number
  outerRadius: number
  maxTiltRad?: number
  profile: DebrisVisualProfile
  kind: 'dust' | 'chunk'
  shell?: boolean
}

interface StreamSampleArgs {
  fieldId: string
  count: number
  startRadius: number
  endRadius: number
  angleRad: number
  sheathRadius: number
  profile: DebrisVisualProfile
  kind: 'dust' | 'chunk'
}

interface Lane {
  turn: number
  radialT: number
  width: number
  amplitude: number
  frequency: number
  phase: number
}

function signedHash(seed: string): number {
  return hashToUnit(seed) - hashToUnit(`${seed}:b`)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function smoothstep01(value: number): number {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

function ringEdgeFade(radialT: number, profile: DebrisVisualProfile): number {
  const width = clamp(0.16 + profile.chaos * 0.08, 0.16, 0.28)
  return smoothstep01(radialT / width) * smoothstep01((1 - radialT) / width)
}

function heavyTail(seed: string, power = 3): number {
  return Math.pow(hashToUnit(seed), power)
}

function laneCount(profile: DebrisVisualProfile): number {
  return Math.max(1, Math.round(profile.filamentCount))
}

function knotCount(profile: DebrisVisualProfile): number {
  return Math.max(1, Math.round(profile.knotCount))
}

function buildLanes(fieldId: string, profile: DebrisVisualProfile): Lane[] {
  const count = laneCount(profile)
  const lanes: Lane[] = []
  for (let i = 0; i < count; i++) {
    lanes.push({
      turn: ((i / count) + signedHash(`lane-turn#${fieldId}#${i}`) * 0.24 + 1) % 1,
      radialT: 0.18 + hashToUnit(`lane-radial#${fieldId}#${i}`) * 0.64,
      width: 0.018 + hashToUnit(`lane-width#${fieldId}#${i}`) * (0.035 + profile.chaos * 0.08),
      amplitude: 0.025 + hashToUnit(`lane-amp#${fieldId}#${i}`) * (0.05 + profile.chaos * 0.14),
      frequency: 1.2 + Math.floor(hashToUnit(`lane-freq#${fieldId}#${i}`) * 4),
      phase: hashToUnit(`lane-phase#${fieldId}#${i}`) * Math.PI * 2,
    })
  }
  return lanes
}

function laneRadial(lane: Lane, turn: number, profile: DebrisVisualProfile, key: string): number {
  const warpA = Math.sin((turn * lane.frequency + lane.turn) * Math.PI * 2 + lane.phase)
  const warpB = Math.sin((turn * (lane.frequency * 0.43 + 0.7)) * Math.PI * 2 + lane.phase * 1.71)
  const noise = signedHash(`${key}:radial-noise`) * 0.03 * profile.chaos
  return clamp(lane.radialT + warpA * lane.amplitude + warpB * lane.amplitude * 0.55 + noise, 0.02, 0.98)
}

function knotTurn(fieldId: string, profile: DebrisVisualProfile, index: number): number {
  const count = knotCount(profile)
  const slot = index % count
  const base = slot / count
  const jitter = signedHash(`knot-turn#${fieldId}#${slot}`) * 0.34 / count
  return ((base + jitter + 1) % 1)
}

function sampleLanePoint(fieldId: string, profile: DebrisVisualProfile, lanes: Lane[], index: number, kind: string): {
  turn: number
  radialT: number
  inKnot: boolean
  outlier: boolean
  laneIndex: number
} {
  const outlier = hashToUnit(`${kind}-outlier#${fieldId}#${index}`) < profile.outlierFraction
  if (outlier) {
    return {
      turn: hashToUnit(`${kind}-outlier-turn#${fieldId}#${index}`),
      radialT: 0.02 + hashToUnit(`${kind}-outlier-radial#${fieldId}#${index}`) * 0.96,
      inKnot: false,
      outlier: true,
      laneIndex: Math.floor(hashToUnit(`${kind}-outlier-lane#${fieldId}#${index}`) * lanes.length) % lanes.length,
    }
  }

  const inKnot = hashToUnit(`${kind}-knot-roll#${fieldId}#${index}`) < 0.25 + profile.clumpiness * 0.55
  const laneIndex = Math.floor(hashToUnit(`${kind}-lane#${fieldId}#${index}`) * lanes.length) % lanes.length
  const lane = lanes[laneIndex]

  if (inKnot) {
    const center = knotTurn(fieldId, profile, Math.floor(hashToUnit(`${kind}-knot-idx#${fieldId}#${index}`) * knotCount(profile)))
    const turn = ((center + signedHash(`${kind}-knot-turn-offset#${fieldId}#${index}`) * (0.018 + profile.chaos * 0.045) + 1) % 1)
    const radialT = laneRadial(lane, turn, profile, `${kind}-knot#${fieldId}#${index}`)
    return {
      turn,
      radialT: clamp(radialT + signedHash(`${kind}-knot-radial-offset#${fieldId}#${index}`) * (0.025 + profile.chaos * 0.08), 0.02, 0.98),
      inKnot: true,
      outlier: false,
      laneIndex,
    }
  }

  const turn = hashToUnit(`${kind}-lane-turn#${fieldId}#${index}`)
  const radialT = laneRadial(lane, turn, profile, `${kind}-lane#${fieldId}#${index}`)
  return {
    turn,
    radialT: clamp(radialT + signedHash(`${kind}-lane-radial-offset#${fieldId}#${index}`) * lane.width, 0.02, 0.98),
    inKnot: false,
    outlier: false,
    laneIndex,
  }
}

function dustSize(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string, inKnot: boolean, outlier: boolean): number {
  const base = 0.22 + heavyTail(`${tag}-size#${fieldId}#${index}`, 3.6) * (2.4 + profile.chaos * 1.8)
  const clusterBoost = inKnot ? 1.2 + hashToUnit(`${tag}-knot-size#${fieldId}#${index}`) * 0.55 : 1
  const outlierBoost = outlier ? 0.65 + hashToUnit(`${tag}-outlier-size#${fieldId}#${index}`) * 0.5 : 1
  return base * clusterBoost * outlierBoost
}

function dustOpacity(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string, inKnot: boolean, outlier: boolean): number {
  const density = inKnot ? 0.65 : outlier ? 0.22 : 0.36
  const variation = 0.72 + hashToUnit(`${tag}-opacity#${fieldId}#${index}`) * 0.55
  return clamp(profile.dustOpacity * density * variation, 0.04, 0.78)
}

function dustAspect(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string): [number, number] {
  const streak = hashToUnit(`${tag}-aspect-roll#${fieldId}#${index}`) < profile.chaos * 0.5
  if (!streak) return [1, 0.72 + hashToUnit(`${tag}-aspect-y#${fieldId}#${index}`) * 0.45]
  return [
    1.8 + hashToUnit(`${tag}-aspect-x#${fieldId}#${index}`) * (2.1 + profile.chaos * 1.6),
    0.22 + hashToUnit(`${tag}-aspect-y#${fieldId}#${index}`) * 0.34,
  ]
}

function dustSprite(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string): number {
  const roll = hashToUnit(`${tag}-sprite#${fieldId}#${index}`)
  if (roll < profile.glintFraction) return 2
  if (roll < 0.42 + profile.chaos * 0.2) return 1
  if (roll < 0.78) return 3
  return 0
}

function chunkSize(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string, inKnot: boolean): number {
  const hero = index < Math.max(1, Math.round(knotCount(profile) * 0.18))
  const base = hero
    ? 1.95 + hashToUnit(`${tag}-hero-size#${fieldId}#${index}`) * (1.8 + profile.chaos)
    : 0.52
      + hashToUnit(`${tag}-chunk-fill-size#${fieldId}#${index}`) * 0.58
      + heavyTail(`${tag}-chunk-size#${fieldId}#${index}`, 2.2) * (1.4 + profile.chaos * 1.2)
  return base * profile.chunkScale * (inKnot ? 1.18 : 1)
}

function chunkStretch(fieldId: string, index: number, profile: DebrisVisualProfile, tag: string): [number, number, number] {
  return [
    0.52 + hashToUnit(`${tag}-chunk-sx#${fieldId}#${index}`) * (0.9 + profile.chaos * 0.7),
    0.42 + hashToUnit(`${tag}-chunk-sy#${fieldId}#${index}`) * 0.82,
    0.5 + hashToUnit(`${tag}-chunk-sz#${fieldId}#${index}`) * (1.0 + profile.chaos * 0.75),
  ]
}

function chunkRotation(fieldId: string, index: number, tag: string): [number, number, number] {
  return [
    hashToUnit(`${tag}-chunk-rx#${fieldId}#${index}`) * Math.PI * 2,
    hashToUnit(`${tag}-chunk-ry#${fieldId}#${index}`) * Math.PI * 2,
    hashToUnit(`${tag}-chunk-rz#${fieldId}#${index}`) * Math.PI * 2,
  ]
}

export function sampleRingDust(args: RingSampleArgs): DebrisDustSample[] {
  const samples: DebrisDustSample[] = []
  const lanes = buildLanes(args.fieldId, args.profile)
  for (let i = 0; i < args.count; i++) {
    const lane = sampleLanePoint(args.fieldId, args.profile, lanes, i, args.kind)
    const angle = args.startRad + lane.turn * args.spanRad
    const r = args.innerRadius + lane.radialT * args.radialThickness
    const envelope = Math.pow(Math.sin(lane.radialT * Math.PI), 0.55)
    const scatter = lane.outlier ? 2.4 : lane.inKnot ? 0.85 : 1.25
    const y = signedHash(`${args.kind}-ring-y#${args.fieldId}#${i}`) * args.verticalThickness * args.profile.verticalScatter * scatter * envelope
    const edgeFade = ringEdgeFade(lane.radialT, args.profile)
    samples.push({
      position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
      sizeMul: dustSize(args.fieldId, i, args.profile, args.kind, lane.inKnot, lane.outlier),
      rotation: hashToUnit(`${args.kind}-ring-rot#${args.fieldId}#${i}`) * Math.PI * 2,
      tintHeat: clamp(1 - lane.radialT * 0.55 + (lane.inKnot ? 0.18 : 0), 0.35, 1.2),
      opacity: dustOpacity(args.fieldId, i, args.profile, args.kind, lane.inKnot, lane.outlier) * edgeFade,
      aspect: dustAspect(args.fieldId, i, args.profile, args.kind),
      spriteIndex: dustSprite(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

export function sampleRingChunks(args: RingSampleArgs): DebrisChunkSample[] {
  const samples: DebrisChunkSample[] = []
  const lanes = buildLanes(args.fieldId, args.profile)
  for (let i = 0; i < args.count; i++) {
    const lane = sampleLanePoint(args.fieldId, args.profile, lanes, i, args.kind)
    const angle = args.startRad + lane.turn * args.spanRad
    const r = args.innerRadius + lane.radialT * args.radialThickness
    const y = signedHash(`${args.kind}-ring-y#${args.fieldId}#${i}`) * args.verticalThickness * args.profile.verticalScatter * (lane.outlier ? 3.5 : 1.7)
    const edgeFade = ringEdgeFade(lane.radialT, args.profile)
    samples.push({
      position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
      sizeMul: chunkSize(args.fieldId, i, args.profile, args.kind, lane.inKnot),
      rotation: chunkRotation(args.fieldId, i, args.kind),
      brightness: (0.42 + hashToUnit(`${args.kind}-chunk-bright#${args.fieldId}#${i}`) * 0.55 + (lane.inKnot ? 0.08 : 0)) * (0.45 + edgeFade * 0.55),
      stretch: chunkStretch(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

export function sampleVolumeDust(args: VolumeSampleArgs): DebrisDustSample[] {
  const samples: DebrisDustSample[] = []
  const lanes = buildLanes(args.fieldId, args.profile)
  for (let i = 0; i < args.count; i++) {
    const lane = sampleLanePoint(args.fieldId, args.profile, lanes, i, args.kind)
    const radialT = args.shell
      ? clamp(0.62 + signedHash(`${args.kind}-shell-r#${args.fieldId}#${i}`) * (0.22 + args.profile.chaos * 0.14), 0.05, 0.98)
      : lane.radialT
    const r = args.innerRadius + (args.outerRadius - args.innerRadius) * radialT
    const phi = lane.turn * Math.PI * 2
    const maxTilt = args.maxTiltRad ?? Math.PI
    const laneTilt = signedHash(`${args.kind}-tilt#${args.fieldId}#${lane.laneIndex}`) * maxTilt * 0.65
    const tiltNoise = signedHash(`${args.kind}-tilt-noise#${args.fieldId}#${i}`) * maxTilt * args.profile.verticalScatter * 0.32
    const tilt = args.shell
      ? Math.asin(clamp(signedHash(`${args.kind}-shell-y#${args.fieldId}#${i}`) * (0.45 + args.profile.chaos * 0.45), -0.98, 0.98))
      : clamp(laneTilt + tiltNoise, -maxTilt, maxTilt)
    const x = r * Math.cos(phi) * Math.cos(tilt)
    const y = r * Math.sin(tilt)
    const z = r * Math.sin(phi) * Math.cos(tilt)
    samples.push({
      position: [x, y, z],
      sizeMul: dustSize(args.fieldId, i, args.profile, args.kind, lane.inKnot, lane.outlier),
      rotation: hashToUnit(`${args.kind}-volume-rot#${args.fieldId}#${i}`) * Math.PI * 2,
      tintHeat: clamp(1 - radialT * 0.45 + (lane.inKnot ? 0.14 : 0), 0.36, 1.2),
      opacity: dustOpacity(args.fieldId, i, args.profile, args.kind, lane.inKnot, lane.outlier),
      aspect: dustAspect(args.fieldId, i, args.profile, args.kind),
      spriteIndex: dustSprite(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

export function sampleVolumeChunks(args: VolumeSampleArgs): DebrisChunkSample[] {
  const samples: DebrisChunkSample[] = []
  const lanes = buildLanes(args.fieldId, args.profile)
  for (let i = 0; i < args.count; i++) {
    const lane = sampleLanePoint(args.fieldId, args.profile, lanes, i, args.kind)
    const radialT = args.shell ? clamp(0.58 + signedHash(`${args.kind}-shell-chunk-r#${args.fieldId}#${i}`) * 0.36, 0.08, 0.98) : lane.radialT
    const r = args.innerRadius + (args.outerRadius - args.innerRadius) * radialT
    const phi = lane.turn * Math.PI * 2
    const maxTilt = args.maxTiltRad ?? Math.PI
    const tilt = args.shell
      ? Math.asin(clamp(signedHash(`${args.kind}-shell-chunk-y#${args.fieldId}#${i}`) * (0.38 + args.profile.chaos * 0.5), -0.98, 0.98))
      : clamp(signedHash(`${args.kind}-chunk-tilt#${args.fieldId}#${i}`) * maxTilt * args.profile.verticalScatter * 0.45, -maxTilt, maxTilt)
    samples.push({
      position: [r * Math.cos(phi) * Math.cos(tilt), r * Math.sin(tilt), r * Math.sin(phi) * Math.cos(tilt)],
      sizeMul: chunkSize(args.fieldId, i, args.profile, args.kind, lane.inKnot),
      rotation: chunkRotation(args.fieldId, i, args.kind),
      brightness: 0.38 + hashToUnit(`${args.kind}-volume-bright#${args.fieldId}#${i}`) * 0.5 + (lane.inKnot ? 0.1 : 0),
      stretch: chunkStretch(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

export function sampleStreamDust(args: StreamSampleArgs): DebrisDustSample[] {
  const samples: DebrisDustSample[] = []
  const axisX = Math.cos(args.angleRad)
  const axisZ = Math.sin(args.angleRad)
  const perpX = -axisZ
  const perpZ = axisX
  for (let i = 0; i < args.count; i++) {
    const tBase = hashToUnit(`${args.kind}-stream-t#${args.fieldId}#${i}`)
    const knotBias = hashToUnit(`${args.kind}-stream-knot#${args.fieldId}#${i}`) < args.profile.clumpiness * 0.55
    const t = knotBias ? clamp(tBase + signedHash(`${args.kind}-stream-knot-off#${args.fieldId}#${i}`) * 0.08, 0, 1) : tBase
    const r = args.startRadius + (args.endRadius - args.startRadius) * t
    const cx = r * axisX
    const cz = r * axisZ
    const twist = Math.sin(t * Math.PI * (2.2 + args.profile.chaos * 2) + hashToUnit(`${args.kind}-stream-phase#${args.fieldId}`) * Math.PI * 2)
    const radialAngle = hashToUnit(`${args.kind}-stream-angle#${args.fieldId}#${i}`) * Math.PI * 2
    const taper = 0.72 + Math.sin(t * Math.PI) * 0.45
    const ringR = Math.sqrt(hashToUnit(`${args.kind}-stream-radial#${args.fieldId}#${i}`)) * args.sheathRadius * taper
    const offY = Math.sin(radialAngle) * ringR + twist * args.sheathRadius * 0.32
    const offPerp = Math.cos(radialAngle) * ringR + twist * args.sheathRadius * 0.22
    samples.push({
      position: [cx + perpX * offPerp, offY, cz + perpZ * offPerp],
      sizeMul: dustSize(args.fieldId, i, args.profile, args.kind, knotBias, false),
      rotation: hashToUnit(`${args.kind}-stream-rot#${args.fieldId}#${i}`) * Math.PI * 2,
      tintHeat: 0.65 + (1 - t) * 0.72,
      opacity: dustOpacity(args.fieldId, i, args.profile, args.kind, knotBias, false),
      aspect: dustAspect(args.fieldId, i, args.profile, args.kind),
      spriteIndex: dustSprite(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

export function sampleStreamChunks(args: StreamSampleArgs): DebrisChunkSample[] {
  const samples: DebrisChunkSample[] = []
  const axisX = Math.cos(args.angleRad)
  const axisZ = Math.sin(args.angleRad)
  const perpX = -axisZ
  const perpZ = axisX
  for (let i = 0; i < args.count; i++) {
    const knotBias = i < Math.max(1, Math.round(args.count * 0.25))
    const t = clamp(hashToUnit(`${args.kind}-stream-chunk-t#${args.fieldId}#${i}`) + (knotBias ? signedHash(`${args.kind}-stream-chunk-knot#${args.fieldId}#${i}`) * 0.09 : 0), 0, 1)
    const r = args.startRadius + (args.endRadius - args.startRadius) * t
    const cx = r * axisX
    const cz = r * axisZ
    const offY = signedHash(`${args.kind}-stream-chunk-y#${args.fieldId}#${i}`) * args.sheathRadius * (1.1 + args.profile.verticalScatter)
    const offPerp = signedHash(`${args.kind}-stream-chunk-p#${args.fieldId}#${i}`) * args.sheathRadius * 2.1
    samples.push({
      position: [cx + perpX * offPerp, offY, cz + perpZ * offPerp],
      sizeMul: chunkSize(args.fieldId, i, args.profile, args.kind, knotBias),
      rotation: chunkRotation(args.fieldId, i, args.kind),
      brightness: 0.52 + hashToUnit(`${args.kind}-stream-chunk-bright#${args.fieldId}#${i}`) * 0.45,
      stretch: chunkStretch(args.fieldId, i, args.profile, args.kind),
    })
  }
  return samples
}

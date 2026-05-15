import type { DebrisField, DebrisFieldShape, DebrisFieldSpatialExtent, Fact, GeneratedSystem, GenerationOptions, StellarCompanion, Star } from '../../types'
import { fact } from './index'
import { createSeededRng } from './rng'
import type { SeededRng } from './rng'

export interface SpatialInputs {
  separationAu: number
  primaryMass: number
  companionMass: number
  hwInner: number
  hwOuter: number
}

export function spatialExtentForShape(shape: DebrisFieldShape, inputs: SpatialInputs): DebrisFieldSpatialExtent {
  const f = (n: number, src: string): Fact<number> => fact(n, 'derived', src)

  switch (shape) {
    case 'polar-ring':
      return {
        innerAu: f(inputs.hwInner, 'circumbinary inner keep-out'),
        outerAu: f(inputs.hwInner * 3, 'polar-ring outer = 3x inner'),
        inclinationDeg: f(90, 'polar by definition'),
        spanDeg: f(360, 'full ring'),
        centerAngleDeg: f(0, 'rotationally symmetric'),
      }
    case 'mass-transfer-stream':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'stream inner ~0.3x sep'),
        outerAu: f(inputs.separationAu * 1.2, 'stream outer ~1.2x sep'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(5, 'narrow stream'),
        centerAngleDeg: f(0, 'L1 axis'),
      }
    case 'common-envelope-shell':
      return {
        innerAu: f(inputs.separationAu * 5, 'shell inner ~5x sep'),
        outerAu: f(inputs.separationAu * 50, 'shell outer ~50x sep'),
        inclinationDeg: f(0, 'spherical, no preferred plane'),
        spanDeg: f(360, 'full shell'),
        centerAngleDeg: f(0, 'spherical'),
      }
    case 'inner-pair-halo':
      return {
        innerAu: f(inputs.hwInner * 1.1, 'just outside keep-out'),
        outerAu: f(inputs.hwInner * 4, 'inner halo extent'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'annulus'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'trojan-camp': {
      const side = (inputs.separationAu * 1000) % 2 < 1 ? 60 : -60
      return {
        innerAu: f(inputs.separationAu * 0.9, 'co-orbital with companion'),
        outerAu: f(inputs.separationAu * 1.1, 'co-orbital'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(30, 'tadpole'),
        centerAngleDeg: f(side, 'L4 or L5'),
      }
    }
    case 'kozai-scattered-halo':
      return {
        innerAu: f(inputs.hwOuter * 0.5, 'inner halo'),
        outerAu: f(inputs.hwOuter * 0.95, 'just inside S-type cutoff'),
        inclinationDeg: f(60, 'Kozai inclination'),
        spanDeg: f(360, 'scattered'),
        centerAngleDeg: f(0, 'isotropic'),
      }
    case 'hill-sphere-capture-cone':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'companion Hill sphere'),
        outerAu: f(inputs.separationAu * 0.5, 'capture boundary'),
        inclinationDeg: f(15, 'mild scatter'),
        spanDeg: f(120, 'trailing cone'),
        centerAngleDeg: f(180, 'opposite companion motion'),
      }
    case 'exocomet-swarm':
      return {
        innerAu: f(inputs.hwOuter * 2, 'reservoir start'),
        outerAu: f(inputs.hwOuter * 10, 'reservoir extent'),
        inclinationDeg: f(20, 'mild scatter'),
        spanDeg: f(360, 'reservoir'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'accretion-bridge':
      return {
        innerAu: f(0, 'star surface'),
        outerAu: f(inputs.separationAu, 'star to star'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(3, 'very narrow'),
        centerAngleDeg: f(0, 'star-star axis'),
      }
    case 'gardener-cordon':
      return {
        innerAu: f(inputs.hwOuter * 0.7, 'cordon radius'),
        outerAu: f(inputs.hwOuter * 0.72, 'cordon thin'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'full perimeter'),
        centerAngleDeg: f(0, 'symmetric'),
      }
  }
}

interface SelectionContext {
  hierarchicalTriple: boolean
}

interface SelectionResult {
  shape: DebrisFieldShape
}

export function selectArchetypeForCompanion(
  rngSeed: { seed: string },
  companion: StellarCompanion,
  primary: Star,
  context: SelectionContext,
): SelectionResult | null {
  const rng = createSeededRng(`${rngSeed.seed}:debris:${companion.id}`)
  const massRatio = companion.star.massSolar.value / (primary.massSolar.value + companion.star.massSolar.value)
  const activity = companion.star.activity.value
  const mode = companion.mode

  if (mode === 'linked-independent') return null

  if (context.hierarchicalTriple && companion.id === 'companion-1') {
    return { shape: 'inner-pair-halo' }
  }

  if (mode === 'volatile') {
    return { shape: 'mass-transfer-stream' }
  }

  if (mode === 'circumbinary') {
    if (massRatio <= 0.15) return { shape: 'trojan-camp' }
    return { shape: 'polar-ring' }
  }

  if (mode === 'orbital-sibling') {
    if (
      activity === 'Flare-prone' ||
      activity === 'Violent flare cycle' ||
      activity === 'Extreme activity / metric-amplified events'
    ) {
      return { shape: 'kozai-scattered-halo' }
    }
    const roll = rng.next()
    if (roll < 0.4) return { shape: 'hill-sphere-capture-cone' }
    return { shape: 'exocomet-swarm' }
  }

  return null
}

export function deriveDebrisFields(
  _rng: SeededRng,
  _system: GeneratedSystem,
  _options: GenerationOptions,
): DebrisField[] {
  return []
}

export function attachSettlementsToDebrisFields<T extends { debrisFieldId?: string; bodyId?: string }>(
  _rng: SeededRng,
  settlements: T[],
  _debrisFields: DebrisField[],
): T[] {
  return settlements
}

export function attachRuinsToDebrisFields<T extends { debrisFieldId?: string }>(
  _rng: SeededRng,
  ruins: T[],
  _debrisFields: DebrisField[],
): T[] {
  return ruins
}

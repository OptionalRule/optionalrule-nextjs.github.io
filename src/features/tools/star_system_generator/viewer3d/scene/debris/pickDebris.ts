import type { DebrisFieldShape, DebrisDensityBand } from '../../../types'

export type DebrisComponent = 'ring' | 'shell' | 'stream' | 'halo'

const COMPONENT_BY_SHAPE: Record<DebrisFieldShape, DebrisComponent> = {
  'polar-ring': 'ring',
  'trojan-camp': 'ring',
  'inner-pair-halo': 'ring',
  'gardener-cordon': 'ring',
  'common-envelope-shell': 'shell',
  'mass-transfer-stream': 'stream',
  'accretion-bridge': 'stream',
  'kozai-scattered-halo': 'halo',
  'hill-sphere-capture-cone': 'halo',
  'exocomet-swarm': 'halo',
}

export interface DebrisVisualParams {
  particleCount: number
  opacity: number
}

export interface DebrisRendererPick {
  component: DebrisComponent
  visualParams: DebrisVisualParams
}

export function pickDebrisRenderer(args: { shape: DebrisFieldShape; densityBand: DebrisDensityBand }): DebrisRendererPick {
  const component = COMPONENT_BY_SHAPE[args.shape]
  const particleCount =
    args.densityBand === 'shell-dense' ? 600 :
    args.densityBand === 'asteroid-fleet' ? 300 :
    args.densityBand === 'sparse' ? 120 :
    args.densityBand === 'dust' ? 40 : 200
  const opacity =
    args.densityBand === 'dust' ? 0.35 :
    args.densityBand === 'sparse' ? 0.55 : 0.85
  return { component, visualParams: { particleCount, opacity } }
}

import type { OrbitingBody } from '../../types'
import type { BodyShadingKey } from '../types'

export interface ShaderUniformSet {
  baseColor: string
  noiseScale: number
  atmosphereStrength: number
  heatTint: number
  bandStrength: number
}

const SHADING_BASE: Record<BodyShadingKey, ShaderUniformSet> = {
  'rocky-warm':  { baseColor: '#a87a5a', noiseScale: 4.0, atmosphereStrength: 0.2, heatTint: 0.0, bandStrength: 0.0 },
  'rocky-cool':  { baseColor: '#7e8a96', noiseScale: 4.0, atmosphereStrength: 0.15, heatTint: 0.0, bandStrength: 0.0 },
  earthlike:     { baseColor: '#3a7e9a', noiseScale: 3.0, atmosphereStrength: 0.4, heatTint: 0.0, bandStrength: 0.0 },
  desert:        { baseColor: '#d6a96b', noiseScale: 3.5, atmosphereStrength: 0.15, heatTint: 0.3, bandStrength: 0.1 },
  'sub-neptune': { baseColor: '#9ec8c2', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.2 },
  'gas-giant':   { baseColor: '#b08a52', noiseScale: 2.0, atmosphereStrength: 0.6, heatTint: 0.0, bandStrength: 0.8 },
  'ice-giant':   { baseColor: '#5e92aa', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.4 },
  dwarf:         { baseColor: '#8a8a82', noiseScale: 5.0, atmosphereStrength: 0.05, heatTint: 0.0, bandStrength: 0.0 },
  anomaly:       { baseColor: '#1a0d2a', noiseScale: 6.0, atmosphereStrength: 0.0, heatTint: 0.0, bandStrength: 0.0 },
}

export function chooseShading(body: OrbitingBody): BodyShadingKey {
  const cat = body.category.value
  switch (cat) {
    case 'gas-giant': return 'gas-giant'
    case 'ice-giant': return 'ice-giant'
    case 'sub-neptune': return 'sub-neptune'
    case 'anomaly': return 'anomaly'
    case 'dwarf-body': return 'dwarf'
    case 'belt': return 'dwarf'
    case 'rogue-captured': return 'rocky-cool'
    case 'super-earth':
    case 'rocky-planet': {
      const hydro = body.detail.hydrosphere.value.toLowerCase()
      if (hydro.includes('water') || hydro.includes('ocean')) return 'earthlike'
      const closeIn = body.physical.closeIn.value
      const thermal = body.thermalZone.value.toLowerCase()
      if (closeIn || thermal.includes('hot')) return 'desert'
      if (thermal.includes('cold') || thermal.includes('frozen')) return 'rocky-cool'
      return 'rocky-warm'
    }
    default: return 'rocky-warm'
  }
}

export function shaderUniforms(body: OrbitingBody): ShaderUniformSet {
  const key = chooseShading(body)
  const base = SHADING_BASE[key]
  const volatileBoost = body.physical.volatileEnvelope.value ? 0.25 : 0
  const heatBoost = body.physical.closeIn.value ? 0.4 : 0
  return {
    ...base,
    atmosphereStrength: base.atmosphereStrength + volatileBoost,
    heatTint: base.heatTint + heatBoost,
  }
}

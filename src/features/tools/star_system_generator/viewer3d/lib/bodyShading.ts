import type { OrbitingBody } from '../../types'
import type { BodyShadingKey } from '../types'
import { hashToUnit } from './motion'

export interface ShaderUniformSet {
  baseColor: string
  secondaryColor: string
  accentColor: string
  noiseScale: number
  atmosphereStrength: number
  heatTint: number
  bandStrength: number
  bandFrequency: number
  waterCoverage: number
  iceCoverage: number
  cloudStrength: number
  craterStrength: number
  volcanicStrength: number
  stormStrength: number
  surfaceSeed: number
}

const SHADING_BASE: Record<BodyShadingKey, ShaderUniformSet> = {
  'rocky-warm':  { baseColor: '#a87a5a', secondaryColor: '#6c5a45', accentColor: '#2d5367', noiseScale: 4.0, atmosphereStrength: 0.2, heatTint: 0.0, bandStrength: 0.0, bandFrequency: 4, waterCoverage: 0, iceCoverage: 0, cloudStrength: 0.08, craterStrength: 0.2, volcanicStrength: 0, stormStrength: 0, surfaceSeed: 0 },
  'rocky-cool':  { baseColor: '#7e8a96', secondaryColor: '#4f5a63', accentColor: '#b7d9e8', noiseScale: 4.0, atmosphereStrength: 0.15, heatTint: 0.0, bandStrength: 0.0, bandFrequency: 4, waterCoverage: 0, iceCoverage: 0.25, cloudStrength: 0.06, craterStrength: 0.25, volcanicStrength: 0, stormStrength: 0, surfaceSeed: 0 },
  earthlike:     { baseColor: '#496f42', secondaryColor: '#8b7651', accentColor: '#1f5f8f', noiseScale: 3.0, atmosphereStrength: 0.4, heatTint: 0.0, bandStrength: 0.0, bandFrequency: 4, waterCoverage: 0.55, iceCoverage: 0.12, cloudStrength: 0.28, craterStrength: 0.03, volcanicStrength: 0, stormStrength: 0.1, surfaceSeed: 0 },
  desert:        { baseColor: '#d6a96b', secondaryColor: '#8f583a', accentColor: '#f0c37c', noiseScale: 3.5, atmosphereStrength: 0.15, heatTint: 0.3, bandStrength: 0.1, bandFrequency: 5, waterCoverage: 0, iceCoverage: 0, cloudStrength: 0.04, craterStrength: 0.15, volcanicStrength: 0, stormStrength: 0, surfaceSeed: 0 },
  'sub-neptune': { baseColor: '#9ec8c2', secondaryColor: '#5e8f9c', accentColor: '#d8eee9', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.2, bandFrequency: 8, waterCoverage: 0, iceCoverage: 0, cloudStrength: 0.48, craterStrength: 0, volcanicStrength: 0, stormStrength: 0.25, surfaceSeed: 0 },
  'gas-giant':   { baseColor: '#b08a52', secondaryColor: '#6f4c32', accentColor: '#e2c383', noiseScale: 2.0, atmosphereStrength: 0.6, heatTint: 0.0, bandStrength: 0.8, bandFrequency: 12, waterCoverage: 0, iceCoverage: 0, cloudStrength: 0.35, craterStrength: 0, volcanicStrength: 0, stormStrength: 0.45, surfaceSeed: 0 },
  'ice-giant':   { baseColor: '#5e92aa', secondaryColor: '#31586e', accentColor: '#bfe7ef', noiseScale: 2.5, atmosphereStrength: 0.5, heatTint: 0.0, bandStrength: 0.4, bandFrequency: 9, waterCoverage: 0, iceCoverage: 0.12, cloudStrength: 0.35, craterStrength: 0, volcanicStrength: 0, stormStrength: 0.25, surfaceSeed: 0 },
  dwarf:         { baseColor: '#8a8a82', secondaryColor: '#565651', accentColor: '#bdb9a8', noiseScale: 5.0, atmosphereStrength: 0.05, heatTint: 0.0, bandStrength: 0.0, bandFrequency: 4, waterCoverage: 0, iceCoverage: 0.1, cloudStrength: 0, craterStrength: 0.45, volcanicStrength: 0, stormStrength: 0, surfaceSeed: 0 },
  anomaly:       { baseColor: '#1a0d2a', secondaryColor: '#34185a', accentColor: '#a880ff', noiseScale: 6.0, atmosphereStrength: 0.0, heatTint: 0.0, bandStrength: 0.0, bandFrequency: 6, waterCoverage: 0, iceCoverage: 0, cloudStrength: 0, craterStrength: 0, volcanicStrength: 0, stormStrength: 0.2, surfaceSeed: 0 },
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
  const text = bodyText(body)
  const volatileBoost = body.physical.volatileEnvelope.value ? 0.25 : 0
  const heatBoost = body.physical.closeIn.value ? 0.4 : 0
  const atmosphereBoost = atmosphereStrength(text)
  const cloudBoost = cloudStrength(text, body.physical.volatileEnvelope.value)
  const waterCoverage = waterCoverageFor(text, key)
  const iceCoverage = iceCoverageFor(text, key)
  const volcanicStrength = volcanicStrengthFor(text)
  const craterStrength = craterStrengthFor(text, key, atmosphereBoost, waterCoverage)
  const stormStrength = stormStrengthFor(text, key)
  const surfaceSeed = hashToUnit(`${body.id}#${body.name.value}#surface`) * 19.7
  return {
    ...base,
    ...colorsFor(body, key),
    atmosphereStrength: Math.min(1, Math.max(base.atmosphereStrength, atmosphereBoost) + volatileBoost),
    heatTint: base.heatTint + heatBoost,
    bandStrength: Math.min(1, base.bandStrength + (stormStrength * 0.22)),
    bandFrequency: base.bandFrequency + hashToUnit(`${body.id}#bands`) * 5,
    waterCoverage,
    iceCoverage,
    cloudStrength: Math.min(1, base.cloudStrength + cloudBoost),
    craterStrength,
    volcanicStrength,
    stormStrength,
    surfaceSeed,
  }
}

function bodyText(body: OrbitingBody): string {
  return [
    body.category.value,
    body.massClass.value,
    body.bodyClass.value,
    body.bodyProfile?.value ?? '',
    body.whyInteresting.value,
    body.thermalZone.value,
    body.detail.atmosphere.value,
    body.detail.hydrosphere.value,
    body.detail.geology.value,
    body.detail.radiation.value,
    body.detail.biosphere.value,
    ...body.detail.climate.map((c) => c.value),
    ...body.traits.map((t) => t.value),
    ...body.sites.map((s) => s.value),
  ].join(' ').toLowerCase()
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function waterCoverageFor(text: string, key: BodyShadingKey): number {
  if (key === 'gas-giant' || key === 'ice-giant' || key === 'sub-neptune' || key === 'anomaly') return 0
  if (hasAny(text, ['global ocean', 'waterworld', 'hycean', 'ocean world'])) return 0.82
  if (hasAny(text, ['liquid water', 'water oceans', 'ocean'])) return 0.62
  if (hasAny(text, ['briny', 'aquifer', 'lakes', 'seas'])) return 0.28
  if (hasAny(text, ['bone dry', 'no accessible volatile', 'none / dispersed', 'hard vacuum'])) return 0
  return SHADING_BASE[key].waterCoverage
}

function iceCoverageFor(text: string, key: BodyShadingKey): number {
  let coverage = SHADING_BASE[key].iceCoverage
  if (hasAny(text, ['cryogenic', 'frozen', 'ice-rich', 'ice mantle', 'dark', 'cold'])) coverage += 0.35
  if (hasAny(text, ['snow', 'glacier', 'polar'])) coverage += 0.2
  if (hasAny(text, ['furnace', 'inferno', 'hot', 'magma', 'steam greenhouse'])) coverage = Math.max(0, coverage - 0.3)
  return Math.min(0.85, Math.max(0, coverage))
}

function atmosphereStrength(text: string): number {
  if (hasAny(text, ['hard vacuum', 'airless', 'none / dispersed'])) return 0
  if (hasAny(text, ['thin'])) return 0.14
  if (hasAny(text, ['moderate'])) return 0.32
  if (hasAny(text, ['thick', 'dense', 'toxic', 'steam'])) return 0.55
  if (hasAny(text, ['hydrogen/helium', 'envelope'])) return 0.72
  return 0
}

function cloudStrength(text: string, volatileEnvelope: boolean): number {
  let strength = volatileEnvelope ? 0.25 : 0
  if (hasAny(text, ['storm', 'cloud', 'steam', 'greenhouse', 'toxic', 'haze'])) strength += 0.28
  if (hasAny(text, ['hydrogen/helium', 'envelope'])) strength += 0.32
  if (hasAny(text, ['hard vacuum', 'airless'])) strength = 0
  return Math.min(0.75, strength)
}

function volcanicStrengthFor(text: string): number {
  if (hasAny(text, ['magma', 'volcan', 'global resurfacing', 'cryovolcan', 'tectonic'])) return 0.45
  return 0
}

function craterStrengthFor(text: string, key: BodyShadingKey, atmosphere: number, water: number): number {
  let strength = SHADING_BASE[key].craterStrength
  if (hasAny(text, ['airless', 'hard vacuum', 'rubble', 'collision', 'remnant', 'minor-body'])) strength += 0.3
  if (hasAny(text, ['static lid'])) strength += 0.12
  strength -= atmosphere * 0.18
  strength -= water * 0.2
  return Math.min(0.85, Math.max(0, strength))
}

function stormStrengthFor(text: string, key: BodyShadingKey): number {
  let strength = SHADING_BASE[key].stormStrength
  if (hasAny(text, ['storm', 'jet', 'cyclone', 'turbulent'])) strength += 0.3
  if (key === 'gas-giant' || key === 'ice-giant' || key === 'sub-neptune') strength += 0.15
  return Math.min(1, strength)
}

function colorsFor(body: OrbitingBody, key: BodyShadingKey): Pick<ShaderUniformSet, 'baseColor' | 'secondaryColor' | 'accentColor'> {
  const text = bodyText(body)
  if (key === 'earthlike') {
    if (hasAny(text, ['global ocean', 'waterworld', 'hycean'])) {
      return { baseColor: '#2f6f7f', secondaryColor: '#325d3e', accentColor: '#184f86' }
    }
    return { baseColor: '#4f7b44', secondaryColor: '#9a855a', accentColor: '#1f5f8f' }
  }
  if (key === 'desert') {
    if (hasAny(text, ['iron', 'rust', 'oxid'])) return { baseColor: '#b6603d', secondaryColor: '#733929', accentColor: '#e5a160' }
    return { baseColor: '#d6a96b', secondaryColor: '#8f583a', accentColor: '#f0c37c' }
  }
  if (hasAny(text, ['carbon', 'chiral'])) return { baseColor: '#3f4142', secondaryColor: '#1d1f21', accentColor: '#7a8c91' }
  if (hasAny(text, ['metal', 'iron'])) return { baseColor: '#8d8276', secondaryColor: '#4f4d4b', accentColor: '#c0a37e' }
  return {
    baseColor: baseColorVariant(body, key, 0),
    secondaryColor: baseColorVariant(body, key, 1),
    accentColor: SHADING_BASE[key].accentColor,
  }
}

function baseColorVariant(body: OrbitingBody, key: BodyShadingKey, offset: number): string {
  const palettes: Record<BodyShadingKey, string[]> = {
    'rocky-warm': ['#a87a5a', '#96704d', '#b17f5b', '#8d735b'],
    'rocky-cool': ['#7e8a96', '#687986', '#8f9390', '#66717c'],
    earthlike: ['#496f42', '#527f49', '#446b5c', '#627345'],
    desert: ['#d6a96b', '#c89052', '#b97a4e', '#d2b16f'],
    'sub-neptune': ['#9ec8c2', '#7fb3bd', '#9db5d4', '#8cc7a8'],
    'gas-giant': ['#b08a52', '#a17445', '#c39b62', '#94745e'],
    'ice-giant': ['#5e92aa', '#527faa', '#6aa6b1', '#4f7592'],
    dwarf: ['#8a8a82', '#77766f', '#9d9787', '#6e716d'],
    anomaly: ['#1a0d2a', '#241044', '#30195f', '#12081f'],
  }
  const options = palettes[key]
  return options[Math.floor(hashToUnit(`${body.id}#${key}#palette#${offset}`) * options.length) % options.length]
}

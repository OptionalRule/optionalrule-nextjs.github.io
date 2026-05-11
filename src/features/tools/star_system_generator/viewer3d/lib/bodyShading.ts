import type { OrbitingBody } from '../../types'
import type { BodyShadingKey } from '../types'
import { hashToUnit } from './motion'

interface BaseShadingSet {
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

export interface ShaderUniformSet extends BaseShadingSet {
  mineralTint: string
  mineralBlend: number
  topographyMode: number
  topographyStrength: number
  hazardTint: string
  hazardBlend: number
  shimmerColor: string
  shimmerStrength: number
}

const SHADING_BASE: Record<BodyShadingKey, BaseShadingSet> = {
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
  const mineral = mineralFor(body)
  const topography = topographyFor(body)
  const hazard = hazardFor(body)
  const shimmer = shimmerFor(mineral, hazard)
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
    mineralTint: mineral.tint,
    mineralBlend: mineral.blend,
    topographyMode: topography.mode,
    topographyStrength: topography.strength,
    hazardTint: hazard.tint,
    hazardBlend: hazard.blend,
    shimmerColor: shimmer.color,
    shimmerStrength: shimmer.strength,
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
    return { baseColor: '#d6a96b', secondaryColor: '#8f583a', accentColor: '#f0c37c' }
  }
  return {
    baseColor: baseColorVariant(body, key, 0),
    secondaryColor: baseColorVariant(body, key, 1),
    accentColor: SHADING_BASE[key].accentColor,
  }
}

interface MineralResult { tint: string; blend: number; shimmer: boolean }
interface HazardResult { tint: string; blend: number; shimmer: boolean }

const MINERAL_MAP: Record<string, MineralResult> = {
  'Common silicate': { tint: '#ffffff', blend: 0, shimmer: false },
  'Iron-rich (red oxide)': { tint: '#b6603d', blend: 0.55, shimmer: false },
  'Carbon-rich (diamond precursor)': { tint: '#2a2528', blend: 0.55, shimmer: false },
  'Sulfide ore-dominant': { tint: '#caa84a', blend: 0.45, shimmer: false },
  'Heavy element enrichment': { tint: '#7a7280', blend: 0.40, shimmer: false },
  'Phosphate-rich': { tint: '#c2a878', blend: 0.30, shimmer: false },
  'Calcite / limestone bedrock': { tint: '#d8d2bc', blend: 0.40, shimmer: false },
  'Olivine-pyroxene mantle exposure': { tint: '#6b7a5a', blend: 0.40, shimmer: false },
  'Methane / hydrocarbon clathrates': { tint: '#7a6850', blend: 0.35, shimmer: false },
  'Helium-3 sequestered regolith': { tint: '#9aa5b8', blend: 0.30, shimmer: false },
  'Halogen-bearing crust': { tint: '#a8c879', blend: 0.35, shimmer: false },
  'Chiral organics in soil': { tint: '#a880ff', blend: 0.40, shimmer: true },
  'Programmable-matter substrate': { tint: '#5e6ad8', blend: 0.50, shimmer: true },
  'Bleed-altered crust': { tint: '#c18cff', blend: 0.45, shimmer: true },
  'Iron meteoritic enrichment': { tint: '#8d8276', blend: 0.40, shimmer: false },
  'Vitrified surface glasses': { tint: '#9caec0', blend: 0.35, shimmer: false },
  'Salt / evaporite-rich': { tint: '#e8e2c8', blend: 0.50, shimmer: false },
  'Bedrock exposed (no regolith)': { tint: '#5e5752', blend: 0.45, shimmer: false },
  'Frozen organics (tholin-rich)': { tint: '#d49a52', blend: 0.45, shimmer: false },
  'Sulfate evaporite crust': { tint: '#e8d9a0', blend: 0.45, shimmer: false },
}

const TOPOGRAPHY_MAP: Record<string, { mode: number; strength: number }> = {
  'Flat plains': { mode: 0, strength: 0 },
  'Crater-saturated': { mode: 0, strength: 0 },
  'Highland-continent dichotomy': { mode: 1, strength: 0.50 },
  'Tibetan plateau / supercontinent': { mode: 1, strength: 0.40 },
  'Deep canyons / Valles Marineris': { mode: 3, strength: 0.45 },
  'Volcanic shield province': { mode: 0, strength: 0 },
  'Sand seas / dune fields': { mode: 2, strength: 0.55 },
  'Tectonic ridge system': { mode: 3, strength: 0.35 },
  'Mascon basin (gravity well)': { mode: 0, strength: 0 },
  'Hemispheric albedo dichotomy': { mode: 1, strength: 0.65 },
  'Ring impact pattern': { mode: 0, strength: 0 },
  'Ice-shell terrain': { mode: 4, strength: 0.45 },
  'Glacial valley networks': { mode: 4, strength: 0.35 },
  'Bright icy poles': { mode: 0, strength: 0 },
}

const HAZARD_MAP: Record<string, HazardResult> = {
  'Clear surface — no contact hazards': { tint: '#ffffff', blend: 0, shimmer: false },
  'Wind-driven abrasive dust': { tint: '#b09a82', blend: 0.20, shimmer: false },
  'Perchlorate-laden soil': { tint: '#c9a35a', blend: 0.30, shimmer: false },
  'Sulfuric acid pools': { tint: '#d9c450', blend: 0.32, shimmer: false },
  'Cyanide-bearing salt crust': { tint: '#d8e2b8', blend: 0.28, shimmer: false },
  'Mercury vapor pockets': { tint: '#c9c8b8', blend: 0.25, shimmer: false },
  'Electrostatic dust clouds': { tint: '#a8a098', blend: 0.22, shimmer: false },
  'Radioactive surface mineralization': { tint: '#c8ff90', blend: 0.30, shimmer: true },
  'Cryogenic burn (LN2-cold contact)': { tint: '#bce0ee', blend: 0.25, shimmer: false },
  'Carbon monoxide seeps': { tint: '#8a8580', blend: 0.18, shimmer: false },
  'Hydrogen sulfide vent gas': { tint: '#aab06e', blend: 0.20, shimmer: false },
  'Chiral-reactive contaminants': { tint: '#a880ff', blend: 0.30, shimmer: true },
  'Programmable-matter contamination': { tint: '#5e6ad8', blend: 0.35, shimmer: true },
  'Pyrophoric metallic dust': { tint: '#7a4a2c', blend: 0.25, shimmer: false },
}

function mineralFor(body: OrbitingBody): MineralResult {
  return MINERAL_MAP[body.detail.mineralComposition.value] ?? { tint: '#ffffff', blend: 0, shimmer: false }
}

function topographyFor(body: OrbitingBody): { mode: number; strength: number } {
  return TOPOGRAPHY_MAP[body.detail.topography.value] ?? { mode: 0, strength: 0 }
}

function hazardFor(body: OrbitingBody): HazardResult {
  return HAZARD_MAP[body.detail.surfaceHazards.value] ?? { tint: '#ffffff', blend: 0, shimmer: false }
}

function shimmerFor(mineral: MineralResult, hazard: HazardResult): { color: string; strength: number } {
  if (mineral.shimmer) return { color: mineral.tint, strength: 0.25 }
  if (hazard.shimmer) return { color: hazard.tint, strength: 0.25 }
  return { color: '#ffffff', strength: 0 }
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

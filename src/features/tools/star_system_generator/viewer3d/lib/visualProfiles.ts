import type { GeneratedSystem, Moon, OrbitingBody, StellarCompanion } from '../../types'
import type {
  BeltVisual,
  BodySurfaceVisual,
  MoonSurfaceVisual,
  PhenomenonMarker,
  RingVisual,
  SceneVec3,
  StarVisual,
  SurfaceFamily,
  VolumeShape,
} from '../types'
import { hashToUnit } from './motion'
import { spectralVisuals } from './stellarColor'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term))
}

export function bodyVisualText(body: OrbitingBody): string {
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
    ...body.filterNotes.map((n) => n.value),
  ].join(' ').toLowerCase()
}

function familyForBody(body: OrbitingBody, text = bodyVisualText(body)): SurfaceFamily {
  if (body.category.value === 'anomaly' || hasAny(text, ['gu', 'chiral', 'bleed', 'fracture', 'dark-sector'])) return 'anomaly'
  if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant') return 'gas-banded'
  if (body.category.value === 'sub-neptune' || body.physical.volatileEnvelope.value) return 'volatile'
  if (hasAny(text, ['airless', 'hard vacuum', 'rubble', 'minor-body'])) return 'airless'
  if (hasAny(text, ['magma', 'lava', 'volcan', 'cryovolcan'])) return 'magma'
  if (hasAny(text, ['global ocean', 'waterworld', 'hycean', 'ocean world', 'liquid water'])) return 'ocean'
  if (hasAny(text, ['ice-rich', 'ice mantle', 'frozen', 'cryogenic', 'glacier'])) return 'ice'
  if (hasAny(text, ['carbon'])) return 'carbon'
  if (hasAny(text, ['iron', 'metal', 'stripped', 'remnant core'])) return 'iron'
  if (hasAny(text, ['desert', 'dry', 'furnace', 'scorched', 'hot'])) return 'desert'
  return 'rocky'
}

function atmosphereStrength(text: string, volatileEnvelope: boolean): number {
  if (hasAny(text, ['hard vacuum', 'airless', 'none / dispersed'])) return 0
  let strength = volatileEnvelope ? 0.42 : 0
  if (hasAny(text, ['thin'])) strength = Math.max(strength, 0.16)
  if (hasAny(text, ['moderate'])) strength = Math.max(strength, 0.34)
  if (hasAny(text, ['thick', 'dense', 'toxic', 'steam', 'greenhouse', 'haze'])) strength = Math.max(strength, 0.58)
  if (hasAny(text, ['hydrogen/helium', 'envelope', 'sub-neptune', 'gas giant', 'ice giant'])) strength = Math.max(strength, 0.72)
  return clamp01(strength)
}

function cloudStrength(text: string, family: SurfaceFamily, volatileEnvelope: boolean): number {
  if (hasAny(text, ['hard vacuum', 'airless'])) return 0
  let strength = volatileEnvelope ? 0.2 : 0
  if (family === 'gas-banded') strength += 0.42
  if (family === 'volatile') strength += 0.34
  if (family === 'ocean') strength += 0.22
  if (hasAny(text, ['storm', 'cloud', 'steam', 'greenhouse', 'toxic', 'haze', 'cyclone', 'jet'])) strength += 0.3
  return clamp01(strength)
}

function atmosphereColor(text: string, family: SurfaceFamily): string {
  if (family === 'anomaly') return '#a880ff'
  if (hasAny(text, ['toxic', 'sulfur', 'greenhouse'])) return '#d8bd6a'
  if (hasAny(text, ['steam', 'water', 'ocean', 'hycean'])) return '#8bc8ff'
  if (hasAny(text, ['methane', 'ice giant'])) return '#7fd1df'
  if (hasAny(text, ['dust', 'desert', 'haze'])) return '#d6a96b'
  return '#7fb5ff'
}

function cloudColor(text: string, family: SurfaceFamily): string {
  if (family === 'anomaly') return '#c3a7ff'
  if (hasAny(text, ['toxic', 'sulfur'])) return '#d7c16d'
  if (hasAny(text, ['dust', 'desert'])) return '#d8a46a'
  if (family === 'gas-banded') return '#efe2bf'
  return '#e6edf0'
}

function reliefStrength(text: string, family: SurfaceFamily): number {
  let strength = 0.12
  if (family === 'airless') strength += 0.34
  if (family === 'ice') strength += 0.18
  if (family === 'magma') strength += 0.16
  if (family === 'gas-banded' || family === 'volatile' || family === 'ocean') strength -= 0.08
  if (hasAny(text, ['rubble', 'collision', 'crater', 'static lid', 'mountain', 'fracture'])) strength += 0.18
  return clamp01(strength)
}

export function buildBodySurfaceProfile(
  body: OrbitingBody,
  seed: string,
  settlementCount: number,
): BodySurfaceVisual {
  const text = bodyVisualText(body)
  const family = settlementCount > 0 ? 'settled' : familyForBody(body, text)
  const atmo = atmosphereStrength(text, body.physical.volatileEnvelope.value)
  const clouds = cloudStrength(text, family, body.physical.volatileEnvelope.value)
  const surfaceSeed = hashToUnit(`${seed}#${body.id}#surface-profile/v1`) * 31.7
  const cloudTrace = cloudTraceFor(body)
  const cloudBand = cloudBandMultiplierFor(body)
  const cloudRotationMult = cloudRotationMultiplierFor(body)
  const pressureMult = atmospherePressureMultiplierFor(body)
  const aurora = auroraFor(body, seed)
  return {
    profileVersion: 1,
    family,
    atmosphereColor: atmosphereColor(text, family),
    atmosphereStrength: atmo,
    atmosphereThickness: 1.06 + atmo * 0.16,
    cloudColor: cloudColor(text, family),
    cloudStrength: clouds,
    cloudRotationSpeed: (hashToUnit(`${seed}#${body.id}#cloud-speed`) - 0.5) * 0.08,
    normalStrength: reliefStrength(text, family),
    reliefStrength: reliefStrength(text, family),
    nightLightStrength: settlementCount > 0 ? Math.min(0.62, 0.18 + settlementCount * 0.08) : 0,
    cityLightColor: family === 'anomaly' ? '#b891ff' : '#ffb15c',
    surfaceSeed,
    cloudSeed: hashToUnit(`${seed}#${body.id}#cloud-profile/v1`) * 29.3,
    cloudTraceTint: cloudTrace.tint,
    cloudTraceBlend: cloudTrace.blend,
    cloudBandStrength: cloudBand,
    cloudRotationMultiplier: cloudRotationMult,
    atmospherePressureMultiplier: pressureMult,
    auroraIntensity: aurora.intensity,
    auroraColor: aurora.color,
    auroraMode: aurora.mode,
    auroraPulse: aurora.pulse,
    auroraAxisOffset: aurora.axisOffset,
  }
}

const CLOUD_TRACE_MAP: Record<string, { tint: string; blend: number }> = {
  'Pure (primary mix only)': { tint: '#ffffff', blend: 0 },
  'Helium-3 enriched': { tint: '#ffffff', blend: 0 },
  'Ozone layer present': { tint: '#7ac7e0', blend: 0.15 },
  'Methane biosignature trace': { tint: '#ffffff', blend: 0 },
  'Tholin photochemistry': { tint: '#d49a52', blend: 0.45 },
  'Volcanic SO2 plumes': { tint: '#e2cf68', blend: 0.40 },
  'Lightning-driven NOx': { tint: '#c2a878', blend: 0.25 },
  'Cyanide / cyanogen trace': { tint: '#ffffff', blend: 0 },
  'Halogen mix': { tint: '#a8c879', blend: 0.30 },
  'Industrial pollutant signatures': { tint: '#7c5a45', blend: 0.40 },
  'Noble gas excess': { tint: '#ffffff', blend: 0 },
  'Carbon isotope biosignature': { tint: '#ffffff', blend: 0 },
}

function cloudTraceFor(body: OrbitingBody): { tint: string; blend: number } {
  return CLOUD_TRACE_MAP[body.detail.atmosphericTraces.value] ?? { tint: '#ffffff', blend: 0 }
}

const WIND_BAND_MAP: Record<string, number> = {
  'Still / calm': 0.6,
  'Light breeze': 0.8,
  'Earth-typical winds': 1.0,
  'Persistent strong winds': 1.2,
  'Storm-prone with high gusts': 1.4,
  'Hurricane-class continuous winds': 1.6,
  'Hypercane / supersonic jet streams': 1.8,
  'Periodic dust storm season': 1.3,
  'Stratified zonal jets (banded)': 1.5,
  'Chiral wind chemistry': 1.3,
}

function cloudBandMultiplierFor(body: OrbitingBody): number {
  return WIND_BAND_MAP[body.detail.windRegime.value] ?? 1.0
}

const DAY_LENGTH_SPEED: Record<string, number> = {
  'Very short day (under 6 Earth hours)': 3.0,
  'Short day (6-18 hours)': 1.5,
  'Earth-like day (~24 hours)': 1.0,
  'Long day (1-3 Earth days)': 0.3,
  'Multi-day cycle (3-30 days)': 0.1,
  'Mercury-style year-length day': 0.02,
  'No day-night cycle (tidally locked)': 0.0,
}

const ROTATION_DIRECTION: Record<string, number> = {
  'Slow rotation (Mercury-style)': 0.2,
  'Resonant rotation (3:2)': 0.5,
  'Earth-like 24h cycle': 1.0,
  'Fast rotation': 1.0,
  'Retrograde rotation': -1.0,
  'Precessing axis': 1.0,
  'Wobbling rotation': 0.9,
  'Chaotic rotation': 0.6,
}

function cloudRotationMultiplierFor(body: OrbitingBody): number {
  const day = DAY_LENGTH_SPEED[body.detail.dayLength.value] ?? 1.0
  const dir = ROTATION_DIRECTION[body.detail.rotationProfile.value] ?? 1.0
  return day * dir
}

const PRESSURE_MAP: Record<string, number> = {
  'Hard vacuum (<0.001 atm)': 0,
  'Near-vacuum (~0.01 atm)': 0.05,
  'Thin (~0.3 atm, pressure-gear required)': 0.18,
  'Standard (~1 atm)': 0.28,
  'Dense (~3 atm)': 0.36,
  'High-pressure (~10 atm)': 0.42,
  'Crushing (~50 atm)': 0.45,
  'Supercritical (Venus-extreme, ~90+ atm)': 0.50,
}

function atmospherePressureMultiplierFor(body: OrbitingBody): number {
  const value = body.detail.atmosphericPressure.value
  if (!value || !(value in PRESSURE_MAP)) return -1
  return PRESSURE_MAP[value]
}

interface AuroraProfile {
  intensity: number
  color: string
  mode: number
  pulse: number
  axisOffset: number
}

const AURORA_MAP: Record<string, Omit<AuroraProfile, 'axisOffset'>> = {
  'No field (naked)': { intensity: 0, color: '#ffffff', mode: 0, pulse: 0 },
  'Weak crustal remnant': { intensity: 0, color: '#ffffff', mode: 0, pulse: 0 },
  'Earth-like dipole': { intensity: 0.15, color: '#9bcb6f', mode: 0, pulse: 0 },
  'Strong dipole shield': { intensity: 0.35, color: '#6ad17a', mode: 0, pulse: 0 },
  'Pulsing / flickering': { intensity: 0.30, color: '#8cd4a8', mode: 0, pulse: 1 },
  'Multipolar chaos': { intensity: 0.30, color: '#b8c8e0', mode: 1, pulse: 0 },
  'Twin-pole shifting': { intensity: 0.30, color: '#7ee0a6', mode: 4, pulse: 0 },
  'Crustal magnetic stripes': { intensity: 0.20, color: '#9cb8d4', mode: 2, pulse: 0 },
  'Aurora-belt dominated': { intensity: 0.50, color: '#5ce39a', mode: 0, pulse: 0 },
  'GU monopole anomaly': { intensity: 0.60, color: '#b18cff', mode: 3, pulse: 0 },
}

function auroraFor(body: OrbitingBody, seed: string): AuroraProfile {
  const base = AURORA_MAP[body.detail.magneticField.value] ?? { intensity: 0, color: '#ffffff', mode: 0, pulse: 0 }
  const axisOffset = (hashToUnit(`${seed}#${body.id}#aurora-tilt`) - 0.5) * 0.6
  return { ...base, axisOffset }
}

function moonFamily(moon: Moon): SurfaceFamily {
  const text = [moon.moonType.value, moon.scale.value, moon.resource.value, moon.hazard.value, moon.use.value].join(' ').toLowerCase()
  if (hasAny(text, ['gu', 'chiral', 'dark-sector', 'anomaly'])) return 'anomaly'
  if (hasAny(text, ['ice', 'ocean', 'cryovolcan', 'volatile'])) return 'ice'
  if (hasAny(text, ['volcan', 'lava', 'magma', 'tidal'])) return 'magma'
  if (hasAny(text, ['metal', 'iron'])) return 'iron'
  if (hasAny(text, ['carbon'])) return 'carbon'
  if (hasAny(text, ['industrial', 'station', 'base', 'habitat'])) return 'settled'
  return 'airless'
}

const MOON_PALETTES: Record<SurfaceFamily, [string, string, string]> = {
  airless: ['#8a8a82', '#565651', '#bdb9a8'],
  anomaly: ['#26103e', '#4b2584', '#a880ff'],
  carbon: ['#3f4142', '#1d1f21', '#7a8c91'],
  desert: ['#b9865a', '#704b38', '#e3bb7c'],
  'gas-banded': ['#b08a52', '#6f4c32', '#e2c383'],
  ice: ['#9fb3bd', '#536b79', '#d7eef5'],
  iron: ['#8d8276', '#4f4d4b', '#c0a37e'],
  magma: ['#6d4639', '#2f2623', '#ff5c2b'],
  ocean: ['#2f6f7f', '#1f3f5f', '#8dcfed'],
  rocky: ['#8d735b', '#51483f', '#b79d80'],
  settled: ['#77766f', '#4c4d4b', '#ffb15c'],
  volatile: ['#9ec8c2', '#5e8f9c', '#d8eee9'],
}

export function buildMoonSurfaceProfile(moon: Moon, seed: string): MoonSurfaceVisual {
  const family = moonFamily(moon)
  const text = [moon.moonType.value, moon.resource.value, moon.hazard.value, moon.use.value].join(' ').toLowerCase()
  const [baseColor, secondaryColor, accentColor] = MOON_PALETTES[family]
  return {
    profileVersion: 1,
    family,
    baseColor,
    secondaryColor,
    accentColor,
    atmosphereStrength: hasAny(text, ['atmosphere', 'haze']) ? 0.2 : 0,
    craterStrength: family === 'airless' ? 0.72 : family === 'ice' ? 0.38 : 0.18,
    iceCoverage: family === 'ice' ? 0.72 : 0,
    volcanicStrength: family === 'magma' ? 0.58 : 0,
    surfaceSeed: hashToUnit(`${seed}#${moon.id}#moon-surface/v1`) * 23.1,
  }
}

export function buildRingProfile(body: OrbitingBody, parentSize: number): RingVisual | undefined {
  if (!body.rings) return undefined
  const text = [body.rings.type.value, body.bodyClass.value, body.detail.radiation.value, body.whyInteresting.value].join(' ').toLowerCase()
  const icy = hasAny(text, ['ice', 'water', 'volatile'])
  const dusty = hasAny(text, ['dust', 'debris', 'rock', 'rubble'])
  const anomaly = hasAny(text, ['gu', 'chiral', 'metric'])
  const tilt = (hashToUnit(`ring#${body.id}`) - 0.5) * 0.6
  return {
    innerRadius: parentSize * 1.4,
    outerRadius: parentSize * (2.05 + hashToUnit(`ring-width#${body.id}`) * 0.35),
    tilt,
    bandCount: 3 + Math.floor(hashToUnit(`ring-bands#${body.id}`) * 4),
    color: anomaly ? '#a880ff' : icy ? '#c9dce4' : dusty ? '#b49a7a' : '#d6a96b',
    secondaryColor: anomaly ? '#5f3ca3' : icy ? '#edf8ff' : dusty ? '#6f6257' : '#9d7650',
    opacity: anomaly ? 0.5 : 0.42,
    gapCount: 1 + Math.floor(hashToUnit(`ring-gaps#${body.id}`) * 4),
    gapSeed: hashToUnit(`ring-gap-seed#${body.id}`) * 17.5,
    arcStrength: anomaly || hasAny(text, ['arc', 'shepherd', 'broken']) ? 0.5 : hashToUnit(`ring-arc#${body.id}`) * 0.24,
  }
}

export function buildBeltProfile(body: OrbitingBody, base: Omit<BeltVisual, 'colors' | 'gapCount' | 'clumpiness' | 'inclination' | 'particleSizeScale'>): BeltVisual {
  const text = bodyVisualText(body)
  const colors = hasAny(text, ['ice', 'volatile', 'snow'])
    ? ['#dceaf0', '#9fb8c1', '#f3f8fa']
    : hasAny(text, ['metal', 'iron'])
      ? ['#b3aa9e', '#74716d', '#d2b68c']
      : hasAny(text, ['carbon', 'dark'])
        ? ['#686e70', '#3d4143', '#8a9599']
        : hasAny(text, ['gu', 'chiral', 'programm'])
          ? ['#a880ff', '#3e245f', '#67d4ff']
          : ['#9c9185', '#5f5850', '#c1ad93']
  return {
    ...base,
    colors,
    gapCount: Math.floor(hashToUnit(`belt-gaps#${body.id}`) * 4),
    clumpiness: 0.12 + hashToUnit(`belt-clumps#${body.id}`) * 0.55,
    inclination: (hashToUnit(`belt-inclination#${body.id}`) - 0.5) * 0.24,
    particleSizeScale: 0.75 + hashToUnit(`belt-size#${body.id}`) * 0.55,
  }
}

export function companionStarVisuals(companion: StellarCompanion): Pick<StarVisual, 'coreColor' | 'coronaColor' | 'coronaRadius' | 'rayCount' | 'bloomStrength' | 'flareStrength' | 'pulseSpeed' | 'rayColor'> {
  const text = [companion.companionType.value, companion.planetaryConsequence.value, companion.guConsequence.value].join(' ').toLowerCase()
  const spectral = hasAny(text, ['white dwarf']) ? 'DA'
    : hasAny(text, ['brown dwarf']) ? 'L2V'
      : hasAny(text, ['red dwarf', 'm dwarf']) ? 'M4V'
        : hasAny(text, ['blue', 'hot']) ? 'A2V'
          : 'K5V'
  const visuals = spectralVisuals(spectral, 45 + companion.rollMargin.value)
  return {
    ...visuals,
    coronaRadius: visuals.coronaRadius * 0.72,
    bloomStrength: visuals.bloomStrength * 0.72,
    flareStrength: 0.28 + hashToUnit(`companion-flare#${companion.id}`) * 0.35,
    pulseSpeed: 0.2 + hashToUnit(`companion-pulse#${companion.id}`) * 0.4,
    rayColor: visuals.coronaColor,
  }
}

export function primaryStarVisualExtras(system: GeneratedSystem): Pick<StarVisual, 'flareStrength' | 'pulseSpeed' | 'rayColor'> {
  const activity = clamp01(system.primary.activityRoll.value / 100)
  const visuals = spectralVisuals(system.primary.spectralType.value, system.primary.activityRoll.value)
  return {
    flareStrength: 0.35 + activity * 0.45,
    pulseSpeed: 0.12 + activity * 0.45,
    rayColor: visuals.coronaColor,
  }
}

export function hazardVolumeProfile(sourceText: string, id: string): { shape: VolumeShape; color: string; tilt: number; stretch: SceneVec3 } {
  const text = sourceText.toLowerCase()
  const shape: VolumeShape = hasAny(text, ['radiation belt', 'magnetosphere'])
    ? 'torus'
    : hasAny(text, ['debris', 'wreckage', 'swarm'])
      ? 'shell'
      : hasAny(text, ['route', 'corridor', 'baseline', 'shear'])
        ? 'ribbon'
        : hasAny(text, ['quarantine', 'cordon'])
          ? 'ellipsoid'
          : 'sphere'
  const color = hasAny(text, ['radiation', 'flare', 'cme']) ? '#ffb15c'
    : hasAny(text, ['debris', 'wreckage']) ? '#b8a58f'
      : hasAny(text, ['metric', 'shear', 'ai', 'sensor']) ? '#67d4ff'
        : '#ff5773'
  return {
    shape,
    color,
    tilt: (hashToUnit(`hazard-tilt#${id}`) - 0.5) * 1.1,
    stretch: shape === 'ribbon' ? [1.65, 0.16, 0.72] : shape === 'ellipsoid' ? [1.2, 0.55, 1.2] : [1, 1, 1],
  }
}

export function guVolumeProfile(system: GeneratedSystem, id: string): { shape: VolumeShape; color: string; distortion: number; tilt: number; stretch: SceneVec3 } {
  const text = [
    system.guOverlay.bleedLocation.value,
    system.guOverlay.bleedBehavior.value,
    system.guOverlay.resource.value,
    system.guOverlay.hazard.value,
  ].join(' ').toLowerCase()
  const shape: VolumeShape = hasAny(text, ['ring', 'arc', 'lagrange', 'trojan']) ? 'torus'
    : hasAny(text, ['route', 'corridor', 'stream', 'wake', 'moving']) ? 'ribbon'
      : hasAny(text, ['system-wide', 'storm']) ? 'shell'
        : hasAny(text, ['fracture', 'terminator', 'nightside']) ? 'ellipsoid'
          : 'sphere'
  return {
    shape,
    color: hasAny(text, ['dark', 'shadow']) ? '#6f5cff' : '#a880ff',
    distortion: 0.18 + hashToUnit(`gu-distortion#${id}`) * 0.48,
    tilt: (hashToUnit(`gu-tilt#${id}`) - 0.5) * 1.4,
    stretch: shape === 'ribbon' ? [1.9, 0.18, 0.62] : shape === 'ellipsoid' ? [1.25, 0.7, 1.05] : [1, 1, 1],
  }
}

export function phenomenonVisualProfile(kind: string, id: string): Pick<PhenomenonMarker, 'color' | 'glowColor' | 'scale'> {
  const text = kind.toLowerCase()
  const color = hasAny(text, ['fold', 'metric', 'static']) ? '#c18cff'
    : hasAny(text, ['signal', 'sensor', 'echo', 'beacon']) ? '#67d4ff'
      : hasAny(text, ['flare', 'radiation', 'storm']) ? '#ffb15c'
        : hasAny(text, ['chiral', 'bloom', 'fog']) ? '#9be7d8'
          : '#d7b8ff'
  return {
    color,
    glowColor: color,
    scale: 1.25 + hashToUnit(`phen-scale#${id}`) * 0.75,
  }
}

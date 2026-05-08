import type { GeneratedSystem, GuOverlay, OrbitingBody } from '../../types'
import type { GuBleedVisual, SceneVec3 } from '../types'
import { auToScene } from './scale'
import { hashToUnit } from './motion'

interface AnchorMatch {
  center: SceneVec3
  radius: number
}

const INTENSITY_LEVELS: Record<string, { intensity: number; radius: number }> = {
  low:       { intensity: 0.3,  radius: 36 },
  normal:    { intensity: 0.55, radius: 50 },
  moderate:  { intensity: 0.55, radius: 50 },
  high:      { intensity: 0.75, radius: 70 },
  severe:    { intensity: 0.85, radius: 84 },
  fracture:  { intensity: 1.0,  radius: 100 },
}

function intensityFromOverlay(overlay: GuOverlay): { intensity: number; radius: number } {
  const text = overlay.intensity.value.toLowerCase()
  for (const [keyword, value] of Object.entries(INTENSITY_LEVELS)) {
    if (text.includes(keyword)) return value
  }
  return INTENSITY_LEVELS.normal
}

function bodyAnchor(body: OrbitingBody): AnchorMatch {
  const r = auToScene(body.orbitAu.value)
  const angle = hashToUnit(`gu#${body.id}`) * Math.PI * 2
  return {
    center: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
    radius: 0,
  }
}

function resolveAnchor(overlay: GuOverlay, system: GeneratedSystem): AnchorMatch | null {
  const text = overlay.bleedLocation.value.toLowerCase()
  if (!text) return null

  if (text.includes('outer') || text.includes('kuiper') || text.includes('edge')) {
    const outermost = system.bodies.reduce<OrbitingBody | undefined>(
      (acc, b) => (acc && acc.orbitAu.value > b.orbitAu.value ? acc : b),
      undefined,
    )
    if (!outermost) return null
    return bodyAnchor(outermost)
  }

  if (text.includes('inner') || text.includes('close')) {
    const inner = system.bodies.reduce<OrbitingBody | undefined>(
      (acc, b) => (acc && acc.orbitAu.value < b.orbitAu.value ? acc : b),
      undefined,
    )
    if (!inner) return null
    return bodyAnchor(inner)
  }

  if (text.includes('habitable') || text.includes('temperate')) {
    const r = auToScene(system.zones.habitableCenterAu.value)
    return { center: [r, 0, 0], radius: 0 }
  }

  if (text.includes('belt') || text.includes('asteroid')) {
    const belt = system.bodies.find((b) => b.category.value === 'belt')
    return belt ? bodyAnchor(belt) : null
  }

  for (const body of system.bodies) {
    if (text.includes(body.name.value.toLowerCase())) return bodyAnchor(body)
  }

  return null
}

export function classifyGuBleed(overlay: GuOverlay, system: GeneratedSystem): GuBleedVisual {
  const id = `gu-${hashToUnit(`${system.id}#${overlay.bleedLocation.value}#${overlay.intensity.value}`).toString(36).slice(2, 10)}`
  const sized = intensityFromOverlay(overlay)
  const anchor = resolveAnchor(overlay, system)
  const pulsePeriodSec = sized.intensity >= 0.95 ? 4 : 6

  if (!anchor) {
    return {
      id,
      center: [0, 0, 0],
      radius: 0,
      pulsePhase: hashToUnit(`gu-phase#${id}`) * Math.PI * 2,
      pulsePeriodSec,
      intensity: sized.intensity,
      unclassified: true,
    }
  }

  return {
    id,
    center: anchor.center,
    radius: sized.radius,
    pulsePhase: hashToUnit(`gu-phase#${id}`) * Math.PI * 2,
    pulsePeriodSec,
    intensity: sized.intensity,
    unclassified: false,
  }
}

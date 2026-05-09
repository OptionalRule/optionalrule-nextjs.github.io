import type { GeneratedSystem, GuOverlay, OrbitingBody } from '../../types'
import type { GuBleedVisual, SceneVec3 } from '../types'
import { auToScene } from './scale'
import { hashToUnit } from './motion'

interface AnchorMatch {
  center: SceneVec3
  radius: number
}

interface LocationRule {
  keywords: string[]
  resolve: (system: GeneratedSystem, hzCenterAu: number) => AnchorMatch | null
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

function orbitPoint(radius: number, key: string): SceneVec3 {
  const angle = hashToUnit(key) * Math.PI * 2
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}

function bodyAnchor(body: OrbitingBody, hzCenterAu: number): AnchorMatch {
  const r = auToScene(body.orbitAu.value, hzCenterAu)
  return {
    center: orbitPoint(r, `gu#${body.id}`),
    radius: 0,
  }
}

function outermostBody(system: GeneratedSystem): OrbitingBody | undefined {
  return system.bodies.reduce<OrbitingBody | undefined>(
    (acc, b) => (acc && acc.orbitAu.value > b.orbitAu.value ? acc : b),
    undefined,
  )
}

function innermostBody(system: GeneratedSystem): OrbitingBody | undefined {
  return system.bodies.reduce<OrbitingBody | undefined>(
    (acc, b) => (acc && acc.orbitAu.value < b.orbitAu.value ? acc : b),
    undefined,
  )
}

function bodyClosestToAu(system: GeneratedSystem, au: number): OrbitingBody | undefined {
  return system.bodies.reduce<OrbitingBody | undefined>(
    (acc, b) => (!acc || Math.abs(b.orbitAu.value - au) < Math.abs(acc.orbitAu.value - au) ? b : acc),
    undefined,
  )
}

function firstGiant(system: GeneratedSystem): OrbitingBody | undefined {
  return system.bodies.find((b) => b.category.value === 'gas-giant' || b.category.value === 'ice-giant')
}

function firstMoonHost(system: GeneratedSystem): OrbitingBody | undefined {
  return system.bodies.find((b) => b.moons.length > 0)
}

function firstBelt(system: GeneratedSystem): OrbitingBody | undefined {
  return system.bodies.find((b) => b.category.value === 'belt')
}

function routeAnchor(system: GeneratedSystem, hzCenterAu: number, key: string): AnchorMatch | null {
  const outer = outermostBody(system)
  if (!outer) return null
  return { center: orbitPoint(auToScene(outer.orbitAu.value, hzCenterAu) * 1.15, key), radius: 0 }
}

function zoneAnchor(system: GeneratedSystem, hzCenterAu: number, au: number, key: string): AnchorMatch {
  return { center: orbitPoint(auToScene(au, hzCenterAu), key), radius: 0 }
}

function resonantOrbitAnchor(system: GeneratedSystem, hzCenterAu: number): AnchorMatch | null {
  const sorted = [...system.bodies].sort((a, b) => a.orbitAu.value - b.orbitAu.value)
  if (sorted.length < 2) return null
  let pair: [OrbitingBody, OrbitingBody] = [sorted[0], sorted[1]]
  let bestDistance = Number.POSITIVE_INFINITY
  for (let i = 1; i < sorted.length; i++) {
    const midpoint = (sorted[i - 1].orbitAu.value + sorted[i].orbitAu.value) / 2
    const distance = Math.abs(midpoint - system.zones.habitableCenterAu.value)
    if (distance < bestDistance) {
      pair = [sorted[i - 1], sorted[i]]
      bestDistance = distance
    }
  }
  const midpointAu = (pair[0].orbitAu.value + pair[1].orbitAu.value) / 2
  return zoneAnchor(system, hzCenterAu, midpointAu, `gu#resonant#${pair[0].id}#${pair[1].id}`)
}

const LOCATION_RULES: LocationRule[] = [
  {
    keywords: ['inner star-skimming', 'star-skimming', 'stellar vicinity', 'stellar'],
    resolve: (system, hz) => {
      const inner = innermostBody(system)
      const au = inner ? Math.max(inner.orbitAu.value * 0.65, system.zones.habitableCenterAu.value * 0.08) : system.zones.habitableCenterAu.value * 0.15
      return zoneAnchor(system, hz, au, 'gu#stellar-vicinity')
    },
  },
  {
    keywords: ['flare-coupled magnetosphere', 'magnetosphere'],
    resolve: (system, hz) => {
      const giant = firstGiant(system)
      return giant ? bodyAnchor(giant, hz) : zoneAnchor(system, hz, system.zones.habitableInnerAu.value, 'gu#magnetosphere')
    },
  },
  {
    keywords: ['tidally locked', 'terminator', 'planetary nightside', 'nightside cold trap', 'habitable zone', 'temperate'],
    resolve: (system, hz) => {
      const body = bodyClosestToAu(system, system.zones.habitableCenterAu.value)
      return body ? bodyAnchor(body, hz) : zoneAnchor(system, hz, system.zones.habitableCenterAu.value, 'gu#habitable')
    },
  },
  {
    keywords: ['resonant orbit between two planets', 'resonant orbit', 'between two planets'],
    resolve: resonantOrbitAnchor,
  },
  {
    keywords: ['lagrange point', 'lagrange'],
    resolve: (system, hz) => {
      const giant = firstGiant(system) ?? bodyClosestToAu(system, system.zones.habitableCenterAu.value)
      if (!giant) return null
      return zoneAnchor(system, hz, giant.orbitAu.value, `gu#lagrange#${giant.id}`)
    },
  },
  {
    keywords: ['trojan swarm', 'trojan'],
    resolve: (system, hz) => {
      const giant = firstGiant(system) ?? outermostBody(system)
      return giant ? bodyAnchor(giant, hz) : null
    },
  },
  {
    keywords: ['asteroid belt seam', 'snow-line volatile belt', 'belt seam', 'volatile belt', 'belt', 'asteroid'],
    resolve: (system, hz) => {
      const belt = firstBelt(system)
      return belt ? bodyAnchor(belt, hz) : zoneAnchor(system, hz, system.zones.snowLineAu.value, 'gu#belt')
    },
  },
  {
    keywords: ['ring arc', 'ring'],
    resolve: (system, hz) => {
      const ringed = system.bodies.find((b) => b.rings) ?? firstGiant(system)
      return ringed
        ? bodyAnchor(ringed, hz)
        : zoneAnchor(system, hz, system.zones.snowLineAu.value, 'gu#ring-arc-fallback')
    },
  },
  {
    keywords: ['gas giant radiation belt', 'gas giant'],
    resolve: (system, hz) => {
      const giant = firstGiant(system)
      return giant ? bodyAnchor(giant, hz) : null
    },
  },
  {
    keywords: ['major moon tidal corridor', 'ice-shell ocean vent field', 'major moon', 'moon', 'ocean vent'],
    resolve: (system, hz) => {
      const host = firstMoonHost(system) ?? firstGiant(system)
      return host ? bodyAnchor(host, hz) : null
    },
  },
  {
    keywords: ['circumbinary barycenter', 'barycenter'],
    resolve: (_system, _hz) => ({ center: [0, 0, 0], radius: 0 }),
  },
  {
    keywords: ['wide-binary transfer corridor', 'transfer corridor', 'comet stream', 'outer', 'kuiper', 'edge'],
    resolve: (system, hz) => routeAnchor(system, hz, 'gu#outer-route'),
  },
  {
    keywords: ['derelict iggygate wake', 'iggygate', 'pinchdrive calibration scar', 'pinchdrive', 'route', 'gate'],
    resolve: (system, hz) => routeAnchor(system, hz, 'gu#gate-route'),
  },
  {
    keywords: ['moving node', 'no fixed orbit'],
    resolve: (system, hz) => zoneAnchor(system, hz, (system.zones.habitableCenterAu.value + system.zones.snowLineAu.value) / 2, 'gu#moving-node'),
  },
  {
    keywords: ['system-wide metric storm cycle', 'system-wide', 'metric storm'],
    resolve: () => ({ center: [0, 0, 0], radius: 0 }),
  },
  {
    keywords: ['orbital station', 'station'],
    resolve: (system, hz) => {
      const station = system.settlements?.find((settlement) => /station|orbital/i.test(settlement.location.value) && settlement.bodyId)
      const body = station?.bodyId ? system.bodies.find((candidate) => candidate.id === station.bodyId) : undefined
      return body ? bodyAnchor(body, hz) : zoneAnchor(system, hz, system.zones.habitableCenterAu.value, 'gu#orbital-station')
    },
  },
]

function resolveAnchor(overlay: GuOverlay, system: GeneratedSystem, hzCenterAu: number): AnchorMatch | null {
  const text = overlay.bleedLocation.value.toLowerCase()
  if (!text) return null

  for (const body of system.bodies) {
    const bodyName = body.name.value.toLowerCase()
    if (text.includes(bodyName) || text.includes(body.id.toLowerCase())) return bodyAnchor(body, hzCenterAu)
  }

  for (const rule of LOCATION_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      const anchor = rule.resolve(system, hzCenterAu)
      if (anchor) return anchor
    }
  }

  return null
}

export function classifyGuBleed(overlay: GuOverlay, system: GeneratedSystem, hzCenterAu = 1): GuBleedVisual {
  const id = `gu-${hashToUnit(`${system.id}#${overlay.bleedLocation.value}#${overlay.intensity.value}`).toString(36).slice(2, 10)}`
  const sized = intensityFromOverlay(overlay)
  const anchor = resolveAnchor(overlay, system, hzCenterAu)
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

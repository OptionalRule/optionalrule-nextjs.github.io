import type { Fact, GeneratedSystem, OrbitingBody } from '../../types'
import type { HazardVisual, SceneVec3 } from '../types'
import { auToScene } from './scale'
import { hashToUnit } from './motion'

interface AnchorRule {
  keywords: string[]
  resolve: (system: GeneratedSystem, hzCenterAu: number) => { center: SceneVec3; radius: number; anchorDescription: string } | null
}

function findFirstBody(system: GeneratedSystem, predicate: (b: OrbitingBody) => boolean): OrbitingBody | undefined {
  return system.bodies.find(predicate)
}

function orbitPoint(radius: number, key: string): SceneVec3 {
  const angle = hashToUnit(key) * Math.PI * 2
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}

function bodyAnchor(body: OrbitingBody, radius: number, label: string, hzCenterAu: number): { center: SceneVec3; radius: number; anchorDescription: string } {
  const r = auToScene(body.orbitAu.value, hzCenterAu)
  return {
    center: orbitPoint(r, body.id),
    radius,
    anchorDescription: `${label}: ${body.name.value}`,
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

function outerRouteAnchor(system: GeneratedSystem, hzCenterAu: number, label = 'outer route'): { center: SceneVec3; radius: number; anchorDescription: string } | null {
  const outer = outermostBody(system)
  if (!outer) return null
  const r = auToScene(outer.orbitAu.value, hzCenterAu) * 1.15
  return {
    center: orbitPoint(r, `hazard-${label}`),
    radius: 22,
    anchorDescription: label,
  }
}

function habitableAnchor(system: GeneratedSystem, hzCenterAu: number, label = 'habitable traffic band'): { center: SceneVec3; radius: number; anchorDescription: string } {
  const r = auToScene(system.zones.habitableCenterAu.value, hzCenterAu)
  return {
    center: orbitPoint(r, `hazard-${label}`),
    radius: 18,
    anchorDescription: label,
  }
}

function systemWideAnchor(system: GeneratedSystem, hzCenterAu: number): { center: SceneVec3; radius: number; anchorDescription: string } {
  return {
    center: [0, 0, 0],
    radius: auToScene(system.zones.snowLineAu.value, hzCenterAu) * 1.2,
    anchorDescription: 'system-wide',
  }
}

const RULES: AnchorRule[] = [
  {
    keywords: ['radiation belt', 'magnetosphere', 'magnetospheric'],
    resolve: (system, hz) => {
      const giant = findFirstBody(system, (b) => b.category.value === 'gas-giant' || b.category.value === 'ice-giant')
      return giant ? bodyAnchor(giant, 18, 'near', hz) : null
    },
  },
  {
    keywords: ['pinch', 'route', 'choke', 'transit corridor', 'navigation baseline', 'navigation baselines', 'misjump', 'iggygate throat', 'throat instability', 'clocks desynchronize', 'clock desynchronize'],
    resolve: (system, hz) => outerRouteAnchor(system, hz),
  },
  {
    keywords: ['stellar flare', 'cme', 'coronal', 'flare', 'radiation/metric storm', 'radiation metric storm'],
    resolve: () => ({ center: [0, 0, 0], radius: 28, anchorDescription: 'stellar' }),
  },
  {
    keywords: ['debris', 'wreckage', 'asteroid swarm'],
    resolve: (system, hz) => {
      const inner = findFirstBody(system, (b) => b.category.value === 'belt')
      return inner ? bodyAnchor(inner, 20, 'within', hz) : null
    },
  },
  {
    keywords: ['chiral contamination', 'matter phase', 'programmed regolith', 'regolith growth'],
    resolve: (system, hz) => {
      const body = findFirstBody(system, (b) => b.category.value === 'rocky-planet' || b.category.value === 'super-earth')
        ?? bodyClosestToAu(system, system.zones.habitableCenterAu.value)
      return body ? bodyAnchor(body, 16, 'surface hazard', hz) : null
    },
  },
  {
    keywords: ['local gravity fluctuates', 'gravity fluctuates', 'metric shear damages hulls', 'metric shear', 'hull'],
    resolve: (system, hz) => habitableAnchor(system, hz, 'metric shear field'),
  },
  {
    keywords: ['ai perception', 'narrow-ai fragmentation', 'narrow ai fragmentation', 'false sensor'],
    resolve: (system, hz) => habitableAnchor(system, hz, 'sensor and AI disruption zone'),
  },
  {
    keywords: ['human vestibular', 'neurological', 'settlement madness'],
    resolve: (system, hz) => {
      const settledBodyId = system.settlements?.find((settlement) => settlement.bodyId)?.bodyId
      const settledBody = settledBodyId ? system.bodies.find((body) => body.id === settledBodyId) : undefined
      const body = settledBody ?? bodyClosestToAu(system, system.zones.habitableCenterAu.value)
      return body ? bodyAnchor(body, 14, 'inhabited hazard', hz) : null
    },
  },
  {
    keywords: ['legal quarantine', 'gardener attention'],
    resolve: (system, hz) => {
      const body = bodyClosestToAu(system, system.zones.habitableCenterAu.value) ?? innermostBody(system)
      return body ? bodyAnchor(body, 20, 'quarantine cordon', hz) : null
    },
  },
  {
    keywords: ['corporate claim war', 'claim war', 'pirate ambush'],
    resolve: (system, hz) => outerRouteAnchor(system, hz, 'contested route'),
  },
  {
    keywords: ['systemic cascade'],
    resolve: (system, hz) => systemWideAnchor(system, hz),
  },
]

function intensityFromText(text: string): number {
  const t = text.toLowerCase()
  if (t.includes('severe') || t.includes('lethal') || t.includes('extreme')) return 0.95
  if (t.includes('major') || t.includes('high')) return 0.75
  if (t.includes('moderate')) return 0.55
  if (t.includes('mild') || t.includes('low')) return 0.35
  return 0.6
}

export function classifyHazard(hazard: Fact<string>, system: GeneratedSystem, hzCenterAu = 1): HazardVisual {
  const text = hazard.value
  const lower = text.toLowerCase()
  const id = `hz-${hashToUnit(`${system.id}#${text}`).toString(36).slice(2, 10)}`

  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      const placement = rule.resolve(system, hzCenterAu)
      if (placement) {
        return {
          id,
          center: placement.center,
          radius: placement.radius,
          intensity: intensityFromText(text),
          sourceText: text,
          anchorDescription: placement.anchorDescription,
          unclassified: false,
        }
      }
    }
  }

  return {
    id,
    center: [0, 0, 0],
    radius: 0,
    intensity: intensityFromText(text),
    sourceText: text,
    anchorDescription: '',
    unclassified: true,
  }
}

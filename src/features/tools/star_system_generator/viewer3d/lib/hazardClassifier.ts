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

function bodyAnchor(body: OrbitingBody, radius: number, label: string, hzCenterAu: number): { center: SceneVec3; radius: number; anchorDescription: string } {
  const r = auToScene(body.orbitAu.value, hzCenterAu)
  const angle = hashToUnit(body.id) * Math.PI * 2
  return {
    center: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
    radius,
    anchorDescription: `${label}: ${body.name.value}`,
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
    keywords: ['pinch', 'route', 'choke', 'transit corridor'],
    resolve: (system, hz) => {
      const outermost = system.bodies.reduce<OrbitingBody | undefined>(
        (acc, b) => (acc && acc.orbitAu.value > b.orbitAu.value ? acc : b),
        undefined,
      )
      if (!outermost) return null
      const r = auToScene(outermost.orbitAu.value, hz) * 1.15
      return {
        center: [r, 0, 0],
        radius: 22,
        anchorDescription: 'outer route',
      }
    },
  },
  {
    keywords: ['stellar flare', 'cme', 'coronal'],
    resolve: () => ({ center: [0, 0, 0], radius: 28, anchorDescription: 'stellar' }),
  },
  {
    keywords: ['debris', 'wreckage', 'asteroid swarm'],
    resolve: (system, hz) => {
      const inner = findFirstBody(system, (b) => b.category.value === 'belt')
      return inner ? bodyAnchor(inner, 20, 'within', hz) : null
    },
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

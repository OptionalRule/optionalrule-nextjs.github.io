import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import { circumbinaryInnerAuLimit } from '../../../lib/generator/companionStability'
import { separationToBucketAu } from '../../../lib/generator/companionGeometry'
import { auToScene } from '../scale'

describe('circumbinary keep-out ring matches HW math', () => {
  it('matches circumbinaryInnerAuLimit on a circumbinary seed', () => {
    const seeds = ['probe-frontier-balanced-0', 'probe-frontier-balanced-22', 'probe-frontier-balanced-34', 'probe-frontier-balanced-35', 'probe-frontier-balanced-39']
    let exercised = false
    for (const seed of seeds) {
      const system = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      const cb = system.companions.find(c => c.mode === 'circumbinary')
      if (!cb) continue
      exercised = true
      const sepAu = separationToBucketAu(cb.separation.value)
      const expectedAu = circumbinaryInnerAuLimit(
        sepAu,
        system.primary.massSolar.value,
        cb.star.massSolar.value,
      )
      const graph = buildSceneGraph(system)
      const hzCenterAu = system.zones.habitableCenterAu.value > 0 ? system.zones.habitableCenterAu.value : 1
      const expectedScene = auToScene(expectedAu, hzCenterAu)
      expect(graph.circumbinaryKeepOut, `${seed}: expected a keepOut value`).toBeDefined()
      expect(graph.circumbinaryKeepOut, `${seed}: keepOut mismatch (got ${graph.circumbinaryKeepOut}, expected ~${expectedScene})`).toBeCloseTo(expectedScene, 1)
      break
    }
    expect(exercised, 'No circumbinary system available in probe seeds').toBe(true)
  })
})

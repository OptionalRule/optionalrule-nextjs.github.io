import { describe, expect, it } from 'vitest'
import { debrisChunkBudget } from '../chunkBudget'
import { defaultDebrisVisualProfile } from '../debrisVisualProfile'

describe('debrisChunkBudget', () => {
  it('allocates many more chunks for chaotic debris than settled rings', () => {
    const calm = defaultDebrisVisualProfile('polar-ring', 'asteroid-fleet')
    const chaos = defaultDebrisVisualProfile('common-envelope-shell', 'shell-dense')

    const calmCount = debrisChunkBudget({ kind: 'ring', profile: calm })
    const chaosCount = debrisChunkBudget({ kind: 'ring', profile: chaos })

    expect(chaosCount).toBeGreaterThan(calmCount * 3)
  })

  it('honors quality scaling and explicit zero-count overrides', () => {
    const profile = defaultDebrisVisualProfile('exocomet-swarm', 'asteroid-fleet')

    expect(debrisChunkBudget({ kind: 'ring', profile, explicitCount: 0 })).toBe(0)
    expect(debrisChunkBudget({ kind: 'ring', profile, explicitCount: 12, qualityScale: 0.5 })).toBe(6)
  })

  it('caps high quality chaotic shell budgets', () => {
    const profile = defaultDebrisVisualProfile('common-envelope-shell', 'shell-dense')

    expect(debrisChunkBudget({ kind: 'shell', profile, qualityScale: 5 })).toBe(190)
  })
})

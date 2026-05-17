import type { DebrisVisualProfile } from './debrisVisualProfile'

export type DebrisChunkFieldKind = 'ring' | 'halo' | 'shell' | 'stream'

interface ChunkBudgetArgs {
  kind: DebrisChunkFieldKind
  profile: DebrisVisualProfile
  qualityScale?: number
  explicitCount?: number
}

const BUDGET_BY_KIND: Record<DebrisChunkFieldKind, { base: number; chaos: number; min: number; max: number }> = {
  ring: { base: 16, chaos: 86, min: 6, max: 160 },
  halo: { base: 20, chaos: 92, min: 6, max: 176 },
  shell: { base: 18, chaos: 104, min: 6, max: 190 },
  stream: { base: 5, chaos: 16, min: 4, max: 42 },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function debrisChunkBudget({
  kind,
  profile,
  qualityScale = 1,
  explicitCount,
}: ChunkBudgetArgs): number {
  const quality = Math.max(0, qualityScale)
  if (quality === 0 || explicitCount === 0) return 0

  const config = BUDGET_BY_KIND[kind]
  const defaultCount = config.base
    + config.chaos
    * Math.pow(clamp(profile.chaos, 0, 1), 1.25)
    * (0.45 + profile.chunkScale * 0.45 + profile.clumpiness * 0.25)

  const requested = explicitCount ?? defaultCount
  if (requested <= 0) return 0

  return clamp(Math.round(requested * quality), config.min, config.max)
}

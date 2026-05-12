export const companionBucketKeys = ['close', 'tight', 'near', 'moderate', 'wide', 'distant', 'triple'] as const
export type CompanionBucketKey = typeof companionBucketKeys[number]

const COMPANION_AU: Record<CompanionBucketKey, number> = {
  close: 0.5,
  tight: 1.0,
  near: 2,
  moderate: 8,
  wide: 40,
  distant: 80,
  triple: 1.0,
}

export function separationToBucketAu(separation: string): number {
  const lower = separation.toLowerCase()
  for (const key of companionBucketKeys) {
    if (lower.includes(key)) return COMPANION_AU[key]
  }
  return COMPANION_AU.moderate
}

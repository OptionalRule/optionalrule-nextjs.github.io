export const companionBucketKeys = ['close', 'tight', 'near', 'moderate', 'wide', 'distant', 'triple'] as const
export type CompanionBucketKey = typeof companionBucketKeys[number]

const COMPANION_AU: Record<CompanionBucketKey, number> = {
  near: 0.05,
  close: 0.5,
  tight: 1.5,
  triple: 1.5,
  moderate: 20,
  wide: 150,
  distant: 1500,
}

export function separationToBucketAu(separation: string): number {
  const lower = separation.toLowerCase()
  for (const key of companionBucketKeys) {
    if (lower.includes(key)) return COMPANION_AU[key]
  }
  return COMPANION_AU.moderate
}

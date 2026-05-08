export const AMBIENT_YEAR_SECONDS = 30
const MAX_ANGULAR_SPEED = (2 * Math.PI) / (AMBIENT_YEAR_SECONDS * 0.25)

export function hashToUnit(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h >>> 0) / 0x100000000
}

export function phase0ForBody(bodyId: string, seed: string): number {
  return hashToUnit(`${seed}#${bodyId}`) * Math.PI * 2
}

export function angularSpeedFromAu(au: number): number {
  if (au <= 0) return MAX_ANGULAR_SPEED
  const speed = (2 * Math.PI) / (AMBIENT_YEAR_SECONDS * Math.pow(au, 1.5))
  return Math.min(speed, MAX_ANGULAR_SPEED)
}

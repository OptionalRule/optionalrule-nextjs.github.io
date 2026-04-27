export type ThermalZone = 'Furnace' | 'Inferno' | 'Hot' | 'Temperate band' | 'Cold' | 'Cryogenic' | 'Dark'

export function calculateInsolation(luminositySolar: number, orbitAu: number): number {
  if (orbitAu <= 0) return Number.POSITIVE_INFINITY
  return luminositySolar / orbitAu ** 2
}

export function calculateHabitableZone(luminositySolar: number) {
  const root = Math.sqrt(Math.max(luminositySolar, 0))
  return {
    inner: roundTo(0.75 * root, 3),
    center: roundTo(root, 3),
    outer: roundTo(1.77 * root, 3),
  }
}

export function calculateSnowLine(luminositySolar: number): number {
  return roundTo(2.7 * Math.sqrt(Math.max(luminositySolar, 0)), 3)
}

export function classifyThermalZone(insolation: number): ThermalZone {
  if (insolation >= 25) return 'Furnace'
  if (insolation >= 10) return 'Inferno'
  if (insolation >= 2) return 'Hot'
  if (insolation >= 0.35) return 'Temperate band'
  if (insolation >= 0.05) return 'Cold'
  if (insolation >= 0.005) return 'Cryogenic'
  return 'Dark'
}

export function roundTo(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

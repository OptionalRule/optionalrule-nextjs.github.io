import type { GeneratedSystem } from '../types'

export function formatOrbitContext(orbitAu: number, system: GeneratedSystem): string {
  const hzCenter = system.zones.habitableCenterAu.value
  const snowLine = system.zones.snowLineAu.value
  if (snowLine > 0 && orbitAu >= snowLine * 0.7) return `${formatRatio(orbitAu / snowLine)}x snow line`
  if (hzCenter > 0) return `${formatRatio(orbitAu / hzCenter)}x HZ center`
  return 'no stellar zone scale'
}

function formatRatio(value: number): string {
  if (value >= 10) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}

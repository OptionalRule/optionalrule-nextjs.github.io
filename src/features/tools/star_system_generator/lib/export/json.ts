import type { GeneratedSystem } from '../../types'

export function exportSystemJson(system: GeneratedSystem): string {
  return `${JSON.stringify(system, null, 2)}\n`
}

export type ErrorCodeCounts = Record<string, number>

export type AuditBaseline = Record<string, ErrorCodeCounts>

export interface BaselineFindingLike {
  severity: string
  path: string
  code?: string
  source?: string
}

export interface BaselineDelta {
  code: string
  baseline: number
  current: number
}

export interface BaselineComparison {
  regressions: BaselineDelta[]
  improvements: BaselineDelta[]
  passed: boolean
}

export function baselineKeyForFinding(finding: BaselineFindingLike): string {
  if (finding.code) return finding.code
  const source = finding.source ?? 'audit'
  return `${source}:${finding.path.replace(/\[\d+\]/g, '[]')}`
}

export function countErrorsByCode(findings: readonly BaselineFindingLike[]): ErrorCodeCounts {
  const counts: ErrorCodeCounts = {}
  for (const finding of findings) {
    if (finding.severity !== 'error') continue
    const key = baselineKeyForFinding(finding)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return sortCounts(counts)
}

export function compareToBaseline(baseline: ErrorCodeCounts, current: ErrorCodeCounts): BaselineComparison {
  const codes = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort()
  const regressions: BaselineDelta[] = []
  const improvements: BaselineDelta[] = []
  for (const code of codes) {
    const delta = { code, baseline: baseline[code] ?? 0, current: current[code] ?? 0 }
    if (delta.current > delta.baseline) regressions.push(delta)
    else if (delta.current < delta.baseline) improvements.push(delta)
  }
  return { regressions, improvements, passed: regressions.length === 0 }
}

export function sortCounts(counts: ErrorCodeCounts): ErrorCodeCounts {
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

export function withProfileBaseline(baseline: AuditBaseline, profile: string, counts: ErrorCodeCounts): AuditBaseline {
  const next: AuditBaseline = { ...baseline, [profile]: sortCounts(counts) }
  return Object.fromEntries(Object.entries(next).sort(([left], [right]) => left.localeCompare(right)))
}

export function parseAuditBaseline(raw: unknown): AuditBaseline {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Audit baseline must be an object keyed by profile.')
  }
  const baseline: AuditBaseline = {}
  for (const [profile, counts] of Object.entries(raw)) {
    if (typeof counts !== 'object' || counts === null || Array.isArray(counts)) {
      throw new Error(`Audit baseline profile "${profile}" must be an object of error-code counts.`)
    }
    const parsed: ErrorCodeCounts = {}
    for (const [code, count] of Object.entries(counts)) {
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
        throw new Error(`Audit baseline count for "${profile}.${code}" must be a non-negative integer.`)
      }
      parsed[code] = count
    }
    baseline[profile] = parsed
  }
  return baseline
}

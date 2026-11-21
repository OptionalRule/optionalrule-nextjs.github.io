import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type {
  GenerationOptions,
  GeneratorDistribution,
  GeneratorTone,
  GuPreference,
  SettlementDensity,
} from '../types'
import { generateSystem } from '../lib/generator'

const FIXTURE_PATH = path.resolve(__dirname, '__fixtures__/generator-golden-hashes.json')
const UPDATE = process.env.STAR_SYSTEM_GOLDEN_UPDATE === '1'

const DISTRIBUTIONS: readonly GeneratorDistribution[] = ['frontier', 'realistic']
const TONES: readonly GeneratorTone[] = ['balanced', 'astronomy', 'cinematic']
const GU_PREFERENCES: readonly GuPreference[] = ['normal', 'low', 'high', 'fracture']
const SETTLEMENT_DENSITIES: readonly SettlementDensity[] = ['normal', 'sparse', 'crowded', 'hub']
const SEEDS_PER_COMBINATION = 2

const EDGE_CASE_SEEDS: readonly string[] = [
  '0000000000000000',
  'ffffffffffffffff',
  '7f3a9c2e41b8d09a',
  '1',
  'a',
  '0123456789abcdef0123456789abcdef01234567',
  'deadbeef:cafe',
  '',
]

type GoldenCase = GenerationOptions & { id: string }

function derivedSeed(index: number): string {
  return createHash('sha256').update(`star-system-golden:${index}`).digest('hex').slice(0, 16)
}

function caseId(options: GenerationOptions): string {
  return [options.seed, options.distribution, options.tone, options.gu, options.settlements].join('|')
}

function buildCases(): GoldenCase[] {
  const cases: GoldenCase[] = []
  let index = 0
  for (const distribution of DISTRIBUTIONS) {
    for (const tone of TONES) {
      for (const gu of GU_PREFERENCES) {
        for (const settlements of SETTLEMENT_DENSITIES) {
          for (let n = 0; n < SEEDS_PER_COMBINATION; n++) {
            const options: GenerationOptions = { seed: derivedSeed(index++), distribution, tone, gu, settlements }
            cases.push({ id: caseId(options), ...options })
          }
        }
      }
    }
  }
  EDGE_CASE_SEEDS.forEach((seed, edgeIndex) => {
    const options: GenerationOptions = {
      seed,
      distribution: DISTRIBUTIONS[edgeIndex % DISTRIBUTIONS.length],
      tone: TONES[edgeIndex % TONES.length],
      gu: GU_PREFERENCES[edgeIndex % GU_PREFERENCES.length],
      settlements: SETTLEMENT_DENSITIES[(edgeIndex + 1) % SETTLEMENT_DENSITIES.length],
    }
    cases.push({ id: caseId(options), ...options })
  })
  return cases
}

function stableSerialize(value: unknown): string {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value)
    case 'boolean':
      return value ? 'true' : 'false'
    case 'number':
      if (Number.isNaN(value)) return '"#NaN"'
      if (value === Number.POSITIVE_INFINITY) return '"#Infinity"'
      if (value === Number.NEGATIVE_INFINITY) return '"#-Infinity"'
      if (Object.is(value, -0)) return '"#-0"'
      return JSON.stringify(value)
    case 'undefined':
      return '"#undefined"'
    case 'object': {
      if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
      const proto = Object.getPrototypeOf(value)
      if (proto !== Object.prototype && proto !== null) {
        throw new TypeError(`Unsupported value in generator output: ${Object.prototype.toString.call(value)}`)
      }
      const record = value as Record<string, unknown>
      const entries = Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      return `{${entries.join(',')}}`
    }
    default:
      throw new TypeError(`Unsupported value in generator output: ${typeof value}`)
  }
}

function hashSystem(options: GenerationOptions): string {
  return createHash('sha256').update(stableSerialize(generateSystem(options))).digest('hex')
}

function readFixture(): Record<string, string> {
  if (!existsSync(FIXTURE_PATH)) return {}
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as Record<string, string>
}

describe('generateSystem golden determinism guard', () => {
  const cases = buildCases()

  it('covers every option combination plus edge-case seeds with unique case ids', () => {
    expect(cases).toHaveLength(
      DISTRIBUTIONS.length * TONES.length * GU_PREFERENCES.length * SETTLEMENT_DENSITIES.length * SEEDS_PER_COMBINATION +
        EDGE_CASE_SEEDS.length,
    )
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
  })

  it('produces the committed output hash for every golden case', () => {
    const actual: Record<string, string> = {}
    for (const { id, ...options } of cases) actual[id] = hashSystem(options)

    if (UPDATE) {
      writeFileSync(FIXTURE_PATH, `${JSON.stringify(actual, null, 2)}\n`)
      return
    }

    const expected = readFixture()
    const mismatched = cases
      .map((c) => c.id)
      .filter((id) => expected[id] !== actual[id])
    expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort())
    expect(mismatched).toEqual([])
  }, 120_000)
})

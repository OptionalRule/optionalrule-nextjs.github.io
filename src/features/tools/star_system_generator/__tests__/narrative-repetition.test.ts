import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator/index'
import type { GenerationOptions } from '../types'

const base: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

const SEEDS = Array.from({ length: 40 }, (_, index) => `metric-${index}`)
const SYSTEMS = SEEDS.map((seed) => generateSystem({ ...base, seed }))

function distinctRatio(values: readonly string[]): number {
  const nonEmpty = values.filter((value) => value.length > 0)
  if (nonEmpty.length === 0) return 1
  return new Set(nonEmpty).size / nonEmpty.length
}

describe('narrative repetition metrics (40-seed corpus)', () => {
  it('spine summaries are at least 90% distinct among non-empty values', () => {
    const spineSummaries = SYSTEMS.map((system) => system.systemStory.spineSummary)
    const ratio = distinctRatio(spineSummaries)
    expect(ratio).toBeGreaterThanOrEqual(0.9)
  })

  it('conflict body paragraphs are at least 85% distinct', () => {
    const bodyParagraphs = SYSTEMS.flatMap((system) => system.systemStory.body)
    const ratio = distinctRatio(bodyParagraphs)
    expect(ratio).toBeGreaterThanOrEqual(0.85)
  })

  it('phenomenon conflict hooks are at least 60% distinct', () => {
    const conflictHooks = SYSTEMS.flatMap((system) => system.phenomena.map((phenomenon) => phenomenon.conflictHook.value))
    const ratio = distinctRatio(conflictHooks)
    expect(ratio).toBeGreaterThanOrEqual(0.6)
  })

  it('no single hook-pool entry text appears more than 4 times across the corpus', () => {
    const hookTexts = SYSTEMS.flatMap((system) => [
      ...system.hooks.rumors,
      ...system.hooks.contracts,
      ...system.hooks.encounters,
      ...system.hooks.npcs,
      ...system.hooks.twists,
    ].map((hook) => hook.text.value))

    const counts = new Map<string, number>()
    for (const text of hookTexts) counts.set(text, (counts.get(text) ?? 0) + 1)

    const maxCount = Math.max(...counts.values())
    const offenders = [...counts.entries()].filter(([, count]) => count > 4)
    expect(offenders, JSON.stringify(offenders)).toHaveLength(0)
    expect(maxCount).toBeLessThanOrEqual(4)
  })
})

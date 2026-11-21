import { describe, expect, it } from 'vitest'
import type { GenerationOptions } from '../../../../types'
import { generateSystem } from '../..'
import { createSeededRng, type SeededRng } from '../../rng'
import { runNarrativeStage, type NarrativeStageInput } from '..'

const options: GenerationOptions = {
  seed: '7f3a9c2e41b8d09a',
  distribution: 'frontier',
  tone: 'cinematic',
  gu: 'high',
  settlements: 'crowded',
}

function recordingRng(rng: SeededRng, forks: string[]): SeededRng {
  return {
    seed: rng.seed,
    next: () => rng.next(),
    int: (min, max) => rng.int(min, max),
    float: (min, max) => rng.float(min, max),
    chance: (probability) => rng.chance(probability),
    fork: (label) => {
      forks.push(label)
      return rng.fork(label)
    },
  }
}

function stageInput(): NarrativeStageInput {
  const system = generateSystem(options)
  return {
    options,
    systemName: system.name,
    primary: system.primary,
    companions: system.companions,
    reachability: system.reachability,
    architecture: system.architecture,
    bodies: system.bodies,
    guOverlay: system.guOverlay,
    settlements: system.settlements,
    ruins: system.ruins,
    phenomena: system.phenomena,
  }
}

describe('runNarrativeStage', () => {
  it('forks each narrative RNG label exactly once from the root stream', () => {
    const forks: string[] = []
    runNarrativeStage(stageInput(), recordingRng(createSeededRng(options.seed), forks))
    expect([...forks].sort()).toEqual(['conflicts', 'factions', 'graph', 'graph-prose', 'hooks', 'story'])
  })

  it('keeps settlement and phenomenon identity and order', () => {
    const input = stageInput()
    const output = runNarrativeStage(input, createSeededRng(options.seed))
    expect(output.settlements.map((s) => s.id)).toEqual(input.settlements.map((s) => s.id))
    expect(output.phenomena.map((p) => p.id)).toEqual(input.phenomena.map((p) => p.id))
  })

  it('is deterministic for the same input and seed', () => {
    const input = stageInput()
    expect(runNarrativeStage(input, createSeededRng(options.seed))).toEqual(
      runNarrativeStage(input, createSeededRng(options.seed)),
    )
  })
})

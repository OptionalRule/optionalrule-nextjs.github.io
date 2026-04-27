import type { SeededRng } from './rng'

export interface TableEntry<T> {
  min: number
  max: number
  value: T
}

export function rollDie(rng: SeededRng, sides: number): number {
  return rng.int(1, sides)
}

export function rollDice(rng: SeededRng, count: number, sides: number): number {
  let total = 0
  for (let i = 0; i < count; i++) {
    total += rollDie(rng, sides)
  }
  return total
}

export function d6(rng: SeededRng): number {
  return rollDie(rng, 6)
}

export function d8(rng: SeededRng): number {
  return rollDie(rng, 8)
}

export function d12(rng: SeededRng): number {
  return rollDie(rng, 12)
}

export function d20(rng: SeededRng): number {
  return rollDie(rng, 20)
}

export function d66(rng: SeededRng): number {
  return d6(rng) * 10 + d6(rng)
}

export function d100(rng: SeededRng): number {
  return rng.int(1, 100)
}

export function twoD6(rng: SeededRng): number {
  return rollDice(rng, 2, 6)
}

export function pickTable<T>(rng: SeededRng, dieValue: number, table: Array<TableEntry<T>>): T {
  const entry = table.find((candidate) => dieValue >= candidate.min && dieValue <= candidate.max)
  if (!entry) {
    throw new Error(`No table entry for roll ${dieValue}`)
  }
  return entry.value
}

export function pickOne<T>(rng: SeededRng, values: readonly T[]): T {
  if (!values.length) {
    throw new Error('Cannot pick from an empty list')
  }
  return values[rng.int(0, values.length - 1)]
}

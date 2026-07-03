import type { SeededRng } from '../../rng'

export class VariantDeck<T> {
  private order: number[] = []
  private pos = 0

  constructor(
    private readonly items: readonly T[],
    private readonly rng: SeededRng,
  ) {
    if (items.length === 0) throw new Error('VariantDeck: empty pool')
    this.reshuffle()
  }

  private reshuffle(): void {
    this.order = this.items.map((_, i) => i)
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i)
      const tmp = this.order[i]
      this.order[i] = this.order[j]
      this.order[j] = tmp
    }
    this.pos = 0
  }

  draw(): T {
    if (this.pos >= this.order.length) this.reshuffle()
    const item = this.items[this.order[this.pos]]
    this.pos += 1
    return item
  }
}

export function getOrCreateDeck<T>(
  pool: ReadonlyArray<T>,
  decks: Map<ReadonlyArray<T>, VariantDeck<T>>,
  rng: SeededRng,
): VariantDeck<T> {
  const existing = decks.get(pool)
  if (existing) return existing
  const deck = new VariantDeck(pool, rng)
  decks.set(pool, deck)
  return deck
}

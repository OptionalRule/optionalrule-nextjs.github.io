export interface SeededRng {
  readonly seed: string
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number): number
  chance(probability: number): boolean
  fork(label: string): SeededRng
}

function xmur3(input: string): () => number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    const t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    const result = (t + d) | 0
    c = (c + result) | 0
    return (result >>> 0) / 4294967296
  }
}

export function createSeededRng(seed: string): SeededRng {
  const normalizedSeed = seed.trim() || '0000000000000000'
  const seedFactory = xmur3(normalizedSeed)
  const nextValue = sfc32(seedFactory(), seedFactory(), seedFactory(), seedFactory())

  return {
    seed: normalizedSeed,
    next: nextValue,
    int(min: number, max: number): number {
      const low = Math.ceil(min)
      const high = Math.floor(max)
      return Math.floor(nextValue() * (high - low + 1)) + low
    },
    float(min: number, max: number): number {
      return nextValue() * (max - min) + min
    },
    chance(probability: number): boolean {
      return nextValue() < probability
    },
    fork(label: string): SeededRng {
      return createSeededRng(`${normalizedSeed}:${label}`)
    },
  }
}

export function createRandomSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = crypto.getRandomValues(new Uint32Array(2))
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('')
  }

  const high = Math.floor(Math.random() * 0xffffffff)
  const low = Math.floor(Math.random() * 0xffffffff)
  return `${high.toString(16).padStart(8, '0')}${low.toString(16).padStart(8, '0')}`
}

export function normalizeSeed(seed: string | null | undefined): string {
  const cleaned = (seed ?? '').trim().replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  if (!cleaned) return createRandomSeed()
  return cleaned.slice(0, 32)
}

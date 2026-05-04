import type { GeneratorTone } from '../../../types'
import type { SeededRng } from '../rng'
import type { FactionBank, GeneratedFaction } from './index'
import { astronomyBank } from './banks/astronomyBank'
import { balancedBank } from './banks/balancedBank'
import { cinematicBank } from './banks/cinematicBank'

const BANK_BY_TONE: Record<GeneratorTone, FactionBank> = {
  balanced: balancedBank,
  astronomy: astronomyBank,
  cinematic: cinematicBank,
}

export function generateFactions(
  rng: SeededRng,
  tone: GeneratorTone,
  count: number,
): GeneratedFaction[] {
  const bank = BANK_BY_TONE[tone]
  const out: GeneratedFaction[] = []
  const usedNames = new Set<string>()

  const seedDraws = Math.min(count, bank.seedFactions.length)
  const shuffledSeed = shuffleDeterministic([...bank.seedFactions], rng)
  for (let i = 0; i < seedDraws; i++) {
    const seed = shuffledSeed[i]
    out.push({
      id: nameToId(seed.name),
      name: seed.name,
      kind: seed.kind,
      domains: [...seed.domains],
      publicFace: seed.publicFace,
    })
    usedNames.add(seed.name)
  }

  let safetyBudget = count * 32
  while (out.length < count && safetyBudget > 0) {
    safetyBudget -= 1
    const stem = bank.stems[Math.floor(rng.next() * bank.stems.length)]
    const suffix = bank.suffixes[Math.floor(rng.next() * bank.suffixes.length)]
    const name = `${stem} ${suffix}`
    if (usedNames.has(name)) continue
    usedNames.add(name)
    const domains = pickDomainsForGenerated(bank, rng)
    out.push({
      id: nameToId(name),
      name,
      kind: pickKindForGenerated(bank, domains, rng),
      domains,
      publicFace: defaultPublicFace(name),
    })
  }

  return out
}

function shuffleDeterministic<T>(arr: T[], rng: SeededRng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function pickKindForGenerated(
  bank: FactionBank,
  domains: readonly string[],
  rng: SeededRng,
): string {
  const candidateKinds: string[] = []
  for (const domain of domains) {
    const kinds = bank.kindByDomain[domain]
    if (kinds) candidateKinds.push(...kinds)
  }
  if (candidateKinds.length === 0) {
    const allKinds: string[] = []
    for (const kinds of Object.values(bank.kindByDomain)) {
      allKinds.push(...kinds)
    }
    return allKinds[Math.floor(rng.next() * allKinds.length)]
  }
  return candidateKinds[Math.floor(rng.next() * candidateKinds.length)]
}

function pickDomainsForGenerated(
  bank: FactionBank,
  rng: SeededRng,
): readonly string[] {
  const allDomains = Object.keys(bank.kindByDomain)
  const count = 2 + Math.floor(rng.next() * 2)
  const shuffled = shuffleDeterministic([...allDomains], rng)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function defaultPublicFace(name: string): string {
  return `the public face of ${name} is reserved`
}

import type { GeneratedSystem, GenerationOptions, GeneratorVersion } from '../types'
import { GENERATOR_VERSION, SUPPORTED_GENERATOR_VERSIONS } from './generator'
import { normalizeSeed } from './generator/rng'

export interface SeedLink {
  options: GenerationOptions
  generatorVersion: GeneratorVersion
}

type OptionKey = Exclude<keyof GenerationOptions, 'seed'>

interface OptionSpec<T extends string> {
  defaultValue: T
  values: Record<T, true>
}

const OPTION_SCHEMA: { [K in OptionKey]: OptionSpec<GenerationOptions[K]> } = {
  distribution: { defaultValue: 'frontier', values: { frontier: true, realistic: true } },
  tone: { defaultValue: 'balanced', values: { balanced: true, astronomy: true, cinematic: true } },
  gu: { defaultValue: 'normal', values: { normal: true, low: true, high: true, fracture: true } },
  settlements: { defaultValue: 'normal', values: { normal: true, sparse: true, crowded: true, hub: true } },
}

const OPTION_KEYS = Object.keys(OPTION_SCHEMA) as OptionKey[]

const VERSION_PARAM = 'v'
const LEGACY_GENERATOR_VERSION: GeneratorVersion = 2

function mapOptions(pick: <K extends OptionKey>(key: K) => GenerationOptions[K]): Omit<GenerationOptions, 'seed'> {
  return {
    distribution: pick('distribution'),
    tone: pick('tone'),
    gu: pick('gu'),
    settlements: pick('settlements'),
  }
}

function isOptionValue<T extends string>(spec: OptionSpec<T>, raw: string): raw is T {
  return Object.hasOwn(spec.values, raw)
}

function parseOption<T extends string>(spec: OptionSpec<T>, raw: string | null): T {
  return raw !== null && isOptionValue(spec, raw) ? raw : spec.defaultValue
}

export const OPTION_DEFAULTS: Omit<GenerationOptions, 'seed'> = mapOptions((key) => OPTION_SCHEMA[key].defaultValue)

function parseGeneratorVersion(raw: string | null): GeneratorVersion {
  if (raw === null) return LEGACY_GENERATOR_VERSION
  if (!/^[1-9]\d*$/.test(raw)) return GENERATOR_VERSION
  const requested = Number(raw)
  return SUPPORTED_GENERATOR_VERSIONS.find((version) => version === requested) ?? GENERATOR_VERSION
}

export function decodeSeedLink(search: string | URLSearchParams): SeedLink {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  return {
    options: {
      seed: normalizeSeed(params.get('seed')),
      ...mapOptions((key) => parseOption(OPTION_SCHEMA[key], params.get(key))),
    },
    generatorVersion: parseGeneratorVersion(params.get(VERSION_PARAM)),
  }
}

export function buildSeedLink(link: SeedLink): string {
  const params = new URLSearchParams()
  params.set('seed', link.options.seed)
  for (const key of OPTION_KEYS) {
    if (link.options[key] !== OPTION_SCHEMA[key].defaultValue) params.set(key, link.options[key])
  }
  params.set(VERSION_PARAM, String(link.generatorVersion))
  return `?${params.toString()}`
}

export function seedLinkFrom(system: Pick<GeneratedSystem, 'options' | 'generatorVersion'>, seed: string): string {
  return buildSeedLink({ options: { ...system.options, seed }, generatorVersion: system.generatorVersion })
}

export function sameGenerationOptions(a: GenerationOptions, b: GenerationOptions): boolean {
  return a.seed === b.seed && OPTION_KEYS.every((key) => a[key] === b[key])
}

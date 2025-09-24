import { TorchCatalogEntry, TorchCatalogCategory, TorchSourceType, LightRadius } from '../types'

export const DEFAULT_TURN_MINUTES = 10

const DEFAULT_RADIUS_BY_SOURCE: Record<TorchSourceType, LightRadius> = {
  torch: { bright: 30, dim: 60 },
  lantern: { bright: 40, dim: 80 },
  spell: { bright: 20, dim: 40 },
  fire: { bright: 50, dim: 100 },
  custom: { bright: 20, dim: 40 },
}

const CATEGORY_BY_SOURCE: Record<TorchSourceType, TorchCatalogCategory> = {
  torch: 'mundane',
  lantern: 'mundane',
  spell: 'magical',
  fire: 'environmental',
  custom: 'custom',
}

export const baseLightSources: TorchCatalogEntry[] = [
  {
    id: 'torch-standard',
    name: 'Standard Torch',
    sourceType: 'torch',
    category: CATEGORY_BY_SOURCE.torch,
    baseDurationMinutes: 60,
    turnLengthMinutes: DEFAULT_TURN_MINUTES,
    radius: DEFAULT_RADIUS_BY_SOURCE.torch,
    icon: '🔥',
    color: '#FFA500',
    description: 'A reliable source of light that burns for about an hour.',
    brightness: 80,
    tags: ['core', 'carried'],
  },
  {
    id: 'lantern-oil',
    name: 'Oil Lantern',
    sourceType: 'lantern',
    category: CATEGORY_BY_SOURCE.lantern,
    baseDurationMinutes: 240,
    turnLengthMinutes: DEFAULT_TURN_MINUTES,
    radius: DEFAULT_RADIUS_BY_SOURCE.lantern,
    icon: '🏮',
    color: '#FFD700',
    description: 'A steady light source that lasts for several hours.',
    brightness: 70,
    tags: ['core', 'carried'],
    mishapNote: 'Consumes oil; spills can ignite flammable terrain.',
  },
  {
    id: 'spell-light',
    name: 'Light Spell',
    sourceType: 'spell',
    category: CATEGORY_BY_SOURCE.spell,
    baseDurationMinutes: 120,
    turnLengthMinutes: DEFAULT_TURN_MINUTES,
    radius: DEFAULT_RADIUS_BY_SOURCE.spell,
    icon: '🌟',
    color: '#FFFACD',
    description: 'A gentle light spell perfect for ambient lighting.',
    brightness: 40,
    tags: ['spellcasting'],
    mishapNote: 'Ends immediately if concentration is broken.',
  },
  {
    id: 'fire-campfire',
    name: 'Campfire',
    sourceType: 'fire',
    category: CATEGORY_BY_SOURCE.fire,
    baseDurationMinutes: 180,
    turnLengthMinutes: DEFAULT_TURN_MINUTES,
    radius: DEFAULT_RADIUS_BY_SOURCE.fire,
    icon: '🔥',
    color: '#FF4500',
    description: 'A powerful fire that provides warmth and bright light.',
    brightness: 90,
    tags: ['environmental', 'warmth'],
    mishapNote: 'Produces smoke; may consume oxygen in tight spaces.',
  },
]

export interface CustomLightSourceOptions {
  id?: string
  turnLengthMinutes?: number
  radius?: Partial<LightRadius>
  color?: string
  icon?: string
  description?: string
  brightness?: number
  mishapNote?: string
  tags?: string[]
}

const CUSTOM_DEFAULT_COLOR = '#FACC15'
const CUSTOM_DEFAULT_ICON = '✨'

const sanitizeId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function createCustomLightSource(
  name: string,
  baseDurationMinutes: number,
  options: CustomLightSourceOptions = {},
): TorchCatalogEntry {
  const idFromName = sanitizeId(name)
  const radiusBase = DEFAULT_RADIUS_BY_SOURCE.custom
  const requestedBright = options.radius?.bright ?? radiusBase.bright
  const bright = Math.max(0, requestedBright)
  const requestedDim = options.radius?.dim ?? radiusBase.dim
  const dim = Math.max(bright, requestedDim)
  const customRadius: LightRadius = { bright, dim }

  return {
    id: options.id ?? (idFromName ? `custom-${idFromName}` : `custom-${Date.now()}`),
    name,
    sourceType: 'custom',
    category: CATEGORY_BY_SOURCE.custom,
    baseDurationMinutes: baseDurationMinutes > 0 ? baseDurationMinutes : DEFAULT_TURN_MINUTES,
    turnLengthMinutes: options.turnLengthMinutes ?? DEFAULT_TURN_MINUTES,
    radius: customRadius,
    icon: options.icon ?? CUSTOM_DEFAULT_ICON,
    color: options.color ?? CUSTOM_DEFAULT_COLOR,
    description: options.description ?? 'User-defined light source.',
    brightness: options.brightness,
    mishapNote: options.mishapNote,
    tags: options.tags,
    isCustomArchetype: true,
  }
}

export const lightSourceCatalog: TorchCatalogEntry[] = [
  ...baseLightSources,
  createCustomLightSource('Custom Light Source', DEFAULT_TURN_MINUTES, {
    id: 'custom-template',
    description: 'Define your own duration, radius, and notes when adding to the tracker.',
    brightness: 50,
    tags: ['custom'],
  }),
]

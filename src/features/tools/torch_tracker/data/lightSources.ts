import { TorchCatalogEntry, TorchCatalogCategory, TorchSourceType, LightRadius } from '../types'

export const DEFAULT_TURN_MINUTES = 10

const DEFAULT_RADIUS_BY_SOURCE: Record<TorchSourceType, LightRadius> = {
  torch: { bright: 30, dim: 0 },
  lantern: { bright: 60, dim: 0 },
  spell: { bright: 30, dim: 0 },
  fire: { bright: 30, dim: 0 },
}

const CATEGORY_BY_SOURCE: Record<TorchSourceType, TorchCatalogCategory> = {
  torch: 'mundane',
  lantern: 'mundane',
  spell: 'magical',
  fire: 'environmental',
}

export const baseLightSources: TorchCatalogEntry[] = [
  {
    id: 'torch-standard',
    name: 'Torch',
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
    name: 'Lantern',
    sourceType: 'lantern',
    category: CATEGORY_BY_SOURCE.lantern,
    baseDurationMinutes: 60,
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
    baseDurationMinutes: 60,
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
    baseDurationMinutes: 60,
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

export const lightSourceCatalog: TorchCatalogEntry[] = [...baseLightSources]

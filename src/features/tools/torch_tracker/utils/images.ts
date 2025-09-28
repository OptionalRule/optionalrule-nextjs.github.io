import type { TorchSourceType } from '../types'

export type LightImageStatus = 'active' | 'inactive'

const imageTypeKey: Record<TorchSourceType, 'torch' | 'lantern' | 'spell' | 'campfire'> = {
  torch: 'torch',
  lantern: 'lantern',
  spell: 'spell',
  fire: 'campfire',
}

const statusLabel: Record<LightImageStatus, string> = {
  active: 'Lit',
  inactive: 'Extinguished',
}

export const getImagePath = (type: TorchSourceType, status: LightImageStatus) => {
  const key = imageTypeKey[type] ?? 'torch'
  return `/tools/torchtracker/${key}_${status}.webp`
}

export const getImageAlt = (label: string, status: LightImageStatus) => {
  const prefix = statusLabel[status] ?? 'Lit'
  return `${prefix} ${label}`.trim()
}

export const getAllImageVariants = (): string[] => {
  const statuses: LightImageStatus[] = ['active', 'inactive']
  const types = Object.values(imageTypeKey)
  const uniqueTypes = Array.from(new Set(types))

  return uniqueTypes.flatMap((type) => statuses.map((status) => `/tools/torchtracker/${type}_${status}.webp`))
}

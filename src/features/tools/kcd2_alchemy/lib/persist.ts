// Local persistence utilities for KCD2 Alchemy Scholar
// Stores user filter state in localStorage when enabled

import type { IngredientId } from '../types'

export interface PersistedFilters {
  q?: string
  ingredients?: IngredientId[]
  ingMode?: 'any' | 'only'
  alchemyLevel?: number
}

const SAVE_ENABLED_KEY = 'kcd2Alchemy:saveEnabled'
const FILTERS_KEY = 'kcd2Alchemy:filters'

export function getSaveEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SAVE_ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function setSaveEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (enabled) window.localStorage.setItem(SAVE_ENABLED_KEY, '1')
    else window.localStorage.removeItem(SAVE_ENABLED_KEY)
  } catch {
    // ignore
  }
}

export function readPersistedFilters(): PersistedFilters | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedFilters
    return parsed ?? null
  } catch {
    return null
  }
}

export function writePersistedFilters(data: PersistedFilters): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function clearPersistedFilters(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(FILTERS_KEY)
  } catch {
    // ignore
  }
}

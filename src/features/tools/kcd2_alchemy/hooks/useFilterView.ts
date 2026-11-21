'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { addLiquidsToLiquidlessOnlyFilter, type IngredientMatchMode } from '../lib/filter'

export interface FilterView {
  q: string
  ingredients: string[]
  matchMode: IngredientMatchMode
  alchemyLevel: number
}

export interface FilterViewControls {
  view: FilterView
  update: (patch: Partial<FilterView>) => void
  saveEnabled: boolean
  setSaveEnabled: (enabled: boolean) => void
  restoredFromSave: boolean
}

type Field = keyof FilterView

interface SavedFilters {
  version: number
  q?: string
  ingredients?: string[]
  matchMode?: IngredientMatchMode
  alchemyLevel?: number
}

interface Hydration {
  view: FilterView
  restoredFields: Field[]
  saveEnabled: boolean
  migrationPending: boolean
  recordVersion: number
}

const SAVE_ENABLED_KEY = 'kcd2Alchemy:saveEnabled'
const FILTERS_KEY = 'kcd2Alchemy:filters'
const LEGACY_VERSION = 1
const CURRENT_VERSION = 2
const FIELDS: readonly Field[] = ['q', 'ingredients', 'matchMode', 'alchemyLevel']
const DEFAULT_VIEW: FilterView = { q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 }

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function toMatchMode(value: string): IngredientMatchMode {
  return value === 'only' || value === 'all' ? 'only' : 'any'
}

function readUrl(search: string): Partial<FilterView> {
  const params = new URLSearchParams(search)
  const fromUrl: Partial<FilterView> = {}
  const q = params.get('q')
  if (q) fromUrl.q = q
  const ingredients = params.get('ingredients')
  if (ingredients) fromUrl.ingredients = ingredients.split(',').map((id) => id.trim()).filter(Boolean)
  const matchMode = params.get('ingMode')
  if (matchMode) fromUrl.matchMode = toMatchMode(matchMode)
  const alchemyLevel = params.get('alchLvl')
  if (alchemyLevel) {
    const level = Number(alchemyLevel)
    fromUrl.alchemyLevel = Number.isFinite(level) ? level : 0
  }
  return fromUrl
}

function writeUrl(search: string, view: FilterView, fields: readonly Field[]): string {
  const params = new URLSearchParams(search)
  const put = (key: string, value: string | null) => {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  for (const field of fields) {
    if (field === 'q') put('q', view.q.trim())
    if (field === 'ingredients') put('ingredients', view.ingredients.map(String).filter(Boolean).join(','))
    if (field === 'matchMode') put('ingMode', view.matchMode === 'any' ? null : view.matchMode)
    if (field === 'alchemyLevel') {
      const level = Number(view.alchemyLevel) || 0
      put('alchLvl', level > 0 ? String(level) : null)
    }
  }
  return params.toString()
}

function currentSearch(): string {
  return window.location.search.replace(/^\?/, '')
}

function replaceSearch(search: string): void {
  const path = window.location.pathname
  window.history.replaceState(null, '', search ? `${path}?${search}` : path)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readSaved(): SavedFilters | null {
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed)) return null
    const { version, q, ingredients, ingMode, alchemyLevel } = parsed
    return {
      version: typeof version === 'number' ? version : LEGACY_VERSION,
      q: typeof q === 'string' ? q : undefined,
      ingredients: Array.isArray(ingredients) ? ingredients.map(String) : undefined,
      matchMode: typeof ingMode === 'string' && ingMode ? toMatchMode(ingMode) : undefined,
      alchemyLevel: typeof alchemyLevel === 'number' && Number.isFinite(alchemyLevel) ? alchemyLevel : undefined,
    }
  } catch {
    return null
  }
}

function writeSaved(view: FilterView, version: number): void {
  try {
    window.localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        version,
        q: view.q,
        ingredients: view.ingredients,
        ingMode: view.matchMode,
        alchemyLevel: Number(view.alchemyLevel) || 0,
      }),
    )
  } catch {}
}

function clearSaved(): void {
  try {
    window.localStorage.removeItem(FILTERS_KEY)
  } catch {}
}

function readSaveFlag(): boolean {
  try {
    return window.localStorage.getItem(SAVE_ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

function writeSaveFlag(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(SAVE_ENABLED_KEY, '1')
    else window.localStorage.removeItem(SAVE_ENABLED_KEY)
  } catch {}
}

function hydrate(): Hydration {
  if (!hasWindow()) {
    return { view: DEFAULT_VIEW, restoredFields: [], saveEnabled: false, migrationPending: false, recordVersion: CURRENT_VERSION }
  }
  const fromUrl = readUrl(window.location.search)
  const saved = readSaved()
  const view: FilterView = { ...DEFAULT_VIEW, ...fromUrl }
  const restoredFields: Field[] = []
  if (saved) {
    if (fromUrl.q === undefined && saved.q !== undefined) {
      view.q = saved.q
      restoredFields.push('q')
    }
    if (fromUrl.ingredients === undefined && saved.ingredients !== undefined) {
      view.ingredients = saved.ingredients
      restoredFields.push('ingredients')
    }
    if (fromUrl.matchMode === undefined && saved.matchMode !== undefined) {
      view.matchMode = saved.matchMode
      restoredFields.push('matchMode')
    }
    if (fromUrl.alchemyLevel === undefined && saved.alchemyLevel !== undefined) {
      view.alchemyLevel = saved.alchemyLevel
      restoredFields.push('alchemyLevel')
    }
  }
  const currentRecord = saved !== null && saved.version >= CURRENT_VERSION
  const migrationPending = !(currentRecord && restoredFields.includes('ingredients'))
  return {
    view,
    restoredFields,
    saveEnabled: saved !== null || readSaveFlag(),
    migrationPending,
    recordVersion: migrationPending && !currentRecord ? LEGACY_VERSION : CURRENT_VERSION,
  }
}

function sameField(field: Field, a: FilterView, b: FilterView): boolean {
  if (field === 'ingredients') return a.ingredients.join(',') === b.ingredients.join(',')
  return a[field] === b[field]
}

export function useFilterView(liquidIds: readonly string[]): FilterViewControls {
  const [initial] = useState(hydrate)
  const [view, setView] = useState<FilterView>(initial.view)
  const [saveEnabled, setSaveEnabledState] = useState(initial.saveEnabled)
  const viewRef = useRef(initial.view)
  const saveRef = useRef(initial.saveEnabled)
  const versionRef = useRef(initial.recordVersion)
  const migrationPendingRef = useRef(initial.migrationPending)

  const commit = useCallback((next: FilterView) => {
    viewRef.current = next
    if (saveRef.current) writeSaved(next, versionRef.current)
  }, [])

  const update = useCallback(
    (patch: Partial<FilterView>) => {
      const current = viewRef.current
      const fields = FIELDS.filter((field) => patch[field] !== undefined)
      const next: FilterView = {
        q: patch.q ?? current.q,
        ingredients: patch.ingredients ?? current.ingredients,
        matchMode: patch.matchMode ?? current.matchMode,
        alchemyLevel: patch.alchemyLevel ?? current.alchemyLevel,
      }
      const search = currentSearch()
      const nextSearch = writeUrl(search, next, fields)
      const unchanged = fields.every((field) => sameField(field, current, next))
      if (unchanged && nextSearch === search) return
      commit(next)
      if (nextSearch !== search) replaceSearch(nextSearch)
      setView(next)
    },
    [commit],
  )

  const setSaveEnabled = useCallback((enabled: boolean) => {
    saveRef.current = enabled
    setSaveEnabledState(enabled)
    writeSaveFlag(enabled)
    if (enabled) writeSaved(viewRef.current, versionRef.current)
    else clearSaved()
  }, [])

  useEffect(() => {
    writeSaveFlag(initial.saveEnabled)
    if (initial.saveEnabled) writeSaved(viewRef.current, versionRef.current)
    else clearSaved()
    if (initial.restoredFields.length) {
      const search = currentSearch()
      const nextSearch = writeUrl(search, initial.view, initial.restoredFields)
      if (nextSearch !== search) replaceSearch(nextSearch)
    }
  }, [initial])

  useEffect(() => {
    const onPopState = () => {
      const next: FilterView = { ...DEFAULT_VIEW, ...readUrl(window.location.search) }
      commit(next)
      setView(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [commit])

  useEffect(() => {
    if (!migrationPendingRef.current || !liquidIds.length) return
    migrationPendingRef.current = false
    versionRef.current = CURRENT_VERSION
    const current = viewRef.current
    const migrated = addLiquidsToLiquidlessOnlyFilter(current.ingredients, current.matchMode, [...liquidIds])
    if (migrated) update({ ingredients: migrated.map(String) })
    else if (saveRef.current) writeSaved(current, CURRENT_VERSION)
  }, [liquidIds, update])

  return { view, update, saveEnabled, setSaveEnabled, restoredFromSave: initial.restoredFields.length > 0 }
}

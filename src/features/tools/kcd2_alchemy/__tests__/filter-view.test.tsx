import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFilterView } from '../hooks/useFilterView'

const PATH = '/tools/kcd2_alchemy/'
const FILTERS_KEY = 'kcd2Alchemy:filters'
const FLAG_KEY = 'kcd2Alchemy:saveEnabled'
const LIQUIDS = ['water', 'wine', 'spirits', 'oil']
const NO_LIQUIDS: string[] = []

function visit(search = '') {
  window.history.replaceState(null, '', `${PATH}${search}`)
}

function saveRecord(record: Record<string, unknown>) {
  window.localStorage.setItem(FILTERS_KEY, JSON.stringify(record))
}

function savedRecord(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(FILTERS_KEY)
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
}

function params(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

function mount(liquidIds: readonly string[] = NO_LIQUIDS) {
  return renderHook(({ ids }) => useFilterView(ids), { initialProps: { ids: liquidIds } })
}

describe('useFilterView', () => {
  beforeEach(() => {
    visit()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('URL codec', () => {
    it('reads every public param into the view', () => {
      visit('?q=mint&ingredients=sage,%20mint,,&ingMode=only&alchLvl=12')
      const { result } = mount()
      expect(result.current.view).toEqual({ q: 'mint', ingredients: ['sage', 'mint'], matchMode: 'only', alchemyLevel: 12 })
    })

    it('reads legacy ingMode=all as Only and junk values as defaults', () => {
      visit('?ingMode=all&alchLvl=abc')
      expect(mount().result.current.view).toMatchObject({ matchMode: 'only', alchemyLevel: 0 })
      visit('?ingMode=weird')
      expect(mount().result.current.view.matchMode).toBe('any')
    })

    it('starts from defaults on a bare URL', () => {
      expect(mount().result.current.view).toEqual({ q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 })
    })

    it('writes only the updated params and keeps unrelated ones', () => {
      visit('?ref=share&ingMode=all')
      const { result } = mount()
      act(() => result.current.update({ q: '  mint  ', ingredients: ['sage', 'mint'], alchemyLevel: 7 }))
      expect(window.location.pathname).toBe(PATH)
      expect(params().get('ref')).toBe('share')
      expect(params().get('ingMode')).toBe('all')
      expect(params().get('q')).toBe('mint')
      expect(params().get('ingredients')).toBe('sage,mint')
      expect(params().get('alchLvl')).toBe('7')
      expect(result.current.view.q).toBe('  mint  ')
    })

    it('removes params that return to their defaults', () => {
      visit('?q=mint&ingredients=sage&ingMode=only&alchLvl=3')
      const { result } = mount()
      act(() => result.current.update({ q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 }))
      expect(window.location.search).toBe('')
      expect(result.current.view).toEqual({ q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 })
    })

    it('skips the history write when nothing changes', () => {
      visit('?q=mint')
      const { result } = mount()
      const spy = vi.spyOn(window.history, 'replaceState')
      act(() => result.current.update({ q: 'mint' }))
      expect(spy).not.toHaveBeenCalled()
    })

    it('composes updates issued in the same tick', () => {
      const { result } = mount()
      act(() => {
        result.current.update({ q: 'mint' })
        result.current.update({ alchemyLevel: 4 })
      })
      expect(result.current.view).toMatchObject({ q: 'mint', alchemyLevel: 4 })
      expect(params().get('q')).toBe('mint')
      expect(params().get('alchLvl')).toBe('4')
    })

    it('re-reads the URL on back/forward navigation', () => {
      const { result } = mount()
      act(() => {
        visit('?q=wine&ingMode=only')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(result.current.view).toEqual({ q: 'wine', ingredients: [], matchMode: 'only', alchemyLevel: 0 })
    })
  })

  describe('hydration', () => {
    it('restores saved fields missing from the URL and writes them into the URL', () => {
      saveRecord({ version: 2, q: 'restored', ingredients: ['sage'], ingMode: 'only', alchemyLevel: 12 })
      const { result } = mount()
      expect(result.current.view).toEqual({ q: 'restored', ingredients: ['sage'], matchMode: 'only', alchemyLevel: 12 })
      expect(result.current.restoredFromSave).toBe(true)
      expect(result.current.saveEnabled).toBe(true)
      expect(window.localStorage.getItem(FLAG_KEY)).toBe('1')
      expect(params().get('q')).toBe('restored')
      expect(params().get('ingredients')).toBe('sage')
      expect(params().get('ingMode')).toBe('only')
      expect(params().get('alchLvl')).toBe('12')
    })

    it('prefers URL params over saved fields, treating empty params as missing', () => {
      saveRecord({ version: 2, q: 'saved', ingredients: ['sage'], ingMode: 'only', alchemyLevel: 12 })
      visit('?q=&ingredients=mint&alchLvl=0')
      const { result } = mount()
      expect(result.current.view).toEqual({ q: 'saved', ingredients: ['mint'], matchMode: 'only', alchemyLevel: 0 })
    })

    it('does not report a restore when every field came from the URL', () => {
      saveRecord({ version: 2, q: 'saved', ingredients: ['sage'], ingMode: 'only', alchemyLevel: 12 })
      visit('?q=a&ingredients=b&ingMode=any&alchLvl=2')
      const { result } = mount()
      expect(result.current.restoredFromSave).toBe(false)
      expect(result.current.saveEnabled).toBe(true)
    })

    it('loads a legacy unversioned record', () => {
      saveRecord({ q: 'old', ingredients: ['sage'], ingMode: 'any', alchemyLevel: 5 })
      const { result } = mount()
      expect(result.current.view).toEqual({ q: 'old', ingredients: ['sage'], matchMode: 'any', alchemyLevel: 5 })
    })

    it('reads numeric saved ingredient ids as strings', () => {
      saveRecord({ version: 2, ingredients: [1, 'sage'] })
      expect(mount().result.current.view.ingredients).toEqual(['1', 'sage'])
    })

    it('shows exactly the URL on back/forward without merging saved fields', () => {
      saveRecord({ version: 2, q: 'saved', ingredients: ['sage'], ingMode: 'any', alchemyLevel: 5 })
      const { result } = mount()
      act(() => {
        visit('?ingMode=only')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(result.current.view).toEqual({ q: '', ingredients: [], matchMode: 'only', alchemyLevel: 0 })
      expect(window.location.search).toBe('?ingMode=only')
    })

    it('ignores a corrupt record', () => {
      window.localStorage.setItem(FILTERS_KEY, '{not json')
      const { result } = mount()
      expect(result.current.view).toEqual({ q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 })
      expect(result.current.restoredFromSave).toBe(false)
    })

    it('enables saving from the flag alone and writes the current view', () => {
      window.localStorage.setItem(FLAG_KEY, '1')
      visit('?q=mint')
      const { result } = mount()
      expect(result.current.saveEnabled).toBe(true)
      expect(savedRecord()).toMatchObject({ q: 'mint', ingredients: [], ingMode: 'any', alchemyLevel: 0 })
    })

    it('starts with saving off and nothing stored when there is no flag or record', () => {
      visit('?q=mint')
      const { result } = mount()
      expect(result.current.saveEnabled).toBe(false)
      expect(savedRecord()).toBeNull()
      expect(window.localStorage.getItem(FLAG_KEY)).toBeNull()
    })
  })

  describe('persistence', () => {
    it('writes the saved record before the URL on each update', () => {
      window.localStorage.setItem(FLAG_KEY, '1')
      const { result } = mount()
      const storedAtUrlWrite: Array<Record<string, unknown> | null> = []
      const original = window.history.replaceState.bind(window.history)
      vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) => {
        storedAtUrlWrite.push(savedRecord())
        original(data, unused, url)
      })
      act(() => result.current.update({ q: 'mint' }))
      expect(storedAtUrlWrite[0]).toMatchObject({ q: 'mint' })
    })

    it('does not store anything while saving is off', () => {
      const { result } = mount()
      act(() => result.current.update({ q: 'mint' }))
      expect(savedRecord()).toBeNull()
    })

    it('persists the view read on back/forward navigation', () => {
      window.localStorage.setItem(FLAG_KEY, '1')
      mount()
      act(() => {
        visit('?ingredients=sage')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(savedRecord()).toMatchObject({ q: '', ingredients: ['sage'] })
    })

    it('writes on enable and clears on disable', () => {
      visit('?q=mint')
      const { result } = mount()
      act(() => result.current.setSaveEnabled(true))
      expect(result.current.saveEnabled).toBe(true)
      expect(window.localStorage.getItem(FLAG_KEY)).toBe('1')
      expect(savedRecord()).toMatchObject({ q: 'mint' })
      act(() => result.current.setSaveEnabled(false))
      expect(result.current.saveEnabled).toBe(false)
      expect(window.localStorage.getItem(FLAG_KEY)).toBeNull()
      expect(savedRecord()).toBeNull()
    })
  })

  describe('liquid migration', () => {
    it('adds every liquid to a legacy saved Only filter once, then marks the record current', () => {
      saveRecord({ q: '', ingredients: ['sage'], ingMode: 'only', alchemyLevel: 0 })
      const { result, rerender } = mount()
      expect(savedRecord()).toMatchObject({ version: 1 })
      rerender({ ids: LIQUIDS })
      expect(result.current.view.ingredients).toEqual(['sage', ...LIQUIDS])
      expect(params().get('ingredients')).toBe(['sage', ...LIQUIDS].join(','))
      expect(savedRecord()).toMatchObject({ version: 2, ingredients: ['sage', ...LIQUIDS] })
    })

    it('leaves a current saved Only filter without liquids alone', () => {
      saveRecord({ version: 2, q: '', ingredients: ['sage'], ingMode: 'only', alchemyLevel: 0 })
      const { result, rerender } = mount()
      rerender({ ids: LIQUIDS })
      expect(result.current.view.ingredients).toEqual(['sage'])
      expect(savedRecord()).toMatchObject({ version: 2, ingredients: ['sage'] })
    })

    it('still migrates an Only filter from a shared URL', () => {
      visit('?ingredients=sage&ingMode=only')
      const { result, rerender } = mount()
      rerender({ ids: LIQUIDS })
      expect(result.current.view.ingredients).toEqual(['sage', ...LIQUIDS])
    })

    it('marks a legacy record current even when no liquids are needed', () => {
      saveRecord({ q: 'x', ingredients: ['sage'], ingMode: 'any', alchemyLevel: 0 })
      const { rerender } = mount()
      rerender({ ids: LIQUIDS })
      expect(savedRecord()).toMatchObject({ version: 2, ingredients: ['sage'] })
    })

    it('runs only once per load', () => {
      visit('?ingredients=sage&ingMode=only')
      const { result, rerender } = mount(LIQUIDS)
      act(() => result.current.update({ ingredients: ['mint'] }))
      rerender({ ids: [...LIQUIDS] })
      expect(result.current.view.ingredients).toEqual(['mint'])
    })
  })
})

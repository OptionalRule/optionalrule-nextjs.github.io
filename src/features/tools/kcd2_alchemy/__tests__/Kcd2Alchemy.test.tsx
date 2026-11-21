import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AlchemyDataState } from '../hooks/useAlchemyData'
import type { NormalizedPotionRecipe } from '../types'

vi.mock('../hooks/useAlchemyData', () => ({
  useAlchemyData: vi.fn(),
}))

import { useAlchemyData } from '../hooks/useAlchemyData'
import Kcd2Alchemy from '..'

const mockUseAlchemyData = vi.mocked(useAlchemyData)

const PATH = '/tools/kcd2_alchemy/'
const FILTERS_KEY = 'kcd2Alchemy:filters'
const FLAG_KEY = 'kcd2Alchemy:saveEnabled'
const RESTORED = 'Restored your saved filters.'

function potion(id: string, name: string, liquidId: string, itemId: string): NormalizedPotionRecipe {
  return {
    id,
    name,
    ingredients: { liquid: liquidId, liquidId, items: [{ id: itemId, name: itemId, quantity: 1 }] },
    instructions: { default: [`Brew ${name}`] },
    quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
    effects: [{ quality: 'Standard', description: `${name} effect` }],
  }
}

const POTIONS = [potion('p1', 'Elixir', 'water', 'mint'), potion('p2', 'Tonic', 'wine', 'sage')]

function data(overrides: Partial<AlchemyDataState> = {}): AlchemyDataState {
  return {
    loading: false,
    error: null,
    potions: POTIONS,
    ingredients: [],
    ingredientOptions: [
      { id: 'mint', name: 'Mint' },
      { id: 'sage', name: 'Sage' },
      { id: 'water', name: 'Water' },
      { id: 'wine', name: 'Wine' },
    ],
    ...overrides,
  }
}

function params(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

function savedRecord(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(FILTERS_KEY)
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
}

async function typeSearch(text: string) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.type(screen.getByPlaceholderText('Search potions…'), text)
  await act(async () => {
    vi.advanceTimersByTime(400)
  })
}

describe('Kcd2Alchemy', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    window.history.replaceState(null, '', PATH)
    window.localStorage.clear()
    mockUseAlchemyData.mockReturnValue(data())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('filters by search and reflects it in the URL', async () => {
    render(<Kcd2Alchemy />)
    expect(screen.getByText('2 results')).toBeInTheDocument()
    await typeSearch('elix')
    expect(params().get('q')).toBe('elix')
    expect(screen.getByText('1 result')).toBeInTheDocument()
    expect(savedRecord()).toBeNull()
  })

  it('restores saved filters into the view and URL and announces it once', async () => {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ version: 2, q: 'tonic', ingredients: [], ingMode: 'any', alchemyLevel: 4 }))
    render(<Kcd2Alchemy />)
    expect(screen.getByText(RESTORED)).toBeInTheDocument()
    expect(screen.getByText('1 result')).toBeInTheDocument()
    expect(params().get('q')).toBe('tonic')
    expect(params().get('alchLvl')).toBe('4')
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.queryByText(RESTORED)).toBeNull()
    await typeSearch('x')
    expect(params().get('q')).toBe('tonicx')
    expect(savedRecord()).toMatchObject({ q: 'tonicx' })
    expect(screen.queryByText(RESTORED)).toBeNull()
  })

  it('adds every base liquid to a legacy saved Only filter once data has loaded', () => {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ q: '', ingredients: ['mint'], ingMode: 'only', alchemyLevel: 0 }))
    mockUseAlchemyData.mockReturnValue(data({ loading: true, potions: [] }))
    const { rerender } = render(<Kcd2Alchemy />)
    expect(savedRecord()).toMatchObject({ version: 1, ingredients: ['mint'] })
    mockUseAlchemyData.mockReturnValue(data())
    rerender(<Kcd2Alchemy />)
    expect(params().get('ingredients')).toBe('mint,water,wine')
    expect(savedRecord()).toMatchObject({ version: 2, ingredients: ['mint', 'water', 'wine'] })
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('saves the view when Save view is switched on and clears it when switched off', async () => {
    window.history.replaceState(null, '', `${PATH}?q=elix`)
    render(<Kcd2Alchemy />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const toggle = screen.getByRole('switch', { name: /Toggle saving current view/ })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(window.localStorage.getItem(FLAG_KEY)).toBe('1')
    expect(savedRecord()).toMatchObject({ q: 'elix' })
    expect(screen.getByText('Saving filters enabled.')).toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(window.localStorage.getItem(FLAG_KEY)).toBeNull()
    expect(savedRecord()).toBeNull()
  })

  it('gives a toast shown during the restore toast its full duration', async () => {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ version: 2, q: 'tonic', ingredients: [], ingMode: 'any', alchemyLevel: 4 }))
    render(<Kcd2Alchemy />)
    expect(screen.getByText(RESTORED)).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('switch', { name: /Toggle saving current view/ }))
    const toast = screen.getByText(/Saving filters enabled\.|Saved filters cleared and disabled\./)
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(toast).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.queryByText(/Saving filters enabled\.|Saved filters cleared and disabled\./)).toBeNull()
  })

  it('shows loading and error states', () => {
    mockUseAlchemyData.mockReturnValue(data({ loading: true, potions: [] }))
    const { rerender } = render(<Kcd2Alchemy />)
    expect(screen.getByText('Loading data.')).toBeInTheDocument()
    mockUseAlchemyData.mockReturnValue(data({ error: 'Something broke', potions: [] }))
    rerender(<Kcd2Alchemy />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
  })
})

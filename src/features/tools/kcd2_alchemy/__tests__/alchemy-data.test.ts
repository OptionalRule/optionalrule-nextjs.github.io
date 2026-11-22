import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useAlchemyData } from '../hooks/useAlchemyData'
import { parseIngredients, parsePotions, validateReferentialIntegrity } from '../lib/schema'
import { buildIngredientIndex, resolvePotions } from '../lib/normalize'

const DATA_DIR = path.resolve(process.cwd(), 'public/tools/kcd2_alchemy')
const INGREDIENTS_URL = '/tools/kcd2_alchemy/ingredients.json'
const POTIONS_URL = '/tools/kcd2_alchemy/potions.json'

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8'))
}

describe('shipped KCD2 alchemy data', () => {
  const ingredients = parseIngredients(readJson('ingredients.json'))
  const potions = parsePotions(readJson('potions.json'))

  it('parses against the schema', () => {
    expect(ingredients.length).toBeGreaterThan(0)
    expect(potions.length).toBeGreaterThan(0)
  })

  it('has unique ingredient and potion ids', () => {
    expect(new Set(ingredients.map((ingredient) => String(ingredient.id))).size).toBe(ingredients.length)
    expect(new Set(potions.map((potion) => potion.id)).size).toBe(potions.length)
  })

  it('references only known ingredients', () => {
    expect(validateReferentialIntegrity(potions, ingredients)).toEqual([])
  })

  it('resolves every item name and liquid to an ingredient', () => {
    const index = buildIngredientIndex(ingredients)
    const resolved = resolvePotions(potions, index)
    for (const potion of resolved) {
      expect(index.has(String(potion.ingredients.liquidId))).toBe(true)
      for (const item of potion.ingredients.items) {
        expect(item.name).toBe(index.get(String(item.id))?.name)
      }
    }
  })
})

type FetchResponse = { ok: boolean; json: () => Promise<unknown> }

function respond(body: unknown, ok = true): FetchResponse {
  return { ok, json: () => Promise.resolve(body) }
}

function stubFetch(handler: (url: string) => FetchResponse) {
  const fetchMock = vi.fn((url: string) => Promise.resolve(handler(url)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useAlchemyData', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads, validates and resolves the shipped data', async () => {
    const fetchMock = stubFetch((url) =>
      respond(readJson(url === INGREDIENTS_URL ? 'ingredients.json' : 'potions.json')),
    )

    const { result } = renderHook(() => useAlchemyData())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock).toHaveBeenCalledWith(INGREDIENTS_URL)
    expect(fetchMock).toHaveBeenCalledWith(POTIONS_URL)
    expect(result.current.error).toBeNull()
    expect(result.current.potions.length).toBeGreaterThan(0)
    expect(result.current.ingredientOptions).toHaveLength(result.current.ingredients.length)
    const names = result.current.ingredientOptions.map((option) => option.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })))
  })

  it('reports a failed request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stubFetch((url) => respond([], url !== POTIONS_URL))

    const { result } = renderHook(() => useAlchemyData())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to fetch data assets')
    expect(result.current.potions).toEqual([])
  })

  it('reports potions that reference unknown ingredients', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const potions = readJson('potions.json')
    stubFetch((url) => respond(url === INGREDIENTS_URL ? [{ id: 'mint', name: 'Mint' }] : potions))

    const { result } = renderHook(() => useAlchemyData())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/Data integrity error/)
  })

  it('reports malformed data', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stubFetch(() => respond({ not: 'an array' }))

    const { result } = renderHook(() => useAlchemyData())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})

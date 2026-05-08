import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  contractPool,
  encounterPool,
  npcPool,
  rumorPool,
  twistPool,
} from '../lib/generator/data/hooks'

const SECTION_MAP: Record<string, string> = {
  'Rumors at port': 'rumors',
  'Contracts on offer': 'contracts',
  'Encounters in transit': 'encounters',
  'People you meet': 'npcs',
  'Mid-session twists': 'twists',
}

interface ParsedEntry {
  tag: string
  text: string
}

function parseMarkdown(md: string): Record<string, ParsedEntry[]> {
  const result: Record<string, ParsedEntry[]> = {
    rumors: [],
    contracts: [],
    encounters: [],
    npcs: [],
    twists: [],
  }
  let currentCategory: string | null = null
  for (const rawLine of md.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    const headerMatch = line.match(/^##\s+(.+)$/)
    if (headerMatch) {
      currentCategory = SECTION_MAP[headerMatch[1].trim()] ?? null
      continue
    }
    if (!currentCategory) continue
    const bulletMatch = line.match(/^-\s+\[([^\]]+)\]\s+(.+)$/)
    if (!bulletMatch) continue
    result[currentCategory].push({ tag: bulletMatch[1].trim(), text: bulletMatch[2].trim() })
  }
  return result
}

const SOURCE_PATH = resolve(__dirname, '../docs/background/GU_HOOKS.md')

describe('GU_HOOKS.md and hooks.json parity', () => {
  const md = readFileSync(SOURCE_PATH, 'utf8')
  const parsed = parseMarkdown(md)

  const runtimePools = {
    rumors: rumorPool,
    contracts: contractPool,
    encounters: encounterPool,
    npcs: npcPool,
    twists: twistPool,
  } as const

  for (const category of Object.keys(parsed)) {
    it(`${category}: counts match`, () => {
      const mdCount = parsed[category].length
      const runtimeCount = runtimePools[category as keyof typeof runtimePools].length
      expect(runtimeCount, `${category} count`).toBe(mdCount)
    })

    it(`${category}: every markdown entry exists in runtime data`, () => {
      const runtimeTexts = new Set(runtimePools[category as keyof typeof runtimePools].map((e) => e.text))
      for (const entry of parsed[category]) {
        expect(runtimeTexts.has(entry.text), `markdown text missing from json: ${entry.text}`).toBe(true)
      }
    })

    it(`${category}: every runtime entry exists in markdown`, () => {
      const mdTexts = new Set(parsed[category].map((e) => e.text))
      for (const entry of runtimePools[category as keyof typeof runtimePools]) {
        expect(mdTexts.has(entry.text), `json text missing from markdown: ${entry.text}`).toBe(true)
      }
    })

    it(`${category}: tags match for each entry`, () => {
      const runtimeByText = new Map(
        runtimePools[category as keyof typeof runtimePools].map((e) => [e.text, e.tags] as const),
      )
      for (const entry of parsed[category]) {
        const runtimeTags = runtimeByText.get(entry.text)
        expect(runtimeTags, `runtime entry for "${entry.text}"`).toBeDefined()
        expect(runtimeTags).toEqual([entry.tag])
      }
    })
  }
})

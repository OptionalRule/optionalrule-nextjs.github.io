import * as fs from 'node:fs'
import * as path from 'node:path'

const ROOT = process.cwd()
const SOURCE = path.join(ROOT, 'src/features/tools/star_system_generator/docs/background/GU_HOOKS.md')
const TARGET = path.join(ROOT, 'src/features/tools/star_system_generator/data/hooks.json')

const SECTION_MAP: Record<string, string> = {
  'Rumors at port': 'rumors',
  'Contracts on offer': 'contracts',
  'Encounters in transit': 'encounters',
  'People you meet': 'npcs',
  'Mid-session twists': 'twists',
}

interface HookEntry {
  tags: string[]
  text: string
}

type HooksData = Record<string, HookEntry[]>

function parseHooks(md: string): HooksData {
  const result: HooksData = { rumors: [], contracts: [], encounters: [], npcs: [], twists: [] }
  let currentCategory: string | null = null

  for (const rawLine of md.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    const headerMatch = line.match(/^##\s+(.+)$/)
    if (headerMatch) {
      const heading = headerMatch[1].trim()
      currentCategory = SECTION_MAP[heading] ?? null
      continue
    }
    if (!currentCategory) continue

    const bulletMatch = line.match(/^-\s+\[([^\]]+)\]\s+(.+)$/)
    if (!bulletMatch) continue

    const tag = bulletMatch[1].trim()
    const text = bulletMatch[2].trim()
    result[currentCategory].push({ tags: [tag], text })
  }

  return result
}

function main(): void {
  const md = fs.readFileSync(SOURCE, 'utf8')
  const data = parseHooks(md)

  const totals = Object.entries(data).map(([k, v]) => `${k}: ${v.length}`).join(', ')
  console.log(`Parsed hooks → ${totals}`)

  for (const [category, entries] of Object.entries(data)) {
    if (entries.length === 0) {
      throw new Error(`Category "${category}" parsed 0 entries — check source markdown structure`)
    }
    for (const entry of entries) {
      if (!entry.text) throw new Error(`Empty text in ${category}`)
      if (!entry.tags.length) throw new Error(`Missing tag in ${category}: ${entry.text}`)
    }
  }

  const output = {
    _generated: 'Auto-generated from GU_HOOKS.md by scripts/generate-hooks-json.ts. Do not edit by hand — edit the markdown source and re-run.',
    _source: 'src/features/tools/star_system_generator/docs/background/GU_HOOKS.md',
    rumors: data.rumors,
    contracts: data.contracts,
    encounters: data.encounters,
    npcs: data.npcs,
    twists: data.twists,
  }

  fs.writeFileSync(TARGET, JSON.stringify(output, null, 2) + '\n')
  console.log(`Wrote ${path.relative(ROOT, TARGET)}`)
}

main()

#!/usr/bin/env node
// ESM TypeScript script to enrich potions.json with baseValue from CSV

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type Potion = Record<string, unknown> & {
  id?: string
  name?: string
}

const JSON_PATH = path.resolve('public/tools/kcd2_alchemy/potions.json')
const CSV_PATH = path.resolve('tmp_local/kcd2-potion-value.csv')

function detectNewline(text: string): '\n' | '\r\n' {
  return text.includes('\r\n') ? '\r\n' : '\n'
}

// Minimal CSV parser supporting quoted fields and comma separation.
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"' // Escaped quote
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field)
        field = ''
      } else if (ch === '\n') {
        // End of record (support CRLF and LF)
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else if (ch === '\r') {
        // ignore; will be handled by \n
      } else {
        field += ch
      }
    }
  }
  // flush last field/row if any
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // Trim whitespace around fields
  return rows.map(r => r.map(v => v.trim()))
}

async function main() {
  const [jsonRaw, csvRaw] = await Promise.all([
    readFile(JSON_PATH, 'utf8'),
    readFile(CSV_PATH, 'utf8'),
  ])

  const newline = detectNewline(jsonRaw)
  const potions: Potion[] = JSON.parse(jsonRaw)

  const rows = parseCSV(csvRaw)
  if (rows.length === 0) {
    throw new Error('CSV appears empty')
  }

  const header = rows[0].map(h => h.toLowerCase())
  const nameIdx = header.findIndex(h => h === 'potion name' || h === 'name' || h === 'potion')
  const valueIdx = header.findIndex(h => h === 'base value' || h === 'base price' || h === 'value' || h === 'price')
  if (nameIdx === -1 || valueIdx === -1) {
    throw new Error('CSV missing required columns: "Potion Name" and "Base Value"')
  }

  const valueMap = new Map<string, number>()
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue
    const name = (r[nameIdx] ?? '').trim()
    if (!name) continue
    const rawVal = (r[valueIdx] ?? '').replace(/[^0-9.\-]/g, '')
    const num = Number.parseFloat(rawVal)
    if (!Number.isNaN(num)) {
      valueMap.set(name, num)
    }
  }

  let matched = 0
  let defaulted = 0

  const enriched = potions.map(p => {
    const name = (p.name ?? '').trim()
    const val = valueMap.get(name)
    const baseValue = typeof val === 'number' && Number.isFinite(val) ? val : 0
    if (val !== undefined) matched++
    else defaulted++

    const { id, ingredients, instructions, quantity, effects, notes, ...rest } = p
    const out = {
      id,
      name,
      baseValue,
      ingredients,
      instructions,
      quantity,
      effects,
      notes,
      ...rest,
    }
    return out
  })

  const json = JSON.stringify(enriched, null, 2)
  const normalized = newline === '\r\n' ? json.replace(/\n/g, '\r\n') : json
  await writeFile(JSON_PATH, normalized, 'utf8')

  console.log(`Updated ${enriched.length} potions. Matched: ${matched}, Defaulted: ${defaulted}`)
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

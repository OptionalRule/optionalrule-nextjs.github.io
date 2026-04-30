#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const namesPath = path.join(process.cwd(), 'src/features/tools/star_system_generator/data/names.json')
const namesData = JSON.parse(fs.readFileSync(namesPath, 'utf8')) as {
  systemNameCores?: unknown
  systemNameForms?: unknown
}

function sortedStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected names.json ${key} to be an array.`)
  }

  return [...value]
    .map((entry) => {
      if (typeof entry !== 'string') throw new Error(`Expected every ${key} entry to be a string.`)
      return entry
    })
    .sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }))
}

const sortedSystemNameCores = sortedStringArray(namesData.systemNameCores, 'systemNameCores')
const sortedSystemNameForms = sortedStringArray(namesData.systemNameForms, 'systemNameForms')

namesData.systemNameCores = sortedSystemNameCores
namesData.systemNameForms = sortedSystemNameForms

fs.writeFileSync(namesPath, `${JSON.stringify(namesData, null, 2)}\n`)

console.log(
  `Sorted ${sortedSystemNameCores.length} system name cores and ${sortedSystemNameForms.length} system name forms in ${namesPath}.`
)

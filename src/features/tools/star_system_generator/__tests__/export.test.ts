import { describe, expect, it } from 'vitest'
import { exportSystemJson, exportSystemMarkdown } from '../lib/export'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'export-test-seed',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('star system exports', () => {
  it('exports a compact Markdown system profile', () => {
    const system = generateSystem(options)
    const markdown = exportSystemMarkdown(system)

    expect(markdown).toContain(`# ${system.name.value}`)
    expect(markdown).toContain('**System Name:**')
    expect(markdown).toContain('**Primary:**')
    expect(markdown).toContain('**Reachability:**')
    expect(markdown).toContain('**GU Intensity:**')
    expect(markdown).toContain('## Orbital Bodies')
    expect(markdown).toContain('| Orbit | Body | Class | Key traits | Sites |')
    expect(markdown).toContain(system.bodies[0].name.value)
    expect(markdown).toContain('## Settlement Profiles')
    expect(markdown).toContain('## Human Remnants')
    expect(markdown).toContain('## System Phenomena')
    expect(markdown).toContain('  - Transit:')
    expect(markdown).toContain('  - Question:')
    expect(markdown).toContain('  - Hook:')
    expect(markdown).toContain('  - Image:')
    expect(markdown).toContain('## System Story')
    expect(markdown).toContain(`**Spine:** ${system.systemStory.spineSummary}`)
    expect(markdown).toContain(system.systemStory.body[0])
    expect(markdown).toContain(`- ${system.systemStory.hooks[0]}`)
    expect(markdown.indexOf('## System Story')).toBeLessThan(markdown.indexOf('## Stories at Port'))
    expect(markdown.endsWith('\n')).toBe(true)
  })

  it('includes a system Population line and per-body population in markdown export', () => {
    const system = generateSystem({ ...options, seed: 'export-pop-header', settlements: 'hub' })
    const markdown = exportSystemMarkdown(system)

    expect(markdown).toContain('**Population:**')

    const populatedBody = system.bodies.find((b) => {
      const band = b.population?.value.band
      return band && !['empty', 'automated', 'transient'].includes(band)
    })
    if (populatedBody) {
      expect(markdown).toContain(populatedBody.name.value)
      const band = populatedBody.population!.value.band
      const friendlyBand = band.replace('-', ' ')
      expect(markdown.toLowerCase()).toContain(friendlyBand.toLowerCase())
    }
  })

  it('exports population structures in JSON', () => {
    const system = generateSystem(options)
    const json = exportSystemJson(system)
    const parsed = JSON.parse(json)
    expect(parsed.bodies[0].population).toBeDefined()
    expect(parsed.bodies[0].population.value.band).toBeDefined()
  })

  it('exports parseable JSON using the generated system schema', () => {
    const system = generateSystem(options)
    const json = exportSystemJson(system)
    const parsed = JSON.parse(json)

    expect(parsed.id).toBe(system.id)
    expect(parsed.seed).toBe(options.seed)
    expect(parsed.name.value).toBe(system.name.value)
    expect(parsed.bodies).toHaveLength(system.bodies.length)
    expect(parsed.phenomena[0].travelEffect.value).toBe(system.phenomena[0].travelEffect.value)
    expect(parsed.phenomena[0].surveyQuestion.value).toBe(system.phenomena[0].surveyQuestion.value)
    expect(parsed.phenomena[0].conflictHook.value).toBe(system.phenomena[0].conflictHook.value)
    expect(parsed.phenomena[0].sceneAnchor.value).toBe(system.phenomena[0].sceneAnchor.value)
    expect(parsed.guOverlay.intensity.value).toBe(system.guOverlay.intensity.value)
    expect(json.endsWith('\n')).toBe(true)
  })
})

describe('Markdown export with debris fields', () => {
  it('includes ## Debris Fields section when system has debris fields', () => {
    for (let i = 0; i < 30; i++) {
      const system = generateSystem({
        seed: `export-debris-md-${i}`,
        distribution: 'frontier',
        tone: 'cinematic',
        gu: 'normal',
        settlements: 'normal',
      })
      if (system.debrisFields.length === 0) continue
      const md = exportSystemMarkdown(system)
      expect(md).toMatch(/## Debris Fields/)
      const first = system.debrisFields[0]
      expect(md).toContain(first.archetypeName.value)
      return
    }
    throw new Error('no debris-field system found in 30 seeds')
  })

  it('settlements anchored to a debris field include a Region: line in Markdown', () => {
    for (let i = 0; i < 80; i++) {
      const system = generateSystem({
        seed: `export-debris-md-anchor-${i}`,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'crowded',
      })
      const anchored = system.settlements.find(s => s.debrisFieldId)
      if (!anchored) continue
      const field = system.debrisFields.find(d => d.id === anchored.debrisFieldId)!
      const md = exportSystemMarkdown(system)
      expect(md).toMatch(new RegExp(`\\*\\*Region:\\*\\*.*${field.archetypeName.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
      return
    }
  })

  it('omits ## Debris Fields section when system has no debris fields', () => {
    for (let i = 0; i < 30; i++) {
      const system = generateSystem({
        seed: `export-no-debris-md-${i}`,
        distribution: 'realistic',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })
      if (system.debrisFields.length > 0) continue
      const md = exportSystemMarkdown(system)
      expect(md).not.toMatch(/## Debris Fields/)
      return
    }
  })
})

describe('JSON export with debris fields', () => {
  it('debrisFields[] appears in output', () => {
    for (let i = 0; i < 30; i++) {
      const system = generateSystem({
        seed: `export-debris-json-${i}`,
        distribution: 'frontier',
        tone: 'cinematic',
        gu: 'normal',
        settlements: 'normal',
      })
      if (system.debrisFields.length === 0) continue
      const json = JSON.parse(exportSystemJson(system))
      expect(Array.isArray(json.debrisFields)).toBe(true)
      expect(json.debrisFields.length).toBeGreaterThan(0)
      return
    }
    throw new Error('no debris-field system found in JSON export sweep')
  })

  it('settlement.debrisFieldId passes through to JSON', () => {
    for (let i = 0; i < 80; i++) {
      const system = generateSystem({
        seed: `export-debris-json-anchor-${i}`,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'crowded',
      })
      const anchored = system.settlements.find(s => s.debrisFieldId)
      if (!anchored) continue
      const json = JSON.parse(exportSystemJson(system))
      const exported = json.settlements.find((s: { id: string }) => s.id === anchored.id)
      expect(exported.debrisFieldId).toBe(anchored.debrisFieldId)
      return
    }
  })

  it('debrisFields array is present even when empty', () => {
    const system = generateSystem(options)
    const json = JSON.parse(exportSystemJson(system))
    expect(Array.isArray(json.debrisFields)).toBe(true)
  })
})

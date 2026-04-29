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
    expect(markdown.endsWith('\n')).toBe(true)
  })

  it('exports parseable JSON using the generated system schema', () => {
    const system = generateSystem(options)
    const json = exportSystemJson(system)
    const parsed = JSON.parse(json)

    expect(parsed.id).toBe(system.id)
    expect(parsed.seed).toBe(options.seed)
    expect(parsed.name.value).toBe(system.name.value)
    expect(parsed.bodies).toHaveLength(system.bodies.length)
    expect(parsed.guOverlay.intensity.value).toBe(system.guOverlay.intensity.value)
    expect(json.endsWith('\n')).toBe(true)
  })
})

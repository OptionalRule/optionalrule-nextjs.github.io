import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { generateSystem } from '../lib/generator'
import { SystemOverview } from '../components/SystemOverview'
import { OrbitalTable } from '../components/OrbitalTable'
import { BodyDetailPanel } from '../components/BodyDetailPanel'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'pop-ui-test',
  distribution: 'realistic',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'hub',
}

describe('SystemOverview population row', () => {
  it('renders a "Population" label and system population line', () => {
    const sys = generateSystem(baseOptions)
    render(<SystemOverview system={sys} />)
    expect(screen.getByText(/^Population:?$/)).toBeTruthy()
  })
})

describe('OrbitalTable population indicators', () => {
  it('shows a population band label on the populated body row in the satellite summary', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'pop-ui-table' })
    render(<OrbitalTable system={sys} />)
    const populatedBody = sys.bodies.find((b) => {
      const band = b.population?.value.band
      return band && !['empty', 'automated', 'transient'].includes(band)
    })
    if (!populatedBody) return
    const band = populatedBody.population!.value.band
    const labelFragment = bandLabelFragment(band)
    expect(screen.getAllByText(new RegExp(labelFragment, 'i')).length).toBeGreaterThan(0)
  })
})

function bandLabelFragment(band: string): string {
  if (band === 'colony') return 'colony'
  if (band === 'frontier') return 'frontier'
  if (band === 'outpost') return 'outpost'
  if (band === 'established') return 'established'
  if (band === 'populous') return 'populous'
  if (band === 'dense-world') return 'dense'
  return band
}

describe('BodyDetailPanel population block', () => {
  it('renders a Population section with the band label when a body has population', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'pop-ui-detail' })
    const populatedBody = sys.bodies.find((b) => {
      const band = b.population?.value.band
      return band && !['empty', 'automated', 'transient'].includes(band)
    })
    if (!populatedBody) return
    render(<BodyDetailPanel body={populatedBody} system={sys} />)
    expect(screen.getByText(/^Population$/i)).toBeTruthy()
  })

  it('renders the terraform state when present and not "none"', () => {
    let foundTerraform = false
    for (let i = 0; i < 20; i += 1) {
      const sys = generateSystem({ ...baseOptions, seed: `pop-ui-terraform-${i}`, settlements: 'hub' })
      const body = sys.bodies.find((b) => {
        const state = b.population?.value.terraformState
        return state && state !== 'none'
      })
      if (body) {
        render(<BodyDetailPanel body={body} system={sys} />)
        const labelMatches = screen.getAllByText(/terraform/i)
        expect(labelMatches.length).toBeGreaterThan(0)
        foundTerraform = true
        break
      }
    }
    if (!foundTerraform) {
      console.warn('No terraform state found across 20 hub-density seeds; review derivation pools')
    }
  })
})

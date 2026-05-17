import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { generateSystem } from '../lib/generator'
import { BodyDetailPanel } from '../components/BodyDetailPanel'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'debris-region-64',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

describe('BodyDetailPanel Region line', () => {
  it('renders Region: line for a body whose orbit falls inside a debris field with attached settlements', () => {
    const system = generateSystem(options)

    const debrisSettlement = system.settlements.find((s) => s.debrisFieldId)
    if (!debrisSettlement) return

    const field = system.debrisFields.find((d) => d.id === debrisSettlement.debrisFieldId)
    if (!field) return

    const body = system.bodies.find(
      (b) =>
        b.orbitAu.value >= field.spatialExtent.innerAu.value &&
        b.orbitAu.value <= field.spatialExtent.outerAu.value,
    )
    if (!body) return

    render(<BodyDetailPanel body={body} system={system} />)

    expect(screen.getByText(/^Region$/i)).toBeTruthy()
    expect(screen.getByText(new RegExp(field.archetypeName.value, 'i'))).toBeTruthy()
  })

  it('does not render Region: line for a body when the system has no debris field attached settlements', () => {
    const noDebrisOptions: GenerationOptions = {
      seed: 'no-debris-settle-0',
      distribution: 'realistic',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    }
    const system = generateSystem(noDebrisOptions)

    const debrisSettlements = system.settlements.filter((s) => s.debrisFieldId)
    if (debrisSettlements.length > 0) return

    const body = system.bodies[0]
    if (!body) return

    render(<BodyDetailPanel body={body} system={system} />)

    expect(screen.queryByText(/^Region$/i)).toBeNull()
  })
})

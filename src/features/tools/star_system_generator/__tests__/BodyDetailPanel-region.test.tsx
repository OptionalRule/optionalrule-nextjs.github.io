import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { generateSystem } from '../lib/generator'
import { BodyDetailPanel } from '../components/BodyDetailPanel'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'debris-region-0',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

describe('BodyDetailPanel Region line', () => {
  it('renders Region: line for a body whose orbit falls inside a debris field with attached settlements', () => {
    const system = generateSystem(options)

    const debrisSettlement = system.settlements.find((s) => s.debrisFieldId)
    expect(debrisSettlement, 'seed must attach a settlement to a debris field').toBeDefined()

    const field = system.debrisFields.find((d) => d.id === debrisSettlement!.debrisFieldId)
    if (!field) throw new Error('attached debris field missing from system')

    const body = system.bodies.find(
      (b) =>
        b.orbitAu.value >= field.spatialExtent.innerAu.value &&
        b.orbitAu.value <= field.spatialExtent.outerAu.value,
    )
    if (!body) throw new Error('seed must place a body inside the debris field')

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
    expect(debrisSettlements, 'seed must have no debris-attached settlements').toHaveLength(0)

    const body = system.bodies[0]
    if (!body) throw new Error('seed must generate at least one body')

    render(<BodyDetailPanel body={body} system={system} />)

    expect(screen.queryByText(/^Region$/i)).toBeNull()
  })
})

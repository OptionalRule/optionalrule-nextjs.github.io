import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { generateSystem } from '../lib/generator'
import { OrbitalTable } from '../components/OrbitalTable'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'debris-region-0',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

describe('OrbitalTable debris region suffix', () => {
  it('shows "near <archetypeName>" suffix in Sites column for a body inside a debris field with attached settlements', () => {
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

    render(<OrbitalTable system={system} />)

    expect(screen.getAllByText(new RegExp(`near ${field.archetypeName.value}`, 'i')).length).toBeGreaterThan(0)
  })

  it('does not show "near" suffix when the system has no debris field attached settlements', () => {
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

    render(<OrbitalTable system={system} />)

    expect(screen.queryByText(/\(near /i)).toBeNull()
  })
})

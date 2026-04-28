import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BodyDetailPanel } from '../components/BodyDetailPanel'
import { SystemOverview } from '../components/SystemOverview'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'ea1d8ba2f11e808c',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('star system display context', () => {
  it('shows stellar scale and labels companion context by practical effect', () => {
    const system = generateSystem(options)

    render(<SystemOverview system={system} />)

    expect(screen.getByText('Est. radius')).toBeInTheDocument()
    expect(screen.getByText(/solar radii \([0-9.]+ AU\)/)).toBeInTheDocument()
    expect(screen.getByText('Multiple-Star Context')).toBeInTheDocument()
    expect(screen.getByText('Planetary layout')).toBeInTheDocument()
    expect(screen.getByText('Route value')).toBeInTheDocument()
  })

  it('uses belt-appropriate physical details instead of a body radius', () => {
    const system = generateSystem(options)
    const belt = system.bodies.find((body) => body.category.value === 'belt')

    expect(belt).toBeTruthy()
    render(<BodyDetailPanel body={belt!} system={system} />)

    expect(screen.getByText('Structure')).toBeInTheDocument()
    expect(screen.getByText('Distributed belt or swarm')).toBeInTheDocument()
    expect(screen.getByText('Not estimated for a distributed belt')).toBeInTheDocument()
    expect(screen.queryByText(`${belt!.physical.radiusEarth.value} Earth radii`)).not.toBeInTheDocument()
  })
})

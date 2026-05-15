import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  class BufferGeometry {
    type = 'BufferGeometry'
    setAttribute(_name: string, _attr: unknown) {}
  }
  class BufferAttribute {
    type = 'BufferAttribute'
    constructor(public array: Float32Array, public itemSize: number) {}
  }
  return { BufferGeometry, BufferAttribute }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
   
  namespace JSX {
    interface IntrinsicElements {
      points: React.HTMLAttributes<HTMLElement> & { geometry?: unknown }
      pointsMaterial: React.HTMLAttributes<HTMLElement> & {
        color?: string
        size?: number
        sizeAttenuation?: boolean
        transparent?: boolean
        opacity?: number
      }
    }
  }
}

import { DebrisFieldHalo } from '../DebrisFieldHalo'

describe('DebrisFieldHalo', () => {
  it('renders a points element with default params', () => {
    const { container } = render(
      <DebrisFieldHalo
        innerRadius={5} outerRadius={10} inclinationDeg={30}
        particleCount={150} opacity={0.5} color="#ccddee"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders flat (zero inclination) without throwing', () => {
    const { container } = render(
      <DebrisFieldHalo
        innerRadius={3} outerRadius={7} inclinationDeg={0}
        particleCount={0} opacity={0.4} color="#ffffff"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })
})

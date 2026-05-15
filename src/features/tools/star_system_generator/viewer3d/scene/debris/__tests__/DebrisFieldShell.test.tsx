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

import { DebrisFieldShell } from '../DebrisFieldShell'

describe('DebrisFieldShell', () => {
  it('renders a points element with default params', () => {
    const { container } = render(
      <DebrisFieldShell
        innerRadius={4} outerRadius={8} particleCount={100}
        opacity={0.6} color="#aabbcc"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders with zero particles without throwing', () => {
    const { container } = render(
      <DebrisFieldShell
        innerRadius={2} outerRadius={5} particleCount={0}
        opacity={0.3} color="#ffffff"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })
})

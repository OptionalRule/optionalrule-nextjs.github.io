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
  class Color {
    r = 1
    g = 1
    b = 1
    constructor(_color?: string) {}
    clone() { return new Color() }
    lerp(_other: Color, _t: number) { return this }
  }
  class LineBasicMaterial {
    type = 'LineBasicMaterial'
    constructor(_opts?: unknown) {}
  }
  class Line {
    type = 'Line'
    constructor(public geometry?: unknown, public material?: unknown) {}
  }
  return { BufferGeometry, BufferAttribute, Color, LineBasicMaterial, Line }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: React.HTMLAttributes<HTMLElement>
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown }
      mesh: React.HTMLAttributes<HTMLElement> & { position?: unknown }
      sphereGeometry: React.HTMLAttributes<HTMLElement> & { args?: unknown }
      meshBasicMaterial: React.HTMLAttributes<HTMLElement> & {
        color?: string
        transparent?: boolean
        opacity?: number
      }
    }
  }
}

import { DebrisFieldStream } from '../DebrisFieldStream'

describe('DebrisFieldStream', () => {
  it('renders a primitive line and hot-spot mesh with default params', () => {
    const { container } = render(
      <DebrisFieldStream
        startRadius={3} endRadius={8} centerAngleDeg={45}
        opacity={0.7} color="#88aaff"
      />
    )
    expect(container.querySelector('primitive')).not.toBeNull()
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('renders when start and end radius are equal (zero-length stream)', () => {
    const { container } = render(
      <DebrisFieldStream
        startRadius={5} endRadius={5} centerAngleDeg={0}
        opacity={0.5} color="#ff8888"
      />
    )
    expect(container.querySelector('primitive')).not.toBeNull()
    expect(container.querySelector('mesh')).not.toBeNull()
  })
})

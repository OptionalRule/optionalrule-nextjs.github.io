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
  return { BufferGeometry, BufferAttribute, Color }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      group: React.HTMLAttributes<HTMLElement>
      line: React.HTMLAttributes<HTMLElement> & { geometry?: unknown }
      lineBasicMaterial: React.HTMLAttributes<HTMLElement> & {
        vertexColors?: boolean
        transparent?: boolean
        opacity?: number
      }
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
  it('renders a line and hot-spot mesh with default params', () => {
    const { container } = render(
      <DebrisFieldStream
        startRadius={3} endRadius={8} centerAngleDeg={45}
        opacity={0.7} color="#88aaff"
      />
    )
    expect(container.querySelector('line')).not.toBeNull()
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('renders when start and end radius are equal (zero-length stream)', () => {
    const { container } = render(
      <DebrisFieldStream
        startRadius={5} endRadius={5} centerAngleDeg={0}
        opacity={0.5} color="#ff8888"
      />
    )
    expect(container.querySelector('line')).not.toBeNull()
    expect(container.querySelector('mesh')).not.toBeNull()
  })
})

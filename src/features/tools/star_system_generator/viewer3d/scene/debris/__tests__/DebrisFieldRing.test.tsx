import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  const DoubleSide = 2
  class RingGeometry {
    type = 'RingGeometry'
  }
  class MeshBasicMaterial {
    type = 'MeshBasicMaterial'
  }
  return { RingGeometry, MeshBasicMaterial, DoubleSide }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
   
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; rotation?: unknown }
      meshBasicMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; transparent?: boolean; opacity?: number; side?: unknown }
    }
  }
}

import { DebrisFieldRing } from '../DebrisFieldRing'

describe('DebrisFieldRing', () => {
  it('renders a mesh for a 360-degree ring', () => {
    const { container } = render(
      <DebrisFieldRing
        innerRadius={4} outerRadius={6} inclinationDeg={90}
        spanDeg={360} centerAngleDeg={0} opacity={0.7} color="#88aaff"
      />
    )
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('renders a mesh for a partial-span arc', () => {
    const { container } = render(
      <DebrisFieldRing
        innerRadius={4} outerRadius={6} inclinationDeg={0}
        spanDeg={60} centerAngleDeg={60} opacity={0.5} color="#ffaa88"
      />
    )
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('sets opacity from props', () => {
    const { container } = render(
      <DebrisFieldRing
        innerRadius={2} outerRadius={5} inclinationDeg={45}
        spanDeg={180} centerAngleDeg={90} opacity={0.35} color="#aabbcc"
      />
    )
    const mat = container.querySelector('meshbasicmaterial')
    expect(mat).not.toBeNull()
    expect(mat?.getAttribute('opacity')).toBe('0.35')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  class RingGeometry {
    type = 'RingGeometry'
    constructor(
      public innerRadius: number,
      public outerRadius: number,
      public thetaSegments: number,
      public phiSegments: number,
      public thetaStart: number,
      public thetaLength: number,
    ) {}
    dispose() {}
  }
  class SphereGeometry {
    type = 'SphereGeometry'
    constructor(public radius: number, public widthSegments: number, public heightSegments: number) {}
    dispose() {}
  }
  class ShaderMaterial {
    constructor(public options: unknown) {}
    dispose() {}
  }
  class Color {
    r = 1
    g = 1
    b = 1
    constructor(_c?: string) {}
    clone() { return new Color() }
    lerp() { return this }
    multiplyScalar() { return this }
  }
  return { RingGeometry, SphereGeometry, ShaderMaterial, Color, DoubleSide: 2 }
})

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.HTMLAttributes<HTMLElement> & {
        geometry?: unknown
        material?: unknown
        position?: unknown
        scale?: unknown
        renderOrder?: number
        raycast?: unknown
      }
    }
  }
}

import { DebrisVolumeFog, volumeFogLayerCount } from '../DebrisVolumeFog'
import { defaultDebrisVisualProfile } from '../debrisVisualProfile'

describe('DebrisVolumeFog', () => {
  it('does not allocate fog layers for settled, low-chaos rings', () => {
    const profile = defaultDebrisVisualProfile('polar-ring')
    expect(volumeFogLayerCount(profile, 1, 'disk')).toBe(0)
  })

  it('renders layered annular slices for chaotic disks', () => {
    const profile = defaultDebrisVisualProfile('exocomet-swarm')
    const { container } = render(
      <DebrisVolumeFog
        fieldId="chaotic-disk"
        mode="disk"
        innerRadius={3}
        outerRadius={9}
        opacity={0.25}
        color="#88aaff"
        profile={profile}
      />,
    )
    expect(container.querySelectorAll('mesh').length).toBeGreaterThan(8)
  })

  it('renders nested translucent shells for ejecta fields', () => {
    const profile = defaultDebrisVisualProfile('common-envelope-shell', 'shell-dense')
    const { container } = render(
      <DebrisVolumeFog
        fieldId="shell"
        mode="shell"
        innerRadius={4}
        outerRadius={10}
        opacity={0.3}
        color="#ccddff"
        profile={profile}
      />,
    )
    expect(container.querySelectorAll('mesh').length).toBeGreaterThan(6)
  })
})

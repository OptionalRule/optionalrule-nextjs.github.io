import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  const DoubleSide = 2
  class RingGeometry { type = 'RingGeometry' }
  class BufferGeometry {
    type = 'BufferGeometry'
    setAttribute() {}
  }
  class BufferAttribute { type = 'BufferAttribute' }
  class Color {
    r = 0; g = 0; b = 0
    clone() { return { lerp: (_c: unknown, _t: unknown) => ({ r: 0, g: 0, b: 0 }) } }
  }
  return { RingGeometry, BufferGeometry, BufferAttribute, Color, DoubleSide }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; rotation?: unknown; position?: unknown; scale?: unknown }
      meshBasicMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; transparent?: boolean; opacity?: number; side?: unknown }
      points: React.HTMLAttributes<HTMLElement> & { geometry?: unknown }
      pointsMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; size?: number; sizeAttenuation?: boolean; transparent?: boolean; opacity?: number }
      line: React.HTMLAttributes<HTMLElement> & { geometry?: unknown }
      lineBasicMaterial: React.HTMLAttributes<HTMLElement> & { vertexColors?: boolean; transparent?: boolean; opacity?: number }
      group: React.HTMLAttributes<HTMLElement>
      sphereGeometry: React.HTMLAttributes<HTMLElement> & { args?: unknown }
    }
  }
}

import { DebrisFields } from '../DebrisFields'
import type { DebrisFieldVisual } from '../../../types'
import type { DebrisField } from '../../../../../types'

function makeField(shape: DebrisField['shape']['value'], id = 'd1'): DebrisFieldVisual {
  return {
    field: {
      id,
      shape: { value: shape, confidence: 'derived' },
      archetypeName: { value: 'Test Archetype', confidence: 'derived' },
      companionId: null,
      spatialExtent: {
        innerAu: { value: 1, confidence: 'derived' },
        outerAu: { value: 2, confidence: 'derived' },
        inclinationDeg: { value: 90, confidence: 'derived' },
        spanDeg: { value: 360, confidence: 'derived' },
        centerAngleDeg: { value: 0, confidence: 'derived' },
      },
      densityBand: { value: 'asteroid-fleet', confidence: 'inferred' },
      anchorMode: { value: 'edge-only', confidence: 'inferred' },
      guCharacter: { value: '', confidence: 'gu-layer' },
      prize: { value: '', confidence: 'inferred' },
      spawnedPhenomenonId: null,
      whyHere: { value: '', confidence: 'inferred' },
    },
    innerRadius: 4,
    outerRadius: 6,
    inclinationDeg: 90,
    spanDeg: 360,
    centerAngleDeg: 0,
  }
}

describe('DebrisFields integrator', () => {
  it('renders a ring when physical layer is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('polar-ring')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('hides physical-layer fields when physical is off', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('polar-ring')]}
        layerVisibility={{ physical: false, gu: true, human: true }}
      />
    )
    expect(container.querySelector('mesh')).toBeNull()
    expect(container.querySelector('points')).toBeNull()
  })

  it('renders a shell (points) for common-envelope-shell when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('common-envelope-shell')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders a stream (line) for mass-transfer-stream when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('mass-transfer-stream')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('line')).not.toBeNull()
  })

  it('renders a halo (points) for kozai-scattered-halo when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('kozai-scattered-halo')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders gardener-cordon when human layer is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('gardener-cordon')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('mesh')).not.toBeNull()
  })

  it('hides gardener-cordon when human layer is off', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('gardener-cordon')]}
        layerVisibility={{ physical: true, gu: true, human: false }}
      />
    )
    expect(container.querySelector('mesh')).toBeNull()
  })

  it('renders multiple fields', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('polar-ring', 'f1'), makeField('common-envelope-shell', 'f2')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('mesh')).not.toBeNull()
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders nothing when fields array is empty', () => {
    const { container } = render(
      <DebrisFields
        fields={[]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  class BufferGeometry { type = 'BufferGeometry'; setAttribute() {} }
  class BufferAttribute {
    constructor(public array: Float32Array, public itemSize: number) {}
  }
  class SphereGeometry {}
  class PlaneGeometry {}
  class DodecahedronGeometry {}
  class IcosahedronGeometry {}
  class TorusGeometry {}
  class MeshBasicMaterial { constructor(_o?: unknown) {} dispose() {} }
  class MeshStandardMaterial { constructor(_o?: unknown) {} dispose() {} }
  class PointsMaterial { toneMapped = false; constructor(_o?: unknown) {} dispose() {} }
  class ShaderMaterial { constructor(_o?: unknown) {} dispose() {} }
  class LineBasicMaterial { constructor(_o?: unknown) {} }
  class Texture { needsUpdate = false; colorSpace = ''; minFilter = 0; magFilter = 0 }
  class CanvasTexture extends Texture {}
  class Color {
    r = 1; g = 1; b = 1
    constructor(_c?: string) {}
    clone() { return new Color() }
    copy() { return this }
    lerp() { return this }
    multiplyScalar() { return this }
    set() { return this }
  }
  class Object3D {
    position = { set: () => {} }
    rotation = { set: () => {} }
    scale = { setScalar: () => {}, set: () => {} }
    matrix = {}
    updateMatrix() {}
  }
  class Group { children: unknown[] = []; add(c: unknown) { this.children.push(c) }; traverse() {} }
  class InstancedMesh {
    name = ''
    instanceMatrix = { needsUpdate: false }
    instanceColor: { needsUpdate: boolean } | null = { needsUpdate: false }
    material: unknown
    constructor(_g: unknown, mat: unknown, _n: number) { this.material = mat }
    setMatrixAt() {}; setColorAt() {}
  }
  class Line { constructor(public geometry?: unknown, public material?: unknown) {} }
  return {
    BufferGeometry, BufferAttribute,
    SphereGeometry, PlaneGeometry, DodecahedronGeometry, IcosahedronGeometry, TorusGeometry,
    MeshBasicMaterial, MeshStandardMaterial, PointsMaterial, ShaderMaterial, LineBasicMaterial,
    Texture, CanvasTexture, Color, Object3D, Group, InstancedMesh, Line,
    AdditiveBlending: 2, SRGBColorSpace: 'srgb', LinearFilter: 1006, DoubleSide: 2,
  }
})

vi.mock('@react-three/fiber', () => ({}))

vi.mock('../../overlay/OverlayMarker', () => ({
  OverlayMarker: (props: { id: string; kind: string; label?: string }) => (
    <div data-testid="overlay-marker" data-kind={props.kind} data-id={props.id}>{props.label}</div>
  ),
}))

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; rotation?: unknown; position?: unknown; scale?: unknown }
      meshBasicMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; transparent?: boolean; opacity?: number; side?: unknown }
      points: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; material?: unknown; renderOrder?: number }
      pointsMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; size?: number; sizeAttenuation?: boolean; transparent?: boolean; opacity?: number }
      line: React.HTMLAttributes<HTMLElement> & { geometry?: unknown }
      lineBasicMaterial: React.HTMLAttributes<HTMLElement> & { vertexColors?: boolean; transparent?: boolean; opacity?: number }
      group: React.HTMLAttributes<HTMLElement> & { rotation?: unknown }
      sphereGeometry: React.HTMLAttributes<HTMLElement> & { args?: unknown }
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown; dispose?: unknown }
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
  it('renders ring dust + hazard glyph when physical layer is on', () => {
    const { container, getAllByTestId } = render(
      <DebrisFields
        fields={[makeField('polar-ring')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
    expect(getAllByTestId('overlay-marker').length).toBe(1)
  })

  it('hides physical-layer fields when physical is off', () => {
    const { container, queryAllByTestId } = render(
      <DebrisFields
        fields={[makeField('polar-ring')]}
        layerVisibility={{ physical: false, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).toBeNull()
    expect(queryAllByTestId('overlay-marker').length).toBe(0)
  })

  it('renders shell points for common-envelope-shell when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('common-envelope-shell')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders stream primitive for mass-transfer-stream when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('mass-transfer-stream')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('primitive')).not.toBeNull()
  })

  it('renders halo points for kozai-scattered-halo when physical is on', () => {
    const { container } = render(
      <DebrisFields
        fields={[makeField('kozai-scattered-halo')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders gardener-cordon when human layer is on', () => {
    const { container, getAllByTestId } = render(
      <DebrisFields
        fields={[makeField('gardener-cordon')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
    expect(getAllByTestId('overlay-marker').length).toBe(1)
  })

  it('hides gardener-cordon when human layer is off', () => {
    const { container, queryAllByTestId } = render(
      <DebrisFields
        fields={[makeField('gardener-cordon')]}
        layerVisibility={{ physical: true, gu: true, human: false }}
      />
    )
    expect(container.querySelector('points')).toBeNull()
    expect(queryAllByTestId('overlay-marker').length).toBe(0)
  })

  it('emits one hazard glyph per visible field', () => {
    const { getAllByTestId } = render(
      <DebrisFields
        fields={[makeField('polar-ring', 'f1'), makeField('common-envelope-shell', 'f2')]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(getAllByTestId('overlay-marker').length).toBe(2)
  })

  it('renders nothing when fields array is empty', () => {
    const { container, queryAllByTestId } = render(
      <DebrisFields
        fields={[]}
        layerVisibility={{ physical: true, gu: true, human: true }}
      />
    )
    expect(container.firstChild).toBeNull()
    expect(queryAllByTestId('overlay-marker').length).toBe(0)
  })
})

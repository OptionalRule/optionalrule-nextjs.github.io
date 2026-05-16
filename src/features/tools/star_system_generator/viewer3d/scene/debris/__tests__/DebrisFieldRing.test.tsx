import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('three', () => {
  class BufferGeometry { type = 'BufferGeometry'; setAttribute() {}; dispose() {} }
  class BufferAttribute {
    constructor(public array: Float32Array, public itemSize: number) {}
  }
  class SphereGeometry {}
  class PlaneGeometry {
    attributes = { position: {}, uv: {}, normal: {} }
    index = {}
  }
  class DodecahedronGeometry {}
  class IcosahedronGeometry {}
  class TorusGeometry {}
  class RingGeometry { type = 'RingGeometry'; dispose() {} }
  class InstancedBufferGeometry {
    attributes: Record<string, unknown> = {}
    index: unknown = null
    instanceCount = 0
    setAttribute(name: string, attr: unknown) { this.attributes[name] = attr }
    dispose() {}
  }
  class InstancedBufferAttribute {
    constructor(public array: Float32Array, public itemSize: number) {}
  }
  class Mesh {
    name = ''
    frustumCulled = true
    constructor(public geometry?: unknown, public material?: unknown) {}
  }
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
    setHSL(_h: number, _s: number, _l: number) { return this }
    getHSL(target: { h: number; s: number; l: number }) { target.h = 0; target.s = 0; target.l = 0.5; return target }
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
    SphereGeometry, PlaneGeometry, DodecahedronGeometry, IcosahedronGeometry, TorusGeometry, RingGeometry,
    MeshBasicMaterial, MeshStandardMaterial, PointsMaterial, ShaderMaterial, LineBasicMaterial,
    Texture, CanvasTexture, Color, Object3D, Group, InstancedMesh, Line,
    InstancedBufferGeometry, InstancedBufferAttribute, Mesh,
    AdditiveBlending: 2, SRGBColorSpace: 'srgb', LinearFilter: 1006, DoubleSide: 2,
  }
})

vi.mock('@react-three/fiber', () => ({}))

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; rotation?: unknown; position?: unknown }
      group: React.HTMLAttributes<HTMLElement> & { rotation?: unknown }
      points: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; material?: unknown; renderOrder?: number }
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown; dispose?: unknown }
      sphereGeometry: React.HTMLAttributes<HTMLElement> & { args?: unknown }
      meshBasicMaterial: React.HTMLAttributes<HTMLElement> & { color?: string; transparent?: boolean; opacity?: number }
    }
  }
}

import { DebrisFieldRing } from '../DebrisFieldRing'

describe('DebrisFieldRing', () => {
  it('renders a group with dust points for a 360-degree ring', () => {
    const { container } = render(
      <DebrisFieldRing
        fieldId="t1" innerRadius={4} outerRadius={6} inclinationDeg={90}
        spanDeg={360} centerAngleDeg={0} opacity={0.7} color="#88aaff"
      />
    )
    expect(container.querySelector('group')).not.toBeNull()
    expect(container.querySelector('primitive')).not.toBeNull()
  })

  it('renders for a partial-span arc', () => {
    const { container } = render(
      <DebrisFieldRing
        fieldId="t2" innerRadius={4} outerRadius={6} inclinationDeg={0}
        spanDeg={60} centerAngleDeg={60} opacity={0.5} color="#ffaa88"
      />
    )
    expect(container.querySelector('primitive')).not.toBeNull()
  })

  it('renders zero-chunk variant without throwing', () => {
    const { container } = render(
      <DebrisFieldRing
        fieldId="t3" innerRadius={2} outerRadius={5} inclinationDeg={45}
        spanDeg={180} centerAngleDeg={90} opacity={0.35} color="#aabbcc"
        chunkCount={0}
      />
    )
    expect(container.querySelector('primitive')).not.toBeNull()
  })
})

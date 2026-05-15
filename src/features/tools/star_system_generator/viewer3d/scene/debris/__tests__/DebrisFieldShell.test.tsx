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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: React.HTMLAttributes<HTMLElement>
      points: React.HTMLAttributes<HTMLElement> & { geometry?: unknown; material?: unknown; renderOrder?: number }
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown; dispose?: unknown }
    }
  }
}

import { DebrisFieldShell } from '../DebrisFieldShell'

describe('DebrisFieldShell', () => {
  it('renders a points element with default params', () => {
    const { container } = render(
      <DebrisFieldShell
        fieldId="t1" innerRadius={4} outerRadius={8} particleCount={100}
        opacity={0.6} color="#aabbcc"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })

  it('renders with zero particles without throwing', () => {
    const { container } = render(
      <DebrisFieldShell
        fieldId="t2" innerRadius={2} outerRadius={5} particleCount={0}
        opacity={0.3} color="#ffffff"
      />
    )
    expect(container.querySelector('points')).not.toBeNull()
  })
})

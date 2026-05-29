import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

const { disposeCalls } = vi.hoisted(() => ({
  disposeCalls: { matrix: 0, color: 0, instanceMeshes: 0 },
}))

vi.mock('@react-three/fiber', () => ({
  useFrame: () => {},
}))

vi.mock('../../chrome/ViewerContext', () => ({
  usePrefersReducedMotion: () => false,
}))

vi.mock('../renderAssets', () => ({
  beltChunkGeometry: { type: 'chunk' },
  beltParticleGeometry: { type: 'particle' },
  beltShardGeometry: { type: 'shard' },
}))

vi.mock('three', () => {
  class Group {
    children: unknown[] = []
    add(child: unknown) { this.children.push(child) }
    traverse(cb: (o: unknown) => void) {
      cb(this)
      this.children.forEach((c) => cb(c))
    }
  }
  class Object3D {
    position = { set() {} }
    rotation = { set() {} }
    scale = { set() {} }
    matrix = {}
    updateMatrix() {}
  }
  class Color {
    set() { return this }
    multiplyScalar() { return this }
  }
  class ShaderMaterial {
    constructor(public options: unknown) {}
    dispose() {}
  }
  class InstancedMesh {
    instanceMatrix = { needsUpdate: false, dispose: () => { disposeCalls.matrix++ } }
    instanceColor = { needsUpdate: false, dispose: () => { disposeCalls.color++ } }
    material: unknown
    constructor(_geometry: unknown, material: unknown, _count: number) {
      this.material = material
      disposeCalls.instanceMeshes++
    }
    setMatrixAt() {}
    setColorAt() {}
  }
  return { Group, Object3D, Color, ShaderMaterial, InstancedMesh }
})

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: React.HTMLAttributes<HTMLElement> & { ref?: unknown; rotation?: unknown }
      primitive: React.HTMLAttributes<HTMLElement> & { object?: unknown; dispose?: unknown }
    }
  }
}

import { Belt } from '../Belt'
import type { BeltVisual } from '../../types'

const belt: BeltVisual = {
  id: 'belt-1',
  innerRadius: 4,
  outerRadius: 7,
  particleCount: 6,
  jitter: 0.2,
  color: '#998877',
  colors: ['#998877', '#aabbcc'],
  gapCount: 0,
  clumpiness: 0.3,
  inclination: 0,
  particleSizeScale: 1,
  renderArchetype: 'belt',
}

describe('Belt', () => {
  it('disposes instance matrix and color buffers for every InstancedMesh on unmount', () => {
    disposeCalls.matrix = 0
    disposeCalls.color = 0
    disposeCalls.instanceMeshes = 0

    const { unmount } = render(<Belt belt={belt} />)
    const created = disposeCalls.instanceMeshes
    expect(created).toBeGreaterThan(0)

    unmount()

    expect(disposeCalls.matrix).toBe(created)
    expect(disposeCalls.color).toBe(created)
  })
})

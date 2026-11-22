import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { CameraRig } from '../CameraRig'

interface SelectionState {
  selection: { kind: 'body'; id: string } | null
}

const selectionState: SelectionState = { selection: null }
const camera = new THREE.PerspectiveCamera()

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({ camera }),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: forwardRef(function OrbitControls(_props: object, ref) {
    useImperativeHandle(ref, () => ({
      minDistance: 0,
      target: new THREE.Vector3(),
      update: () => undefined,
    }))
    return null
  }),
}))

vi.mock('../../chrome/ViewerContext', () => ({
  useSelectionState: () => selectionState,
}))

type BodyWindow = Window & {
  __viewer3dBodyPositions?: Record<string, [number, number, number]>
  __viewer3dBodySizes?: Record<string, number>
}

let pending: Map<number, FrameRequestCallback>
let nextId: number

beforeEach(() => {
  pending = new Map()
  nextId = 1
  selectionState.selection = null
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextId++
    pending.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    pending.delete(id)
  })
  const w = window as BodyWindow
  w.__viewer3dBodyPositions = { 'body-1': [10, 0, 0] }
  w.__viewer3dBodySizes = { 'body-1': 1 }
})

afterEach(() => {
  vi.unstubAllGlobals()
  const w = window as BodyWindow
  delete w.__viewer3dBodyPositions
  delete w.__viewer3dBodySizes
})

function frameSystem() {
  act(() => {
    window.dispatchEvent(new Event('viewer3d:frame-system'))
  })
}

describe('CameraRig animation loops', () => {
  it('keeps only one frame-system loop running when the event repeats', () => {
    render(<CameraRig sceneRadius={100} />)
    frameSystem()
    frameSystem()
    expect(pending.size).toBe(1)
  })

  it('cancels the fly-to loop when a frame-system loop starts', () => {
    selectionState.selection = { kind: 'body', id: 'body-1' }
    render(<CameraRig sceneRadius={100} />)
    expect(pending.size).toBe(1)
    frameSystem()
    expect(pending.size).toBe(1)
  })

  it('cancels the running loop on unmount', () => {
    const { unmount } = render(<CameraRig sceneRadius={100} />)
    frameSystem()
    expect(pending.size).toBe(1)
    unmount()
    expect(pending.size).toBe(0)
  })
})

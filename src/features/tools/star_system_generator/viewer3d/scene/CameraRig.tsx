'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useSelectionState } from '../chrome/ViewerContext'

export interface CameraRigProps {
  sceneRadius: number
}

export function CameraRig({ sceneRadius }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const animRef = useRef<number | null>(null)
  const { camera } = useThree()

  const cancelAnimation = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    animRef.current = null
  }, [])

  const startAnimation = useCallback((step: FrameRequestCallback) => {
    cancelAnimation()
    animRef.current = requestAnimationFrame(step)
  }, [cancelAnimation])

  useEffect(() => cancelAnimation, [cancelAnimation])

  useEffect(() => {
    camera.position.set(0, sceneRadius * 0.35, sceneRadius * 0.95)
    camera.lookAt(0, 0, 0)
  }, [camera, sceneRadius])

  useEffect(() => {
    function handle() {
      if (!controlsRef.current) return
      controlsRef.current.minDistance = sceneRadius * 0.2
      controlsRef.current.target.set(0, 0, 0)
      const start = camera.position.clone()
      const target = new THREE.Vector3(0, sceneRadius * 0.35, sceneRadius * 0.95)
      const startTime = performance.now()
      const duration = 600

      function step(t: number) {
        const k = Math.min(1, (t - startTime) / duration)
        const eased = 1 - Math.pow(1 - k, 3)
        camera.position.lerpVectors(start, target, eased)
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
        if (k < 1) animRef.current = requestAnimationFrame(step)
      }
      startAnimation(step)
    }
    window.addEventListener('viewer3d:frame-system', handle)
    return () => window.removeEventListener('viewer3d:frame-system', handle)
  }, [camera, sceneRadius, startAnimation])

  const { selection } = useSelectionState()

  useEffect(() => {
    if (!selection || selection.kind !== 'body') return
    const w = window as Window & {
      __viewer3dBodyPositions?: Record<string, [number, number, number]>
      __viewer3dBodySizes?: Record<string, number>
    }
    const target = w.__viewer3dBodyPositions?.[selection.id]
    if (!target) return
    const visualSize = w.__viewer3dBodySizes?.[selection.id] ?? 1
    const targetVec = new THREE.Vector3(target[0], target[1], target[2])
    const radialDir = new THREE.Vector3(targetVec.x, 0, targetVec.z).normalize()
    if (radialDir.lengthSq() === 0) radialDir.set(0, 0, 1)
    const focusDistance = Math.max(visualSize * 4.5, sceneRadius * 0.012)
    const desired = targetVec.clone()
      .add(radialDir.multiplyScalar(focusDistance))
      .setY(targetVec.y + visualSize * 1.6)
    const start = camera.position.clone()
    const startTime = performance.now()
    const duration = 800

    if (controlsRef.current) controlsRef.current.minDistance = visualSize * 1.8

    function step(t: number) {
      const k = Math.min(1, (t - startTime) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      camera.position.lerpVectors(start, desired, eased)
      camera.lookAt(targetVec)
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetVec)
        controlsRef.current.update()
      }
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    startAnimation(step)
  }, [selection, camera, sceneRadius, startAnimation])

  useEffect(() => {
    if (selection || !controlsRef.current) return
    controlsRef.current.minDistance = sceneRadius * 0.2
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }, [selection, sceneRadius])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={sceneRadius * 0.2}
      maxDistance={sceneRadius * 2.5}
      makeDefault
    />
  )
}

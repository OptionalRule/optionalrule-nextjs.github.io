'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface ZonesProps {
  habitableInner: number
  habitableOuter: number
  snowLine: number
}

export function Zones({ habitableInner, habitableOuter, snowLine }: ZonesProps) {
  const habitableMesh = useMemo(() => {
    const inner = habitableInner
    const outer = habitableOuter
    const geo = new THREE.RingGeometry(inner, outer, 64)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5fb6e8'),
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    return new THREE.Mesh(geo, mat)
  }, [habitableInner, habitableOuter])

  const snowLineRing = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 192
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * snowLine, 0, Math.sin(a) * snowLine))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineDashedMaterial({
      color: new THREE.Color('#5fb6e8'),
      dashSize: 0.8,
      gapSize: 2.4,
      transparent: true,
      opacity: 0.45,
    })
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    return line
  }, [snowLine])

  useEffect(() => () => {
    habitableMesh.geometry.dispose()
    if (Array.isArray(habitableMesh.material)) {
      habitableMesh.material.forEach((material) => material.dispose())
    } else {
      habitableMesh.material.dispose()
    }
  }, [habitableMesh])

  useEffect(() => () => {
    snowLineRing.geometry.dispose()
    if (Array.isArray(snowLineRing.material)) {
      snowLineRing.material.forEach((material) => material.dispose())
    } else {
      snowLineRing.material.dispose()
    }
  }, [snowLineRing])

  return (
    <>
      <primitive object={habitableMesh} />
      <primitive object={snowLineRing} />
    </>
  )
}

import * as THREE from 'three'

export const bodySphereGeometry = new THREE.SphereGeometry(1, 32, 32)
export const starSphereGeometry = new THREE.SphereGeometry(1, 24, 24)
export const starGlowPlaneGeometry = new THREE.PlaneGeometry(1, 1)
export const moonSphereGeometry = new THREE.SphereGeometry(1, 16, 16)
export const hazardSphereGeometry = new THREE.SphereGeometry(1, 24, 24)
export const guBleedSphereGeometry = new THREE.SphereGeometry(1, 32, 32)
export const volumeTorusGeometry = new THREE.TorusGeometry(0.72, 0.18, 12, 48)
export const volumeRibbonGeometry = new THREE.PlaneGeometry(2, 1, 24, 6)
export const beltParticleGeometry = new THREE.DodecahedronGeometry(0.065, 0)
export const beltShardGeometry = new THREE.IcosahedronGeometry(0.058, 1)
export const beltChunkGeometry = new THREE.DodecahedronGeometry(0.075, 1)

export const moonMaterial = new THREE.MeshStandardMaterial({ color: '#8a8a82', roughness: 1, metalness: 0 })
export const invisibleHitMaterial = new THREE.MeshBasicMaterial({ visible: false })

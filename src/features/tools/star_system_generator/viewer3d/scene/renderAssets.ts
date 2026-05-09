import * as THREE from 'three'

export const bodySphereGeometry = new THREE.SphereGeometry(1, 32, 32)
export const starSphereGeometry = new THREE.SphereGeometry(1, 24, 24)
export const moonSphereGeometry = new THREE.SphereGeometry(1, 16, 16)
export const hazardSphereGeometry = new THREE.SphereGeometry(1, 24, 24)
export const guBleedSphereGeometry = new THREE.SphereGeometry(1, 32, 32)
export const volumeTorusGeometry = new THREE.TorusGeometry(0.72, 0.18, 12, 48)
export const volumeRibbonGeometry = new THREE.PlaneGeometry(2, 1, 24, 6)
export const beltParticleGeometry = new THREE.IcosahedronGeometry(0.13, 0)
export const phenomenonGeometry = new THREE.IcosahedronGeometry(1, 0)
export const ruinGeometry = new THREE.OctahedronGeometry(1, 0)
export const settlementPinHeadGeometry = new THREE.SphereGeometry(1, 8, 8)
export const settlementPinStemGeometry = new THREE.CylinderGeometry(1, 1, 1, 6)

export const moonMaterial = new THREE.MeshStandardMaterial({ color: '#8a8a82', roughness: 1, metalness: 0 })
export const phenomenonMaterial = new THREE.MeshBasicMaterial({
  color: '#a880ff',
  transparent: true,
  opacity: 0.8,
  toneMapped: false,
})
export const ruinMaterial = new THREE.MeshBasicMaterial({
  color: '#7e8a96',
  transparent: true,
  opacity: 0.7,
  toneMapped: false,
})
export const settlementPinMaterial = new THREE.MeshBasicMaterial({ color: '#ff9d4a', toneMapped: false })
export const invisibleHitMaterial = new THREE.MeshBasicMaterial({ visible: false })

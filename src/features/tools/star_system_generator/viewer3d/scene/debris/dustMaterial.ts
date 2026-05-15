import * as THREE from 'three'

let cachedTexture: THREE.Texture | null = null
const materialCache = new Map<string, THREE.PointsMaterial>()

function buildDustSpriteTexture(): THREE.Texture {
  if (cachedTexture) return cachedTexture
  if (typeof document === 'undefined') {
    cachedTexture = new THREE.Texture()
    return cachedTexture
  }
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    cachedTexture = new THREE.Texture()
    return cachedTexture
  }
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  cachedTexture = texture
  return texture
}

export interface DustMaterialOptions {
  color: string
  opacity: number
  size: number
}

export function getDustMaterial(opts: DustMaterialOptions): THREE.PointsMaterial {
  const opacityBucket = Math.round(opts.opacity * 20)
  const sizeBucket = Math.max(1, Math.round(opts.size * 4))
  const key = `${opts.color}|${opacityBucket}|${sizeBucket}`
  const existing = materialCache.get(key)
  if (existing) return existing
  const material = new THREE.PointsMaterial({
    map: buildDustSpriteTexture(),
    color: opts.color,
    size: sizeBucket / 4,
    sizeAttenuation: true,
    transparent: true,
    opacity: opacityBucket / 20,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.01,
  })
  material.toneMapped = false
  materialCache.set(key, material)
  return material
}

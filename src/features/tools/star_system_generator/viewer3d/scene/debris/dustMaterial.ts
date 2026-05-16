import * as THREE from 'three'

let cachedAtlas: THREE.Texture | null = null
const billboardMaterialCache = new Map<string, THREE.ShaderMaterial>()

const ATLAS_SIZE = 256
const ATLAS_CELL = 128

function drawRadialSprite(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = ctx.createRadialGradient(x + ATLAS_CELL / 2, y + ATLAS_CELL / 2, 0, x + ATLAS_CELL / 2, y + ATLAS_CELL / 2, ATLAS_CELL / 2 - 2)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)')
  g.addColorStop(0.7, 'rgba(255, 255, 255, 0.18)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(x, y, ATLAS_CELL, ATLAS_CELL)
}

function drawEllipseSprite(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x + ATLAS_CELL / 2, y + ATLAS_CELL / 2)
  ctx.scale(1, 0.45)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ATLAS_CELL / 2 - 2)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)')
  g.addColorStop(0.85, 'rgba(255, 255, 255, 0.1)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, ATLAS_CELL / 2 - 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawWispSprite(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = x + ATLAS_CELL * 0.38
  const cy = y + ATLAS_CELL * 0.5
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ATLAS_CELL * 0.42)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)')
  g.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(x, y, ATLAS_CELL, ATLAS_CELL)
  const trail = ctx.createLinearGradient(cx, cy, x + ATLAS_CELL * 0.95, cy)
  trail.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
  trail.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)')
  trail.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = trail
  ctx.beginPath()
  ctx.moveTo(cx, cy - 6)
  ctx.lineTo(x + ATLAS_CELL * 0.95, cy)
  ctx.lineTo(cx, cy + 6)
  ctx.closePath()
  ctx.fill()
}

function drawCrescentSprite(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = x + ATLAS_CELL / 2
  const cy = y + ATLAS_CELL / 2
  const ring = ctx.createRadialGradient(cx, cy, ATLAS_CELL * 0.22, cx, cy, ATLAS_CELL * 0.46)
  ring.addColorStop(0, 'rgba(255, 255, 255, 0)')
  ring.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)')
  ring.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)')
  ring.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = ring
  ctx.beginPath()
  ctx.arc(cx, cy, ATLAS_CELL * 0.46, 0, Math.PI * 2)
  ctx.fill()
  // Punch out one side to make crescent shape.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const cutG = ctx.createRadialGradient(cx + ATLAS_CELL * 0.18, cy, 0, cx + ATLAS_CELL * 0.18, cy, ATLAS_CELL * 0.38)
  cutG.addColorStop(0, 'rgba(0, 0, 0, 1)')
  cutG.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)')
  cutG.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = cutG
  ctx.beginPath()
  ctx.arc(cx + ATLAS_CELL * 0.18, cy, ATLAS_CELL * 0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function buildSpriteAtlas(): THREE.Texture {
  if (cachedAtlas) return cachedAtlas
  if (typeof document === 'undefined') {
    cachedAtlas = new THREE.Texture()
    return cachedAtlas
  }
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_SIZE
  canvas.height = ATLAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    cachedAtlas = new THREE.Texture()
    return cachedAtlas
  }
  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE)
  drawRadialSprite(ctx, 0, 0)
  drawEllipseSprite(ctx, ATLAS_CELL, 0)
  drawWispSprite(ctx, 0, ATLAS_CELL)
  drawCrescentSprite(ctx, ATLAS_CELL, ATLAS_CELL)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  cachedAtlas = texture
  return texture
}

const billboardVertexShader = /* glsl */ `
attribute vec3 aOffset;
attribute float aScale;
attribute float aRotation;
attribute vec3 aTint;
attribute float aSpriteIndex;

varying vec2 vAtlasUv;
varying vec3 vTint;

void main() {
  float c = cos(aRotation);
  float s = sin(aRotation);
  vec2 rotated = vec2(position.x * c - position.y * s, position.x * s + position.y * c);
  vec2 scaled = rotated * aScale;
  vec4 worldOffset = modelViewMatrix * vec4(aOffset, 1.0);
  vec4 pos = vec4(worldOffset.xyz + vec3(scaled, 0.0), 1.0);
  gl_Position = projectionMatrix * pos;

  // 2x2 atlas: cell selected by aSpriteIndex (0,1,2,3).
  float idx = floor(aSpriteIndex + 0.5);
  float col = mod(idx, 2.0);
  float row = floor(idx * 0.5);
  vec2 cellOrigin = vec2(col, row) * 0.5;
  vec2 cellSize = vec2(0.5);
  // PlaneGeometry uv is in [0,1].
  vAtlasUv = cellOrigin + uv * cellSize;
  vTint = aTint;
}
`

const billboardFragmentShader = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uBaseColor;
uniform float uOpacity;
varying vec2 vAtlasUv;
varying vec3 vTint;

void main() {
  vec4 tex = texture2D(uAtlas, vAtlasUv);
  if (tex.a < 0.01) discard;
  vec3 color = uBaseColor * vTint;
  // Pre-multiplied output; AdditiveBlending uses SrcAlpha + One, so we set
  // alpha to 1.0 to avoid double-multiplying the contribution.
  gl_FragColor = vec4(color * tex.a * uOpacity, 1.0);
}
`

export interface BillboardMaterialOptions {
  color: string
  opacity: number
}

export function getDustBillboardMaterial(opts: BillboardMaterialOptions): THREE.ShaderMaterial {
  const opacityBucket = Math.round(opts.opacity * 20)
  const key = `${opts.color}|${opacityBucket}`
  const existing = billboardMaterialCache.get(key)
  if (existing) return existing
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: buildSpriteAtlas() },
      uBaseColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opacityBucket / 20 },
    },
    vertexShader: billboardVertexShader,
    fragmentShader: billboardFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
  billboardMaterialCache.set(key, material)
  return material
}

const hazeVertexShader = /* glsl */ `
varying vec3 vLocalPos;

void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const hazeFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColorOuter;
uniform float uOpacity;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uNoiseScale;
uniform float uSeed;
varying vec3 vLocalPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.55;
  }
  return v;
}

void main() {
  float r = length(vLocalPos.xy);
  float t = (r - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.001);
  if (t < 0.0 || t > 1.0) discard;
  // Lens-shaped radial mask, peak at midradius.
  float radialMask = sin(t * 3.14159);
  radialMask = pow(radialMask, 0.65);
  // World-position-based noise (not parametric) so clumps look like patches, not arcs.
  vec2 noiseUv = vLocalPos.xy * uNoiseScale * 0.05;
  float n = fbm(noiseUv);
  // Heat-shift color: inner (hot) -> outer (cool).
  vec3 col = mix(uColor, uColorOuter, t);
  float patch = 0.35 + n * 1.15;
  float alpha = radialMask * patch * uOpacity;
  // Pre-multiplied output; alpha=1.0 to avoid AdditiveBlending double-multiply.
  gl_FragColor = vec4(col * alpha, 1.0);
}
`

export function getHazeRingMaterial(opts: {
  color: string
  colorOuter?: string
  opacity: number
  innerRadius: number
  outerRadius: number
  seed: number
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
      uColorOuter: { value: new THREE.Color(opts.colorOuter ?? opts.color).multiplyScalar(0.55) },
      uOpacity: { value: opts.opacity },
      uInnerRadius: { value: opts.innerRadius },
      uOuterRadius: { value: opts.outerRadius },
      uNoiseScale: { value: 6.0 },
      uSeed: { value: opts.seed },
    },
    vertexShader: hazeVertexShader,
    fragmentShader: hazeFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

import * as THREE from 'three'

let cachedAtlas: THREE.Texture | null = null
const billboardMaterialCache = new Map<string, THREE.ShaderMaterial>()

const ATLAS_SIZE = 256
const ATLAS_CELL = 128

function drawBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { cx?: number; cy?: number; rx: number; ry: number; core: number; midStop: number; midAlpha: number },
) {
  ctx.save()
  ctx.translate(x + ATLAS_CELL / 2 + (opts.cx ?? 0), y + ATLAS_CELL / 2 + (opts.cy ?? 0))
  const maxR = Math.max(opts.rx, opts.ry)
  ctx.scale(opts.rx / maxR, opts.ry / maxR)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(opts.core, 'rgba(255, 255, 255, 0.7)')
  g.addColorStop(opts.midStop, `rgba(255, 255, 255, ${opts.midAlpha})`)
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(-maxR, -maxR, maxR * 2, maxR * 2)
  ctx.restore()
}

function drawSpriteVariant0(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Round soft blob — the "default" mote.
  drawBlob(ctx, x, y, { rx: ATLAS_CELL * 0.45, ry: ATLAS_CELL * 0.45, core: 0.3, midStop: 0.65, midAlpha: 0.18 })
}

function drawSpriteVariant1(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Gentle ellipse — 1.5:1 aspect, not stretched enough to read as elongated.
  drawBlob(ctx, x, y, { rx: ATLAS_CELL * 0.45, ry: ATLAS_CELL * 0.3, core: 0.28, midStop: 0.7, midAlpha: 0.15 })
}

function drawSpriteVariant2(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Brighter pinpoint — small bright core with fast falloff.
  drawBlob(ctx, x, y, { rx: ATLAS_CELL * 0.35, ry: ATLAS_CELL * 0.35, core: 0.15, midStop: 0.45, midAlpha: 0.22 })
}

function drawSpriteVariant3(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Wider diffuse blob — softer fade, no sharp core.
  drawBlob(ctx, x, y, { rx: ATLAS_CELL * 0.48, ry: ATLAS_CELL * 0.42, core: 0.45, midStop: 0.78, midAlpha: 0.1 })
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
  drawSpriteVariant0(ctx, 0, 0)
  drawSpriteVariant1(ctx, ATLAS_CELL, 0)
  drawSpriteVariant2(ctx, 0, ATLAS_CELL)
  drawSpriteVariant3(ctx, ATLAS_CELL, ATLAS_CELL)
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

import * as THREE from 'three'

let cachedTexture: THREE.Texture | null = null
const dustShaderCache = new Map<string, THREE.ShaderMaterial>()

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

const dustVertexShader = /* glsl */ `
attribute float aSize;
attribute vec3 aTint;
varying vec3 vTint;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / max(-mv.z, 0.1));
  gl_Position = projectionMatrix * mv;
  vTint = aTint;
}
`

const dustFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uBaseColor;
uniform float uOpacity;
varying vec3 vTint;

void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  if (tex.a < 0.01) discard;
  vec3 color = uBaseColor * vTint;
  gl_FragColor = vec4(color * tex.a, tex.a * uOpacity);
}
`

export interface DustMaterialOptions {
  color: string
  opacity: number
}

export function getDustMaterial(opts: DustMaterialOptions): THREE.ShaderMaterial {
  const opacityBucket = Math.round(opts.opacity * 20)
  const key = `${opts.color}|${opacityBucket}`
  const existing = dustShaderCache.get(key)
  if (existing) return existing
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: buildDustSpriteTexture() },
      uBaseColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opacityBucket / 20 },
    },
    vertexShader: dustVertexShader,
    fragmentShader: dustFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
  dustShaderCache.set(key, material)
  return material
}

const hazeVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const hazeFragmentShader = /* glsl */ `
uniform vec3 uColor;
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
  float radialMask = sin(t * 3.14159);
  radialMask = pow(radialMask, 0.7);
  float angle = atan(vLocalPos.y, vLocalPos.x);
  vec2 noiseUv = vec2(angle * uNoiseScale * 0.5, t * uNoiseScale * 2.0);
  float n = fbm(noiseUv);
  float patch = 0.4 + n * 0.9;
  float alpha = radialMask * patch * uOpacity;
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`

export function getHazeRingMaterial(opts: {
  color: string
  opacity: number
  innerRadius: number
  outerRadius: number
  seed: number
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
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

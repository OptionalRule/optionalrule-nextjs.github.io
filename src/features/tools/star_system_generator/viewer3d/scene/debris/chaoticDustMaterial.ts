import * as THREE from 'three'

const vertexShader = /* glsl */ `
varying vec3 vLocalPos;

void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform float uOpacity;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uChaos;
uniform float uSeed;
uniform float uEdgeFade;
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
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = mat2(1.64, -0.42, 0.42, 1.64) * p;
    amp *= 0.54;
  }
  return v;
}

float radialEdgeFade(float t) {
  float w = max(uEdgeFade, 0.001);
  return smoothstep(0.0, w, t) * (1.0 - smoothstep(1.0 - w, 1.0, t));
}

void main() {
  float r = length(vLocalPos.xy);
  float t = (r - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.001);
  if (t < 0.0 || t > 1.0) discard;

  float angle = atan(vLocalPos.y, vLocalPos.x);
  vec2 polar = vec2(angle * 1.9, t * 7.0);
  float warpA = fbm(polar * (1.5 + uChaos * 1.8));
  float warpB = fbm(vec2(angle * 4.7 + warpA * 3.0, t * 15.0 - warpA * 2.0));
  float lanes = sin(angle * (5.0 + uChaos * 8.0) + warpA * 7.0 + t * (8.0 + uChaos * 8.0));
  lanes = smoothstep(0.42 - uChaos * 0.18, 1.0, lanes * 0.5 + 0.5);

  float radialMask = pow(max(sin(t * 3.14159), 0.0), 0.72);
  float innerEdge = smoothstep(0.04, 0.24 + uChaos * 0.12, t);
  float outerEdge = 1.0 - smoothstep(0.72 - uChaos * 0.08, 0.98, t);
  float tornEdge = innerEdge * outerEdge * radialEdgeFade(t);
  float cloudy = smoothstep(0.38 - uChaos * 0.2, 0.88, warpB);
  float density = radialMask * tornEdge * mix(cloudy, max(cloudy, lanes), 0.55 + uChaos * 0.35);

  float holes = fbm(vec2(angle * 2.1, t * 5.0) + warpB * 2.0);
  density *= smoothstep(0.16 + uChaos * 0.18, 0.92, holes + lanes * 0.24);

  vec3 color = mix(uColorInner, uColorOuter, t);
  float starSide = clamp(dot(normalize(vec2(vLocalPos.x, vLocalPos.y)), vec2(0.82, -0.34)) * 0.5 + 0.5, 0.0, 1.0);
  color *= 0.42 + starSide * 0.65 + lanes * 0.22;

  gl_FragColor = vec4(color, density * uOpacity);
}
`

export function makeChaoticDustMaterial(opts: {
  color: string
  opacity: number
  innerRadius: number
  outerRadius: number
  chaos: number
  seed: number
}): THREE.ShaderMaterial {
  const base = new THREE.Color(opts.color)
  const inner = base.clone().lerp(new THREE.Color('#f0b66c'), 0.28).multiplyScalar(0.72)
  const outer = base.clone().lerp(new THREE.Color('#6f7688'), 0.42).multiplyScalar(0.42)
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorInner: { value: inner },
      uColorOuter: { value: outer },
      uOpacity: { value: opts.opacity },
      uInnerRadius: { value: opts.innerRadius },
      uOuterRadius: { value: opts.outerRadius },
      uChaos: { value: opts.chaos },
      uSeed: { value: opts.seed },
      uEdgeFade: { value: 0.26 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

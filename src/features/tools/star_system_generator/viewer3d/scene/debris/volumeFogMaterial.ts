import * as THREE from 'three'

export type VolumeFogMode = 'disk' | 'shell'

const vertexShader = /* glsl */ `
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vLocalPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform float uOpacity;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uChaos;
uniform float uClumpiness;
uniform float uFilamentCount;
uniform float uLayerT;
uniform float uMode;
uniform float uNoiseScale;
uniform float uSeed;
uniform float uEdgeFade;

varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed) * 43758.5453123);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash3(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

float fbm3(vec3 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise3(p);
    p = p * 2.03 + vec3(11.5, 7.2, 3.9);
    amp *= 0.53;
  }
  return v;
}

float radialEdgeFade(float t) {
  float w = max(uEdgeFade, 0.001);
  return smoothstep(0.0, w, t) * (1.0 - smoothstep(1.0 - w, 1.0, t));
}

void main() {
  float radialDistance = length(vLocalPos.xy);
  float radialT = (radialDistance - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.001);
  if (uMode < 0.5 && (radialT < 0.0 || radialT > 1.0)) discard;
  if (uMode > 0.5) radialT = uLayerT;

  float layerDistance = abs(uLayerT * 2.0 - 1.0);
  float angle = atan(vLocalPos.y, vLocalPos.x);
  vec3 noisePos = vWorldPos * uNoiseScale + vec3(uSeed * 0.013, uSeed * 0.021, uSeed * 0.034);

  float warpA = fbm3(noisePos * 0.72);
  float warpB = fbm3(noisePos * (1.45 + uChaos * 0.65) + vec3(warpA * 2.4, -warpA * 1.7, warpA));
  float fogNoise = fbm3(noisePos * (2.2 + uChaos) + warpB * 3.0);
  float cloudDensity = smoothstep(0.28 - uChaos * 0.12, 0.9, warpB * 0.65 + fogNoise * 0.55);

  float voidNoise = fbm3(noisePos * (3.7 + uChaos * 1.2) - warpB * 2.2);
  float voidMask = smoothstep(0.16 + uChaos * 0.16, 0.98, voidNoise + cloudDensity * 0.22);

  float filamentWave = sin(angle * max(1.0, uFilamentCount) + radialT * (8.0 + uChaos * 9.0) + warpA * 6.0 + uLayerT * 4.0);
  float filamentDensity = smoothstep(0.54 - uChaos * 0.16, 1.0, filamentWave * 0.5 + 0.5);
  float tearNoise = fbm3(vec3(angle * 0.8, radialT * 4.2, uLayerT * 2.7) + vec3(warpA * 2.0, warpB, uSeed * 0.01));
  float tornMask = smoothstep(0.34 - uChaos * 0.1, 0.88, tearNoise + filamentDensity * 0.18);
  float clumpMask = smoothstep(0.38 - uClumpiness * 0.12, 0.94, fogNoise + warpB * 0.42);

  float radialMask = pow(max(sin(clamp(radialT, 0.0, 1.0) * 3.14159), 0.0), mix(0.6, 0.42, uMode));
  if (uMode < 0.5) radialMask *= radialEdgeFade(radialT);
  float layerMask = uMode < 0.5
    ? 0.34 + pow(max(1.0 - layerDistance, 0.0), 0.55) * 0.86
    : 1.0;

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rimDensity = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), 0.72);
  float viewMask = uMode < 0.5 ? 1.0 : 0.24 + rimDensity * 0.82;

  float chaoticDensity = mix(cloudDensity, max(cloudDensity, filamentDensity), clamp(uChaos * 0.72, 0.0, 1.0));
  float density = radialMask * layerMask * viewMask * chaoticDensity * voidMask;
  density *= mix(1.0, tornMask * clumpMask, clamp(uChaos * 0.88, 0.0, 1.0));
  density *= mix(0.62, 1.18, uClumpiness);
  if (density < 0.01) discard;

  vec3 col = mix(uColorInner, uColorOuter, clamp(radialT, 0.0, 1.0));
  col *= 0.58 + cloudDensity * 0.55 + filamentDensity * 0.16;
  gl_FragColor = vec4(col, density * uOpacity);
}
`

export function makeVolumeFogMaterial(opts: {
  color: string
  opacity: number
  innerRadius: number
  outerRadius: number
  chaos: number
  clumpiness: number
  filamentCount: number
  layerT: number
  mode: VolumeFogMode
  seed: number
}): THREE.ShaderMaterial {
  const base = new THREE.Color(opts.color)
  const inner = base.clone().lerp(new THREE.Color('#f3b976'), 0.22).multiplyScalar(0.7)
  const outer = base.clone().lerp(new THREE.Color('#6f7d9a'), 0.46).multiplyScalar(0.48)
  const noiseScale = (1.15 + opts.chaos * 2.25) / Math.max(1, opts.outerRadius * 0.32)

  return new THREE.ShaderMaterial({
    uniforms: {
      uColorInner: { value: inner },
      uColorOuter: { value: outer },
      uOpacity: { value: opts.opacity },
      uInnerRadius: { value: opts.innerRadius },
      uOuterRadius: { value: opts.outerRadius },
      uChaos: { value: opts.chaos },
      uClumpiness: { value: opts.clumpiness },
      uFilamentCount: { value: opts.filamentCount },
      uLayerT: { value: opts.layerT },
      uMode: { value: opts.mode === 'disk' ? 0 : 1 },
      uNoiseScale: { value: noiseScale },
      uSeed: { value: opts.seed },
      uEdgeFade: { value: opts.mode === 'disk' ? 0.24 : 0.01 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

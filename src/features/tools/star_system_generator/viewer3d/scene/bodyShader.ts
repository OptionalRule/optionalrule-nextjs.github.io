import * as THREE from 'three'
import type { BodyVisual } from '../types'

export const bodyVertex = /* glsl */ `
uniform float uVisualSize;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = position * uVisualSize;
  gl_Position = projectionMatrix * mv;
}
`

export const bodyFragment = /* glsl */ `
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAccentColor;
uniform float uNoiseScale;
uniform float uAtmosphere;
uniform float uHeatTint;
uniform float uBandStrength;
uniform float uBandFrequency;
uniform float uWaterCoverage;
uniform float uIceCoverage;
uniform float uCloudStrength;
uniform float uCraterStrength;
uniform float uVolcanicStrength;
uniform float uStormStrength;
uniform float uGuAccent;
uniform float uSurfaceSeed;

varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 unitPos = normalize(vPos);
  vec3 seedOffset = vec3(uSurfaceSeed, uSurfaceSeed * 0.37, uSurfaceSeed * 0.61);
  vec3 p = (unitPos + seedOffset) * uNoiseScale;
  float n = fbm(p);
  float detail = fbm(p * 2.7 + seedOffset.yzx);

  float bands = sin(unitPos.y * uBandFrequency + n * 3.0 + uSurfaceSeed);
  float bandFactor = mix(1.0, 0.7 + 0.3 * bands, uBandStrength);

  float surfaceMix = smoothstep(0.28, 0.82, n + detail * 0.25);
  vec3 base = mix(uSecondaryColor, uBaseColor, surfaceMix);
  base = mix(base * 0.72, base * 1.25, n);
  base *= bandFactor;

  float waterThreshold = 1.0 - clamp(uWaterCoverage, 0.0, 0.95);
  float waterMask = smoothstep(waterThreshold - 0.16, waterThreshold + 0.16, n + detail * 0.18);
  base = mix(base, uAccentColor, waterMask * uWaterCoverage);

  float polar = pow(abs(unitPos.y), 1.8);
  float iceMask = max(
    smoothstep(max(0.0, 0.98 - uIceCoverage), 1.0, polar + detail * 0.24),
    smoothstep(0.72, 0.94, detail) * uIceCoverage * 0.5
  );
  base = mix(base, vec3(0.82, 0.92, 0.96), iceMask * uIceCoverage);

  float craterNoise = fbm(p * 4.2 + vec3(7.1, 2.3, 5.9));
  float craterMask = smoothstep(0.68, 0.93, craterNoise) * uCraterStrength;
  base = mix(base, base * 0.45, craterMask);

  float volcanicNoise = fbm(p * 3.6 + vec3(2.5, 9.1, 4.7));
  float volcanicMask = smoothstep(0.72, 0.94, volcanicNoise) * uVolcanicStrength;
  base = mix(base, vec3(1.0, 0.26, 0.08), volcanicMask);

  float stormNoise = fbm(vec3(unitPos.x * 1.8, unitPos.y * 8.0, unitPos.z * 1.8) + seedOffset.zxy);
  float stormMask = smoothstep(0.56, 0.84, stormNoise) * uStormStrength;
  base = mix(base, base + vec3(0.22, 0.18, 0.12), stormMask);

  base = mix(base, vec3(1.0, 0.55, 0.3), uHeatTint * 0.4);

  float light = clamp(dot(vNormal, normalize(vec3(0.6, 0.4, 0.5))), 0.0, 1.0);
  vec3 lit = base * (0.25 + 0.85 * light);

  float fresnel = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.0);
  vec3 atmo = mix(vec3(0.6, 0.8, 1.0), vec3(0.6, 0.4, 1.0), uGuAccent);
  lit = mix(lit, lit + atmo, fresnel * uAtmosphere * 0.6);

  float cloudNoise = fbm(p * 1.5 + vec3(11.0, 17.0, 23.0));
  float cloudMask = smoothstep(0.48, 0.78, cloudNoise + stormMask * 0.18) * uCloudStrength;
  lit = mix(lit, vec3(0.86, 0.88, 0.84), cloudMask);

  if (uGuAccent > 0.5) {
    lit = mix(lit, lit + vec3(0.4, 0.2, 0.7), fresnel * 0.6);
  }

  gl_FragColor = vec4(lit, 1.0);
}
`

export function makeBodyMaterial(body: BodyVisual): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: bodyVertex,
    fragmentShader: bodyFragment,
    uniforms: {
      uBaseColor: { value: new THREE.Color() },
      uSecondaryColor: { value: new THREE.Color() },
      uAccentColor: { value: new THREE.Color() },
      uNoiseScale: { value: 0 },
      uAtmosphere: { value: 0 },
      uHeatTint: { value: 0 },
      uBandStrength: { value: 0 },
      uBandFrequency: { value: 0 },
      uWaterCoverage: { value: 0 },
      uIceCoverage: { value: 0 },
      uCloudStrength: { value: 0 },
      uCraterStrength: { value: 0 },
      uVolcanicStrength: { value: 0 },
      uStormStrength: { value: 0 },
      uGuAccent: { value: body.guAccent ? 1 : 0 },
      uSurfaceSeed: { value: 0 },
      uVisualSize: { value: body.visualSize },
    },
  })
}

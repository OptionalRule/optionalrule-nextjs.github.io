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
uniform float uNoiseScale;
uniform float uAtmosphere;
uniform float uHeatTint;
uniform float uBandStrength;
uniform float uGuAccent;

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
  vec3 p = normalize(vPos) * uNoiseScale;
  float n = fbm(p);

  float bands = sin(vPos.y * 4.0 + n * 2.0);
  float bandFactor = mix(1.0, 0.7 + 0.3 * bands, uBandStrength);

  vec3 base = uBaseColor;
  base = mix(base * 0.6, base * 1.3, n);
  base *= bandFactor;
  base = mix(base, vec3(1.0, 0.55, 0.3), uHeatTint * 0.4);

  float light = clamp(dot(vNormal, normalize(vec3(0.6, 0.4, 0.5))), 0.0, 1.0);
  vec3 lit = base * (0.25 + 0.85 * light);

  float fresnel = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.0);
  vec3 atmo = mix(vec3(0.6, 0.8, 1.0), vec3(0.6, 0.4, 1.0), uGuAccent);
  lit = mix(lit, lit + atmo, fresnel * uAtmosphere * 0.6);

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
      uNoiseScale: { value: 0 },
      uAtmosphere: { value: 0 },
      uHeatTint: { value: 0 },
      uBandStrength: { value: 0 },
      uGuAccent: { value: body.guAccent ? 1 : 0 },
      uVisualSize: { value: body.visualSize },
    },
  })
}

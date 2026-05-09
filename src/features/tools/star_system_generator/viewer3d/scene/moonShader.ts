import * as THREE from 'three'
import type { MoonVisual } from '../types'

const moonVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const moonFragment = /* glsl */ `
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAccentColor;
uniform float uSurfaceSeed;
uniform float uCraterStrength;
uniform float uIceCoverage;
uniform float uVolcanicStrength;
uniform float uAtmosphereStrength;
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
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 unitPos = normalize(vPos);
  vec3 seed = vec3(uSurfaceSeed, uSurfaceSeed * 0.41, uSurfaceSeed * 0.73);
  float terrain = fbm((unitPos + seed) * 5.2);
  float detail = fbm((unitPos + seed.yzx) * 14.0);
  vec3 color = mix(uSecondaryColor, uBaseColor, smoothstep(0.25, 0.82, terrain));
  color = mix(color * 0.62, color * 1.18, terrain);

  float crater = smoothstep(0.68, 0.94, detail) * uCraterStrength;
  color = mix(color, color * 0.42, crater);

  float polar = pow(abs(unitPos.y), 1.7);
  float ice = max(smoothstep(0.7, 0.96, polar + terrain * 0.18), smoothstep(0.78, 0.95, detail)) * uIceCoverage;
  color = mix(color, vec3(0.82, 0.92, 0.96), ice);

  float vent = smoothstep(0.82, 0.97, fbm((unitPos + seed.zxy) * 10.0)) * uVolcanicStrength;
  color = mix(color, uAccentColor, vent);

  float light = clamp(dot(vNormal, normalize(vec3(0.6, 0.4, 0.5))), 0.0, 1.0);
  vec3 lit = color * (0.2 + 0.9 * light);
  float fresnel = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.0);
  lit += uAccentColor * fresnel * uAtmosphereStrength * 0.35;
  gl_FragColor = vec4(lit, 1.0);
}
`

export function makeMoonMaterial(moon: MoonVisual): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: moonVertex,
    fragmentShader: moonFragment,
    uniforms: {
      uBaseColor: { value: new THREE.Color(moon.surface.baseColor) },
      uSecondaryColor: { value: new THREE.Color(moon.surface.secondaryColor) },
      uAccentColor: { value: new THREE.Color(moon.surface.accentColor) },
      uSurfaceSeed: { value: moon.surface.surfaceSeed },
      uCraterStrength: { value: moon.surface.craterStrength },
      uIceCoverage: { value: moon.surface.iceCoverage },
      uVolcanicStrength: { value: moon.surface.volcanicStrength },
      uAtmosphereStrength: { value: moon.surface.atmosphereStrength },
    },
  })
}

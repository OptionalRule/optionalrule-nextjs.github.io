import * as THREE from 'three'

export const volumetricVertex = /* glsl */ `
varying float vDist;
void main() {
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const staticFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  gl_FragColor = vec4(uColor, falloff * 0.55 * uIntensity);
}
`

const pulsingFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPulse;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  float pulse = 0.85 + 0.15 * uPulse;
  gl_FragColor = vec4(uColor, falloff * 0.5 * uIntensity * pulse);
}
`

export interface VolumetricMaterialOptions {
  color: string
  intensity: number
  pulsing?: boolean
}

export function makeVolumetricMaterial({ color, intensity, pulsing }: VolumetricMaterialOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: volumetricVertex,
    fragmentShader: pulsing ? pulsingFragment : staticFragment,
    uniforms: pulsing
      ? {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPulse: { value: 1 },
        }
      : {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
    transparent: true,
    depthWrite: false,
  })
}

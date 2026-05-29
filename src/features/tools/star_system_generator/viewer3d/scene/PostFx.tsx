'use client'

import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'

/**
 * Cinematic bloom + vignette pass. The star surface/corona render with
 * `toneMapped: false`, so their additive output stays above the luminance
 * threshold and blooms into a soft glow while planets and orbits stay crisp.
 * ACES tone mapping is configured on the renderer (see Scene.tsx).
 *
 * Everything here is constant — there is no `multisampling` prop that changes at
 * runtime, so the composer never rebuilds its render targets. The caller mounts
 * this once and only ever unmounts it permanently (sticky `richFx`), so there is
 * no per-quality-change rebuild/teardown that would cause flicker or stutter.
 *
 * Anti-aliasing is done with SMAA (a cheap shader pass) rather than MSAA render
 * targets, which keeps thin orbit lines from shimmering without the memory-bandwidth
 * cost of multisampled HDR buffers.
 */
export function PostFx() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.95}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.28}
        radius={0.72}
        mipmapBlur
      />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}

'use client'

import { EffectComposer, Bloom } from '@react-three/postprocessing'

export interface PostFxProps {
  /**
   * Adaptive quality from the scene's PerformanceMonitor. Bloom multisampling is
   * scaled down as quality drops; the caller skips this component entirely on the
   * weakest GPUs (fallback tier) so post-processing never tanks the frame rate.
   */
  qualityScale: number
}

/**
 * Cinematic bloom pass. The star surface/corona render with `toneMapped: false`,
 * so their additive output stays above the luminance threshold and blooms into a
 * soft glow, while planets and orbits stay crisp. ACES tone mapping is configured
 * on the renderer (see Scene.tsx) so bright highlights roll off filmically.
 */
export function PostFx({ qualityScale }: PostFxProps) {
  return (
    <EffectComposer multisampling={qualityScale > 0.9 ? 2 : 0}>
      <Bloom
        intensity={0.95}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.28}
        radius={0.72}
        mipmapBlur
      />
    </EffectComposer>
  )
}

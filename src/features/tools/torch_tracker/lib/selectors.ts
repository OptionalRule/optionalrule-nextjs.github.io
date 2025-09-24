import type { ActiveLightSource, LightRadius, TorchTrackerSelector, TorchTrackerSelectors, TorchTrackerState } from '../types'

export const selectCatalog: TorchTrackerSelector<TorchTrackerState['catalog']> = (state) => state.catalog

export const selectActive: TorchTrackerSelector<ActiveLightSource[]> = (state) => state.active

export const selectExpired: TorchTrackerSelector<ActiveLightSource[]> = (state) => state.expired

export const selectSettings: TorchTrackerSelector<TorchTrackerState['settings']> = (state) => state.settings

export const selectIsClockRunning: TorchTrackerSelector<boolean> = (state) => state.settings.isClockRunning

export const selectAutoAdvance: TorchTrackerSelector<boolean> = (state) => state.settings.autoAdvance

export const selectNextExpiration: TorchTrackerSelector<ActiveLightSource | null> = (state) => {
  if (!state.active.length) return null
  let result: ActiveLightSource | null = null
  for (const source of state.active) {
    if (source.isPaused || source.status !== 'active') continue
    if (source.remainingSeconds <= 0) continue
    if (!result || source.remainingSeconds < result.remainingSeconds) {
      result = source
    }
  }
  return result
}

export const selectBrightestRadius: TorchTrackerSelector<LightRadius | null> = (state) => {
  if (!state.active.length) return null
  let brightest: LightRadius | null = null
  let bestScore = -Infinity
  for (const source of state.active) {
    if (source.status === 'expired') continue
    const bright = source.radius.bright
    const dim = source.radius.dim
    const score = bright * 2 + dim
    if (score > bestScore) {
      bestScore = score
      brightest = source.radius
    }
  }
  return brightest ? { ...brightest } : null
}

export const torchTrackerSelectors: TorchTrackerSelectors = {
  selectCatalog,
  selectActive,
  selectExpired,
  selectSettings,
  selectIsClockRunning,
  selectAutoAdvance,
  selectNextExpiration,
  selectBrightestRadius,
}


import type {
  ActiveLightSource,
  CentralTimerSnapshot,
  TorchTrackerSelector,
  TorchTrackerSelectors,
  TorchTrackerState,
} from '../types'

export const selectCatalog: TorchTrackerSelector<TorchTrackerState['catalog']> = (state) => state.catalog

export const selectActive: TorchTrackerSelector<ActiveLightSource[]> = (state) => state.active

export const selectSettings: TorchTrackerSelector<TorchTrackerState['settings']> = (state) => state.settings

export const selectIsClockRunning: TorchTrackerSelector<boolean> = (state) => state.settings.isClockRunning

export const selectCentralTimer: TorchTrackerSelector<CentralTimerSnapshot> = (state) => state.centralTimer

export const torchTrackerSelectors: TorchTrackerSelectors = {
  selectCatalog,
  selectActive,
  selectSettings,
  selectIsClockRunning,
  selectCentralTimer,
}

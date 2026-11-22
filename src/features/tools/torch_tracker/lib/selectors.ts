import type { CentralTimerSnapshot, TorchTrackerSelector, TorchTrackerState } from '../types'

export const selectSettings: TorchTrackerSelector<TorchTrackerState['settings']> = (state) => state.settings

export const selectCentralTimer: TorchTrackerSelector<CentralTimerSnapshot> = (state) => state.centralTimer

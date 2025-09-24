import type { ActiveLightSource } from '../types'

export const formatSourceSummary = (source: ActiveLightSource) => {
  const status = source.status === 'expired' ? 'expired' : source.status === 'paused' ? 'paused' : 'active'
  return `${source.label}, ${status}, ${source.remainingRounds} rounds remaining (${Math.ceil(source.remainingSeconds / 60)} minutes)`
}


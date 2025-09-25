import type { ActiveLightSource } from '../types'

export const formatSourceSummary = (source: ActiveLightSource) => {
  const status = source.status === 'expired' ? 'expired' : source.status === 'paused' ? 'inactive' : 'active'
  const remainingMinutes = Math.max(0, Math.ceil(source.remainingSeconds / 60))
  return `${source.label}, ${status}, ${source.remainingRounds} rounds remaining (${remainingMinutes} minutes)`
}
